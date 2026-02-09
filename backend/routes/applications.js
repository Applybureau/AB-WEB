const express = require('express');
const { authenticateToken, requireAdmin, requireClient } = require('../middleware/auth');
const { isProfileUnlocked, discoveryModeInfo } = require('../middleware/profileGuard');
const { supabaseAdmin } = require('../utils/supabase');
const logger = require('../utils/logger');
const ApplicationTrackingController = require('../controllers/applicationTrackingController');
const { sendEmail, sendApplicationUpdateEmail } = require('../utils/email');
const { NotificationHelpers } = require('../utils/notifications');
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

// GET /api/applications - Get client's applications (CLIENT ONLY) OR admin access
router.get('/', 
  authenticateToken, 
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      // Admin can access all applications, clients can only access their own
      if (userRole === 'admin') {
        // Admin access - get all applications or filter by client_id
        const { client_id, limit = 50, offset = 0 } = req.query;
        
        let query = supabaseAdmin
          .from('applications')
          .select(`
            id,
            client_id,
            type,
            title,
            description,
            status,
            priority,
            requirements,
            documents,
            estimated_duration,
            estimated_cost,
            actual_duration,
            actual_cost,
            admin_notes,
            rejection_reason,
            internal_notes,
            tags,
            deadline,
            approved_by,
            assigned_to,
            approved_at,
            completed_at,
            cancelled_at,
            cancellation_reason,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false })
          .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        if (client_id) {
          query = query.eq('client_id', client_id);
        }

        const { data: applications, error } = await query;

        if (error) {
          console.error('Error fetching applications (admin):', error);
          return res.status(500).json({ error: 'Failed to fetch applications' });
        }

        return res.json({
          applications: applications || [],
          total: applications?.length || 0,
          offset: parseInt(offset),
          limit: parseInt(limit),
          user_role: 'admin'
        });
      } else {
        // Client access - only their own applications
        const baseQuery = supabaseAdmin
          .from('applications')
          .select(`
            id,
            client_id,
            type,
            title,
            description,
            status,
            priority,
            requirements,
            documents,
            estimated_duration,
            estimated_cost,
            actual_duration,
            actual_cost,
            admin_notes,
            rejection_reason,
            internal_notes,
            tags,
            deadline,
            approved_by,
            assigned_to,
            approved_at,
            completed_at,
            cancelled_at,
            cancellation_reason,
            created_at,
            updated_at
          `)
          .eq('client_id', userId)
          .order('created_at', { ascending: false });

        const { data: applications, error } = await baseQuery;

        if (error) {
          console.error('Error fetching applications (client):', error);
          return res.status(500).json({ error: 'Failed to fetch applications' });
        }

        return res.json({
          applications: applications || [],
          total: applications?.length || 0,
          user_role: 'client'
        });
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }
  }
);

// GET /api/applications/discovery-mode - Get discovery mode status for locked profiles
router.get('/discovery-mode', authenticateToken, discoveryModeInfo, (req, res) => {
  res.json({
    discovery_mode: req.discoveryMode || { active: false },
    message: req.discoveryMode?.active 
      ? 'Your Application Tracker is currently locked. Complete the requirements below to unlock it.'
      : 'Your Application Tracker is active and ready to use!'
  });
});

// GET /api/applications/weekly - Get applications grouped by week (MOBILE SCALING)
router.get('/weekly', authenticateToken, isProfileUnlocked, async (req, res) => {
  try {
    const clientId = req.user.id;
    const { weeks_back = 4 } = req.query;

    // Get applications with week numbers
    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('client_id', clientId) // Use client_id instead of user_id
      .order('week_number', { ascending: false })
      .order('date_applied', { ascending: false });

    if (error) {
      console.error('Error fetching weekly applications:', error);
      return res.status(500).json({ error: 'Failed to fetch weekly applications' });
    }

    // Group applications by week
    const weeklyGroups = {};
    const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));

    applications.forEach(app => {
      const weekNumber = app.week_number || currentWeek;
      if (!weeklyGroups[weekNumber]) {
        weeklyGroups[weekNumber] = {
          week_number: weekNumber,
          applications: [],
          total_count: 0,
          status_counts: {}
        };
      }
      
      weeklyGroups[weekNumber].applications.push(app);
      weeklyGroups[weekNumber].total_count++;
      
      const status = app.status || 'applied';
      weeklyGroups[weekNumber].status_counts[status] = 
        (weeklyGroups[weekNumber].status_counts[status] || 0) + 1;
    });

    // Convert to array and sort by week
    const weeklyData = Object.values(weeklyGroups)
      .sort((a, b) => b.week_number - a.week_number)
      .slice(0, parseInt(weeks_back));

    res.json({
      weekly_applications: weeklyData,
      total_weeks: weeklyData.length,
      mobile_optimized: true
    });
  } catch (error) {
    console.error('Weekly applications error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly applications' });
  }
});

// POST /api/applications - Create new application (admin only) - FIXED VERSION
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      client_id,
      company_name,
      job_title,
      company,
      role,
      job_description,
      job_link,
      salary_range,
      location,
      job_type = 'full-time',
      application_strategy,
      admin_notes,
      notes
    } = req.body;

    const adminId = req.user.id;

    // Use either company_name or company, job_title or role
    const finalCompany = company_name || company;
    const finalRole = job_title || role;

    if (!client_id || !finalCompany || !finalRole) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['client_id', 'company_name (or company)', 'job_title (or role)'],
        received: { client_id, company_name, job_title, company, role }
      });
    }

    // Verify client exists
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, full_name, email')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Create application with correct schema
    const applicationData = {
      client_id: client_id,
      applied_by_admin: true, // Boolean field
      job_title: finalRole,
      company: finalCompany,
      title: `${finalCompany} - ${finalRole}`, // Required field
      description: job_description || `Application for ${finalRole} position at ${finalCompany}`,
      job_url: job_link,
      offer_salary_min: salary_range ? parseInt(salary_range.split('-')[0].replace(/\D/g, '')) : null,
      offer_salary_max: salary_range ? parseInt(salary_range.split('-')[1]?.replace(/\D/g, '')) : null,
      type: job_type,
      application_strategy: application_strategy,
      admin_notes: admin_notes || notes || `Application created by admin for ${finalCompany} - ${finalRole}`,
      status: 'applied',
      date_applied: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .insert(applicationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return res.status(500).json({ 
        error: 'Failed to create application',
        details: error.message 
      });
    }

    console.log('Application created by admin:', {
      applicationId: application.id,
      clientId: client_id,
      adminId,
      company: finalCompany,
      role: finalRole
    });

    // Send email notification to client
    try {
      await sendEmail(client.email, 'application_update', {
        client_name: client.full_name,
        company_name: finalCompany,
        position_title: finalRole,
        application_status: 'applied',
        message: `We've submitted your application for the ${finalRole} position at ${finalCompany}.`,
        next_steps: 'We will monitor the application and keep you updated on any progress.'
      });
      console.log('Application creation email sent to:', client.email);
    } catch (emailError) {
      console.error('Failed to send application creation email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: 'Application created successfully',
      application
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// PATCH /api/applications/:id - Update application (ENHANCED INTERVIEW NOTIFICATIONS)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      interview_date, 
      offer_amount, 
      notes, 
      admin_notes,
      resume_version_used,
      job_posting_link,
      application_method
    } = req.body;

    // Get current application
    const { data: currentApp, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentApp) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check if user can update this application
    if (req.user.role !== 'admin' && currentApp.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update application
    const updateData = {};
    if (status) updateData.status = status;
    if (interview_date) updateData.interview_date = interview_date;
    if (offer_amount) updateData.offer_amount = offer_amount;
    if (notes !== undefined) updateData.notes = notes;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (resume_version_used) updateData.resume_version_used = resume_version_used;
    if (job_posting_link) updateData.job_posting_link = job_posting_link;
    if (application_method) updateData.application_method = application_method;

    // ENHANCED INTERVIEW NOTIFICATION LOGIC
    const isInterviewUpdate = status === 'interview_requested' && currentApp.status !== 'interview_requested';
    if (isInterviewUpdate) {
      updateData.interview_update_sent = true;
      updateData.interview_notification_sent_at = new Date().toISOString();
    }

    const { data: application, error: updateError } = await supabaseAdmin
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      return res.status(500).json({ error: 'Failed to update application' });
    }

    // ENHANCED INTERVIEW EMAIL NOTIFICATION
    if (isInterviewUpdate) {
      try {
        // Get client details
        const { data: client } = await supabaseAdmin
          .from('clients')
          .select('email, full_name, job_search_email')
          .eq('id', currentApp.client_id)
          .single();

        if (client) {
          await sendEmail(client.email, 'interview_update_enhanced', {
            client_name: client.full_name,
            company_name: application.company,
            job_title: application.role,
            job_search_email: client.job_search_email || client.email,
            interview_date: interview_date || 'To be scheduled',
            job_posting_link: application.job_posting_link || 'Check your application email',
            application_date: application.applied_date || application.created_at,
            next_steps: 'Please check the application email account for details. We are monitoring alongside you and will support next steps as needed.',
            message: 'An interview request has been received for a role we applied to on your behalf.',
            support_message: 'We are monitoring alongside you and will support next steps as needed.'
          });

          // Create notification
          await NotificationHelpers.interviewRequestReceived(currentApp.client_id, application);
        }
      } catch (emailError) {
        console.error('Failed to send interview update email:', emailError);
        // Don't fail the update if email fails
      }
    }

    // Create general status update notification
    if (status && status !== currentApp.status) {
      try {
        await NotificationHelpers.applicationStatusUpdated(currentApp.client_id, application, currentApp.status, status);
      } catch (notificationError) {
        console.error('Failed to create status update notification:', notificationError);
      }
    }

    res.json({
      message: 'Application updated successfully',
      application,
      interview_notification_sent: isInterviewUpdate,
      status_changed: status && status !== currentApp.status,
      previous_status: currentApp.status
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// GET /api/applications/stats - Get application statistics
router.get('/stats', authenticateToken, isProfileUnlocked, ApplicationTrackingController.getApplicationStats);

// POST /api/applications/:id/send-update - Send application update email (ADMIN ONLY)
router.post('/:id/send-update', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      message,
      next_steps,
      consultant_email = 'applybureau@gmail.com',
      custom_subject
    } = req.body;

    // Get application details
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        clients:client_id (
          id,
          email,
          full_name
        )
      `)
      .eq('id', id)
      .single();

    if (appError || !application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Get client details (fallback if join didn't work)
    let clientData = application.clients;
    if (!clientData) {
      const { data: client } = await supabaseAdmin
        .from('clients')
        .select('id, email, full_name')
        .eq('id', application.client_id)
        .single();
      clientData = client;
    }

    if (!clientData) {
      return res.status(404).json({ error: 'Client not found for this application' });
    }

    // Prepare application data for email
    const applicationData = {
      client_name: clientData.full_name,
      company_name: application.title?.split(' - ')[0] || 'Company',
      position_title: application.title?.split(' - ')[1] || application.description,
      application_status: application.status,
      message: message || 'Your application is being reviewed and we will keep you updated on any progress.',
      next_steps,
      consultant_email,
      user_id: clientData.id
    };

    // Send the application update email
    const emailResult = await sendApplicationUpdateEmail(
      clientData.email,
      applicationData,
      { subject: custom_subject }
    );

    // Log the email send
    console.log(`📧 Application update email sent:`, {
      applicationId: id,
      clientEmail: clientData.email,
      consultantEmail: consultant_email,
      emailId: emailResult.id
    });

    // Update application with email sent timestamp
    await supabaseAdmin
      .from('applications')
      .update({
        last_email_sent_at: new Date().toISOString(),
        admin_notes: application.admin_notes 
          ? `${application.admin_notes}\n\n[${new Date().toISOString()}] Update email sent to client`
          : `[${new Date().toISOString()}] Update email sent to client`
      })
      .eq('id', id);

    res.json({
      message: 'Application update email sent successfully',
      email_id: emailResult.id,
      sent_to: clientData.email,
      reply_to: consultant_email,
      application_id: id
    });

  } catch (error) {
    console.error('❌ Failed to send application update email:', error);
    res.status(500).json({ 
      error: 'Failed to send application update email',
      details: error.message 
    });
  }
});

module.exports = router;