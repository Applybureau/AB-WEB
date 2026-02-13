const express = require('express');
const { authenticateToken, requireClient } = require('../middleware/auth');
const { supabaseAdmin } = require('../utils/supabase');

const router = express.Router();

// GET /api/client/profile - Get client profile
router.get('/', authenticateToken, requireClient, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/client/profile - Update client profile
router.put('/', authenticateToken, requireClient, async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;