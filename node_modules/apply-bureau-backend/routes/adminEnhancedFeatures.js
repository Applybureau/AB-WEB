const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================
// 20 QUESTIONS MARK AS REVIEWED
// ============================================

// POST /api/admin/clients/:clientId/20q/mark-reviewed
router.post('/clients/:clientId/20q/mark-reviewed', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { admin_notes, approved, feedback } = req.body;

    // Get onboarding record
    const { data: onboarding, error: fetchError } = await supabaseAdmin
      .from('client_onboarding')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (fetchError || !onboarding) {
      return res.status(404).json({ error: '20Q responses not found' });
    }

    const previousStatus = onboarding.status;

    // Update onboarding status to reviewed
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('client_onboarding')
      .update({
        status: approved ? 'active' : 'reviewed',
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user.id,
        admin_notes: admin_notes || null,
        approved_at: approved ? new Date().toISOString() : null,
        approved_by: approved ? req.user.id : null
      })
      .eq('client_id', clientId)
      .select()
      .single();

    if (updateError) {
      logger.error('Error marking 20Q as reviewed:', updateError);
      return res.status(500).json({ error: 'Failed to mark as reviewed' });
    }

    // Update client record
    await supabaseAdmin
      .from('clients')
      .update({
        onboarding_approved: approved || false,
        status: approved ? 'active' : 'onboarding_reviewed',
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    // Get client info for notification
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('email, full_name')
      .eq('id', clientId)
      .single();

    // Send notification to client
    if (client && approved) {
      try {
        await sendEmail(client.email, 'onboarding_approved', {
          client_name: client.full_name,
          feedback: feedback || 'Your responses have been reviewed and approved.',
          admin_name: req.user.full_name || 'Apply Bureau Team'
        });
      } catch (emailError) {
        logger.error('Failed to send approval email:', emailError);
      }

      // Create notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: clientId,
          user_type: 'client',
          title: '20 Questions Reviewed',
          message: approved 
            ? 'Your 20 Questions assessment has been approved!' 
            : 'Your 20 Questions assessment has been reviewed.',
          type: 'onboarding_reviewed',
          is_read: false,
          action_url: '/client/dashboard'
        });
    }

    res.json({
      success: true,
      message: '20Q responses marked as reviewed',
      twenty_questions: {
        client_id: clientId,
        status: updated.status,
        previous_status: previousStatus,
        reviewed_at: updated.reviewed_at,
        reviewed_by: req.user.email,
        admin_notes: updated.admin_notes,
        approved: approved || false
      },
      client_dashboard_updated: true,
      new_dashboard_status: {
        twenty_questions: {
          status: updated.status,
          display_status: approved ? 'Approved' : 'Reviewed',
          description: approved 
            ? 'Your responses have been approved by our team' 
            : 'Your responses have been reviewed',
          color: approved ? 'green' : 'blue',
          progress: 100,
          can_edit: false
        }
      }
    });

  } catch (error) {
    logger.error('Mark 20Q as reviewed error:', error);
    res.status(500).json({ error: 'Failed to mark as reviewed' });
  }
});

// GET /api/admin/clients/:clientId/20q/responses
router.get('/clients/:clientId/20q/responses', async (req, res) => {
  try {
    const { clientId } = req.params;

    // Get client info
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, onboarding_completed, onboarding_approved')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get onboarding responses
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (onboardingError && onboardingError.code !== 'PGRST116') {
      logger.error('Error fetching onboarding:', onboardingError);
      return res.status(500).json({ error: 'Failed to fetch 20Q responses' });
    }

    // Get reviewer info if reviewed
    let reviewerInfo = null;
    if (onboarding?.reviewed_by) {
      const { data: reviewer } = await supabaseAdmin
        .from('registered_users')
        .select('email, full_name')
        .eq('id', onboarding.reviewed_by)
        .single();
      reviewerInfo = reviewer;
    }

    res.json({
      client_id: clientId,
      client_name: client.full_name,
      client_email: client.email,
      twenty_questions: onboarding ? {
        id: onboarding.id,
        status: onboarding.status,
        submitted_at: onboarding.submitted_at,
        reviewed_at: onboarding.reviewed_at,
        reviewed_by: reviewerInfo?.email || null,
        reviewer_name: reviewerInfo?.full_name || null,
        admin_notes: onboarding.admin_notes,
        approved: onboarding.approved_at ? true : false,
        approved_at: onboarding.approved_at,
        responses: {
          q1: onboarding.q1,
          q2: onboarding.q2,
          q3: onboarding.q3,
          q4: onboarding.q4,
          q5: onboarding.q5,
          q6: onboarding.q6,
          q7: onboarding.q7,
          q8: onboarding.q8,
          q8_currency: onboarding.q8_currency,
          q9: onboarding.q9,
          q9_currency: onboarding.q9_currency,
          q10: onboarding.q10,
          q10a: onboarding.q10a,
          q11: onboarding.q11,
          q11a: onboarding.q11a,
          q12: onboarding.q12,
          q13: onboarding.q13,
          q14: onboarding.q14,
          q14a: onboarding.q14a,
          q15: onboarding.q15,
          q16: onboarding.q16,
          q17: onboarding.q17,
          q18: onboarding.q18,
          q19: onboarding.q19,
          q20: onboarding.q20
        }
      } : null
    });

  } catch (error) {
    logger.error('Get 20Q responses error:', error);
    res.status(500).json({ error: 'Failed to get 20Q responses' });
  }
});

// GET /api/admin/20q/pending-review
router.get('/20q/pending-review', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sort = 'submitted_at', 
      order = 'desc' 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get pending reviews
    const { data: pending, error } = await supabaseAdmin
      .from('client_onboarding')
      .select(`
        *,
        clients!client_onboarding_client_id_fkey (
          id,
          email,
          full_name,
          phone,
          created_at
        )
      `)
      .in('status', ['pending_approval', 'under_review'])
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      logger.error('Error fetching pending reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch pending reviews' });
    }

    // Get total count
    const { data: allPending } = await supabaseAdmin
      .from('client_onboarding')
      .select('id, status, submitted_at')
      .in('status', ['pending_approval', 'under_review']);

    // Calculate priority based on days pending
    const pendingWithPriority = pending?.map(item => {
      const daysPending = Math.floor(
        (new Date() - new Date(item.submitted_at)) / (1000 * 60 * 60 * 24)
      );
      
      let priority = 'normal';
      if (daysPending > 7) priority = 'urgent';
      else if (daysPending > 3) priority = 'high';

      return {
        id: item.id,
        client_id: item.client_id,
        client_name: item.clients?.full_name,
        client_email: item.clients?.email,
        status: item.status,
        submitted_at: item.submitted_at,
        days_pending: daysPending,
        response_count: 20,
        priority
      };
    }) || [];

    // Calculate summary
    const summary = {
      total_pending: allPending?.length || 0,
      urgent: pendingWithPriority.filter(p => p.priority === 'urgent').length,
      high_priority: pendingWithPriority.filter(p => p.priority === 'high').length,
      normal: pendingWithPriority.filter(p => p.priority === 'normal').length
    };

    res.json({
      pending_reviews: pendingWithPriority,
      total_count: allPending?.length || 0,
      page: parseInt(page),
      total_pages: Math.ceil((allPending?.length || 0) / parseInt(limit)),
      summary
    });

  } catch (error) {
    logger.error('Get pending reviews error:', error);
    res.status(500).json({ error: 'Failed to get pending reviews' });
  }
});

// ============================================
// ENHANCED FILE DETAILS
// ============================================

// GET /api/admin/clients/:clientId/files/resume
router.get('/clients/:clientId/files/resume', async (req, res) => {
  try {
    const { clientId } = req.params;

    const { data: files, error } = await supabaseAdmin
      .from('client_files')
      .select('*')
      .eq('client_id', clientId)
      .eq('file_type', 'resume')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching resume:', error);
      return res.status(500).json({ error: 'Failed to fetch resume' });
    }

    const activeResume = files?.find(f => f.is_active) || files?.[0];

    if (!activeResume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Format file size
    const formatFileSize = (bytes) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    // Get all versions
    const versions = files?.map((f, index) => ({
      version: files.length - index,
      filename: f.filename,
      uploaded_at: f.uploaded_at || f.created_at,
      status: f.is_active ? 'active' : 'archived',
      file_size: f.file_size,
      file_url: f.file_url
    })) || [];

    res.json({
      resume: {
        id: activeResume.id,
        client_id: activeResume.client_id,
        filename: activeResume.filename,
        file_url: activeResume.file_url,
        download_url: activeResume.file_url,
        file_size_bytes: activeResume.file_size || 0,
        file_size_formatted: formatFileSize(activeResume.file_size || 0),
        uploaded_at: activeResume.uploaded_at || activeResume.created_at,
        version: versions.length,
        status: activeResume.is_active ? 'active' : 'archived',
        metadata: {
          original_filename: activeResume.filename,
          mime_type: 'application/pdf'
        },
        versions
      }
    });

  } catch (error) {
    logger.error('Get resume details error:', error);
    res.status(500).json({ error: 'Failed to get resume details' });
  }
});

// GET /api/admin/clients/:clientId/files/linkedin
router.get('/clients/:clientId/files/linkedin', async (req, res) => {
  try {
    const { clientId } = req.params;

    const { data: file, error } = await supabaseAdmin
      .from('client_files')
      .select('*')
      .eq('client_id', clientId)
      .eq('file_type', 'linkedin')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching LinkedIn:', error);
      return res.status(500).json({ error: 'Failed to fetch LinkedIn profile' });
    }

    if (!file) {
      return res.status(404).json({ error: 'LinkedIn profile not found' });
    }

    res.json({
      linkedin: {
        id: file.id,
        client_id: file.client_id,
        url: file.url || file.file_url,
        added_at: file.created_at,
        verified: true,
        last_checked: file.updated_at || file.created_at,
        status: 'active',
        profile_data: {
          url: file.url || file.file_url
        }
      }
    });

  } catch (error) {
    logger.error('Get LinkedIn details error:', error);
    res.status(500).json({ error: 'Failed to get LinkedIn details' });
  }
});

// GET /api/admin/clients/:clientId/files/portfolio
router.get('/clients/:clientId/files/portfolio', async (req, res) => {
  try {
    const { clientId } = req.params;

    const { data: files, error } = await supabaseAdmin
      .from('client_files')
      .select('*')
      .eq('client_id', clientId)
      .eq('file_type', 'portfolio')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching portfolio:', error);
      return res.status(500).json({ error: 'Failed to fetch portfolio' });
    }

    const portfolio = files?.map(f => ({
      id: f.id,
      client_id: f.client_id,
      url: f.url || f.file_url,
      title: f.filename || 'Portfolio Link',
      description: f.description || 'Portfolio website',
      added_at: f.created_at,
      verified: true,
      last_checked: f.updated_at || f.created_at,
      status: 'active',
      metadata: {
        site_type: 'portfolio'
      }
    })) || [];

    res.json({
      portfolio,
      total_count: portfolio.length
    });

  } catch (error) {
    logger.error('Get portfolio details error:', error);
    res.status(500).json({ error: 'Failed to get portfolio details' });
  }
});

// ============================================
// PACKAGE MONITORING
// ============================================

// GET /api/admin/clients/:clientId/package
router.get('/clients/:clientId/package', async (req, res) => {
  try {
    const { clientId } = req.params;

    // Get active subscription
    const { data: subscription, error } = await supabaseAdmin
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
      .eq('client_id', clientId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching package:', error);
      return res.status(500).json({ error: 'Failed to fetch package' });
    }

    if (!subscription) {
      return res.status(404).json({ error: 'No active package found' });
    }

    // Calculate days remaining
    const endDate = new Date(subscription.end_date);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    // Determine status
    let status = 'active';
    if (daysRemaining < 0) status = 'expired';
    else if (daysRemaining <= 7) status = 'expiring_soon';

    // Get application usage
    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('client_id', clientId)
      .gte('created_at', subscription.start_date);

    res.json({
      client_id: clientId,
      package_tier: subscription.subscription_plans?.tier || 'Unknown',
      package_name: subscription.subscription_plans?.plan_name || subscription.plan_name,
      start_date: subscription.start_date,
      expiry_date: subscription.end_date,
      days_remaining: daysRemaining,
      status,
      auto_renewal: false,
      payment_status: 'paid',
      applications_limit: subscription.subscription_plans?.applications_per_week * subscription.subscription_plans?.duration_weeks || 0,
      applications_used: applications?.length || 0,
      features: subscription.subscription_plans?.features || []
    });

  } catch (error) {
    logger.error('Get package error:', error);
    res.status(500).json({ error: 'Failed to get package' });
  }
});

// GET /api/admin/packages/expiring
router.get('/packages/expiring', async (req, res) => {
  try {
    const { 
      days = 7, 
      page = 1, 
      limit = 20 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + parseInt(days));

    // Get expiring subscriptions
    const { data: subscriptions, error } = await supabaseAdmin
      .from('client_subscriptions')
      .select(`
        *,
        clients!client_subscriptions_client_id_fkey (
          id,
          full_name,
          email,
          last_login_at
        ),
        subscription_plans (
          plan_name,
          tier
        )
      `)
      .eq('status', 'active')
      .lte('end_date', thresholdDate.toISOString().split('T')[0])
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('end_date', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      logger.error('Error fetching expiring packages:', error);
      return res.status(500).json({ error: 'Failed to fetch expiring packages' });
    }

    const expiringPackages = subscriptions?.map(sub => {
      const endDate = new Date(sub.end_date);
      const today = new Date();
      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

      return {
        client_id: sub.client_id,
        client_name: sub.clients?.full_name,
        client_email: sub.clients?.email,
        package_tier: sub.subscription_plans?.tier || 'Unknown',
        expiry_date: sub.end_date,
        days_remaining: daysRemaining,
        status: daysRemaining <= 3 ? 'expiring_soon' : 'active',
        last_activity: sub.clients?.last_login_at
      };
    }) || [];

    // Get total count
    const { data: allExpiring } = await supabaseAdmin
      .from('client_subscriptions')
      .select('id')
      .eq('status', 'active')
      .lte('end_date', thresholdDate.toISOString().split('T')[0])
      .gte('end_date', new Date().toISOString().split('T')[0]);

    res.json({
      expiring_packages: expiringPackages,
      total_count: allExpiring?.length || 0,
      page: parseInt(page),
      total_pages: Math.ceil((allExpiring?.length || 0) / parseInt(limit))
    });

  } catch (error) {
    logger.error('Get expiring packages error:', error);
    res.status(500).json({ error: 'Failed to get expiring packages' });
  }
});

// PUT /api/admin/clients/:clientId/package/extend
router.put('/clients/:clientId/package/extend', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { extension_days, reason, admin_notes } = req.body;

    if (!extension_days || extension_days <= 0) {
      return res.status(400).json({ error: 'extension_days must be a positive number' });
    }

    // Get active subscription
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('client_subscriptions')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .single();

    if (fetchError || !subscription) {
      return res.status(404).json({ error: 'No active package found' });
    }

    // Calculate new expiry date
    const currentEndDate = new Date(subscription.end_date);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + parseInt(extension_days));

    // Update subscription
    const { error: updateError } = await supabaseAdmin
      .from('client_subscriptions')
      .update({
        end_date: newEndDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      logger.error('Error extending package:', updateError);
      return res.status(500).json({ error: 'Failed to extend package' });
    }

    // Log the extension
    await supabaseAdmin
      .from('subscription_history')
      .insert({
        subscription_id: subscription.id,
        client_id: clientId,
        action: 'extended',
        previous_end_date: subscription.end_date,
        new_end_date: newEndDate.toISOString().split('T')[0],
        extension_days: parseInt(extension_days),
        reason: reason || null,
        admin_notes: admin_notes || null,
        performed_by: req.user.id,
        performed_at: new Date().toISOString()
      });

    // Notify client
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('email, full_name')
      .eq('id', clientId)
      .single();

    if (client) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: clientId,
          user_type: 'client',
          title: 'Package Extended',
          message: `Your package has been extended by ${extension_days} days`,
          type: 'package_extended',
          is_read: false,
          action_url: '/client/dashboard'
        });
    }

    res.json({
      success: true,
      message: 'Package extended successfully',
      new_expiry_date: newEndDate.toISOString().split('T')[0],
      days_added: parseInt(extension_days)
    });

  } catch (error) {
    logger.error('Extend package error:', error);
    res.status(500).json({ error: 'Failed to extend package' });
  }
});

module.exports = router;
