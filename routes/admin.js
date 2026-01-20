const express = require('express');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { validate, schemas } = require('../utils/validation');
const AdminController = require('../controllers/adminController');

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

module.exports = router;