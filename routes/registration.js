const express = require('express');
const LeadController = require('../controllers/leadController');
const { upload } = require('../utils/upload');

const router = express.Router();

// GET /api/register/verify - Verify registration token and get pre-filled email
router.get('/verify', LeadController.verifyToken);

// POST /api/register/complete - Complete registration with passcode and profile
// Supports file uploads for profile_pic and resume
router.post('/complete', 
  upload.fields([
    { name: 'profile_pic', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
  ]), 
  LeadController.completeRegistration
);

module.exports = router;
