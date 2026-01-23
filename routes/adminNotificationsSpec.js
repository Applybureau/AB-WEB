const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// API Specification compliant admin notifications
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  res.json({ message: 'Admin notifications spec endpoint' });
});

module.exports = router;