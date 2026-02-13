const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// API Specification compliant profile
router.get('/', authenticateToken, async (req, res) => {
  res.json({ message: 'Profile spec endpoint' });
});

module.exports = router;