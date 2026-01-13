const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// POST /api/contact-requests - Handle contact form submissions (PUBLIC)
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
      source = 'contact_form'
    } = req.body;

    // Validate required fields according to spec
    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: firstName, lastName, email, subject, message',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Create contact request according to spec format
    const { data: contact, error } = await supabaseAdmin
      .from('contact_requests')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        subject,
        message,
        source,
        status: 'new',
        response_sent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating contact request:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to submit contact request',
        code: 'DATABASE_ERROR'
      });
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
        client_phone: phone || 'Not provided',
        subject: subject,
        message: message,
        contact_id: contact.id
      });
    } catch (emailError) {
      console.error('Failed to send admin contact notification:', emailError);
    }

    // Return response according to spec
    res.status(201).json({
      success: true,
      id: contact.id,
      status: 'new',
      message: 'Contact form submitted successfully',
      created_at: contact.created_at
    });
  } catch (error) {
    console.error('Contact request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit contact request',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/contact-requests - Return contact requests for admin (PROTECTED)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      status,
      limit = 50, 
      offset = 0, 
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let query = supabaseAdmin
      .from('contact_requests')
      .select('id, first_name, last_name, email, phone, subject, message, status, created_at, updated_at, handled_by, response_sent')
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    const { data: contacts, error } = await query;

    if (error) {
      console.error('Error fetching contact requests:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch contact requests',
        code: 'DATABASE_ERROR'
      });
    }

    // Format contacts according to spec
    const formattedContacts = contacts?.map(contact => ({
      id: contact.id,
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      subject: contact.subject,
      message: contact.message,
      status: contact.status,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
      handled_by: contact.handled_by,
      response_sent: contact.response_sent
    })) || [];

    res.json({
      success: true,
      contacts: formattedContacts,
      total: contacts?.length || 0,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Fetch contact requests error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch contact requests',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PATCH /api/contact-requests/:id - Update contact request status (PROTECTED)
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes, response_sent } = req.body;
    const adminId = req.user.userId || req.user.id;

    // Validate status
    const validStatuses = ['new', 'in_progress', 'handled', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS'
      });
    }

    // Get current contact request
    const { data: currentContact, error: fetchError } = await supabaseAdmin
      .from('contact_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentContact) {
      return res.status(404).json({ 
        success: false,
        error: 'Contact request not found',
        code: 'NOT_FOUND'
      });
    }

    let updateData = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      
      // Set handled_by when status changes to in_progress or handled
      if (status === 'in_progress' || status === 'handled') {
        updateData.handled_by = adminId;
        if (status === 'handled') {
          updateData.handled_at = new Date().toISOString();
        }
      }
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    if (response_sent !== undefined) {
      updateData.response_sent = response_sent;
    }

    // Update contact request
    const { data: updatedContact, error: updateError } = await supabaseAdmin
      .from('contact_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating contact request:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update contact request',
        code: 'UPDATE_ERROR'
      });
    }

    // Format response according to spec
    const formattedContact = {
      id: updatedContact.id,
      firstName: updatedContact.first_name,
      lastName: updatedContact.last_name,
      email: updatedContact.email,
      phone: updatedContact.phone,
      subject: updatedContact.subject,
      message: updatedContact.message,
      status: updatedContact.status,
      created_at: updatedContact.created_at,
      updated_at: updatedContact.updated_at,
      handled_by: updatedContact.handled_by,
      response_sent: updatedContact.response_sent
    };

    res.json({
      success: true,
      message: 'Contact request updated successfully',
      contact: formattedContact
    });
  } catch (error) {
    console.error('Update contact request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update contact request',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/contact-requests/:id - Get specific contact request (PROTECTED)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: contact, error } = await supabaseAdmin
      .from('contact_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !contact) {
      return res.status(404).json({ 
        success: false,
        error: 'Contact request not found',
        code: 'NOT_FOUND'
      });
    }

    // Format response according to spec
    const formattedContact = {
      id: contact.id,
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      subject: contact.subject,
      message: contact.message,
      status: contact.status,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
      handled_by: contact.handled_by,
      response_sent: contact.response_sent
    };

    res.json({
      success: true,
      contact: formattedContact
    });
  } catch (error) {
    console.error('Get contact request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch contact request',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;