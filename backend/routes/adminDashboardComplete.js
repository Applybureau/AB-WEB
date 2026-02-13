const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const crypto = require('crypto');
const logger = require('../utils/logger');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================
// CLIENT INVITATION & REGISTRATION
// ============================================

// POST /api/admin/clients/invite - Send registration link to client
router.post('/clients/invite', async (req, res) => {
  try {
    const { email, full_name, phone } = req.body;

    if (!email || !full_name) {
      return res.status(400).json({ error: 'Email and full name are required' });
    }

    // Check if client already exists
    const { data: existing } = await supabaseAdmin
      .from('clients')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Client with this email already exists' });
    }

    // Generate registration token (valid for 7 days)
    const registrationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date();
    tokenExpires.setDate(tokenExpires.getDate() + 7);

    // Create client record
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert({
        email,
        full_name,
        phone: phone || null,
        role: 'client',
        registration_token: registrationToken,
        registration_token_expires: tokenExpires.toISOString(),
        registration_completed: false,
        profile_unlocked: false,
        payment_confirmed: false,
        onboarding_completed: false,
        onboarding_approved: false,
        status: 'pending_registration',
        is_active: true
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating client:', error);
      return res.status(500).json({ error: 'Failed to create client' });
    }

    // Generate registration link
    const registrationLink = `${process.env.FRONTEND_URL}/register?token=${registrationToken}`;

    // Send registration email
    try {
      await sendEmail(email, 'signup_invite', {
        client_name: full_name,
        registration_link: registrationLink,
        token_expiry: '7 days',
        admin_name: req.user.full_name || 'Apply Bureau Team'
      });
    } catch (emailError) {
      logger.error('Failed to send registration email:', emailError);
      // Don't fail the request if email fails
    }

    // Create notification for admin
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: req.user.id,
        user_type: 'admin',
        title: 'Client Invitation Sent',
        message: `Registration link sent to ${full_name} (${email})`,
        type: 'client_invited',
        is_read: false
      });

    res.status(201).json({
      success: true,
      message: 'Registration link sent successfully',
      client: {
        id: client.id,
        email: client.email,
        full_name: client.full_name,
        registration_link: registrationLink
      }
    });

  } catch (error) {
    logger.error('Client invitation error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// ============================================
// STRATEGY CALLS MANAGEMENT
// ============================================

// GET /api/admin/strategy-calls - Get all strategy call requests
router.get('/strategy-calls', async (req, res) => {
  try {
    const { status = 'all', limit = 50, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (status !== 'all') {
      query = query.eq('admin_status', status);
    }

    const { data: calls, error } = await query;

    if (error) {
      logger.error('Error fetching strategy calls:', error);
      return res.status(500).json({ error: 'Failed to fetch strategy calls' });
    }

    // Get counts by status
    const { data: allCalls } = await supabaseAdmin
      .from('strategy_calls')
      .select('admin_status');

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };

    allCalls?.forEach(call => {
      if (statusCounts.hasOwnProperty(call.admin_status)) {
        statusCounts[call.admin_status]++;
      }
    });

    res.json({
      strategy_calls: calls || [],
      total: calls?.length || 0,
      status_counts: statusCounts,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

  } catch (error) {
    logger.error('Strategy calls list error:', error);
    res.status(500).json({ error: 'Failed to fetch strategy calls' });
  }
});

// POST /api/admin/strategy-calls/:id/confirm - Confirm strategy call
router.post('/strategy-calls/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      selected_slot_index,
      communication_method, // 'whatsapp' or 'meeting_link'
      meeting_link,
      whatsapp_number,
      admin_notes
    } = req.body;

    if (selected_slot_index === undefined) {
      return res.status(400).json({ error: 'selected_slot_index is required' });
    }

    if (!communication_method || !['whatsapp', 'meeting_link'].includes(communication_method)) {
      return res.status(400).json({ error: 'communication_method must be "whatsapp" or "meeting_link"' });
    }

    if (communication_method === 'meeting_link' && !meeting_link) {
      return res.status(400).json({ error: 'meeting_link is required when communication_method is "meeting_link"' });
    }

    if (communication_method === 'whatsapp' && !whatsapp_number) {
      return res.status(400).json({ error: 'whatsapp_number is required when communication_method is "whatsapp"' });
    }

    // Get strategy call
    const { data: call, error: fetchError } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !call) {
      return res.status(404).json({ error: 'Strategy call not found' });
    }

    const selectedSlot = call.preferred_slots[selected_slot_index];
    if (!selectedSlot) {
      return res.status(400).json({ error: 'Invalid slot index' });
    }

    const confirmedTime = new Date(`${selectedSlot.date}T${selectedSlot.time}:00`);

    // Update strategy call
    const { data: updatedCall, error: updateError } = await supabaseAdmin
      .from('strategy_calls')
      .update({
        admin_status: 'confirmed',
        status: 'confirmed',
        confirmed_time: confirmedTime.toISOString(),
        communication_method,
        meeting_link: communication_method === 'meeting_link' ? meeting_link : null,
        whatsapp_number: communication_method === 'whatsapp' ? whatsapp_number : null,
        admin_notes: admin_notes || null,
        admin_action_by: req.user.id,
        admin_action_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      logger.error('Error confirming strategy call:', updateError);
      return res.status(500).json({ error: 'Failed to confirm strategy call' });
    }

    // Send confirmation email to client
    try {
      const emailData = {
        client_name: call.client_name,
        confirmed_date: selectedSlot.date,
        confirmed_time: selectedSlot.time,
        communication_method,
        admin_name: req.user.full_name || 'Apply Bureau Team'
      };

      if (communication_method === 'meeting_link') {
        emailData.meeting_link = meeting_link;
      } else {
        emailData.whatsapp_number = whatsapp_number;
      }

      await sendEmail(call.client_email, 'strategy_call_confirmed', emailData);
    } catch (emailError) {
      logger.error('Failed to send confirmation email:', emailError);
    }

    // Create notification for client
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: call.client_id,
        user_type: 'client',
        title: 'Strategy Call Confirmed',
        message: `Your strategy call has been confirmed for ${selectedSlot.date} at ${selectedSlot.time}`,
        type: 'strategy_call_confirmed',
        is_read: false,
        action_url: '/client/dashboard'
      });

    res.json({
      success: true,
      message: 'Strategy call confirmed successfully',
      strategy_call: updatedCall
    });

  } catch (error) {
    logger.error('Confirm strategy call error:', error);
    res.status(500).json({ error: 'Failed to confirm strategy call' });
  }
});

// PATCH /api/admin/strategy-calls/:id/status - Update strategy call status
router.patch('/strategy-calls/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: call, error } = await supabaseAdmin
      .from('strategy_calls')
      .update({
        admin_status: status,
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating strategy call status:', error);
      return res.status(500).json({ error: 'Failed to update status' });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      strategy_call: call
    });

  } catch (error) {
    logger.error('Update strategy call status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ============================================
// CLIENT COMPLETE PROFILE (CLIENT CARD)
// ============================================

// GET /api/admin/clients/:id/complete - Get ALL client data for client card
router.get('/clients/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    // Get client basic info
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get 20Q responses
    const { data: onboarding } = await supabaseAdmin
      .from('client_onboarding')
      .select('*')
      .eq('client_id', id)
      .single();

    // Get strategy calls
    const { data: strategyCalls } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false });

    // Get files
    const { data: files } = await supabaseAdmin
      .from('client_files')
      .select('*')
      .eq('client_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Get applications
    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false});

    // Get subscription
    const { data: subscription } = await supabaseAdmin
      .from('client_subscriptions')
      .select(`
        *,
        subscription_plans (
          plan_name,
          tier,
          price_cad,
          duration_weeks,
          applications_per_week,
          features
        )
      `)
      .eq('client_id', id)
      .eq('status', 'active')
      .single();

    // Format files by type
    const resumeFile = files?.find(f => f.file_type === 'resume');
    const linkedinFile = files?.find(f => f.file_type === 'linkedin');
    const portfolioFiles = files?.filter(f => f.file_type === 'portfolio') || [];

    // Calculate application stats
    const appStats = {
      total: applications?.length || 0,
      applied: applications?.filter(a => a.status === 'applied').length || 0,
      interview: applications?.filter(a => a.status === 'interview').length || 0,
      offer: applications?.filter(a => a.status === 'offer').length || 0,
      rejected: applications?.filter(a => a.status === 'rejected').length || 0
    };

    // Format 20Q for display
    const twentyQuestionsData = onboarding ? {
      // Section 1: Role Targeting
      roles_wanted: onboarding.q1,
      roles_open_to: onboarding.q2,
      roles_to_avoid: onboarding.q3,
      
      // Section 2: Location & Work Preferences
      work_type: onboarding.q4,
      location_scope: onboarding.q5,
      target_cities: onboarding.q6,
      locations_to_exclude: onboarding.q7,
      
      // Section 3: Compensation
      minimum_salary: onboarding.q8,
      minimum_salary_currency: onboarding.q8_currency,
      ideal_salary: onboarding.q9,
      ideal_salary_currency: onboarding.q9_currency,
      contract_roles: onboarding.q10,
      contract_conditions: onboarding.q10a,
      
      // Section 4: Application Rules
      work_authorization: onboarding.q11,
      work_authorization_details: onboarding.q11a,
      visa_sponsorship: onboarding.q12,
      willing_to_relocate: onboarding.q13,
      drivers_license_required: onboarding.q14,
      license_type_held: onboarding.q14a,
      industries_to_avoid: onboarding.q15,
      
      // Section 5: Disclosures
      disability_status: onboarding.q16,
      veteran_status: onboarding.q17,
      demographic_self_id: onboarding.q18,
      
      // Section 6: Priorities
      priorities: onboarding.q19,
      
      // Section 7: Final Notes
      additional_notes: onboarding.q20,
      
      // Status
      status: onboarding.status,
      submitted_at: onboarding.submitted_at,
      approved_at: onboarding.approved_at,
      approved_by: onboarding.approved_by
    } : null;

    // Build complete client card data
    const clientCard = {
      // Basic Info
      basic_info: {
        id: client.id,
        full_name: client.full_name,
        email: client.email,
        phone: client.phone,
        profile_picture_url: client.profile_picture_url,
        created_at: client.created_at,
        last_login_at: client.last_login_at,
        status: client.status,
        is_active: client.is_active
      },

      // Account Status
      account_status: {
        registration_completed: client.registration_completed,
        email_verified: client.email_verified,
        profile_unlocked: client.profile_unlocked,
        payment_confirmed: client.payment_confirmed || client.payment_verified,
        onboarding_completed: client.onboarding_completed,
        onboarding_approved: client.onboarding_approved
      },

      // 20 Questions Assessment (Full Data)
      twenty_questions: twentyQuestionsData,

      // Strategy Calls
      strategy_calls: {
        total: strategyCalls?.length || 0,
        latest: strategyCalls?.[0] || null,
        all: strategyCalls || []
      },

      // Files
      files: {
        resume: resumeFile ? {
          filename: resumeFile.filename,
          url: resumeFile.file_url,
          size: resumeFile.file_size,
          uploaded_at: resumeFile.uploaded_at
        } : null,
        linkedin: linkedinFile ? {
          url: linkedinFile.url,
          added_at: linkedinFile.created_at
        } : null,
        portfolio: portfolioFiles.map(f => ({
          url: f.url,
          added_at: f.created_at
        })),
        all_files: files || []
      },

      // Applications
      applications: {
        stats: appStats,
        recent: applications?.slice(0, 5) || [],
        total_count: applications?.length || 0
      },

      // Subscription
      subscription: subscription ? {
        plan_name: subscription.subscription_plans.plan_name,
        tier: subscription.subscription_plans.tier,
        price_cad: subscription.subscription_plans.price_cad,
        duration_weeks: subscription.subscription_plans.duration_weeks,
        applications_per_week: subscription.subscription_plans.applications_per_week,
        features: subscription.subscription_plans.features,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        status: subscription.status,
        assigned_by: subscription.assigned_by,
        assigned_at: subscription.assigned_at
      } : null,

      // Career Profile (from clients table)
      career_profile: {
        current_job_title: client.current_job_title,
        current_company: client.current_company,
        years_experience: client.years_experience,
        target_role: client.target_role,
        target_salary_min: client.target_salary_min,
        target_salary_max: client.target_salary_max,
        preferred_locations: client.preferred_locations,
        career_goals: client.career_goals,
        job_search_timeline: client.job_search_timeline
      }
    };

    res.json(clientCard);

  } catch (error) {
    logger.error('Get complete client data error:', error);
    res.status(500).json({ error: 'Failed to get client data' });
  }
});

// ============================================
// 20 QUESTIONS MANAGEMENT
// ============================================

// GET /api/admin/onboarding/pending - Get all pending 20Q submissions
router.get('/onboarding/pending', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // Get all pending onboarding submissions
    const { data: pendingOnboarding, error } = await supabaseAdmin
      .from('client_onboarding')
      .select(`
        *,
        clients!client_onboarding_client_id_fkey (
          id,
          email,
          full_name,
          phone,
          profile_picture_url
        )
      `)
      .eq('status', 'pending_approval')
      .order('submitted_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      logger.error('Error fetching pending onboarding:', error);
      return res.status(500).json({ error: 'Failed to fetch pending submissions' });
    }

    // Get total count
    const { data: allPending } = await supabaseAdmin
      .from('client_onboarding')
      .select('id')
      .eq('status', 'pending_approval');

    res.json({
      pending_submissions: pendingOnboarding || [],
      total: allPending?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

  } catch (error) {
    logger.error('Get pending onboarding error:', error);
    res.status(500).json({ error: 'Failed to get pending submissions' });
  }
});

// GET /api/admin/clients/:id/onboarding - Get client's 20Q responses
router.get('/clients/:id/onboarding', async (req, res) => {
  try {
    const { id } = req.params;

    // Get client info
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, onboarding_completed, onboarding_approved')
      .eq('id', id)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get onboarding responses
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding')
      .select('*')
      .eq('client_id', id)
      .single();

    if (onboardingError && onboardingError.code !== 'PGRST116') {
      logger.error('Error fetching onboarding:', onboardingError);
      return res.status(500).json({ error: 'Failed to fetch onboarding' });
    }

    // Update status from "pending_approval" to "read" when admin views it
    if (onboarding && onboarding.status === 'pending_approval') {
      await supabaseAdmin
        .from('client_onboarding')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
          read_by: req.user.id
        })
        .eq('id', onboarding.id);

      // Update the returned data to reflect the new status
      onboarding.status = 'read';
      onboarding.read_at = new Date().toISOString();
      onboarding.read_by = req.user.id;
    }

    res.json({
      client: {
        id: client.id,
        email: client.email,
        full_name: client.full_name,
        onboarding_completed: client.onboarding_completed,
        onboarding_approved: client.onboarding_approved
      },
      onboarding: onboarding || null
    });

  } catch (error) {
    logger.error('Get client onboarding error:', error);
    res.status(500).json({ error: 'Failed to get onboarding' });
  }
});

// POST /api/admin/onboarding/:id/approve - Approve 20Q assessment
router.post('/onboarding/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    // Get onboarding record
    const { data: onboarding, error: fetchError } = await supabaseAdmin
      .from('client_onboarding')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !onboarding) {
      return res.status(404).json({ error: 'Onboarding record not found' });
    }

    // Update onboarding status
    const { error: updateError } = await supabaseAdmin
      .from('client_onboarding')
      .update({
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: req.user.id
      })
      .eq('id', id);

    if (updateError) {
      logger.error('Error approving onboarding:', updateError);
      return res.status(500).json({ error: 'Failed to approve onboarding' });
    }

    // Update client record
    await supabaseAdmin
      .from('clients')
      .update({
        onboarding_approved: true,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', onboarding.client_id);

    // Get client info for email
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('email, full_name')
      .eq('id', onboarding.client_id)
      .single();

    // Send approval email
    if (client) {
      try {
        await sendEmail(client.email, 'onboarding_approved', {
          client_name: client.full_name,
          admin_name: req.user.full_name || 'Apply Bureau Team'
        });
      } catch (emailError) {
        logger.error('Failed to send approval email:', emailError);
      }

      // Create notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: onboarding.client_id,
          user_type: 'client',
          title: 'Assessment Approved',
          message: 'Your 20 Questions assessment has been approved. Your account is now active!',
          type: 'onboarding_approved',
          is_read: false,
          action_url: '/client/dashboard'
        });
    }

    res.json({
      success: true,
      message: 'Onboarding approved successfully'
    });

  } catch (error) {
    logger.error('Approve onboarding error:', error);
    res.status(500).json({ error: 'Failed to approve onboarding' });
  }
});

// ============================================
// CLIENT FILES MANAGEMENT
// ============================================

// GET /api/admin/clients/:id/files - Get client's uploaded files
router.get('/clients/:id/files', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: files, error } = await supabaseAdmin
      .from('client_files')
      .select('*')
      .eq('client_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false});

    if (error) {
      logger.error('Error fetching client files:', error);
      return res.status(500).json({ error: 'Failed to fetch files' });
    }

    const resumeFile = files?.find(f => f.file_type === 'resume');
    const linkedinFile = files?.find(f => f.file_type === 'linkedin');
    const portfolioFiles = files?.filter(f => f.file_type === 'portfolio') || [];

    res.json({
      files: files || [],
      summary: {
        resume_uploaded: !!resumeFile,
        linkedin_added: !!linkedinFile,
        portfolio_added: portfolioFiles.length > 0,
        total_files: files?.length || 0
      }
    });

  } catch (error) {
    logger.error('Get client files error:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
});

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

// POST /api/admin/clients/:id/subscription - Assign subscription plan
router.post('/clients/:id/subscription', async (req, res) => {
  try {
    const { id } = req.params;
    const { plan_id, start_date } = req.body;

    if (!plan_id) {
      return res.status(400).json({ error: 'plan_id is required' });
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    // Calculate end date
    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (plan.duration_weeks * 7));

    // Deactivate any existing active subscriptions
    await supabaseAdmin
      .from('client_subscriptions')
      .update({ status: 'completed' })
      .eq('client_id', id)
      .eq('status', 'active');

    // Create new subscription
    const { data: subscription, error } = await supabaseAdmin
      .from('client_subscriptions')
      .insert({
        client_id: id,
        plan_id: plan_id,
        plan_name: plan.plan_name,
        price_cad: plan.price_cad,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active',
        assigned_by: req.user.id,
        assigned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Error assigning subscription:', error);
      return res.status(500).json({ error: 'Failed to assign subscription' });
    }

    // Get client info
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('email, full_name')
      .eq('id', id)
      .single();

    // Send notification
    if (client) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: id,
          user_type: 'client',
          title: 'Subscription Plan Assigned',
          message: `You have been assigned to ${plan.plan_name}`,
          type: 'subscription_assigned',
          is_read: false,
          action_url: '/client/dashboard'
        });
    }

    res.status(201).json({
      success: true,
      message: 'Subscription assigned successfully',
      subscription
    });

  } catch (error) {
    logger.error('Assign subscription error:', error);
    res.status(500).json({ error: 'Failed to assign subscription' });
  }
});

// ============================================
// ADMIN DASHBOARD STATS
// ============================================

// GET /api/admin/dashboard/stats - Get admin dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get client counts
    const { data: clients } = await supabaseAdmin
      .from('clients')
      .select('id, status, onboarding_completed, onboarding_approved')
      .eq('role', 'client');

    const clientStats = {
      total: clients?.length || 0,
      active: clients?.filter(c => c.status === 'active').length || 0,
      pending_registration: clients?.filter(c => c.status === 'pending_registration').length || 0,
      onboarding_pending: clients?.filter(c => c.onboarding_completed && !c.onboarding_approved).length || 0
    };

    // Get strategy call counts
    const { data: calls } = await supabaseAdmin
      .from('strategy_calls')
      .select('admin_status');

    const callStats = {
      total: calls?.length || 0,
      pending: calls?.filter(c => c.admin_status === 'pending').length || 0,
      confirmed: calls?.filter(c => c.admin_status === 'confirmed').length || 0,
      completed: calls?.filter(c => c.admin_status === 'completed').length || 0
    };

    // Get application counts
    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select('status');

    const appStats = {
      total: applications?.length || 0,
      applied: applications?.filter(a => a.status === 'applied').length || 0,
      interview: applications?.filter(a => a.status === 'interview').length || 0,
      offer: applications?.filter(a => a.status === 'offer').length || 0
    };

    res.json({
      clients: clientStats,
      strategy_calls: callStats,
      applications: appStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

// ============================================
// ADMIN NOTIFICATIONS
// ============================================

// GET /api/admin/notifications - Get admin notifications
router.get('/notifications', async (req, res) => {
  try {
    const { limit = 20, offset = 0, unread_only = false } = req.query;

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('user_type', 'admin')
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      logger.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    // Get unread count
    const { data: unreadData } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('user_type', 'admin')
      .eq('is_read', false);

    res.json({
      notifications: notifications || [],
      total: notifications?.length || 0,
      unread_count: unreadData?.length || 0
    });

  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// PATCH /api/admin/notifications/:id/read - Mark notification as read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      logger.error('Error marking notification as read:', error);
      return res.status(500).json({ error: 'Failed to mark as read' });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    logger.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

module.exports = router;
