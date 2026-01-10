const express = require('express');
const { authenticateToken } = require('../utils/auth');
const ClientProfileController = require('../controllers/clientProfileController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/client/profile - Get client profile with completion status
router.get('/', ClientProfileController.getProfile);

// PATCH /api/client/profile - Update client profile
router.patch('/', ClientProfileController.updateProfile);

// POST /api/client/profile/upload-resume - Upload resume
router.post('/upload-resume', ClientProfileController.uploadResume);

// GET /api/client/profile/completion - Get profile completion status
router.get('/completion', ClientProfileController.getCompletionStatus);

module.exports = router;