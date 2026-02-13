const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// API Specification compliant applications
router.get('/', authenticateToken, async (req, res) => {
  res.json({ message: 'Applications spec endpoint' });
});

module.exports = router;