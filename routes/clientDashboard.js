const express = require('express');
const { authenticateToken } = require('../utils/auth');
const ClientDashboardController = require('../controllers/clientDashboardController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/client/dashboard - Get client dashboard overview
router.get('/', ClientDashboardController.getDashboardOverview);

// GET /api/client/dashboard/progress - Get detailed progress tracking
router.get('/progress', ClientDashboardController.getProgressTracking);

// GET /api/client/dashboard/notifications - Get client notifications
router.get('/notifications', ClientDashboardController.getNotifications);

// PATCH /api/client/dashboard/notifications/:id/read - Mark notification as read
router.patch('/notifications/:id/read', ClientDashboardController.markNotificationRead);

module.exports = router;