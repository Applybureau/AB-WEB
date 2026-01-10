const express = require('express');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const ApplicationTrackingController = require('../controllers/applicationTrackingController');

const router = express.Router();

// GET /api/applications - Get client's applications
router.get('/', authenticateToken, ApplicationTrackingController.getApplications);

// POST /api/applications - Create new application (admin only)
router.post('/', authenticateToken, requireAdmin, ApplicationTrackingController.createApplication);

// PATCH /api/applications/:id - Update application
router.patch('/:id', authenticateToken, ApplicationTrackingController.updateApplication);

// GET /api/applications/stats - Get application statistics
router.get('/stats', authenticateToken, ApplicationTrackingController.getApplicationStats);

module.exports = router;