const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// POST /api/contact - Handle contact form submissions (PUBLIC)
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      full_name,
      email,
      phone,
      subject,
      message,
      company,
      country
    } = req.body;

    // Support both field name formats (firstName/lastName OR full_name)
    let first_name = firstName;
    let last_name = lastName;
    
    if (!first_name && full_name) {
      // Split full_name into first and last
      const nameParts = full_name.trim().split(' ');
      first_name = nameParts[0];
      last_name = nameParts.slice(1).join(' ') || '';
    }

    // Validate required fields
    if (!first_name || !email || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: name (firstName/lastName or full_name), email, message' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Create contact submission
    const { data: contact, error } = await supabaseAdmin
      .from('contact_submissions')
      .insert({
        first_name,
        last_name,
        email,
        phone,
        subject: subject || 'General Inquiry',
        message,
        company,
        country,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating contact submission:', error);
      return res.status(500).json({ error: 'Failed to submit contact form' });
    }

    // Send confirmation email to client
    try {
      await sendEmail(email, 'contact_form_received', {
        client_name: `${firstName} ${lastName}`,
        subject: subject,
        message: message,
        next_steps: 'We will respond to your inquiry within 24 hours.'
      });
    } catch (emailError) {
      console.error('Failed to send contact confirmation email:', emailError);
    }

    // Send notification email to admin
    try {
      await sendEmail('admin@applybureau.com', 'new_contact_submission', {
        client_name: `${firstName} ${lastName}`,
        client_email: email,
        subject: subject,
        message: message,
        phone: phone || 'Not provided'
      });
    } catch (emailError) {
      console.error('Failed to send admin contact notification:', emailError);
    }

    res.status(201).json({
      id: contact.id,
      message: 'Contact form submitted successfully'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// GET /api/contact - Get all contact submissions (ADMIN ONLY)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('contact_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Search functionality
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: contacts, error, count } = await query;

    if (error) {
      console.error('Error fetching contact submissions:', error);
      return res.status(500).json({ error: 'Failed to fetch contact submissions' });
    }

    res.json({
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Contact fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch contact submissions' });
  }
});

// PATCH /api/contact/:id - Update contact submission status (ADMIN ONLY)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { id } = req.params;
    const { status, admin_notes } = req.body;

    // Validate status
    const validStatuses = ['new', 'in_progress', 'resolved'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: new, in_progress, resolved' 
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    updateData.updated_at = new Date().toISOString();

    const { data: contact, error } = await supabaseAdmin
      .from('contact_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact submission:', error);
      return res.status(500).json({ error: 'Failed to update contact submission' });
    }

    if (!contact) {
      return res.status(404).json({ error: 'Contact submission not found' });
    }

    res.json({
      message: 'Contact submission updated successfully',
      contact
    });
  } catch (error) {
    console.error('Contact update error:', error);
    res.status(500).json({ error: 'Failed to update contact submission' });
  }
});

module.exports = router;