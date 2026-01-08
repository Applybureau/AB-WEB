const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// POST /api/consultations - Accept consultation requests from website (PUBLIC)
router.post('/', async (req, res) => {
  try {
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
      return res.status(400).json({ 
        error: 'Missing required fields: full_name, email, role_targets' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Map the user's API specification to the existing database structure
    const consultationData = {
      full_name,
      email,
      phone,
      company: target_market || null, // Map target_market to company
      job_title: role_targets, // Map role_targets to job_title
      consultation_type: 'career_strategy', // Default consultation type
      message: `Role Targets: ${role_targets}\n` +
               `Location Preferences: ${location_preferences || 'Not specified'}\n` +
               `Minimum Salary: ${minimum_salary || 'Not specified'}\n` +
               `Employment Status: ${employment_status || 'Not specified'}\n` +
               `Package Interest: ${package_interest || 'Not specified'}\n` +
               `Area of Concern: ${area_of_concern || 'Not specified'}\n` +
               `Consultation Window: ${consultation_window || 'Not specified'}`,
      urgency_level: 'normal',
      status: 'pending',
      source: 'website'
    };

    // Try to insert into consultation_requests table first (new structure)
    let consultation, error;
    
    try {
      const result = await supabaseAdmin
        .from('consultation_requests')
        .insert({
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
          consultation_window,
          status: 'pending'
        })
        .select()
        .single();
        
      consultation = result.data;
      error = result.error;
    } catch (newTableError) {
      console.log('consultation_requests table not available, using consultations table');
      
      // Fall back to the existing consultations table structure
      const fallbackResult = await supabaseAdmin
        .from('consultations')
        .insert(consultationData)
        .select()
        .single();
        
      consultation = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error('Error creating consultation request:', error);
      return res.status(500).json({ error: 'Failed to submit consultation request' });
    }

    // Send confirmation email to client
    try {
      await sendEmail(email, 'consultation_request_received', {
        client_name: full_name,
        request_id: consultation.id,
        role_targets: role_targets,
        package_interest: package_interest || 'Not specified',
        next_steps: 'Our team will review your request and contact you within 24 hours.'
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Send notification email to admin
    try {
      await sendEmail('admin@applybureau.com', 'new_consultation_request', {
        client_name: full_name,
        client_email: email,
        role_targets: role_targets,
        package_interest: package_interest || 'Not specified',
        employment_status: employment_status || 'Not specified',
        area_of_concern: area_of_concern || 'Not specified',
        admin_dashboard_url: `${process.env.FRONTEND_URL}/admin/consultations`
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      id: consultation.id,
      status: 'pending',
      message: 'Consultation request received successfully'
    });
  } catch (error) {
    console.error('Consultation request error:', error);
    res.status(500).json({ error: 'Failed to submit consultation request' });
  }
});

// GET /api/consultations - Return consultation requests for admin (PROTECTED)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0, search } = req.query;

    // First try the new consultation_requests table
    let query = supabaseAdmin
      .from('consultation_requests')
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
      console.error('Error fetching consultation requests:', error);
      
      // If consultation_requests table doesn't exist, fall back to consultations table
      console.log('Falling back to consultations table...');
      try {
        const fallbackQuery = supabaseAdmin
          .from('consultations')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
          
        const { data: fallbackConsultations, error: fallbackError } = await fallbackQuery;
        
        if (fallbackError) {
          return res.status(500).json({ error: 'Failed to fetch consultation requests' });
        }
        
        return res.json(fallbackConsultations || []);
      } catch (fallbackErr) {
        return res.status(500).json({ error: 'Failed to fetch consultation requests' });
      }
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
      processed_by: adminId,
      processed_at: new Date().toISOString()
    };

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !consultation) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Send email notification based on status
    try {
      let emailTemplate = null;
      let emailData = {
        client_name: consultation.full_name,
        role_targets: consultation.role_targets,
        package_interest: consultation.package_interest || 'Not specified'
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
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Don't fail the update if email fails
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

// GET /api/consultations/:id - Get specific consultation request (PROTECTED)
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

    res.json(consultation);
  } catch (error) {
    console.error('Get consultation request error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation request' });
  }
});

module.exports = router;