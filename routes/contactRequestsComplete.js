const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { sendEmail, buildUrl } = require('../utils/email');

const router = express.Router();

// POST /api/contact-requests - Submit contact form (PUBLIC)
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

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: firstName, lastName, email, subject, message',
        code: 'VALIDATION_ERROR'
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

    // Create contact request
    const { data: contactRequest, error } = await supabaseAdmin
      .from('contact_requests')
      .insert({
        firstName,
        lastName,
        email,
        phone,
        subject,
        message,
        status: 'new',
        priority: 'medium',
        source
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
        request_id: contactRequest.id,
        response_time: '24 hours'
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    // Send notification email to admin
    try {
      await sendEmail('admin@applybureau.com', 'new_contact_submission', {
        client_name: `${firstName} ${lastName}`,
        client_email: email,
        client_phone: phone || 'Not provided',
        subject: subject,
        message: message,
        source: source,
        admin_dashboard_url: buildUrl('/admin/contact-requests')
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Contact request submitted successfully',
      data: {
        id: contactRequest.id,
        status: 'new'
      }
    });
  } catch (error) {
    console.error('Contact request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit contact request',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /api/contact-requests - Get all contact requests (PROTECTED)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      limit = 10, 
      page = 1, 
      search,
      source 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('contact_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (source) {
      query = query.eq('source', source);
    }

    if (search) {
      query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: contactRequests, error, count } = await query;

    if (error) {
      console.error('Error fetching contact requests:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch contact requests',
        code: 'DATABASE_ERROR'
      });
    }

    // Format response to match specification
    const formattedRequests = contactRequests?.map(request => ({
      id: request.id,
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      phone: request.phone,
      subject: request.subject,
      message: request.message,
      status: request.status,
      handled_by: request.handled_by,
      response_sent: request.response_sent,
      priority: request.priority,
      source: request.source,
      created_at: request.created_at,
      updated_at: request.updated_at
    })) || [];

    const totalPages = Math.ceil((count || 0) / parseInt(limit));

    res.json({
      success: true,
      data: formattedRequests,
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: totalPages,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1
    });
  } catch (error) {
    console.error('Fetch contact requests error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch contact requests',
      code: 'SERVER_ERROR'
    });
  }
});

// PATCH /api/contact-requests/:id - Update contact request (PROTECTED)
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      priority,
      response_sent,
      admin_notes
    } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (response_sent !== undefined) updateData.response_sent = response_sent;
    if (admin_notes) updateData.admin_notes = admin_notes;
    
    // Set handled_by when status changes to in_progress or handled
    if (status === 'in_progress' || status === 'handled') {
      updateData.handled_by = req.user.id;
    }

    const { data: contactRequest, error } = await supabaseAdmin
      .from('contact_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact request:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update contact request',
        code: 'DATABASE_ERROR'
      });
    }

    if (!contactRequest) {
      return res.status(404).json({ 
        success: false,
        error: 'Contact request not found',
        code: 'NOT_FOUND'
      });
    }

    // Format response
    const formattedRequest = {
      id: contactRequest.id,
      firstName: contactRequest.firstName,
      lastName: contactRequest.lastName,
      email: contactRequest.email,
      phone: contactRequest.phone,
      subject: contactRequest.subject,
      message: contactRequest.message,
      status: contactRequest.status,
      handled_by: contactRequest.handled_by,
      response_sent: contactRequest.response_sent,
      priority: contactRequest.priority,
      source: contactRequest.source,
      created_at: contactRequest.created_at,
      updated_at: contactRequest.updated_at
    };

    res.json({
      success: true,
      message: 'Contact request updated successfully',
      data: formattedRequest
    });
  } catch (error) {
    console.error('Update contact request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update contact request',
      code: 'SERVER_ERROR'
    });
  }
});

// DELETE /api/contact-requests/:id - Delete contact request (PROTECTED)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('contact_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting contact request:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete contact request',
        code: 'DATABASE_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'Contact request deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact request error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete contact request',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /api/contact-requests/stats - Get contact request statistics (PROTECTED)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: requests, error } = await supabaseAdmin
      .from('contact_requests')
      .select('status, priority, created_at, source');

    if (error) {
      console.error('Error fetching contact request stats:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch contact request statistics',
        code: 'DATABASE_ERROR'
      });
    }

    // Calculate statistics
    const stats = {
      total: requests?.length || 0,
      new: requests?.filter(req => req.status === 'new').length || 0,
      in_progress: requests?.filter(req => req.status === 'in_progress').length || 0,
      handled: requests?.filter(req => req.status === 'handled').length || 0,
      closed: requests?.filter(req => req.status === 'closed').length || 0,
      high_priority: requests?.filter(req => req.priority === 'high').length || 0,
      urgent: requests?.filter(req => req.priority === 'urgent').length || 0,
      this_week: requests?.filter(req => {
        const reqDate = new Date(req.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return reqDate > weekAgo;
      }).length || 0,
      by_source: {
        contact_form: requests?.filter(req => req.source === 'contact_form').length || 0,
        website: requests?.filter(req => req.source === 'website').length || 0,
        referral: requests?.filter(req => req.source === 'referral').length || 0
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get contact request stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch contact request statistics',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;