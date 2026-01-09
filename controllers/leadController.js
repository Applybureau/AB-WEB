const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const { generateRegistrationToken, verifyRegistrationToken, invalidateToken } = require('../utils/tokenService');
const { uploadToSupabase } = require('../utils/upload');
const logger = require('../utils/logger');

class LeadController {
  /**
   * POST /api/leads - Submit a new lead (public)
   * Stage 1: Lead Submission
   */
  static async submitLead(req, res) {
    try {
      const {
        full_name,
        firstName,
        lastName,
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
        subject,
        message
      } = req.body;

      // Support both full_name and firstName/lastName formats
      const name = full_name || `${firstName || ''} ${lastName || ''}`.trim();

      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ 
          error: 'Missing required fields: name and email are required' 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Handle PDF upload if present
      let pdfUrl = null;
      let pdfPath = null;
      
      if (req.file) {
        try {
          const timestamp = Date.now();
          const filePath = `lead-resumes/${timestamp}-${req.file.originalname}`;
          const uploadResult = await uploadToSupabase(req.file, 'resumes', filePath);
          pdfUrl = uploadResult.url;
          pdfPath = uploadResult.path;
          logger.info('PDF uploaded successfully', { pdfUrl, pdfPath });
        } catch (uploadError) {
          logger.error('PDF upload failed', uploadError);
          return res.status(500).json({ error: 'Failed to upload resume PDF' });
        }
      }

      // Create lead record with initial status 'lead'
      const { data: lead, error } = await supabaseAdmin
        .from('consultation_requests')
        .insert({
          full_name: name,
          email,
          phone,
          linkedin_url,
          role_targets: role_targets || subject || 'General Inquiry',
          location_preferences,
          minimum_salary,
          target_market,
          employment_status,
          package_interest,
          area_of_concern: area_of_concern || message,
          consultation_window,
          pipeline_status: 'lead',
          status: 'pending',
          pdf_url: pdfUrl,
          pdf_path: pdfPath
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating lead', error);
        return res.status(500).json({ error: 'Failed to submit lead' });
      }

      logger.info('Lead created successfully', { 
        leadId: lead.id, 
        email,
        hasPdf: !!pdfUrl
      });

      res.status(201).json({
        id: lead.id,
        status: 'lead',
        message: 'Lead submitted successfully',
        pdf_url: pdfUrl
      });
    } catch (error) {
      logger.error('Submit lead error', error);
      res.status(500).json({ error: 'Failed to submit lead' });
    }
  }

  /**
   * GET /api/leads - Get all leads (admin only)
   */
  static async getAllLeads(req, res) {
    try {
      const { 
        status, 
        pipeline_status,
        search, 
        page = 1, 
        limit = 50,
        sort = 'created_at',
        order = 'desc'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = supabaseAdmin
        .from('consultation_requests')
        .select('*', { count: 'exact' })
        .order(sort, { ascending: order === 'asc' })
        .range(offset, offset + parseInt(limit) - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (pipeline_status) {
        query = query.eq('pipeline_status', pipeline_status);
      }

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: leads, error, count } = await query;

      if (error) {
        logger.error('Error fetching leads', error);
        return res.status(500).json({ error: 'Failed to fetch leads' });
      }

      res.json({
        data: leads || [],
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      });
    } catch (error) {
      logger.error('Get all leads error', error);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  }

  /**
   * GET /api/leads/:id - Get lead details with PDF URL (admin only)
   */
  static async getLeadById(req, res) {
    try {
      const { id } = req.params;

      const { data: lead, error } = await supabaseAdmin
        .from('consultation_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      res.json(lead);
    } catch (error) {
      logger.error('Get lead by ID error', error, { leadId: req.params.id });
      res.status(500).json({ error: 'Failed to fetch lead' });
    }
  }

  /**
   * PATCH /api/leads/:id/review - Mark lead as under review (admin only)
   * Stage 2: Under Review - Triggers Email #1
   */
  static async markUnderReview(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id || req.user.userId;

      // Get current lead
      const { data: lead, error: fetchError } = await supabaseAdmin
        .from('consultation_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      // Validate status transition
      if (lead.pipeline_status !== 'lead') {
        return res.status(400).json({ 
          error: `Invalid status transition from ${lead.pipeline_status} to under_review` 
        });
      }

      // Update status
      const { data: updatedLead, error: updateError } = await supabaseAdmin
        .from('consultation_requests')
        .update({
          pipeline_status: 'under_review',
          status: 'under_review',
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        logger.error('Error updating lead status', updateError);
        return res.status(500).json({ error: 'Failed to update lead status' });
      }

      // Trigger Email #1 - Profile Under Review (NO dashboard link)
      try {
        await sendEmail(lead.email, 'profile_under_review', {
          client_name: lead.full_name,
          role_targets: lead.role_targets || 'Your application'
        });
        logger.info('Under review email sent', { leadId: id, email: lead.email });
      } catch (emailError) {
        logger.error('Failed to send under review email', emailError);
        // Don't fail the request if email fails
      }

      logger.info('Lead marked as under review', {
        leadId: id,
        adminId,
        previousStatus: lead.pipeline_status
      });

      res.json({
        message: 'Lead marked as under review',
        lead: updatedLead
      });
    } catch (error) {
      logger.error('Mark under review error', error);
      res.status(500).json({ error: 'Failed to mark lead as under review' });
    }
  }

  /**
   * PATCH /api/leads/:id/approve - Approve lead and generate registration token (admin only)
   * Stage 3: Approval - Triggers Email #2 with registration link
   */
  static async approveLead(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id || req.user.userId;

      // Get current lead
      const { data: lead, error: fetchError } = await supabaseAdmin
        .from('consultation_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      // Validate status transition
      if (lead.pipeline_status !== 'under_review') {
        return res.status(400).json({ 
          error: `Invalid status transition from ${lead.pipeline_status} to approved. Lead must be under_review first.` 
        });
      }

      // Generate registration token
      const { token, expiresAt } = generateRegistrationToken(id, lead.email);

      // Update status
      const { data: updatedLead, error: updateError } = await supabaseAdmin
        .from('consultation_requests')
        .update({
          pipeline_status: 'approved',
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: adminId,
          registration_token: token,
          token_expires_at: expiresAt.toISOString(),
          token_used: false
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        logger.error('Error approving lead', updateError);
        return res.status(500).json({ error: 'Failed to approve lead' });
      }

      // Generate registration URL
      const registrationUrl = `${process.env.FRONTEND_URL}/register?token=${token}`;

      // Trigger Email #2 - Lead Selected (WITH registration link and warning)
      try {
        await sendEmail(lead.email, 'lead_selected', {
          client_name: lead.full_name,
          role_targets: lead.role_targets || 'Your application',
          registration_url: registrationUrl
        });
        logger.info('Selection email sent', { leadId: id, email: lead.email });
      } catch (emailError) {
        logger.error('Failed to send selection email', emailError);
        // Don't fail the request if email fails
      }

      logger.info('Lead approved', {
        leadId: id,
        adminId,
        tokenExpiresAt: expiresAt.toISOString()
      });

      res.json({
        message: 'Lead approved successfully',
        lead: updatedLead,
        registration_url: registrationUrl
      });
    } catch (error) {
      logger.error('Approve lead error', error);
      res.status(500).json({ error: 'Failed to approve lead' });
    }
  }


  /**
   * PATCH /api/leads/:id/reject - Reject a lead (admin only)
   */
  static async rejectLead(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id || req.user.userId;

      const { data: lead, error: fetchError } = await supabaseAdmin
        .from('consultation_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      if (lead.pipeline_status === 'client') {
        return res.status(400).json({ error: 'Cannot reject a registered client' });
      }

      const { data: updatedLead, error: updateError } = await supabaseAdmin
        .from('consultation_requests')
        .update({
          pipeline_status: 'rejected',
          status: 'rejected',
          admin_notes: reason || 'Application rejected'
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        logger.error('Error rejecting lead', updateError);
        return res.status(500).json({ error: 'Failed to reject lead' });
      }

      // Send rejection email
      try {
        await sendEmail(lead.email, 'consultation_rejected', {
          client_name: lead.full_name,
          reason: reason || 'Your application does not meet our current criteria.'
        });
      } catch (emailError) {
        logger.error('Failed to send rejection email', emailError);
      }

      logger.info('Lead rejected', { leadId: id, adminId });

      res.json({
        message: 'Lead rejected',
        lead: updatedLead
      });
    } catch (error) {
      logger.error('Reject lead error', error);
      res.status(500).json({ error: 'Failed to reject lead' });
    }
  }

  /**
   * GET /api/register/verify - Verify registration token and get pre-filled data
   * Stage 4: Registration - Token Verification
   */
  static async verifyToken(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const result = await verifyRegistrationToken(token);

      if (!result.valid) {
        return res.status(401).json({ error: result.error });
      }

      res.json({
        valid: true,
        email: result.payload.email,
        full_name: result.payload.full_name,
        consultation_id: result.payload.consultation_id
      });
    } catch (error) {
      logger.error('Verify token error', error);
      res.status(500).json({ error: 'Token verification failed' });
    }
  }

  /**
   * POST /api/register/complete - Complete registration with passcode and profile
   * Stage 4: Registration - Account Creation
   */
  static async completeRegistration(req, res) {
    try {
      const {
        token,
        passcode,
        full_name,
        age,
        linkedin_url,
        current_job,
        target_job,
        country,
        location,
        years_of_experience,
        phone
      } = req.body;

      // Verify token
      const tokenResult = await verifyRegistrationToken(token);
      if (!tokenResult.valid) {
        return res.status(401).json({ error: tokenResult.error });
      }

      const { consultation_id, email } = tokenResult.payload;

      // Validate passcode
      if (!passcode || passcode.length < 8) {
        return res.status(400).json({ 
          error: 'Passcode must be at least 8 characters long' 
        });
      }

      // Hash passcode
      const passcodeHash = await bcrypt.hash(passcode, 12);

      // Handle profile picture upload if present
      let profilePicUrl = null;
      if (req.files && req.files.profile_pic) {
        try {
          const file = req.files.profile_pic;
          const timestamp = Date.now();
          const filePath = `profile-pictures/${timestamp}-${file.originalname}`;
          const uploadResult = await uploadToSupabase(file, 'profiles', filePath);
          profilePicUrl = uploadResult.url;
        } catch (uploadError) {
          logger.error('Profile picture upload failed', uploadError);
        }
      }

      // Handle resume upload if present
      let resumeUrl = null;
      if (req.files && req.files.resume) {
        try {
          const file = req.files.resume;
          const timestamp = Date.now();
          const filePath = `client-resumes/${timestamp}-${file.originalname}`;
          const uploadResult = await uploadToSupabase(file, 'resumes', filePath);
          resumeUrl = uploadResult.url;
        } catch (uploadError) {
          logger.error('Resume upload failed', uploadError);
        }
      }

      // Create user record
      const { data: user, error: userError } = await supabaseAdmin
        .from('registered_users')
        .insert({
          lead_id: consultation_id,
          email,
          passcode_hash: passcodeHash,
          full_name: full_name || tokenResult.payload.full_name,
          role: 'client'
        })
        .select()
        .single();

      if (userError) {
        logger.error('Error creating user', userError);
        return res.status(500).json({ error: 'Failed to create user account' });
      }

      // Update lead record with profile data and status
      const { error: updateError } = await supabaseAdmin
        .from('consultation_requests')
        .update({
          pipeline_status: 'client',
          status: 'completed',
          registered_at: new Date().toISOString(),
          user_id: user.id,
          full_name: full_name || tokenResult.payload.full_name,
          age,
          linkedin_url,
          profile_pic_url: profilePicUrl,
          pdf_url: resumeUrl || undefined,
          current_job,
          target_job,
          country,
          user_location: location,
          years_of_experience,
          phone,
          token_used: true,
          registration_token: null
        })
        .eq('id', consultation_id);

      if (updateError) {
        logger.error('Error updating lead profile', updateError);
      }

      // Invalidate token
      await invalidateToken(consultation_id);

      logger.info('Registration completed', {
        userId: user.id,
        leadId: consultation_id,
        email
      });

      // Send welcome email
      try {
        await sendEmail(email, 'onboarding_completion', {
          client_name: full_name || tokenResult.payload.full_name
        });
      } catch (emailError) {
        logger.error('Failed to send welcome email', emailError);
      }

      res.status(201).json({
        message: 'Registration completed successfully',
        user_id: user.id,
        status: 'client'
      });
    } catch (error) {
      logger.error('Complete registration error', error);
      res.status(500).json({ error: 'Failed to complete registration' });
    }
  }
}

module.exports = LeadController;
