const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { sendEmail } = require('../utils/email');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// POST /api/consultation-requests - Submit consultation request from website
router.post('/', async (req, res) => {
  try {
    const { 
      full_name, 
      email, 
      phone, 
      company, 
      job_title, 
      consultation_type, 
      preferred_date, 
      preferred_time, 
      message, 
      urgency_level = 'normal' 
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !consultation_type) {
      return res.status(400).json({ 
        error: 'Full name, email, and consultation type are required' 
      });
    }

    // Create consultation request
    const { data: request, error } = await supabaseAdmin
      .from('consultation_requests')
      .insert({
        full_name,
        email,
        phone,
        company,
        job_title,
        consultation_type,
        preferred_date,
        preferred_time,
        message,
        urgency_level,
        status: 'pending',
        source: 'website'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating consultation request:', error);
      return res.status(500).json({ error: 'Failed to submit consultation request' });
    }

    // Send confirmation email to requester
    try {
      await sendEmail(email, 'consultation_request_received', {
        client_name: full_name,
        consultation_type: consultation_type,
        request_id: request.id,
        preferred_date: preferred_date,
        preferred_time: preferred_time
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    // Send notification to admin
    try {
      await sendEmail('admin@applybureau.com', 'new_consultation_request', {
        client_name: full_name,
        client_email: email,
        client_phone: phone,
        company: company,
        job_title: job_title,
        consultation_type: consultation_type,
        preferred_date: preferred_date,
        preferred_time: preferred_time,
        message: message,
        urgency_level: urgency_level,
        request_id: request.id,
        admin_dashboard_url: `${process.env.FRONTEND_URL}/admin/consultation-requests`
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    res.status(201).json({
      message: 'Consultation request submitted successfully',
      request_id: request.id,
      status: 'pending'
    });
  } catch (error) {
    console.error('Consultation request error:', error);
    res.status(500).json({ error: 'Failed to submit consultation request' });
  }
});

// GET /api/consultation-requests - Get all consultation requests (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      status, 
      urgency_level, 
      consultation_type, 
      limit = 50, 
      offset = 0,
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

    if (urgency_level) {
      query = query.eq('urgency_level', urgency_level);
    }

    if (consultation_type) {
      query = query.eq('consultation_type', consultation_type);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching consultation requests:', error);
      return res.status(500).json({ error: 'Failed to fetch consultation requests' });
    }

    // Get counts by status
    const { data: statusCounts } = await supabaseAdmin
      .from('consultation_requests')
      .select('status')
      .then(result => {
        if (result.data) {
          const counts = result.data.reduce((acc, req) => {
            acc[req.status] = (acc[req.status] || 0) + 1;
            return acc;
          }, {});
          return { data: counts };
        }
        return { data: {} };
      });

    res.json({
      requests: requests || [],
      total: requests?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit),
      status_counts: statusCounts || {}
    });
  } catch (error) {
    console.error('Get consultation requests error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation requests' });
  }
});

// GET /api/consultation-requests/:id - Get specific consultation request
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: request, error } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !request) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    res.json({ request });
  } catch (error) {
    console.error('Get consultation request error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation request' });
  }
});

// PUT /api/consultation-requests/:id/confirm - Confirm and schedule consultation
router.put('/:id/confirm', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      scheduled_date, 
      scheduled_time, 
      meeting_url, 
      admin_notes,
      meeting_duration = 60 
    } = req.body;

    if (!scheduled_date || !scheduled_time) {
      return res.status(400).json({ 
        error: 'Scheduled date and time are required' 
      });
    }

    const adminId = req.user.userId || req.user.id;

    // Get the consultation request
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Update request status to confirmed
    const { error: updateError } = await supabaseAdmin
      .from('consultation_requests')
      .update({
        status: 'confirmed',
        confirmed_by: adminId,
        confirmed_at: new Date().toISOString(),
        scheduled_date,
        scheduled_time,
        meeting_url,
        admin_notes
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating consultation request:', updateError);
      return res.status(500).json({ error: 'Failed to confirm consultation request' });
    }

    // Create scheduled consultation
    const scheduledDateTime = new Date(`${scheduled_date}T${scheduled_time}`);
    
    const { data: consultation, error: consultationError } = await supabaseAdmin
      .from('consultations')
      .insert({
        client_id: null, // This will be a consultation request, not tied to existing client
        client_name: request.full_name,
        client_email: request.email,
        client_phone: request.phone,
        consultation_type: request.consultation_type,
        scheduled_at: scheduledDateTime.toISOString(),
        meeting_url,
        meeting_title: `${request.consultation_type} Consultation - ${request.full_name}`,
        meeting_description: request.message || `Consultation for ${request.full_name}`,
        preparation_notes: admin_notes,
        status: 'scheduled',
        source: 'consultation_request',
        consultation_request_id: id,
        admin_id: adminId
      })
      .select()
      .single();

    if (consultationError) {
      console.error('Error creating consultation:', consultationError);
      return res.status(500).json({ error: 'Failed to create scheduled consultation' });
    }

    // Send confirmation email to client
    try {
      await sendEmail(request.email, 'consultation_confirmed', {
        client_name: request.full_name,
        consultation_type: request.consultation_type,
        scheduled_date: scheduled_date,
        scheduled_time: scheduled_time,
        meeting_url: meeting_url,
        meeting_duration: meeting_duration,
        admin_notes: admin_notes,
        consultation_id: consultation.id
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.json({
      message: 'Consultation request confirmed and scheduled successfully',
      consultation_request: {
        id: id,
        status: 'confirmed',
        scheduled_date,
        scheduled_time
      },
      consultation: consultation
    });
  } catch (error) {
    console.error('Confirm consultation request error:', error);
    res.status(500).json({ error: 'Failed to confirm consultation request' });
  }
});

// PUT /api/consultation-requests/:id/reject - Reject consultation request
router.put('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    const adminId = req.user.userId || req.user.id;

    // Get the consultation request
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Update request status to rejected
    const { error: updateError } = await supabaseAdmin
      .from('consultation_requests')
      .update({
        status: 'rejected',
        rejected_by: adminId,
        rejected_at: new Date().toISOString(),
        rejection_reason
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error rejecting consultation request:', updateError);
      return res.status(500).json({ error: 'Failed to reject consultation request' });
    }

    // Send rejection email to client
    try {
      await sendEmail(request.email, 'consultation_rejected', {
        client_name: request.full_name,
        consultation_type: request.consultation_type,
        rejection_reason: rejection_reason || 'Unfortunately, we cannot accommodate your consultation request at this time.',
        alternative_options: 'Please feel free to submit another request or contact us directly for alternative options.'
      });
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    res.json({
      message: 'Consultation request rejected successfully',
      consultation_request: {
        id: id,
        status: 'rejected',
        rejection_reason
      }
    });
  } catch (error) {
    console.error('Reject consultation request error:', error);
    res.status(500).json({ error: 'Failed to reject consultation request' });
  }
});

// PUT /api/consultation-requests/:id/reschedule - Reschedule consultation request
router.put('/:id/reschedule', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      new_scheduled_date, 
      new_scheduled_time, 
      reschedule_reason 
    } = req.body;

    if (!new_scheduled_date || !new_scheduled_time) {
      return res.status(400).json({ 
        error: 'New scheduled date and time are required' 
      });
    }

    const adminId = req.user.userId || req.user.id;

    // Get the consultation request
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Update request with new schedule
    const { error: updateError } = await supabaseAdmin
      .from('consultation_requests')
      .update({
        scheduled_date: new_scheduled_date,
        scheduled_time: new_scheduled_time,
        reschedule_reason,
        rescheduled_by: adminId,
        rescheduled_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error rescheduling consultation request:', updateError);
      return res.status(500).json({ error: 'Failed to reschedule consultation request' });
    }

    // Update associated consultation if it exists
    if (request.consultation_request_id) {
      const newScheduledDateTime = new Date(`${new_scheduled_date}T${new_scheduled_time}`);
      
      await supabaseAdmin
        .from('consultations')
        .update({
          scheduled_at: newScheduledDateTime.toISOString()
        })
        .eq('consultation_request_id', id);
    }

    // Send reschedule email to client
    try {
      await sendEmail(request.email, 'consultation_rescheduled', {
        client_name: request.full_name,
        consultation_type: request.consultation_type,
        old_date: request.scheduled_date,
        old_time: request.scheduled_time,
        new_date: new_scheduled_date,
        new_time: new_scheduled_time,
        reschedule_reason: reschedule_reason || 'Schedule adjustment required',
        meeting_url: request.meeting_url
      });
    } catch (emailError) {
      console.error('Failed to send reschedule email:', emailError);
    }

    res.json({
      message: 'Consultation request rescheduled successfully',
      consultation_request: {
        id: id,
        scheduled_date: new_scheduled_date,
        scheduled_time: new_scheduled_time,
        reschedule_reason
      }
    });
  } catch (error) {
    console.error('Reschedule consultation request error:', error);
    res.status(500).json({ error: 'Failed to reschedule consultation request' });
  }
});

module.exports = router;