const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { sendEmail, buildUrl } = require('../utils/email');
const { 
  createSuccessResponse, 
  createPaginatedResponse,
  handleValidationError,
  handleNotFoundError,
  handleDatabaseError,
  ERROR_CODES 
} = require('../middleware/errorHandler');
const { 
  parsePaginationParams, 
  addValidSortFields, 
  paginateResults 
} = require('../middleware/pagination');

const router = express.Router();

// POST /api/consultation-requests - Accept consultation requests from website (PUBLIC)
router.post('/', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      message,
      preferredSlots,
      requestType = 'consultation_booking',
      company,
      job_title,
      consultation_type = 'general_consultation',
      urgency_level = 'normal',
      source = 'website'
    } = req.body;

    // Validate required fields
    const requiredFields = ['fullName', 'email', 'message', 'preferredSlots'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return handleValidationError(req, res, [
        `Missing required fields: ${missingFields.join(', ')}`
      ]);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return handleValidationError(req, res, ['Invalid email format']);
    }

    // Validate preferredSlots is array
    if (!Array.isArray(preferredSlots) || preferredSlots.length === 0) {
      return handleValidationError(req, res, [
        'preferredSlots must be a non-empty array'
      ]);
    }

    // Validate consultation_type
    const validConsultationTypes = [
      'career_strategy', 'resume_review', 'interview_prep', 'job_search',
      'salary_negotiation', 'career_transition', 'linkedin_optimization', 'general_consultation'
    ];
    if (!validConsultationTypes.includes(consultation_type)) {
      return handleValidationError(req, res, [
        `Invalid consultation_type. Valid options: ${validConsultationTypes.join(', ')}`
      ]);
    }

    // Validate urgency_level
    const validUrgencyLevels = ['low', 'normal', 'high'];
    if (!validUrgencyLevels.includes(urgency_level)) {
      return handleValidationError(req, res, [
        `Invalid urgency_level. Valid options: ${validUrgencyLevels.join(', ')}`
      ]);
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
        company,
        job_title,
        consultation_type,
        urgency_level,
        source,
        status: 'pending',
        pipeline_status: 'lead',
        priority: urgency_level === 'high' ? 'high' : 'medium'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating consultation request:', error);
      return handleDatabaseError(req, res, error, 'Failed to submit consultation request');
    }

    // Send confirmation email to client
    try {
      const { generateConsultationActionUrls } = require('../utils/emailTokens');
      const actionUrls = generateConsultationActionUrls(consultation.id, email);
      
      await sendEmail(email, 'consultation_request_received', {
        client_name: fullName,
        request_id: consultation.id,
        consultation_type: consultation_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        preferred_slots: preferredSlots.join(', '),
        urgency_level: urgency_level,
        next_steps: 'Our team will review your request and contact you within 24 hours.',
        confirm_url: actionUrls.confirmUrl,
        waitlist_url: actionUrls.waitlistUrl,
        role_targets: company || 'Not specified',
        package_interest: consultation_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        country: 'Not specified',
        employment_status: 'Not specified'
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Send notification email to admin
    try {
      await sendEmail(process.env.ADMIN_EMAIL || 'admin@applybureau.com', 'new_consultation_request', {
        client_name: fullName,
        client_email: email,
        client_phone: phone || 'Not provided',
        company: company || 'Not provided',
        job_title: job_title || 'Not provided',
        consultation_type: consultation_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        urgency_level: urgency_level,
        message: message,
        preferred_slots: preferredSlots.join(', '),
        admin_dashboard_link: `${process.env.FRONTEND_URL}/admin/consultations/${consultation.id}`
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // Don't fail the request if email fails
    }

    // Format response according to specification
    const responseData = {
      id: consultation.id,
      fullName: consultation.fullName,
      email: consultation.email,
      phone: consultation.phone,
      message: consultation.message,
      preferredSlots: JSON.parse(consultation.preferredSlots || '[]'),
      requestType: consultation.requestType,
      company: consultation.company,
      job_title: consultation.job_title,
      consultation_type: consultation.consultation_type,
      urgency_level: consultation.urgency_level,
      source: consultation.source,
      status: consultation.status,
      pipeline_status: consultation.pipeline_status,
      priority: consultation.priority,
      created_at: consultation.created_at,
      updated_at: consultation.updated_at,
      admin_notes: consultation.admin_notes,
      confirmedSlot: consultation.confirmedSlot,
      scheduled_datetime: consultation.scheduled_datetime,
      google_meet_link: consultation.google_meet_link
    };

    res.status(201).json(createSuccessResponse(
      responseData,
      'Consultation request submitted successfully'
    ));
  } catch (error) {
    console.error('Consultation request submission error:', error);
    return handleDatabaseError(req, res, error, 'Failed to submit consultation request');
  }
});

// GET /api/consultation-requests - List consultation requests (ADMIN ONLY)
router.get('/', 
  authenticateToken, 
  requireAdmin,
  addValidSortFields(['created_at', 'updated_at', 'fullName', 'email', 'status', 'urgency_level', 'consultation_type']),
  parsePaginationParams,
  async (req, res) => {
    try {
      // Add search fields for filtering
      req.searchFields = ['fullName', 'email', 'company', 'job_title', 'message'];

      // Base query
      const baseQuery = supabaseAdmin
        .from('consultation_requests')
        .select(`
          id,
          fullName,
          email,
          phone,
          message,
          preferredSlots,
          requestType,
          company,
          job_title,
          consultation_type,
          urgency_level,
          source,
          status,
          pipeline_status,
          priority,
          created_at,
          updated_at,
          admin_notes,
          confirmedSlot,
          scheduled_datetime,
          google_meet_link,
          handled_by,
          response_sent
        `);

      // Count query
      const countQuery = supabaseAdmin
        .from('consultation_requests')
        .select('*', { count: 'exact', head: true });

      // Get paginated results
      const result = await paginateResults(baseQuery, countQuery, req);

      // Format response data
      const formattedData = result.data.map(consultation => ({
        id: consultation.id,
        fullName: consultation.fullName,
        email: consultation.email,
        phone: consultation.phone,
        message: consultation.message,
        preferredSlots: JSON.parse(consultation.preferredSlots || '[]'),
        requestType: consultation.requestType,
        company: consultation.company,
        job_title: consultation.job_title,
        consultation_type: consultation.consultation_type,
        urgency_level: consultation.urgency_level,
        source: consultation.source,
        status: consultation.status,
        pipeline_status: consultation.pipeline_status,
        priority: consultation.priority,
        created_at: consultation.created_at,
        updated_at: consultation.updated_at,
        admin_notes: consultation.admin_notes,
        confirmedSlot: consultation.confirmedSlot,
        scheduled_datetime: consultation.scheduled_datetime,
        google_meet_link: consultation.google_meet_link,
        handled_by: consultation.handled_by,
        response_sent: consultation.response_sent
      }));

      res.json(createPaginatedResponse(
        formattedData,
        result.pagination,
        'Consultation requests retrieved successfully'
      ));
    } catch (error) {
      console.error('Error fetching consultation requests:', error);
      return handleDatabaseError(req, res, error, 'Failed to fetch consultation requests');
    }
  }
);

// PATCH /api/consultation-requests/:id - Update consultation status (ADMIN ONLY)
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      admin_notes, 
      confirmedSlot, 
      scheduled_datetime, 
      google_meet_link,
      pipeline_status,
      handled_by,
      response_sent,
      priority
    } = req.body;

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'rescheduled', 'waitlisted', 'under_review', 'approved', 'scheduled', 'rejected'];
      if (!validStatuses.includes(status)) {
        return handleValidationError(req, res, [
          `Invalid status. Valid options: ${validStatuses.join(', ')}`
        ]);
      }
    }

    // Validate priority if provided
    if (priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        return handleValidationError(req, res, [
          `Invalid priority. Valid options: ${validPriorities.join(', ')}`
        ]);
      }
    }

    const updateData = {};
    
    if (status) updateData.status = status;
    if (admin_notes) updateData.admin_notes = admin_notes;
    if (confirmedSlot) updateData.confirmedSlot = confirmedSlot;
    if (scheduled_datetime) updateData.scheduled_datetime = scheduled_datetime;
    if (google_meet_link) updateData.google_meet_link = google_meet_link;
    if (pipeline_status) updateData.pipeline_status = pipeline_status;
    if (handled_by) updateData.handled_by = handled_by;
    if (response_sent !== undefined) updateData.response_sent = response_sent;
    if (priority) updateData.priority = priority;

    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating consultation request:', error);
      return handleDatabaseError(req, res, error, 'Failed to update consultation request');
    }

    if (!consultation) {
      return handleNotFoundError(req, res, 'Consultation request');
    }

    // Send appropriate email based on status change
    try {
      if (status === 'confirmed' && confirmedSlot) {
        await sendEmail(consultation.email, 'consultation_confirmed', {
          client_name: consultation.fullName,
          confirmed_slot: confirmedSlot,
          meeting_link: google_meet_link || 'Will be provided separately'
        });
      } else if (status === 'rejected') {
        await sendEmail(consultation.email, 'consultation_rejected', {
          client_name: consultation.fullName,
          reason: admin_notes || 'Unfortunately, we cannot accommodate your request at this time.'
        });
      } else if (status === 'scheduled' && google_meet_link) {
        await sendEmail(consultation.email, 'consultation_scheduled', {
          client_name: consultation.fullName,
          meeting_date: scheduled_datetime,
          meeting_link: google_meet_link
        });
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
    }

    // Format response to match specification
    const formattedConsultation = {
      id: consultation.id,
      fullName: consultation.fullName,
      email: consultation.email,
      phone: consultation.phone,
      message: consultation.message,
      preferredSlots: JSON.parse(consultation.preferredSlots || '[]'),
      requestType: consultation.requestType,
      company: consultation.company,
      job_title: consultation.job_title,
      consultation_type: consultation.consultation_type,
      urgency_level: consultation.urgency_level,
      source: consultation.source,
      status: consultation.status,
      pipeline_status: consultation.pipeline_status,
      priority: consultation.priority,
      created_at: consultation.created_at,
      updated_at: consultation.updated_at,
      admin_notes: consultation.admin_notes,
      confirmedSlot: consultation.confirmedSlot,
      scheduled_datetime: consultation.scheduled_datetime,
      google_meet_link: consultation.google_meet_link,
      handled_by: consultation.handled_by,
      response_sent: consultation.response_sent
    };

    res.json(createSuccessResponse(
      formattedConsultation,
      'Consultation request updated successfully'
    ));
  } catch (error) {
    console.error('Update consultation request error:', error);
    return handleDatabaseError(req, res, error, 'Failed to update consultation request');
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
      return handleDatabaseError(req, res, error, 'Failed to delete consultation request');
    }

    res.json(createSuccessResponse(
      null,
      'Consultation request deleted successfully'
    ));
  } catch (error) {
    console.error('Delete consultation request error:', error);
    return handleDatabaseError(req, res, error, 'Failed to delete consultation request');
  }
});

module.exports = router;