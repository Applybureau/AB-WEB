const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendEmail, buildUrl } = require('../utils/email');
const { NotificationHelpers } = require('../utils/notifications');

const router = express.Router();

// GET /api/admin/consultations - Get all consultation requests (ADMIN ONLY)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      status, 
      workflow_stage,
      limit = 50, 
      offset = 0, 
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let query = supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (workflow_stage) {
      query = query.eq('workflow_stage', workflow_stage);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,role_targets.ilike.%${search}%`);
    }

    const { data: consultations, error } = await query;

    if (error) {
      console.error('Error fetching consultation requests:', error);
      return res.status(500).json({ error: 'Failed to fetch consultation requests' });
    }

    // Enhance consultations with PDF access info
    const consultationsWithPDFs = consultations?.map(consultation => ({
      ...consultation,
      has_pdf: !!consultation.pdf_url,
      pdf_accessible: !!consultation.pdf_url,
      pdf_embed_url: consultation.pdf_url ? `/api/pdf/${consultation.id}` : null,
      time_slots: [
        consultation.preferred_time_1,
        consultation.preferred_time_2,
        consultation.preferred_time_3
      ].filter(Boolean)
    })) || [];

    res.json(consultationsWithPDFs);
  } catch (error) {
    console.error('Fetch consultation requests error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation requests' });
  }
});

// GET /api/admin/consultations/:id - Get specific consultation (ADMIN ONLY)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !consultation) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Enhance with PDF and time slot info
    const enhancedConsultation = {
      ...consultation,
      has_pdf: !!consultation.pdf_url,
      pdf_embed_url: consultation.pdf_url ? `/api/pdf/${consultation.id}` : null,
      time_slots: [
        consultation.preferred_time_1,
        consultation.preferred_time_2,
        consultation.preferred_time_3
      ].filter(Boolean)
    };

    res.json(enhancedConsultation);
  } catch (error) {
    console.error('Get consultation request error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation request' });
  }
});

// POST /api/admin/consultations/:id/confirm-time - Confirm one of the three time slots (ADMIN ONLY)
router.post('/:id/confirm-time', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      selected_time_slot, // 1, 2, or 3
      meeting_details,
      admin_notes,
      meeting_link,
      meeting_type = 'video_call' // video_call, phone_call, in_person
    } = req.body;
    const adminId = req.user.userId || req.user.id;

    if (!selected_time_slot || ![1, 2, 3].includes(parseInt(selected_time_slot))) {
      return res.status(400).json({ 
        error: 'Please select a valid time slot (1, 2, or 3)' 
      });
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

    // Get the selected time
    const timeSlotField = `preferred_time_${selected_time_slot}`;
    const confirmedTime = consultation[timeSlotField];

    if (!confirmedTime) {
      return res.status(400).json({ error: 'Selected time slot is not available' });
    }

    // Update consultation with confirmed details
    const { data: updatedConsultation, error: updateError } = await supabaseAdmin
      .from('consultation_requests')
      .update({
        status: 'confirmed',
        workflow_stage: 'initial_consultation_scheduled',
        confirmed_time: confirmedTime,
        selected_time_slot: parseInt(selected_time_slot),
        meeting_details: meeting_details || 'Meeting details will be provided in the confirmation email.',
        meeting_link: meeting_link || null,
        meeting_type,
        confirmed_by: adminId,
        confirmed_at: new Date().toISOString(),
        admin_notes
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error confirming consultation:', updateError);
      return res.status(500).json({ error: 'Failed to confirm consultation' });
    }

    // Send confirmation email to client
    try {
      const meetingDate = new Date(confirmedTime);
      await sendEmail(consultation.email, 'consultation_confirmed', {
        client_name: consultation.full_name,
        confirmed_date: meetingDate.toLocaleDateString(),
        confirmed_time: meetingDate.toLocaleTimeString(),
        timezone: consultation.timezone || 'UTC',
        meeting_type: meeting_type.replace('_', ' '),
        meeting_link: meeting_link || 'Meeting link will be provided separately',
        meeting_details: meeting_details || 'This consultation is a brief conversation to understand your goals, explain how Apply Bureau works, and determine whether there is a mutual fit to move forward.',
        role_targets: consultation.role_targets,
        next_steps: 'Please mark your calendar and prepare any questions you may have about our services.'
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Create client notification if user exists
    try {
      if (consultation.user_id) {
        await NotificationHelpers.consultationConfirmed(consultation.user_id, updatedConsultation);
      }
    } catch (notificationError) {
      console.error('Failed to create confirmation notification:', notificationError);
    }

    res.json({
      message: 'Consultation confirmed successfully',
      consultation: updatedConsultation,
      confirmed_time: confirmedTime,
      meeting_details: meeting_details || 'Meeting details provided in confirmation email'
    });
  } catch (error) {
    console.error('Confirm consultation time error:', error);
    res.status(500).json({ error: 'Failed to confirm consultation' });
  }
});

// POST /api/admin/consultations/:id/request-new-availability - Request new availability from client (ADMIN ONLY)
router.post('/:id/request-new-availability', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_message, reason } = req.body;
    const adminId = req.user.userId || req.user.id;

    // Get consultation request
    const { data: consultation, error: fetchError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !consultation) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Update consultation status
    const { data: updatedConsultation, error: updateError } = await supabaseAdmin
      .from('consultation_requests')
      .update({
        status: 'awaiting_new_times',
        workflow_stage: 'admin_requested_new_times',
        admin_message: admin_message || 'Unfortunately, none of the selected times work. Please select new preferred times.',
        availability_request_reason: reason || 'Schedule conflict',
        requested_new_times_by: adminId,
        requested_new_times_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error requesting new availability:', updateError);
      return res.status(500).json({ error: 'Failed to request new availability' });
    }

    // Send email to client requesting new times
    try {
      const newTimesUrl = buildUrl(`/consultation/new-times/${consultation.id}`);
      await sendEmail(consultation.email, 'consultation_reschedule_request', {
        client_name: consultation.full_name,
        admin_message: admin_message || 'Thanks for your availability. Unfortunately, none of the selected times work. Please select new preferred times from the available options.',
        reason: reason || 'Schedule conflict',
        new_times_url: newTimesUrl,
        role_targets: consultation.role_targets,
        support_message: 'If you have any questions, please don\'t hesitate to contact us.'
      });
    } catch (emailError) {
      console.error('Failed to send new availability request email:', emailError);
      // Don't fail the request if email fails
    }

    // Create client notification if user exists
    try {
      if (consultation.user_id) {
        await NotificationHelpers.newAvailabilityRequested(consultation.user_id, updatedConsultation);
      }
    } catch (notificationError) {
      console.error('Failed to create new availability notification:', notificationError);
    }

    res.json({
      message: 'New availability requested from client',
      consultation: updatedConsultation,
      next_steps: 'Client will receive an email with instructions to provide new preferred times'
    });
  } catch (error) {
    console.error('Request new availability error:', error);
    res.status(500).json({ error: 'Failed to request new availability' });
  }
});

// POST /api/admin/consultations/:id/complete - Mark consultation as completed (ADMIN ONLY)
router.post('/:id/complete', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      outcome, // 'proceeding', 'not_proceeding'
      selected_tier, // 'tier_1', 'tier_2', etc.
      admin_notes,
      next_steps
    } = req.body;
    const adminId = req.user.userId || req.user.id;

    if (!outcome || !['proceeding', 'not_proceeding'].includes(outcome)) {
      return res.status(400).json({ 
        error: 'Please specify consultation outcome: proceeding or not_proceeding' 
      });
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

    // Update consultation with completion details
    const updateData = {
      status: 'completed',
      workflow_stage: outcome === 'proceeding' ? 'awaiting_payment' : 'consultation_completed',
      consultation_outcome: outcome,
      completed_by: adminId,
      completed_at: new Date().toISOString(),
      admin_notes,
      next_steps: next_steps || (outcome === 'proceeding' ? 'Payment invoice will be sent manually' : 'Consultation completed - no further action')
    };

    if (outcome === 'proceeding' && selected_tier) {
      updateData.selected_tier = selected_tier;
      updateData.awaiting_payment = true;
    }

    const { data: updatedConsultation, error: updateError } = await supabaseAdmin
      .from('consultation_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error completing consultation:', updateError);
      return res.status(500).json({ error: 'Failed to complete consultation' });
    }

    // Send appropriate follow-up email
    try {
      if (outcome === 'proceeding') {
        await sendEmail(consultation.email, 'consultation_confirmed', {
          client_name: consultation.full_name,
          selected_tier: selected_tier || 'To be determined',
          next_steps: next_steps || 'We will send you a payment invoice shortly via email. Payment is via Interac e-transfer.',
          role_targets: consultation.role_targets,
          payment_method: 'Interac e-transfer',
          admin_contact: 'admin@applybureau.com'
        });
      } else {
        await sendEmail(consultation.email, 'consultation_completed', {
          client_name: consultation.full_name,
          thank_you_message: 'Thank you for taking the time to speak with us about your career goals.',
          resources: 'We encourage you to explore our free resources on LinkedIn and our blog for career guidance.',
          future_contact: 'Feel free to reach out if your situation changes in the future.',
          role_targets: consultation.role_targets
        });
      }
    } catch (emailError) {
      console.error('Failed to send completion email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      message: `Consultation marked as completed - ${outcome}`,
      consultation: updatedConsultation,
      next_steps: outcome === 'proceeding' ? 'Send payment invoice manually' : 'No further action required'
    });
  } catch (error) {
    console.error('Complete consultation error:', error);
    res.status(500).json({ error: 'Failed to complete consultation' });
  }
});

// POST /api/admin/consultations/:id/payment-received - Mark payment as received (ADMIN ONLY)
router.post('/:id/payment-received', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      payment_amount,
      payment_method = 'interac_etransfer',
      payment_reference,
      admin_notes
    } = req.body;
    const adminId = req.user.userId || req.user.id;

    if (!payment_amount) {
      return res.status(400).json({ error: 'Payment amount is required' });
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

    // Generate registration token for client portal access
    const registrationToken = jwt.sign({
      consultationId: id,
      email: consultation.email,
      type: 'client_registration',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }, process.env.JWT_SECRET);

    // Update consultation with payment details
    const { data: updatedConsultation, error: updateError } = await supabaseAdmin
      .from('consultation_requests')
      .update({
        status: 'payment_received',
        workflow_stage: 'payment_received_awaiting_registration',
        payment_received: true,
        payment_amount: parseFloat(payment_amount),
        payment_method,
        payment_reference,
        payment_received_by: adminId,
        payment_received_at: new Date().toISOString(),
        registration_token: registrationToken,
        token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        admin_notes
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error recording payment:', updateError);
      return res.status(500).json({ error: 'Failed to record payment' });
    }

    // Send welcome email with registration link
    try {
      const registrationLink = buildUrl(`/register?token=${registrationToken}`);
      await sendEmail(consultation.email, 'payment_received_welcome', {
        client_name: consultation.full_name,
        payment_amount: payment_amount,
        payment_method: payment_method.replace('_', ' '),
        registration_link: registrationLink,
        token_expires: '7 days',
        selected_tier: consultation.selected_tier || 'Your selected package',
        role_targets: consultation.role_targets,
        next_steps: 'Click the registration link to create your client portal account and begin the onboarding process.',
        portal_features: 'In your portal, you will complete an onboarding questionnaire, upload documents, and schedule your strategy call.'
      });
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      message: 'Payment recorded and registration token generated',
      consultation: updatedConsultation,
      registration_token: registrationToken,
      next_steps: 'Client will receive welcome email with registration link'
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

module.exports = router;