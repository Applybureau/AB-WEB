const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// API Specification compliant admin stats
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  res.json({ message: 'Admin stats spec endpoint' });
});

module.exports = router;