const express = require('express');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { supabaseAdmin } = require('../utils/supabase');

const router = express.Router();

// GET /api/applications-workflow - Get applications for workflow management
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, client_id } = req.query;

    let query = supabaseAdmin
      .from('applications')
      .select(`
        id,
        client_id,
        type,
        title,
        description,
        status,
        priority,
        created_at,
        updated_at,
        clients(id, full_name, email)
      `)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (client_id) {
      query = query.eq('client_id', client_id);
    }

    const { data: applications, error } = await query;

    if (error) {
      console.error('Error fetching applications workflow:', error);
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }

    res.json({
      applications: applications || [],
      total: applications?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Applications workflow error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

module.exports = router;