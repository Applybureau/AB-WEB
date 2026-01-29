const express = require('express');
const { authenticateToken, requireClient } = require('../middleware/auth');

const router = express.Router();

// Complete client dashboard
router.get('/', authenticateToken, requireClient, async (req, res) => {
  res.json({ message: 'Complete client dashboard endpoint' });
});

module.exports = router;