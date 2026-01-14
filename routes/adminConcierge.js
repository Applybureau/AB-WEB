const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail, buildUrl } = require('../utils/email');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { NotificationHelpers } = require('../utils/notifications');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/concierge/consultations - List consultation requests with gatekeeper controls
router.get('/consultations', async (req, res) => {
  try {
    const { 
      admin_status = 'all',
      limit = 50,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let query = supabaseAdmin
      .from('consultation_requests')
      .select('id, name, email, phone, message, preferred_slots, admin_status, status, confirmed_time, admin_notes, reschedule_reason, waitlist_reason, admin_action_by, admin_action_at, created_at, updated_at')
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Filter by admin_status if specified
    if (admin_status !== 'all') {
      query = query.eq('admin_status', admin_status);
    }

    const { data: consultations, error } = await query;

    if (error) {
      console.error('Error fetching consultations:', error);
      return res.status(500).json({ error: 'Failed to fetch consultations' });
    }

    // Format consultations for dashboard display
    const formattedConsultations = consultations.map(consultation => ({
      ...consultation,
      booking_details: {
        name: consultation.name, // Use 'name' instead of 'full_name'
        email: consultation.email,
        phone: consultation.phone,
        message: consultation.message || 'No message provided'
      },
      time_slots: consultation.preferred_slots || [],
      has_time_slots: consultation.preferred_slots && consultation.preferred_slots.length > 0,
      display_message: consultation.message ? 
        (consultation.message.length > 100 ? 
          consultation.message.substring(0, 100) + '...' : 
          consultation.message) : 
        'No message provided'
    }));

    // Get status counts
    const { data: statusCounts } = await supabaseAdmin
      .from('consultation_requests')
      .select('admin_status')
      .then(({ data }) => {
        const counts = {
          pending: 0,
          confirmed: 0,
          rescheduled: 0,
          waitlisted: 0
        };
        
        if (data) {
          data.forEach(item => {
            counts[item.admin_status] = (counts[item.admin_status] || 0) + 1;
          });
        }
        
        return { data: counts };
      });

    res.json({
      consultations: formattedConsultations,
      total: consultations.length,
      offset: parseInt(offset),
      limit: parseInt(limit),
      status_counts: statusCounts || {},
      gatekeeper_actions: ['confirm', 'reschedule', 'waitlist'],
      dashboard_fields: ['name', 'email', 'phone', 'message', 'time_slots', 'admin_status']
    });
  } catch (error) {
    console.error('Admin consultations list error:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

// POST /api/admin/concierge/consultations/:id/confirm - Confirm consultation (GATEKEEPER ACTION)
router.post('/consultations/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      selected_slot_index, // 0, 1, or 2 for which of the 3 slots to confirm
      meeting_details,
      meeting_link,
      admin_notes
    } = req.body;

    console.log('🔍 Consultation confirmation request:', { id, selected_slot_index, meeting_link });

    // Validate selected_slot_index
    if (selected_slot_index === undefined || selected_slot_index < 0 || selected_slot_index > 2) {
      return res.status(400).json({ 
        error: 'selected_slot_index must be 0, 1, or 2 (representing which of the 3 time slots to confirm)' 
      });
    }

    // Get consultation request
    const { data: consultation, error: fetchError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', id)
      .single();

    console.log('🔍 Consultation lookup:', { found: !!consultation, error: fetchError?.message });

    if (fetchError || !consultation) {
      console.error('❌ Consultation not found:', fetchError);
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Check if preferred_slots exists and is an array
    if (!consultation.preferred_slots || !Array.isArray(consultation.preferred_slots)) {
      console.error('❌ No preferred_slots found:', consultation.preferred_slots);
      return res.status(400).json({ 
        error: 'Consultation request does not have preferred time slots',
        details: 'Please ensure the consultation request includes 3 preferred time slots'
      });
    }

    // Get the selected time slot
    const selectedSlot = consultation.preferred_slots[selected_slot_index];
    if (!selectedSlot) {
      console.error('❌ Invalid slot index:', { selected_slot_index, slots: consultation.preferred_slots });
      return res.status(400).json({ error: 'Invalid slot index' });
    }

    console.log('✅ Selected slot:', selectedSlot);

    // Create confirmed datetime
    const confirmedTime = new Date(`${selectedSlot.date}T${selectedSlot.time}:00`);

    // Update consultation with confirmation
    const { data: updatedConsultation, error: updateError } = await supabaseAdmin
      .from('consultation_requests')
      .update({
        admin_status: 'confirmed',
        status: 'confirmed',
        confirmed_time: confirmedTime.toISOString(),
        admin_notes: admin_notes || null,
        admin_action_by: req.user.id,
        admin_action_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error confirming consultation:', updateError);
      return res.status(500).json({ 
        error: 'Failed to confirm consultation',
        details: updateError.message 
      });
    }

    console.log('✅ Consultation confirmed in database');

    // Send confirmation email to client
    try {
      await sendEmail(consultation.email, 'consultation_confirmed_concierge', {
        client_name: consultation.name, // Use 'name' instead of 'full_name'
        confirmed_date: selectedSlot.date,
        confirmed_time: selectedSlot.time,
        meeting_details: meeting_details || 'Your consultation has been confirmed.',
        meeting_link: meeting_link || 'Meeting details will be provided separately.',
        admin_name: req.user.full_name || 'Apply Bureau Team',
        next_steps: 'Please mark this time in your calendar. We look forward to speaking with you!'
      });
      console.log('✅ Confirmation email sent');
    } catch (emailError) {
      console.error('⚠️ Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Create notification
    try {
      await NotificationHelpers.consultationConfirmedByAdmin(updatedConsultation, req.user);
      console.log('✅ Notification created');
    } catch (notificationError) {
      console.error('⚠️ Failed to create notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.json({
      message: 'Consultation confirmed successfully',
      consultation: updatedConsultation,
      confirmed_slot: selectedSlot,
      confirmed_time: confirmedTime.toISOString()
    });
  } catch (error) {
    console.error('Confirm consultation error:', error);
    res.status(500).json({ error: 'Failed to confirm consultation' });
  }
});

// POST /api/admin/concierge/consultations/:id/reschedule - Request reschedule (GATEKEEPER ACTION)
router.post('/consultations/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      reschedule_reason,
      admin_notes
    } = req.body;

    if (!reschedule_reason) {
      return res.status(400).json({ error: 'reschedule_reason is required' });
    }

    // Get consultation request
    const { data: consultation, error: fetchError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !consultation) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Update consultation with reschedule status
    const { data: updatedConsultation, error: updateError } = await supabaseAdmin
      .from('consultation_requests')
      .update({
        admin_status: 'rescheduled',
        status: 'pending', // Reset to pending for new times
        reschedule_reason,
        admin_notes: admin_notes || null,
        admin_action_by: req.user.id,
        admin_action_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error rescheduling consultation:', updateError);
      return res.status(500).json({ error: 'Failed to reschedule consultation' });
    }

    // Send reschedule email to client
    try {
      await sendEmail(consultation.email, 'consultation_reschedule_request', {
        client_name: consultation.name, // Use 'name' instead of 'full_name'
        reschedule_reason,
        admin_name: req.user.full_name || 'Apply Bureau Team',
        new_times_url: buildUrl(`/consultation/new-times/${consultation.id}`),
        next_steps: 'Please provide 3 new preferred time slots using the link above.'
      });
    } catch (emailError) {
      console.error('Failed to send reschedule email:', emailError);
    }

    // Create notification
    try {
      await NotificationHelpers.consultationRescheduledByAdmin(updatedConsultation, req.user);
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    res.json({
      message: 'Reschedule request sent successfully',
      consultation: updatedConsultation,
      reschedule_reason
    });
  } catch (error) {
    console.error('Reschedule consultation error:', error);
    res.status(500).json({ error: 'Failed to reschedule consultation' });
  }
});

// POST /api/admin/concierge/consultations/:id/waitlist - Add to waitlist (GATEKEEPER ACTION)
router.post('/consultations/:id/waitlist', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      waitlist_reason,
      admin_notes
    } = req.body;

    if (!waitlist_reason) {
      return res.status(400).json({ error: 'waitlist_reason is required' });
    }

    // Get consultation request
    const { data: consultation, error: fetchError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !consultation) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Update consultation with waitlist status
    const { data: updatedConsultation, error: updateError } = await supabaseAdmin
      .from('consultation_requests')
      .update({
        admin_status: 'waitlisted',
        status: 'pending', // Keep as pending until resolved
        waitlist_reason,
        admin_notes: admin_notes || null,
        admin_action_by: req.user.id,
        admin_action_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error waitlisting consultation:', updateError);
      return res.status(500).json({ error: 'Failed to waitlist consultation' });
    }

    // Send waitlist email to client
    try {
      await sendEmail(consultation.email, 'consultation_waitlisted', {
        client_name: consultation.name, // Use 'name' instead of 'full_name'
        waitlist_reason,
        admin_name: req.user.full_name || 'Apply Bureau Team',
        next_steps: 'We will contact you as soon as availability opens up. Thank you for your patience.'
      });
    } catch (emailError) {
      console.error('Failed to send waitlist email:', emailError);
    }

    // Create notification
    try {
      await NotificationHelpers.consultationWaitlistedByAdmin(updatedConsultation, req.user);
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    res.json({
      message: 'Consultation added to waitlist successfully',
      consultation: updatedConsultation,
      waitlist_reason
    });
  } catch (error) {
    console.error('Waitlist consultation error:', error);
    res.status(500).json({ error: 'Failed to waitlist consultation' });
  }
});

// POST /api/admin/concierge/payment/confirm-and-invite - Confirm payment and send registration invite
router.post('/payment/confirm-and-invite', async (req, res) => {
  try {
    const {
      client_email,
      client_name,
      payment_amount,
      payment_method = 'interac_etransfer',
      payment_reference,
      admin_notes
    } = req.body;

    if (!client_email || !client_name || !payment_amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: client_email, client_name, payment_amount' 
      });
    }

    // Generate registration token (7-day expiry)
    const token = jwt.sign(
      { 
        email: client_email,
        name: client_name,
        type: 'registration',
        payment_confirmed: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7);

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('registered_users')
      .select('id, email')
      .eq('email', client_email)
      .single();

    if (existingUser) {
      // Update existing user with payment confirmation
      const { error: updateError } = await supabaseAdmin
        .from('registered_users')
        .update({
          payment_confirmed: true,
          // payment_confirmed_by: req.user.id, // Removed FK constraint issue
          payment_confirmed_at: new Date().toISOString(),
          registration_token: token,
          token_expires_at: tokenExpiry.toISOString(),
          token_used: false
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('Error updating user payment status:', updateError);
        return res.status(500).json({ error: 'Failed to update payment status' });
      }
    } else {
      // Create new user record with payment confirmation
      // Generate a temporary passcode hash (user will set password during registration)
      const bcrypt = require('bcrypt');
      const tempPasscode = Math.random().toString(36).substring(2, 15);
      const passcodeHash = await bcrypt.hash(tempPasscode, 10);
      
      const { error: createError } = await supabaseAdmin
        .from('registered_users')
        .insert({
          email: client_email,
          full_name: client_name,
          role: 'client',
          passcode_hash: passcodeHash, // Required field
          is_active: true,
          payment_confirmed: true,
          // payment_confirmed_by: req.user.id, // Removed FK constraint issue
          payment_confirmed_at: new Date().toISOString(),
          registration_token: token,
          token_expires_at: tokenExpiry.toISOString(),
          token_used: false,
          profile_unlocked: false,
          payment_received: true,
          onboarding_completed: false
        });

      if (createError) {
        console.error('Error creating user record:', createError);
        console.error('Full error details:', JSON.stringify(createError, null, 2));
        return res.status(500).json({ 
          error: 'Failed to create user record',
          details: createError.message,
          code: createError.code
        });
      }
    }

    // Send welcome email with registration link
    const registrationUrl = buildUrl(`/register?token=${token}`);
    
    try {
      await sendEmail(client_email, 'payment_confirmed_welcome_concierge', {
        client_name,
        payment_amount,
        payment_method,
        payment_reference: payment_reference || 'Manual confirmation',
        registration_url,
        token_expiry: tokenExpiry.toLocaleDateString(),
        admin_name: req.user.full_name || 'Apply Bureau Team',
        next_steps: 'Click the registration link to create your account and begin your onboarding process.'
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the entire operation if email fails
      console.log('⚠️  Email sending failed, but payment confirmation succeeded');
    }

    // Create notification
    try {
      await NotificationHelpers.paymentConfirmedAndInviteSent({
        client_email,
        client_name,
        payment_amount,
        admin_user: req.user
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the entire operation if notification fails
      console.log('⚠️  Notification creation failed, but payment confirmation succeeded');
    }

    res.json({
      message: 'Payment confirmed and registration invite sent successfully',
      client_email,
      client_name,
      payment_amount,
      registration_token: token,
      token_expires_at: tokenExpiry.toISOString(),
      registration_url: registrationUrl
    });
  } catch (error) {
    console.error('Confirm payment and invite error:', error);
    res.status(500).json({ error: 'Failed to confirm payment and send invite' });
  }
});

// POST /api/admin/concierge/onboarding/:id/approve - Approve onboarding and unlock profile
router.post('/onboarding/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    console.log('🔍 Admin approval request:', { id, admin_notes, timestamp: new Date().toISOString() });

    // Get onboarding record
    const { data: onboarding, error: fetchError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('id', id)
      .single();

    console.log('🔍 Onboarding lookup result:', { 
      found: !!onboarding, 
      error: fetchError?.message,
      errorCode: fetchError?.code,
      id: id
    });

    if (fetchError || !onboarding) {
      console.log('❌ Onboarding record not found for ID:', id);
      return res.status(404).json({ error: 'Onboarding record not found' });
    }

    console.log('✅ Onboarding record found:', { 
      id: onboarding.id, 
      user_id: onboarding.user_id, 
      status: onboarding.execution_status 
    });

    // Get user data separately
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name')
      .eq('id', onboarding.user_id)
      .single();

    console.log('🔍 User lookup result:', { 
      found: !!user, 
      error: userError?.message,
      user_id: onboarding.user_id
    });

    if (userError || !user) {
      console.log('❌ User not found for ID:', onboarding.user_id);
      return res.status(404).json({ error: 'User not found' });
    }

    // Combine the data
    onboarding.registered_users = user;

    // Update onboarding execution status
    const { error: onboardingUpdateError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .update({
        execution_status: 'active',
        approved_by: req.user.id,
        approved_at: new Date().toISOString(),
        admin_notes: admin_notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (onboardingUpdateError) {
      console.error('Error updating onboarding status:', onboardingUpdateError);
      return res.status(500).json({ error: 'Failed to update onboarding status' });
    }

    // Unlock user profile (enables Application Tracker access)
    const { error: userUpdateError } = await supabaseAdmin
      .from('registered_users')
      .update({
        profile_unlocked: true,
        profile_unlocked_by: req.user.id,
        profile_unlocked_at: new Date().toISOString(),
        onboarding_completed: true
      })
      .eq('id', onboarding.user_id);

    if (userUpdateError) {
      console.error('Error unlocking user profile:', userUpdateError);
      return res.status(500).json({ error: 'Failed to unlock user profile' });
    }

    // Send profile unlocked email to client
    try {
      await sendEmail(onboarding.registered_users.email, 'profile_unlocked_tracker_active', {
        client_name: onboarding.registered_users.full_name,
        admin_name: req.user.full_name || 'Apply Bureau Team',
        dashboard_url: buildUrl('/dashboard'),
        next_steps: 'Your Application Tracker is now active! You can view and track your job applications in your dashboard.'
      });
    } catch (emailError) {
      console.error('Failed to send profile unlocked email:', emailError);
    }

    // Create notification
    try {
      await NotificationHelpers.profileUnlockedByAdmin({
        client: onboarding.registered_users,
        admin_user: req.user
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    res.json({
      message: 'Onboarding approved and profile unlocked successfully',
      client_name: onboarding.registered_users.full_name,
      client_email: onboarding.registered_users.email,
      execution_status: 'active',
      profile_unlocked: true,
      approved_by: req.user.full_name,
      approved_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Approve onboarding error:', error);
    res.status(500).json({ error: 'Failed to approve onboarding' });
  }
});

module.exports = router;