const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { sendEmail } = require('../utils/email');
const { createNotification } = require('./notificationsComplete');

const router = express.Router();

// POST /api/meetings - Schedule meeting (PROTECTED)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      lead_id,
      client_id,
      client_name,
      client_email,
      meeting_date,
      meeting_link,
      meeting_type = 'consultation',
      duration_minutes = 60,
      notes,
      attendees = []
    } = req.body;

    // Validate required fields
    if (!client_name || !client_email || !meeting_date || !meeting_link) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: client_name, client_email, meeting_date, meeting_link',
        code: 'VALIDATION_ERROR'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(client_email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Create meeting record
    const { data: meeting, error } = await supabaseAdmin
      .from('meetings')
      .insert({
        lead_id,
        client_id,
        client_name,
        client_email,
        meeting_date,
        meeting_link,
        meeting_type,
        duration_minutes,
        status: 'scheduled',
        notes,
        attendees: JSON.stringi