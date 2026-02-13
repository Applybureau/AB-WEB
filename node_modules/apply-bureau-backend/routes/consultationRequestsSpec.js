const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// API Specification compliant consultation requests
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  res.json({ message: 'Consultation requests spec endpoint' });
});

module.exports = router;