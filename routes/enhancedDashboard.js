const express = require('express');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const {
  getAdminDashboardStats,
  getClientDashboardStats,
  getNotifications,
  markNotificationRead,
  getDashboardActivities,
  getMessages,
  sendMessage,
  getOnlineUsers
} = require('../controllers/enhancedDashboardController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Dashboard stats endpoints
router.get('/admin/stats', requireAdmin, getAdminDashboardStats);
router.get('/client/stats', getClientDashboardStats);

// Notifications endpoints
router.get('/notifications', getNotifications);
router.post('/notifications/:id/read', markNotificationRead);

// Activities endpoint (admin only)
router.get('/activities', requireAdmin, getDashboardActivities);

// Real-time messaging endpoints
router.get('/messages', getMessages);
router.post('/messages', sendMessage);

// Online users endpoint (admin only)
router.get('/online-users', requireAdmin, getOnlineUsers);

module.exports = router;