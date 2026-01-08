const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// POST /api/consultations - Accept consultation requests from website (PUBLIC)
router.post('/', async (req, res) => {
  try {
    console.log('=== CONSULTATION REQUEST DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      full_name,
      email,
      phone,
      linkedin_url,
      role_targets,
      location_preferences,
      minimum_salary,
      target_market,
      employment_status,
      package_interest,
      area_of_concern,
      consultation_window
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !role_targets) {
      console.log('Validation failed: missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: full_name, email, role_targets' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed: invalid email format');
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log('Validation passed, preparing data...');

    // Create a comprehensive message that includes all the user's data
    const detailedMessage = [
      `Role Targets: ${role_targets}`,
      `Location Preferences: ${location_preferences || 'Not specified'}`,
      `Minimum Salary: ${minimum_salary || 'Not specified'}`,
      `Target Market: ${target_market || 'Not specified'}`,
      `Employment Status: ${employment_status || 'Not specified'}`,
      `Package Interest: ${package_interest || 'Not specified'}`,
      `Area of Concern: ${area_of_concern || 'Not specified'}`,
      `Consultation Window: ${consultation_window || 'Not specified'}`,
      linkedin_url ? `LinkedIn: ${linkedin_url}` : ''
    ].filter(Boolean).join('\n');

    // Map to the existing consultations table structure (exact match with existing record)
    const consultationData = {
      full_name,
      email,
      phone: phone || null,
      company: target_market || null,
      job_title: role_targets,
      consultation_type: 'career_strategy',
      preferred_date: null,
      preferred_time: consultation_window || null,
      message: detailedMessage,
      urgency_level: 'normal',
      status: 'pending',
      source: 'website',
      // Explicitly set all foreign key fields to null to avoid constraint issues
      confirmed_by: null,
      confirmed_at: null,
      scheduled_date: null,
      scheduled_time: null,
      meeting_url: null,
      admin_notes: null,
      rejected_by: null,
      rejected_at: null,
      rejection_reason: null,
      rescheduled_by: null,
      rescheduled_at: null,
      reschedule_reason: null,
      consultation_request_id: null
      // created_at and updated_at will be auto-generated
    };

    console.log('Prepared consultation data:', JSON.stringify(consultationData, null, 2));
    console.log('Attempting database insert...');

    // Insert into the existing consultations table
    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .insert(consultationData)
      .select()
      .single();

    if (error) {
      console.error('DATABASE ERROR:', JSON.stringify(error, null, 2));
      return res.status(500).json({ 
        error: 'Database error',
        details: error.message || error.details || error.hint || JSON.stringify(error)
      });
    }

    console.log('Database insert successful:', consultation.id);

    // Try to send confirmation email (but don't fail if it doesn't work)
    console.log('Attempting to send confirmation email...');
    try {
      await sendEmail(email, 'consultation_request_received', {
        client_name: full_name,
        request_id: consultation.id,
        role_targets: role_targets,
        package_interest: package_interest || 'Not specified',
        next_steps: 'Our team will review your request and contact you within 24 hours.'
      });
      console.log('Confirmation email sent successfully');
    } catch (emailError) {
      console.error('EMAIL ERROR (non-fatal):', emailError.message);
      // Continue - don't fail the request if email fails
    }

    // Try to send admin notification email (but don't fail if it doesn't work)
    console.log('Attempting to send admin notification email...');
    try {
      await sendEmail('admin@applybureau.com', 'new_consultation_request', {
        client_name: full_name,
        client_email: email,
        role_targets: role_targets,
        package_interest: package_interest || 'Not specified',
        employment_status: employment_status || 'Not specified',
        area_of_concern: area_of_concern || 'Not specified',
        admin_dashboard_url: 'https://apply-bureau-frontend.com/admin/consultations'
      });
      console.log('Admin notification email sent successfully');
    } catch (emailError) {
      console.error('ADMIN EMAIL ERROR (non-fatal):', emailError.message);
      // Continue - don't fail the request if email fails
    }

    console.log('Consultation request completed successfully');
    res.status(201).json({
      id: consultation.id,
      status: 'pending',
      message: 'Consultation request received successfully'
    });
    
  } catch (error) {
    console.error('UNEXPECTED ERROR:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Unexpected server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Failed to submit consultation request'
    });
  }
});

// GET /api/consultations - Return consultation requests for admin (PROTECTED)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0, search } = req.query;

    // Query the existing consultations table
    let query = supabaseAdmin
      .from('consultations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,job_title.ilike.%${search}%`);
    }

    const { data: consultations, error } = await query;

    if (error) {
      console.error('Error fetching consultations:', error);
      return res.status(500).json({ error: 'Failed to fetch consultation requests' });
    }

    // Transform the data to match the user's expected API response format
    const transformedConsultations = (consultations || []).map(consultation => ({
      id: consultation.id,
      full_name: consultation.full_name,
      email: consultation.email,
      phone: consultation.phone,
      linkedin_url: null, // Not stored in original structure
      role_targets: consultation.job_title,
      location_preferences: null, // Extract from message if needed
      minimum_salary: null, // Extract from message if needed
      target_market: consultation.company,
      employment_status: null, // Extract from message if needed
      package_interest: null, // Extract from message if needed
      area_of_concern: null, // Extract from message if needed
      consultation_window: consultation.preferred_time,
      status: consultation.status,
      created_at: consultation.created_at,
      admin_notes: consultation.admin_notes,
      // Include original fields for admin reference
      consultation_type: consultation.consultation_type,
      message: consultation.message,
      urgency_level: consultation.urgency_level,
      source: consultation.source
    }));

    res.json(transformedConsultations);
  } catch (error) {
    console.error('Fetch consultation requests error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation requests' });
  }
});

// PATCH /api/consultations/:id - Update consultation status (PROTECTED)
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const adminId = req.user.userId || req.user.id;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    if (!['pending', 'approved', 'rejected', 'scheduled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      status,
      admin_notes: admin_notes || null
    };

    // Add status-specific fields based on the existing table structure
    if (status === 'approved') {
      updateData.confirmed_by = adminId;
      updateData.confirmed_at = new Date().toISOString();
    } else if (status === 'rejected') {
      updateData.rejected_by = adminId;
      updateData.rejected_at = new Date().toISOString();
      updateData.rejection_reason = admin_notes || 'Request rejected by admin';
    }

    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !consultation) {
      console.error('Error updating consultation:', error);
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Send email notification based on status
    try {
      let emailTemplate = null;
      let emailData = {
        client_name: consultation.full_name,
        role_targets: consultation.job_title,
        package_interest: 'Career Advisory Package'
      };

      if (status === 'approved') {
        emailTemplate = 'consultation_approved';
        emailData.next_steps = 'We will contact you shortly to schedule your consultation session.';
      } else if (status === 'rejected') {
        emailTemplate = 'consultation_rejected';
        emailData.reason = admin_notes || 'Your request does not meet our current criteria.';
      } else if (status === 'scheduled') {
        emailTemplate = 'consultation_confirmed';
        emailData.meeting_details = admin_notes || 'Meeting details will be provided separately.';
      }

      if (emailTemplate) {
        await sendEmail(consultation.email, emailTemplate, emailData);
        console.log(`Status update email sent: ${emailTemplate}`);
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Don't fail the update if email fails
    }

    res.json({
      message: 'Consultation request updated successfully',
      consultation: {
        id: consultation.id,
        status: consultation.status,
        admin_notes: consultation.admin_notes,
        updated_at: consultation.updated_at
      }
    });
  } catch (error) {
    console.error('Update consultation request error:', error);
    res.status(500).json({ error: 'Failed to update consultation request' });
  }
});

// GET /api/consultations/:id - Get specific consultation request (PROTECTED)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !consultation) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Transform to match expected API format
    const transformedConsultation = {
      id: consultation.id,
      full_name: consultation.full_name,
      email: consultation.email,
      phone: consultation.phone,
      role_targets: consultation.job_title,
      target_market: consultation.company,
      consultation_window: consultation.preferred_time,
      status: consultation.status,
      created_at: consultation.created_at,
      admin_notes: consultation.admin_notes,
      message: consultation.message,
      consultation_type: consultation.consultation_type,
      urgency_level: consultation.urgency_level,
      source: consultation.source
    };

    res.json(transformedConsultation);
  } catch (error) {
    console.error('Get consultation request error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation request' });
  }
});

module.exports = router;