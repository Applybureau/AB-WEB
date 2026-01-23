const express = require('express');

const router = express.Router();

// API Specification compliant auth endpoints
router.get('/verify', async (req, res) => {
  res.json({ message: 'Auth spec endpoint' });
});

module.exports = router;