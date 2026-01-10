const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireAdmin } = require('../utils/auth');
const { sendEmail, buildUrl } = require('../utils/email');
const { upload, uploadToSupabase } = require('../utils/upload');
const { NotificationHelpers } = require('../utils/notifications');
const jwt = require('jsonwebtoken');

const router = express.Router();

// POST /api/consultation-requests - Accept consultation requests from website (PUBLIC)
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      linkedin_url,
      role_targets,
      location_preferences,
      minimum_salary,
      target_market,
      employment_status,
      package_interest,
      area_of_concern,
      consultation_window,
      current_country
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !role_targets) {
      return res.status(400).json({ 
        error: 'Missing required fields: full_name, email, role_targets' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Handle PDF upload if provided
    let pdfUrl = null;
    let pdfPath = null;
    
    if (req.file) {
      try {
        const fileName = `consultation_${Date.now()}_${full_name.replace(/\s+/g, '_')}.pdf`;
        const uploadResult = await uploadToSupabase(req.file, 'consultation-resumes', fileName);
        pdfUrl = uploadResult.url;
        pdfPath = uploadResult.path;
      } catch (uploadError) {
        console.error('PDF upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload PDF. Please try again.' });
      }
    }

    // Create consultation request with enhanced status tracking
    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .insert({
        full_name,
        email,
        phone,
        linkedin_url,
        role_targets,
        location_preferences,
        minimum_salary,
        target_market,
        employment_status,
        package_interest,
        area_of_concern,
        consultation_window,
        current_country,
        pdf_url: pdfUrl,
        pdf_path: pdfPath,
        status: 'pending',
        pipeline_status: 'lead'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating consultation request:', error);
      return res.status(500).json({ error: 'Failed to submit consultation request' });
    }

    // Send confirmation email to client
    try {
      await sendEmail(email, 'consultation_request_received', {
        client_name: full_name,
        request_id: consultation.id,
        role_targets: role_targets,
        package_interest: package_interest || 'Not specified',
        current_country: current_country || 'Not specified',
        resume_uploaded: pdfUrl ? 'Yes' : 'No',
        next_steps: 'Our team will review your request and contact you within 24 hours.'
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Send notification email to admin
    try {
      await sendEmail('admin@applybureau.com', 'new_consultation_request', {
        client_name: full_name,
        client_email: email,
        role_targets: role_targets,
        package_interest: package_interest || 'Not specified',
        employment_status: employment_status || 'Not specified',
        area_of_concern: area_of_concern || 'Not specified',
        current_country: current_country || 'Not specified',
        resume_uploaded: pdfUrl ? 'Yes - Resume attached' : 'No resume uploaded',
        pdf_url: pdfUrl || 'Not provided',
        admin_dashboard_url: buildUrl('/admin/consultations')
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // Don't fail the request if email fails
    }

    // Create admin notification
    try {
      await NotificationHelpers.newConsultationRequest(consultation);
    } catch (notificationError) {
      console.error('Failed to create admin notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      id: consultation.id,
      status: 'pending',
      message: 'Consultation request received successfully',
      pdf_uploaded: !!pdfUrl
    });
  } catch (error) {
    console.error('Consultation request error:', error);
    res.status(500).json({ error: 'Failed to submit consultation request' });
  }
});

// GET /api/consultations - Return consultation requests for admin (PROTECTED)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0, search } = req.query;

    let query = supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,role_targets.ilike.%${search}%`);
    }

    const { data: consultations, error } = await query;

    if (error) {
      console.error('Error fetching consultation requests:', error);
      return res.status(500).json({ error: 'Failed to fetch consultation requests' });
    }

    res.json(consultations || []);
  } catch (error) {
    console.error('Fetch consultation requests error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation requests' });
  }
});

// PATCH /api/consultations/:id - Update consultation status with enhanced workflow (PROTECTED)
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes, action } = req.body;
    const adminId = req.user.userId || req.user.id;

    if (!status && !action) {
      return res.status(400).json({ error: 'Status or action is required' });
    }

    // Handle specific actions for the pipeline
    if (action === 'approve') {
      // Generate registration token for approved consultations
      const registrationToken = jwt.sign({
        consultationId: id,
        email: '',
        type: 'client_registration',
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      }, process.env.JWT_SECRET);

      const updateData = {
        status: 'approved',
        pipeline_status: 'approved',
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        registration_token: registrationToken,
        token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        admin_notes
      };

      const { data: consultation, error } = await supabaseAdmin
        .from('consultation_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !consultation) {
        return res.status(404).json({ error: 'Consultation request not found' });
      }

      // Send approval email with registration link
      try {
        const registrationLink = buildUrl(`/register?token=${registrationToken}`);
        await sendEmail(consultation.email, 'consultation_approved', {
          client_name: consultation.full_name,
          role_targets: consultation.role_targets,
          package_interest: consultation.package_interest || 'Not specified',
          registration_link: registrationLink,
          token_expires: '7 days',
          next_steps: 'Click the registration link to create your client account and access our services.'
        });
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }

      // Create client notification if user exists
      try {
        if (consultation.user_id) {
          await NotificationHelpers.consultationApproved(consultation.user_id, consultation);
        }
      } catch (notificationError) {
        console.error('Failed to create approval notification:', notificationError);
      }

      return res.json({
        message: 'Consultation approved and registration token generated',
        consultation,
        registration_token: registrationToken
      });
    }

    if (action === 'reject') {
      const updateData = {
        status: 'rejected',
        pipeline_status: 'rejected',
        rejected_by: adminId,
        rejected_at: new Date().toISOString(),
        rejection_reason: admin_notes || 'Does not meet current criteria',
        admin_notes
      };

      const { data: consultation, error } = await supabaseAdmin
        .from('consultation_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !consultation) {
        return res.status(404).json({ error: 'Consultation request not found' });
      }

      // Send professional rejection email
      try {
        await sendEmail(consultation.email, 'consultation_rejected', {
          client_name: consultation.full_name,
          role_targets: consultation.role_targets,
          reason: consultation.rejection_reason,
          alternative_resources: 'We recommend exploring our free resources on LinkedIn and our blog for career guidance.'
        });
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
      }

      // Create client notification if user exists
      try {
        if (consultation.user_id) {
          await NotificationHelpers.consultationRejected(consultation.user_id, consultation, consultation.rejection_reason);
        }
      } catch (notificationError) {
        console.error('Failed to create rejection notification:', notificationError);
      }

      return res.json({
        message: 'Consultation rejected',
        consultation
      });
    }

    // Handle regular status updates
    if (!['pending', 'under_review', 'approved', 'rejected', 'scheduled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      status
    };

    // Update pipeline status based on regular status
    if (status === 'under_review') {
      updateData.pipeline_status = 'under_review';
      updateData.reviewed_by = adminId;
      updateData.reviewed_at = new Date().toISOString();
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !consultation) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    // Send email notification based on status
    try {
      let emailTemplate = null;
      let emailData = {
        client_name: consultation.full_name,
        role_targets: consultation.role_targets,
        package_interest: consultation.package_interest || 'Not specified'
      };

      if (status === 'under_review') {
        emailTemplate = 'consultation_under_review';
        emailData.next_steps = 'Our team is reviewing your consultation request. We will contact you within 24-48 hours.';
        emailData.estimated_response = '24-48 hours';
        emailData.submission_date = new Date(consultation.created_at).toLocaleDateString();
        
        // Create client notification if user exists
        if (consultation.user_id) {
          await NotificationHelpers.consultationUnderReview(consultation.user_id, consultation);
        }
      } else if (status === 'scheduled') {
        emailTemplate = 'consultation_confirmed';
        emailData.meeting_details = admin_notes || 'Meeting details will be provided separately.';
      }

      if (emailTemplate) {
        await sendEmail(consultation.email, emailTemplate, emailData);
        console.log(`✅ ${status} email sent successfully to:`, consultation.email);
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      
      // Don't fail the entire request if email fails - just log it
      // This is especially important for Resend testing limitations
      if (emailError.statusCode === 403 && emailError.name === 'validation_error') {
        console.log('📧 Email sending restricted to verified addresses in testing mode');
      }
    }

    res.json({
      message: 'Consultation request updated successfully',
      consultation
    });
  } catch (error) {
    console.error('Update consultation request error:', error);
    res.status(500).json({ error: 'Failed to update consultation request' });
  }
});

// GET /api/consultations/:id - Get specific consultation request (PROTECTED)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !consultation) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    res.json(consultation);
  } catch (error) {
    console.error('Get consultation request error:', error);
    res.status(500).json({ error: 'Failed to fetch consultation request' });
  }
});

// GET /api/consultation-requests/:id/pdf - Download PDF file (PROTECTED)
router.get('/:id/pdf', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get consultation request
    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .select('pdf_url, pdf_path, full_name')
      .eq('id', id)
      .single();

    if (error || !consultation) {
      return res.status(404).json({ error: 'Consultation request not found' });
    }

    if (!consultation.pdf_url || !consultation.pdf_path) {
      return res.status(404).json({ error: 'No PDF file found for this consultation' });
    }

    // Extract file path from the stored pdf_path
    const filePath = consultation.pdf_path;

    // Download file from Supabase storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('consultation-resumes')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading PDF:', downloadError);
      return res.status(500).json({ error: 'Failed to download PDF file' });
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Set headers for PDF download
    const fileName = consultation.pdf_path || `${consultation.full_name}_resume.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send the PDF file
    res.send(buffer);
  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({ error: 'Failed to download PDF file' });
  }
});

// POST /api/contact - Handle contact form submissions (PUBLIC)
router.post('/contact', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      subject,
      message
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, email, subject, message' 
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
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        subject,
        message,
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

// POST /api/consultations/register - Client registration using token (PUBLIC)
router.post('/register', async (req, res) => {
  try {
    const { token, password, confirm_password } = req.body;

    if (!token || !password || !confirm_password) {
      return res.status(400).json({ 
        error: 'Registration token, password, and password confirmation are required' 
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    // Verify registration token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({ error: 'Invalid or expired registration token' });
    }

    if (decoded.type !== 'client_registration') {
      return res.status(400).json({ error: 'Invalid registration token type' });
    }

    // Get consultation request
    const { data: consultation, error: consultationError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', decoded.consultationId)
      .eq('registration_token', token)
      .eq('token_used', false)
      .single();

    if (consultationError || !consultation) {
      return res.status(400).json({ error: 'Invalid registration token or token already used' });
    }

    // Check if token is expired
    if (new Date() > new Date(consultation.token_expires_at)) {
      return res.status(400).json({ error: 'Registration token has expired' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create client account
    const { data: client, error: clientError } = await supabaseAdmin
      .from('registered_users')
      .insert({
        lead_id: consultation.id,
        email: consultation.email,
        passcode_hash: hashedPassword,
        full_name: consultation.full_name,
        role: 'client',
        is_active: true
      })
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client account:', clientError);
      return res.status(500).json({ error: 'Failed to create client account' });
    }

    // Update consultation request
    await supabaseAdmin
      .from('consultation_requests')
      .update({
        status: 'registered',
        pipeline_status: 'client',
        registered_at: new Date().toISOString(),
        user_id: client.id,
        token_used: true
      })
      .eq('id', consultation.id);

    // Generate auth token
    const authToken = jwt.sign({
      userId: client.id,
      email: client.email,
      role: client.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, process.env.JWT_SECRET);

    // Send welcome email
    try {
      await sendEmail(client.email, 'client_welcome', {
        client_name: client.full_name,
        dashboard_url: buildUrl('/client/dashboard'),
        next_steps: 'Complete your profile to unlock all features and start tracking your job applications.',
        support_email: 'support@applybureau.com'
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(201).json({
      message: 'Registration completed successfully',
      token: authToken,
      user: {
        id: client.id,
        email: client.email,
        full_name: client.full_name,
        role: client.role
      },
      redirect_to: '/client/profile-setup'
    });
  } catch (error) {
    console.error('Client registration error:', error);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

// GET /api/consultations/validate-token/:token - Validate registration token (PUBLIC)
router.get('/validate-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token format
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Invalid or expired token' 
      });
    }

    if (decoded.type !== 'client_registration') {
      return res.status(400).json({ 
        valid: false, 
        error: 'Invalid token type' 
      });
    }

    // Check consultation request
    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .select('id, full_name, email, token_expires_at, token_used')
      .eq('id', decoded.consultationId)
      .eq('registration_token', token)
      .single();

    if (error || !consultation) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Token not found' 
      });
    }

    if (consultation.token_used) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Token already used' 
      });
    }

    if (new Date() > new Date(consultation.token_expires_at)) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Token expired' 
      });
    }

    res.json({
      valid: true,
      consultation: {
        full_name: consultation.full_name,
        email: consultation.email,
        expires_at: consultation.token_expires_at
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ 
      valid: false, 
      error: 'Failed to validate token' 
    });
  }
});

module.exports = router;