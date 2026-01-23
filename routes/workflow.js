const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Workflow endpoints
router.get('/status', authenticateToken, requireAdmin, async (req, res) => {
  res.json({ message: 'Workflow status endpoint' });
});

module.exports = router;