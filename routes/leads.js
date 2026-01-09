const express = require('express');
const LeadController = require('../controllers/leadController');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { upload } = require('../utils/upload');

const router = express.Router();

// Public routes
// POST /api/leads - Submit a new lead with optional PDF resume
router.post('/', upload.single('resume'), LeadController.submitLead);

// Admin routes (protected)
// GET /api/leads - Get all leads with pagination
router.get('/', authenticateToken, requireAdmin, LeadController.getAllLeads);

// GET /api/leads/:id - Get lead details with PDF URL
router.get('/:id', authenticateToken, requireAdmin, LeadController.getLeadById);

// PATCH /api/leads/:id/review - Mark lead as under review (triggers Email #1)
router.patch('/:id/review', authenticateToken, requireAdmin, LeadController.markUnderReview);

// PATCH /api/leads/:id/approve - Approve lead (triggers Email #2 with registration link)
router.patch('/:id/approve', authenticateToken, requireAdmin, LeadController.approveLead);

// PATCH /api/leads/:id/reject - Reject a lead
router.patch('/:id/reject', authenticateToken, requireAdmin, LeadController.rejectLead);

module.exports = router;
