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