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

    // Map to the consultations table structure
    const consultationData = {
      full_name,
      email,
      phone: phone || null,
      linkedin_url: linkedin_url || null,
      role_targets: role_targets || null,
      location_preferences: location_preferences || null,
      minimum_salary: minimum_salary || null,
      target_market: target_market || null,
      employment_status: employment_status || null,
      package_interest: package_interest || null,
      area_of_concern: area_of_concern || null,
      consultation_window: consultation_window || null,
      job_title: role_targets,
      consultation_type: 'career_strategy',
      message: detailedMessage,
      urgency_level: 'normal',
      status: 'pending',
      source: 'website'
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

    let query = supabaseAdmin
      .from('consultations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,role_targets.ilike.%${search}%`);
    }

    const { data: consultations, error } = await query;

    if (error) {
      console.error('Error fetching consultations:', error);
      return res.status(500).json({ error: 'Failed to fetch consultation requests' });
    }

    res.json(consultations || []);
  } catch (error) {
    console.error('Fetch consultation requests error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation requests' });
  }
});

// PATCH /api/consultations/:id - Update consultation status (PROTECTED)
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes, scheduled_date, scheduled_time, meeting_url } = req.body;

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

    // Add scheduling fields if provided
    if (scheduled_date) updateData.preferred_date = scheduled_date;
    if (scheduled_time) updateData.preferred_time = scheduled_time;

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
        role_targets: consultation.role_targets || consultation.job_title,
        package_interest: consultation.package_interest || 'Career Advisory Package'
      };

      if (status === 'approved') {
        emailTemplate = 'consultation_approved';
        emailData.next_steps = admin_notes || 'We will contact you shortly to schedule your consultation session.';
      } else if (status === 'rejected') {
        emailTemplate = 'consultation_rejected';
        emailData.reason = admin_notes || 'Your request does not meet our current criteria.';
      } else if (status === 'scheduled') {
        emailTemplate = 'consultation_scheduled';
        emailData.scheduled_date = scheduled_date || 'To be confirmed';
        emailData.scheduled_time = scheduled_time || 'To be confirmed';
        emailData.meeting_url = meeting_url || '';
        emailData.meeting_details = admin_notes || 'Please check your email for meeting details.';
      }

      if (emailTemplate) {
        await sendEmail(consultation.email, emailTemplate, emailData);
        console.log(`Email sent: ${emailTemplate} to ${consultation.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
    }

    res.json({
      message: 'Consultation request updated successfully',
      consultation
    });
  } catch (error) {
    console.error('Update consultation request error:', error);
    res.status(500).json({ error: 'Failed to update consultation request' });
  }
});

// POST /api/consultations/:id/invite - Send invitation to approved client (PROTECTED)
router.post('/:id/invite', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { invite_message, signup_link } = req.body;

    // Get the consultation
    const { data: consultation, error: fetchError } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !consultation) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Send invitation email
    try {
      await sendEmail(consultation.email, 'signup_invite', {
        client_name: consultation.full_name,
        package_interest: consultation.package_interest || 'Career Advisory Package',
        invite_message: invite_message || 'You have been approved to join Apply Bureau!',
        signup_link: signup_link || 'https://applybureau.com/signup',
        role_targets: consultation.role_targets
      });

      // Update consultation status to show invitation was sent
      await supabaseAdmin
        .from('consultations')
        .update({ 
          status: 'approved',
          admin_notes: `Invitation sent on ${new Date().toISOString()}. ${consultation.admin_notes || ''}`
        })
        .eq('id', id);

      res.json({
        message: 'Invitation sent successfully',
        email: consultation.email
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      res.status(500).json({ error: 'Failed to send invitation email' });
    }
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// POST /api/consultations/:id/schedule - Schedule a consultation (PROTECTED)
router.post('/:id/schedule', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_date, scheduled_time, meeting_url, notes } = req.body;

    if (!scheduled_date || !scheduled_time) {
      return res.status(400).json({ error: 'Scheduled date and time are required' });
    }

    // Get the consultation
    const { data: consultation, error: fetchError } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !consultation) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Update consultation with schedule
    const { data: updatedConsultation, error: updateError } = await supabaseAdmin
      .from('consultations')
      .update({
        status: 'scheduled',
        preferred_date: scheduled_date,
        preferred_time: scheduled_time,
        admin_notes: notes || `Scheduled for ${scheduled_date} at ${scheduled_time}`
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update consultation' });
    }

    // Send scheduling email
    try {
      await sendEmail(consultation.email, 'consultation_scheduled', {
        client_name: consultation.full_name,
        scheduled_date: scheduled_date,
        scheduled_time: scheduled_time,
        meeting_url: meeting_url || '',
        package_interest: consultation.package_interest || 'Career Advisory Package',
        role_targets: consultation.role_targets,
        notes: notes || ''
      });
      console.log(`Scheduling email sent to ${consultation.email}`);
    } catch (emailError) {
      console.error('Failed to send scheduling email:', emailError);
    }

    res.json({
      message: 'Consultation scheduled successfully',
      consultation: updatedConsultation
    });
  } catch (error) {
    console.error('Schedule error:', error);
    res.status(500).json({ error: 'Failed to schedule consultation' });
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

    res.json(consultation);
  } catch (error) {
    console.error('Get consultation request error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation request' });
  }
});

module.exports = router;