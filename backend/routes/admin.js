const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');
const AdminController = require('../controllers/adminController');
const InterviewController = require('../controllers/interviewController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Client Management Routes
router.post('/clients/invite', validate(schemas.inviteClient), AdminController.inviteClient);
router.get('/clients', AdminController.getAllClients);
router.get('/clients/:id', AdminController.getClientDetails);
router.post('/clients/:id/unlock', async (req, res) => {
  try {
    const { id } = req.params;
    const { supabaseAdmin } = require('../utils/supabase');
    const { sendEmail } = require('../utils/email');
    const { NotificationHelpers } = require('../utils/notifications');

    // Get client details
    const { data: client, error: clientError } = await supabaseAdmin
      .from('registered_users')
      .select('id, full_name, email, profile_unlocked')
      .eq('id', id)
      .eq('role', 'client')
      .single();

    if (clientError || !client) {
      return res.status(404).json({ 
        success: false,
        error: 'Client not found',
        email_sent: false
      });
    }

    if (client.profile_unlocked) {
      return res.status(400).json({ 
        success: false,
        error: 'Profile is already unlocked',
        email_sent: false
      });
    }

    // Update client profile unlock status
    const { data: updatedClient, error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update({
        profile_unlocked: true,
        profile_unlock_date: new Date().toISOString(),
        profile_unlocked_by: req.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error unlocking profile:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to unlock profile',
        email_sent: false
      });
    }

    // Send email notification to client
    let emailSent = false;
    try {
      await sendEmail(client.email, 'onboarding_approved', {
        client_name: client.full_name,
        admin_name: req.user.full_name || 'Apply Bureau Team',
        dashboard_url: process.env.FRONTEND_URL + '/dashboard',
        next_steps: 'Your Apply Bureau Dashboard is now active! You now have full access to the Application Tracker.',
        current_year: new Date().getFullYear()
      });
      emailSent = true;
      console.log('✅ Profile unlock email sent to:', client.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send profile unlock email:', emailError);
    }

    // Create notification
    try {
      await NotificationHelpers.profileUnlockedByAdmin({
        client: updatedClient,
        admin_user: req.user
      });
    } catch (notificationError) {
      console.error('⚠️ Failed to create notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Profile unlocked successfully',
      email_sent: emailSent,
      profile_unlocked: true
    });
  } catch (error) {
    console.error('Profile unlock error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to unlock profile',
      email_sent: false
    });
  }
});

// Application Management Routes
router.post('/applications', validate(schemas.createApplication), AdminController.createApplication);
router.patch('/applications/:id/status', validate(schemas.updateApplicationStatus), AdminController.updateApplicationStatus);

// Communication Routes
router.post('/messages', validate(schemas.sendMessage), AdminController.sendMessageToClient);

// Consultation Management Routes
router.post('/consultations/schedule', validate(schemas.scheduleConsultation), AdminController.scheduleConsultation);

// Dashboard & Analytics Routes
router.get('/dashboard/stats', AdminController.getDashboardStats);

// Profile Routes
router.get('/profile', AdminController.getAdminProfile);

// 20Q Management Routes
router.get('/clients/:clientId/20q/responses', AdminController.get20QResponses);
router.post('/clients/:clientId/20q/mark-reviewed', AdminController.mark20QReviewed);
router.get('/20q/pending-review', AdminController.getPending20QReviews);

// Client Files Routes
router.get('/clients/:clientId/files', AdminController.getClientFiles);
router.get('/clients/:clientId/files/resume', AdminController.getClientResume);
router.get('/clients/:clientId/files/linkedin', AdminController.getClientLinkedIn);
router.get('/clients/:clientId/files/portfolio', AdminController.getClientPortfolio);

// Package Management Routes
router.get('/clients/:clientId/package', AdminController.getClientPackage);
router.get('/packages/expiring', AdminController.getExpiringPackages);
router.put('/clients/:clientId/package/extend', AdminController.extendClientPackage);

// Interview Coordination Routes
router.get('/interviews', InterviewController.getAllInterviews);
router.get('/interviews/:interviewId', InterviewController.getInterviewDetails);
router.post('/interviews', InterviewController.createInterview);
router.put('/interviews/:interviewId', InterviewController.updateInterview);
router.post('/interviews/:interviewId/feedback', InterviewController.addInterviewFeedback);

module.exports = router;