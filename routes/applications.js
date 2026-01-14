const express = require('express');
const { authenticateToken, requireAdmin, requireClient } = require('../utils/auth');
const { isProfileUnlocked, discoveryModeInfo } = require('../middleware/profileGuard');
const { supabaseAdmin } = require('../utils/supabase');
const ApplicationTrackingController = require('../controllers/applicationTrackingController');
const { sendEmail } = require('../utils/email');
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

// GET /api/applications - Get client's applications (CLIENT ONLY)
router.get('/', 
  authenticateToken, 
  requireClient,
  discoveryModeInfo, 
  isProfileUnlocked,
  addValidSortFields(['applied_date', 'created_at', 'company', 'role', 'status']),
  parsePaginationParams,
  async (req, res) => {
    try {
      const clientId = req.user.id;

      // Add search fields for filtering
      req.searchFields = ['company', 'role', 'location', 'notes'];

      // Base query
      const baseQuery = supabaseAdmin
        .from('applications')
        .select(`
          id,
          company,
          role,
          status,
          applied_date,
          job_link,
          salary_range,
          location,
          application_method,
          notes,
          interview_date,
          interview_type,
          interviewer,
          meeting_link,
          offer_amount,
          offer_currency,
          preparation_notes,
          week_number,
          created_at,
          updated_at
        `)
        .eq('clientId', clientId);

      // Count query
      const countQuery = supabaseAdmin
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('clientId', clientId);

      // Get paginated results
      const result = await paginateResults(baseQuery, countQuery, req);

      // Format response data according to specification
      const formattedData = result.data.map(app => ({
        id: app.id,
        company: app.company,
        role: app.role,
        status: app.status,
        applied_date: app.applied_date,
        job_link: app.job_link,
        salary_range: app.salary_range,
        location: app.location,
        application_method: app.application_method,
        notes: app.notes,
        interview_date: app.interview_date,
        interview_type: app.interview_type,
        interviewer: app.interviewer,
        meeting_link: app.meeting_link,
        offer_amount: app.offer_amount,
        offer_currency: app.offer_currency,
        preparation_notes: app.preparation_notes,
        created_at: app.created_at,
        updated_at: app.updated_at
      }));

      res.json(createPaginatedResponse(
        formattedData,
        result.pagination,
        'Applications retrieved successfully'
      ));
    } catch (error) {
      console.error('Error fetching applications:', error);
      return handleDatabaseError(req, res, error, 'Failed to fetch applications');
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
      .eq('client_id', clientId)
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

// POST /api/applications - Create new application (admin only)
router.post('/', authenticateToken, requireAdmin, ApplicationTrackingController.createApplication);

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
          .from('registered_users')
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

module.exports = router;