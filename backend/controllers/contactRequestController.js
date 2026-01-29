const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

class ContactRequestController {
  /**
   * POST /api/contact-requests - Submit a contact request (public)
   * Supports both full and simplified JSON formats
   */
  static async submitContactRequest(req, res) {
    try {
      const {
        firstName,
        lastName,
        first_name,
        last_name,
        email,
        phone,
        subject,
        message
      } = req.body;

      // Support both camelCase and snake_case formats
      const fName = firstName || first_name;
      const lName = lastName || last_name;

      // Validate required fields
      if (!fName || !lName || !email || !subject || !message) {
        return res.status(400).json({ 
          error: 'Missing required fields: firstName, lastName, email, subject, message' 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Create contact request record
      const { data: contactRequest, error } = await supabaseAdmin
        .from('contact_requests')
        .insert({
          first_name: fName,
          last_name: lName,
          name: `${fName} ${lName}`,
          email,
          phone: phone || null,
          subject,
          message,
          status: 'pending' // Use 'pending' instead of 'new' to match our CHECK constraint
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating contact request', error);
        return res.status(500).json({ error: 'Failed to submit contact request' });
      }

      logger.info('Contact request created', { 
        id: contactRequest.id, 
        email,
        subject
      });

      // Send confirmation email to user
      try {
        await sendEmail(email, 'contact_form_received', {
          client_name: `${fName} ${lName}`,
          subject,
          message,
          next_steps: 'We will respond to your inquiry within 24 hours.'
        });
      } catch (emailError) {
        logger.error('Failed to send contact confirmation email', emailError);
      }

      // Send notification to admin
      try {
        await sendEmail(process.env.ADMIN_EMAIL || 'admin@applybureau.com', 'new_contact_submission', {
          client_name: `${fName} ${lName}`,
          client_email: email,
          subject,
          message,
          phone: phone || 'Not provided'
        });
      } catch (emailError) {
        logger.error('Failed to send admin notification', emailError);
      }

      res.status(201).json({
        id: contactRequest.id,
        status: 'pending',
        message: 'Contact request submitted successfully'
      });
    } catch (error) {
      logger.error('Submit contact request error', error);
      res.status(500).json({ error: 'Failed to submit contact request' });
    }
  }

  /**
   * GET /api/contact-requests - Get all contact requests (admin only)
   * Supports pagination, filtering, and search
   */
  static async getContactRequests(req, res) {
    try {
      const { 
        status, 
        search, 
        page = 1, 
        limit = 50,
        sort = 'created_at',
        order = 'desc'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = supabaseAdmin
        .from('contact_requests')
        .select('*', { count: 'exact' })
        .order(sort, { ascending: order === 'asc' })
        .range(offset, offset + parseInt(limit) - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`);
      }

      const { data: contactRequests, error, count } = await query;

      if (error) {
        logger.error('Error fetching contact requests', error);
        return res.status(500).json({ error: 'Failed to fetch contact requests' });
      }

      res.json({
        data: contactRequests || [],
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      });
    } catch (error) {
      logger.error('Get contact requests error', error);
      res.status(500).json({ error: 'Failed to fetch contact requests' });
    }
  }

  /**
   * GET /api/contact-requests/:id - Get single contact request (admin only)
   */
  static async getContactRequestById(req, res) {
    try {
      const { id } = req.params;

      const { data: contactRequest, error } = await supabaseAdmin
        .from('contact_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !contactRequest) {
        return res.status(404).json({ error: 'Contact request not found' });
      }

      res.json(contactRequest);
    } catch (error) {
      logger.error('Get contact request by ID error', error);
      res.status(500).json({ error: 'Failed to fetch contact request' });
    }
  }

  /**
   * PATCH /api/contact-requests/:id - Update contact request status (admin only)
   */
  static async updateContactRequestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, admin_notes } = req.body;
      const adminId = req.user.id || req.user.userId;

      // Validate status
      const validStatuses = ['new', 'in_progress', 'handled', 'archived'];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }

      const updateData = {};
      if (status) {
        updateData.status = status;
        if (status === 'handled') {
          updateData.handled_at = new Date().toISOString();
          updateData.handled_by = adminId;
        }
      }
      if (admin_notes !== undefined) {
        updateData.admin_notes = admin_notes;
      }

      const { data: contactRequest, error } = await supabaseAdmin
        .from('contact_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !contactRequest) {
        return res.status(404).json({ error: 'Contact request not found' });
      }

      logger.info('Contact request updated', { 
        id, 
        status, 
        adminId 
      });

      res.json({
        message: 'Contact request updated successfully',
        contact_request: contactRequest
      });
    } catch (error) {
      logger.error('Update contact request error', error);
      res.status(500).json({ error: 'Failed to update contact request' });
    }
  }
}

module.exports = ContactRequestController;
