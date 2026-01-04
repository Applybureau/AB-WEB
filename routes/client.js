const express = require('express');
const { authenticateToken } = require('../utils/auth');
const { validate, schemas } = require('../utils/validation');
const ClientController = require('../controllers/clientController');

const router = express.Router();

// All client routes require authentication
router.use(authenticateToken);

// Onboarding Routes
router.post('/complete-onboarding', validate(schemas.completeOnboarding), ClientController.completeOnboarding);

// Profile Management Routes
router.patch('/profile', validate(schemas.updateProfile), ClientController.updateProfile);
router.post('/change-password', validate(schemas.changePassword), ClientController.changePassword);

// Communication Routes
router.post('/messages', validate(schemas.sendMessage), ClientController.sendMessageToAdmin);
router.get('/messages', ClientController.getMessages);
router.patch('/messages/:id/read', ClientController.markMessageAsRead);

// Application Routes (Read-only for clients)
router.get('/applications', ClientController.getApplications);

// Consultation Routes (Read-only for clients)
router.get('/consultations', ClientController.getConsultations);

// Dashboard Routes
router.get('/dashboard/summary', ClientController.getDashboardSummary);

module.exports = router;