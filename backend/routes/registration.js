const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// POST /api/register - Public registration endpoint
router.post('/', async (req, res) => {
  try {
    const { email, full_name, phone, token } = req.body;

    // Validate registration token if provided
    if (token) {
      // Token validation logic here
    }

    // Create user registration
    const { data: registration, error } = await supabaseAdmin
      .from('registrations')
      .insert({
        email,
        full_name,
        phone,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ 
      message: 'Registration submitted successfully',
      registration 
    });
  } catch (error) {
    console.error('Error processing registration:', error);
    res.status(500).json({ error: 'Failed to process registration' });
  }
});

module.exports = router;