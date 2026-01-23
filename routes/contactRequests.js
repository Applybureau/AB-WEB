const express = require('express');
const ContactRequestController = require('../controllers/contactRequestController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Public routes
// POST /api/contact-requests - Submit a contact request
router.post('/', ContactRequestController.submitContactRequest);

// Admin routes (protected)
// GET /api/contact-requests - Get all contact requests with pagination
router.get('/', authenticateToken, requireAdmin, ContactRequestController.getContactRequests);

// GET /api/contact-requests/:id - Get single contact request
router.get('/:id', authenticateToken, requireAdmin, ContactRequestController.getContactRequestById);

// PATCH /api/contact-requests/:id - Update contact request status
router.patch('/:id', authenticateToken, requireAdmin, ContactRequestController.updateContactRequestStatus);

module.exports = router;
