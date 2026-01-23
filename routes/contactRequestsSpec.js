const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// API Specification compliant contact requests
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  res.json({ message: 'Contact requests spec endpoint' });
});

module.exports = router;