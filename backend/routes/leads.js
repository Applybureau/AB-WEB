const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { supabaseAdmin } = require('../utils/supabase');

const router = express.Router();

// GET /api/leads - Get all leads (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ leads: leads || [] });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// POST /api/leads - Create new lead
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, source, notes } = req.body;

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({
        name,
        email,
        phone,
        source,
        notes,
        status: 'new',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ lead });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

module.exports = router;