const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/contact - Handle contact form submissions (PUBLIC)
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      full_name,
      name,
      email,
      phone,
      subject,
      message,
      company,
      country,
      position
    } = req.body;

    // Support multiple field name formats
    let contactName = name || full_name;
    
    if (!contactName && (firstName || lastName)) {
      contactName = `${firstName || ''} ${lastName || ''}`.trim();
    }

    // Validate required fields
    if (!contactName || !email || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, message' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Create contact submission
    const { data: contact, error } = await supabaseAdmin
      .from('contact_requests')
      .insert({
        name: contactName,
        first_name: firstName || contactName.split(' ')[0] || '',
        last_name: lastName || contactName.split(' ').slice(1).join(' ') || '',
        email,
        phone,
        subject: subject || 'General Inquiry',
        message,
        company,
        status: 'pending',
        source: 'website',
        priority: 'normal'
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
        client_name: contactName,
        subject: subject || 'General Inquiry',
        message: message,
        next_steps: 'We will respond to your inquiry within 24 hours.'
      });
    } catch (emailError) {
      console.error('Failed to send contact confirmation email:', emailError);
    }

    // Send notification email to admin
    try {
      await sendEmail('admin@applybureau.com', 'new_contact_submission', {
        client_name: contactName,
        client_email: email,
        subject: subject || 'General Inquiry',
        message: message,
        phone: phone || 'Not provided',
        company: company || 'Not provided'
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
      .from('contact_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Search functionality
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`);
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
    const validStatuses = ['pending', 'in_progress', 'handled', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: pending, in_progress, handled, archived' 
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    updateData.updated_at = new Date().toISOString();

    const { data: contact, error } = await supabaseAdmin
      .from('contact_requests')
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