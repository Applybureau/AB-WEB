const express = require('express');
const MeetingController = require('../controllers/meetingController');
const { authenticateToken, requireAdmin } = require('../utils/auth');

const router = express.Router();

// All meeting routes are admin-only

// POST /api/meetings - Schedule a meeting
router.post('/', authenticateToken, requireAdmin, MeetingController.scheduleMeeting);

// GET /api/meetings - Get all meetings
router.get('/', authenticateToken, requireAdmin, MeetingController.getAllMeetings);

// PATCH /api/meetings/:id - Update meeting
router.patch('/:id', authenticateToken, requireAdmin, MeetingController.updateMeeting);

// DELETE /api/meetings/:id - Cancel meeting
router.delete('/:id', authenticateToken, requireAdmin, MeetingController.cancelMeeting);

module.exports = router;
