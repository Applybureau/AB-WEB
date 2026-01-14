const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// GET /api/applications/weekly - Get applications grouped by week (PROTECTED - CLIENT)
router.get('/weekly', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { 
      weeks_back = 12, // Default to 12 weeks of data
      include_empty_weeks = false 
    } = req.query;

    // Verify user is a client
    const { data: user, error: userErro