const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { sendEmail, buildUrl } = require('../utils/email');
const { NotificationHelpers } = require('../utils/notifications');

const router = express.Router();

// POST /api/consultation-requests - Accept consultation requests (PUBLIC)
router.post('/', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      message,
      preferredSlots,
      requestType = 'consultation_booking'
    } = req.body;

    // Validate required fields according to spec
    if (!fullName || !email || !phone || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: fullName, email, phone, message',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate preferredSlots if provided
    if (preferredSlots && (!Array.isArray(preferredSlots) || preferredSlots.length > 3)) {
      return res.status(400).json({ 
        success: false,
        error: 'preferredSlots must be an array with maximum 3 time slots',
        code: 'INVALID_PREFERRED_SLOTS'
      });
    }

    // Create consultation request according to spec format
    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .insert({
        full_name: fullName,
        email,
        phone,
        message,
        preferred_slots: preferredSlots || [],
        request_type: requestType,
        status: 'pending',
        pipeline_status: 'lead',
        admin_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating consultation request:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to submit consultation request',
        code: 'DATABASE_ERROR'
      });
    }

    // Send confirmation email to client
    try {
      await sendEmail(email, 'consultation_request_received', {
        client_name: fullName,
        request_id: consultation.id,
        message: message,
        preferred_slots: preferredSlots || [],
        confirmation_message: 'Request received. We will confirm your consultation shortly.',
        next_steps: 'Our team will review your request and contact you within 24 hours to confirm your consultation time.'
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    // Send admin notification
    try {
      await sendEmail('admin@applybureau.com', 'new_consultation_request', {
        client_name: fullName,
        client_email: email,
        client_phone: phone,
        client_message: message,
        preferred_slots: preferredSlots || [],
        has_time_slots: preferredSlots && preferredSlots.length > 0,
        admin_dashboard_url: buildUrl('/admin/consultations'),
        consultation_id: consultation.id
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
    }

    // Create admin notification
    try {
      await NotificationHelpers.newConsultationRequest(consultation);
    } catch (notificationError) {
      console.error('Failed to create admin notification:', notificationError);
    }

    // Return response according to spec
    res.status(201).json({
      success: true,
      id: consultation.id,
      status: 'pending',
      pipeline_status: 'lead',
      message: 'Request received. We will confirm your consultation shortly.',
      created_at: consultation.created_at
    });
  } catch (error) {
    console.error('Consultation request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit consultation request',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/consultation-requests - Return consultation requests for admin (PROTECTED)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching consultation requests');

    const { 
      status,
      pipeline_status,
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
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (pipeline_status && pipeline_status !== 'all') {
      query = query.eq('pipeline_status', pipeline_status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`);
    }

    const { data: consultations, error } = await query;

    if (error) {
      console.error('❌ Error fetching consultation requests:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch consultation requests',
        code: 'DATABASE_ERROR',
        details: error.message,
        timestamp: new Date().toISOString(),
        path: req.path,
        status: 500
      });
    }

    console.log(`✅ Found ${consultations?.length || 0} consultation requests`);

    // Format consultations according to spec
    const formattedConsultations = consultations?.map(consultation => ({
      id: consultation.id,
      fullName: consultation.name || consultation.full_name,
      email: consultation.email,
      phone: consultation.phone,
      message: consultation.message,
      preferredSlots: consultation.preferred_slots || [],
      status: consultation.status,
      pipeline_status: consultation.pipeline_status,
      admin_status: consultation.admin_status,
      created_at: consultation.created_at,
      updated_at: consultation.updated_at,
      admin_notes: consultation.admin_notes,
      confirmedSlot: consultation.confirmed_slot,
      scheduled_datetime: consultation.scheduled_datetime || consultation.confirmed_time,
      google_meet_link: consultation.google_meet_link
    })) || [];

    res.json({
      success: true,
      consultations: formattedConsultations,
      total: consultations?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit),
      timestamp: new Date().toISOString()
    });
    });
  } catch (error) {
    console.error('Fetch consultation requests error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch consultation requests',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PATCH /api/consultation-requests/:id - Update consultation status (PROTECTED)
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      confirmedSlot, 
      admin_notes, 
      action,
      scheduled_datetime,
      google_meet_link
    } = req.body;
    const adminId = req.user.userId || req.user.id;

    // Get current consultation
    const { data: currentConsultation, error: fetchError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentConsultation) {
      return res.status(404).json({ 
        success: false,
        error: 'Consultation request not found',
        code: 'NOT_FOUND'
      });
    }

    let updateData = {
      updated_at: new Date().toISOString()
    };

    // Handle different status updates according to spec
    if (status === 'confirmed' && confirmedSlot) {
      updateData = {
        ...updateData,
        status: 'confirmed',
        admin_status: 'confirmed',
        confirmed_slot: confirmedSlot,
        admin_notes: admin_notes || `Consultation confirmed for ${confirmedSlot}`,
        confirmed_by: adminId,
        confirmed_at: new Date().toISOString()
      };
    } else if (status === 'rescheduled') {
      updateData = {
        ...updateData,
        status: 'rescheduled',
        admin_status: 'rescheduled',
        admin_notes: admin_notes || 'Time adjustment needed - requesting new availability from client',
        rescheduled_by: adminId,
        rescheduled_at: new Date().toISOString()
      };
    } else if (status === 'waitlisted') {
      updateData = {
        ...updateData,
        status: 'waitlisted',
        admin_status: 'waitlisted',
        admin_notes: admin_notes || 'Client placed on waitlist for future availability',
        waitlisted_by: adminId,
        waitlisted_at: new Date().toISOString()
      };
    } else if (status === 'under_review') {
      updateData = {
        ...updateData,
        status: 'under_review',
        pipeline_status: 'under_review',
        admin_notes: admin_notes || 'Consultation request is now under review by our team.',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString()
      };
    } else if (status === 'scheduled') {
      updateData = {
        ...updateData,
        status: 'scheduled',
        pipeline_status: 'scheduled',
        scheduled_datetime: scheduled_datetime,
        google_meet_link: google_meet_link,
        admin_notes: admin_notes || `Meeting scheduled for ${scheduled_datetime}`,
        scheduled_by: adminId,
        scheduled_at: new Date().toISOString()
      };
    } else if (action === 'approve') {
      updateData = {
        ...updateData,
        status: 'approved',
        pipeline_status: 'approved',
        admin_notes: admin_notes || 'Great candidate with strong background. Approved for service.',
        approved_by: adminId,
        approved_at: new Date().toISOString()
      };
    } else if (action === 'reject') {
      updateData = {
        ...updateData,
        status: 'rejected',
        pipeline_status: 'rejected',
        admin_notes: admin_notes || 'Application rejected - not a good fit for our services at this time.',
        rejected_by: adminId,
        rejected_at: new Date().toISOString()
      };
    } else if (status) {
      // Handle other status updates
      updateData.status = status;
      if (admin_notes) {
        updateData.admin_notes = admin_notes;
      }
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status or action provided',
        code: 'INVALID_STATUS'
      });
    }

    // Update consultation
    const { data: updatedConsultation, error: updateError } = await supabaseAdmin
      .from('consultation_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating consultation:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update consultation request',
        code: 'UPDATE_ERROR'
      });
    }

    // Send appropriate email notifications
    try {
      let emailTemplate = null;
      let emailData = {
        client_name: updatedConsultation.full_name,
        admin_name: req.user.full_name || 'Apply Bureau Team'
      };

      if (status === 'confirmed' && confirmedSlot) {
        emailTemplate = 'consultation_confirmed';
        emailData.confirmed_slot = confirmedSlot;
        emailData.meeting_details = admin_notes || 'Your consultation has been confirmed.';
      } else if (status === 'rescheduled') {
        emailTemplate = 'consultation_reschedule_request';
        emailData.reschedule_reason = admin_notes;
        emailData.new_times_url = buildUrl(`/consultation/new-times/${id}`);
      } else if (status === 'under_review') {
        emailTemplate = 'consultation_under_review';
        emailData.next_steps = 'Our team is reviewing your consultation request. We will contact you within 24-48 hours.';
      } else if (status === 'scheduled') {
        emailTemplate = 'consultation_scheduled';
        emailData.scheduled_datetime = scheduled_datetime;
        emailData.google_meet_link = google_meet_link;
      } else if (action === 'approve') {
        emailTemplate = 'consultation_approved';
        emailData.next_steps = 'You will receive further instructions for the next steps.';
      } else if (action === 'reject') {
        emailTemplate = 'consultation_rejected';
        emailData.reason = admin_notes;
      }

      if (emailTemplate) {
        await sendEmail(updatedConsultation.email, emailTemplate, emailData);
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
    }

    // Create notification
    try {
      if (status === 'confirmed') {
        await NotificationHelpers.consultationConfirmed(updatedConsultation);
      } else if (action === 'approve') {
        await NotificationHelpers.consultationApproved(updatedConsultation);
      } else if (action === 'reject') {
        await NotificationHelpers.consultationRejected(updatedConsultation);
      }
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    // Format response according to spec
    const response = {
      success: true,
      message: 'Consultation request updated successfully',
      consultation: {
        id: updatedConsultation.id,
        fullName: updatedConsultation.full_name,
        email: updatedConsultation.email,
        phone: updatedConsultation.phone,
        message: updatedConsultation.message,
        preferredSlots: updatedConsultation.preferred_slots || [],
        status: updatedConsultation.status,
        pipeline_status: updatedConsultation.pipeline_status,
        created_at: updatedConsultation.created_at,
        updated_at: updatedConsultation.updated_at,
        admin_notes: updatedConsultation.admin_notes,
        confirmedSlot: updatedConsultation.confirmed_slot,
        scheduled_datetime: updatedConsultation.scheduled_datetime,
        google_meet_link: updatedConsultation.google_meet_link
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Update consultation request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update consultation request',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/consultation-requests/:id - Get specific consultation request (PROTECTED)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !consultation) {
      return res.status(404).json({ 
        success: false,
        error: 'Consultation request not found',
        code: 'NOT_FOUND'
      });
    }

    // Format response according to spec
    const formattedConsultation = {
      id: consultation.id,
      fullName: consultation.full_name,
      email: consultation.email,
      phone: consultation.phone,
      message: consultation.message,
      preferredSlots: consultation.preferred_slots || [],
      status: consultation.status,
      pipeline_status: consultation.pipeline_status,
      created_at: consultation.created_at,
      updated_at: consultation.updated_at,
      admin_notes: consultation.admin_notes,
      confirmedSlot: consultation.confirmed_slot,
      scheduled_datetime: consultation.scheduled_datetime,
      google_meet_link: consultation.google_meet_link
    };

    res.json({
      success: true,
      consultation: formattedConsultation
    });
  } catch (error) {
    console.error('Get consultation request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch consultation request',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;