const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { sendEmail } = require('../utils/email');
const { validate, schemas } = require('../utils/validation');

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
      requestType = 'consultation_booking',
      status = 'pending'
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !message || !preferredSlots) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: fullName, email, message, preferredSlots',
        code: 'VALIDATION_ERROR'
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

    // Validate preferredSlots is array
    if (!Array.isArray(preferredSlots) || preferredSlots.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'preferredSlots must be a non-empty array',
        code: 'INVALID_SLOTS'
      });
    }

    // Create consultation request with exact specification format
    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .insert({
        fullName,
        email,
        phone,
        message,
        preferredSlots: JSON.stringify(preferredSlots),
        requestType,
        status,
        pipeline_status: 'lead'
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
        preferred_slots: preferredSlots.join(', '),
        message_preview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        next_steps: 'Our team will review your request and contact you within 24 hours to confirm your consultation slot.'
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Send notification email to admin
    try {
      await sendEmail('admin@applybureau.com', 'new_consultation_request', {
        client_name: fullName,
        client_email: email,
        client_phone: phone || 'Not provided',
        message: message,
        preferred_slots: preferredSlots.join(', '),
        request_id: consultation.id,
        admin_dashboard_url: `${process.env.FRONTEND_URL}/admin/consultations/${consultation.id}`
      });
    } catch (emailError) {
      console.error('Error sending admin notification:', emailError);
    }

    // Return exact specification format
    res.status(201).json({
      success: true,
      message: 'Consultation request submitted successfully',
      data: {
        id: consultation.id,
        fullName: consultation.fullName,
        email: consultation.email,
        phone: consultation.phone,
        message: consultation.message,
        preferredSlots: JSON.parse(consultation.preferredSlots),
        requestType: consultation.requestType,
        status: consultation.status,
        pipeline_status: consultation.pipeline_status,
        created_at: consultation.created_at
      }
    });

  } catch (error) {
    console.error('Consultation request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/consultation-requests - Get all consultation requests (ADMIN ONLY)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      status, 
      pipeline_status, 
      limit = 50, 
      offset = 0,
      search,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    let query = supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (pipeline_status) {
      query = query.eq('pipeline_status', pipeline_status);
    }

    if (search) {
      query = query.or(`fullName.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`);
    }

    const { data: consultations, error } = await query;

    if (error) {
      console.error('Error fetching consultation requests:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch consultation requests',
        code: 'DATABASE_ERROR'
      });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting consultation count:', countError);
    }

    // Format response with exact specification
    const formattedConsultations = consultations.map(consultation => ({
      id: consultation.id,
      fullName: consultation.fullName,
      email: consultation.email,
      phone: consultation.phone,
      message: consultation.message,
      preferredSlots: JSON.parse(consultation.preferredSlots || '[]'),
      status: consultation.status,
      pipeline_status: consultation.pipeline_status,
      created_at: consultation.created_at,
      updated_at: consultation.updated_at,
      admin_notes: consultation.admin_notes,
      confirmedSlot: consultation.confirmedSlot,
      scheduled_datetime: consultation.scheduled_datetime,
      google_meet_link: consultation.google_meet_link
    }));

    res.json({
      success: true,
      data: formattedConsultations,
      pagination: {
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: (offset + parseInt(limit)) < (count || 0),
        hasPrev: offset > 0
      }
    });

  } catch (error) {
    console.error('Get consultation requests error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/consultation-requests/:id - Get specific consultation request (ADMIN ONLY)
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

    // Format response with exact specification
    res.json({
      success: true,
      data: {
        id: consultation.id,
        fullName: consultation.fullName,
        email: consultation.email,
        phone: consultation.phone,
        message: consultation.message,
        preferredSlots: JSON.parse(consultation.preferredSlots || '[]'),
        status: consultation.status,
        pipeline_status: consultation.pipeline_status,
        created_at: consultation.created_at,
        updated_at: consultation.updated_at,
        admin_notes: consultation.admin_notes,
        confirmedSlot: consultation.confirmedSlot,
        scheduled_datetime: consultation.scheduled_datetime,
        google_meet_link: consultation.google_meet_link
      }
    });

  } catch (error) {
    console.error('Get consultation request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/consultation-requests/:id - Update consultation request (ADMIN ONLY)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      pipeline_status,
      admin_notes,
      confirmedSlot,
      scheduled_datetime,
      google_meet_link
    } = req.body;

    // Validate status if provided
    const validStatuses = ['pending', 'confirmed', 'rescheduled', 'waitlisted', 'under_review', 'approved', 'scheduled', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status value',
        code: 'INVALID_STATUS'
      });
    }

    // Validate pipeline_status if provided
    const validPipelineStatuses = ['lead', 'qualified', 'converted', 'closed'];
    if (pipeline_status && !validPipelineStatuses.includes(pipeline_status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid pipeline_status value',
        code: 'INVALID_PIPELINE_STATUS'
      });
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (pipeline_status !== undefined) updateData.pipeline_status = pipeline_status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (confirmedSlot !== undefined) updateData.confirmedSlot = confirmedSlot;
    if (scheduled_datetime !== undefined) updateData.scheduled_datetime = scheduled_datetime;
    if (google_meet_link !== undefined) updateData.google_meet_link = google_meet_link;

    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !consultation) {
      return res.status(404).json({ 
        success: false,
        error: 'Consultation request not found or update failed',
        code: 'UPDATE_FAILED'
      });
    }

    // Send appropriate email based on status change
    if (status) {
      try {
        let emailTemplate = null;
        let emailData = {
          client_name: consultation.fullName,
          request_id: consultation.id
        };

        switch (status) {
          case 'confirmed':
            emailTemplate = 'consultation_confirmed';
            emailData.confirmed_slot = confirmedSlot;
            emailData.meeting_link = google_meet_link;
            emailData.scheduled_datetime = scheduled_datetime;
            break;
          case 'rescheduled':
            emailTemplate = 'consultation_rescheduled';
            emailData.reason = 'Schedule conflict - please provide new availability';
            break;
          case 'rejected':
            emailTemplate = 'consultation_rejected';
            emailData.reason = admin_notes || 'Unfortunately, we cannot accommodate your request at this time';
            break;
          case 'under_review':
            emailTemplate = 'consultation_under_review';
            emailData.review_message = admin_notes || 'Your consultation request is being reviewed by our team';
            break;
        }

        if (emailTemplate) {
          await sendEmail(consultation.email, emailTemplate, emailData);
        }
      } catch (emailError) {
        console.error('Error sending status update email:', emailError);
      }
    }

    // Format response with exact specification
    res.json({
      success: true,
      message: 'Consultation request updated successfully',
      data: {
        id: consultation.id,
        fullName: consultation.fullName,
        email: consultation.email,
        phone: consultation.phone,
        message: consultation.message,
        preferredSlots: JSON.parse(consultation.preferredSlots || '[]'),
        status: consultation.status,
        pipeline_status: consultation.pipeline_status,
        created_at: consultation.created_at,
        updated_at: consultation.updated_at,
        admin_notes: consultation.admin_notes,
        confirmedSlot: consultation.confirmedSlot,
        scheduled_datetime: consultation.scheduled_datetime,
        google_meet_link: consultation.google_meet_link
      }
    });

  } catch (error) {
    console.error('Update consultation request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// DELETE /api/consultation-requests/:id - Delete consultation request (ADMIN ONLY)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('consultation_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting consultation request:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete consultation request',
        code: 'DELETE_FAILED'
      });
    }

    res.json({
      success: true,
      message: 'Consultation request deleted successfully'
    });

  } catch (error) {
    console.error('Delete consultation request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;