const express = require('express');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { supabaseAdmin } = require('../utils/supabase');

const router = express.Router();

// GET /api/workflow/consultation-requests - Get consultation requests for workflow
router.get('/consultation-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;

    let query = supabaseAdmin
      .from('consultations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: consultations, error } = await query;

    if (error) {
      console.error('Error fetching workflow consultation requests:', error);
      return res.status(500).json({ error: 'Failed to fetch consultation requests' });
    }

    res.json({
      consultation_requests: consultations || [],
      total: consultations?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Workflow consultation requests error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation requests' });
  }
});

module.exports = router;