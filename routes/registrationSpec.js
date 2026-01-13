const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const { upload, uploadToSupabase } = require('../utils/upload');

const router = express.Router();

// POST /api/register/complete - Complete client registration (PUBLIC)
router.post('/complete', upload.fields([
  { name: 'profile_pic', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), async (req, res) => {
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

    // Validate required fields
    if (!token || !passcode || !full_name) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: token, passcode, full_name',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Verify registration token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid or expired registration token',
        code: 'INVALID_TOKEN'
      });
    }

    if (decoded.type !== 'registration' && decoded.type !== 'client_registration') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid registration token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Validate password strength
    if (passcode.length < 8) {
      return res.status(400).json({ 
        success: false,
        error: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('registered_users')
      .select('id')
      .eq('email', decoded.email)
      .single();

    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Handle file uploads
    let profilePictureUrl = null;
    let resumeUrl = null;
    let resumePath = null;

    if (req.files) {
      // Handle profile picture upload
      if (req.files.profile_pic && req.files.profile_pic[0]) {
        try {
          const fileName = `client_${Date.now()}_${full_name.replace(/\s+/g, '_')}.jpg`;
          const uploadResult = await uploadToSupabase(req.files.profile_pic[0], 'client-profiles', fileName);
          profilePictureUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Profile picture upload error:', uploadError);
          return res.status(500).json({ 
            success: false,
            error: 'Failed to upload profile picture',
            code: 'UPLOAD_ERROR'
          });
        }
      }

      // Handle resume upload (required)
      if (req.files.resume && req.files.resume[0]) {
        try {
          const fileName = `resume_${Date.now()}_${full_name.replace(/\s+/g, '_')}.pdf`;
          const uploadResult = await uploadToSupabase(req.files.resume[0], 'client-resumes', fileName);
          resumeUrl = uploadResult.url;
          resumePath = uploadResult.path;
        } catch (uploadError) {
          console.error('Resume upload error:', uploadError);
          return res.status(500).json({ 
            success: false,
            error: 'Failed to upload resume',
            code: 'UPLOAD_ERROR'
          });
        }
      } else {
        return res.status(400).json({ 
          success: false,
          error: 'Resume upload is required',
          code: 'MISSING_RESUME'
        });
      }
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'Resume upload is required',
        code: 'MISSING_RESUME'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passcode, 12);

    // Calculate profile completion percentage
    const profileFields = [
      full_name, decoded.email, phone, linkedin_url, current_job, 
      target_job, country, location, years_of_experience, age
    ];
    const completedFields = profileFields.filter(field => field && field.toString().trim().length > 0).length;
    const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

    // Create client account
    const { data: newClient, error: createError } = await supabaseAdmin
      .from('registered_users')
      .insert({
        full_name,
        email: decoded.email,
        passcode_hash: hashedPassword,
        phone,
        age: age ? parseInt(age) : null,
        linkedin_url,
        current_job,
        target_job,
        country,
        user_location: location,
        years_of_experience,
        profile_picture: profilePictureUrl,
        resume_url: resumeUrl,
        resume_path: resumePath,
        role: 'client',
        is_active: true,
        profile_completed: true,
        profile_completion: profileCompletion,
        registration_completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating client account:', createError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create client account',
        code: 'DATABASE_ERROR'
      });
    }

    // Generate auth token
    const authToken = jwt.sign({
      userId: newClient.id,
      email: newClient.email,
      role: newClient.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, process.env.JWT_SECRET);

    // Send welcome email
    try {
      await sendEmail(newClient.email, 'client_welcome', {
        client_name: newClient.full_name,
        profile_completion: profileCompletion,
        dashboard_url: process.env.FRONTEND_URL + '/client/dashboard',
        next_steps: 'Your account is now active! You can start tracking your job applications and accessing our resources.',
        support_email: 'support@applybureau.com'
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Format response according to spec
    const clientData = {
      id: newClient.id,
      full_name: newClient.full_name,
      email: newClient.email,
      phone: newClient.phone,
      profile_picture: newClient.profile_picture,
      linkedin_url: newClient.linkedin_url,
      current_job: newClient.current_job,
      target_job: newClient.target_job,
      years_of_experience: newClient.years_of_experience,
      country: newClient.country,
      user_location: newClient.user_location,
      age: newClient.age,
      profile_completion: newClient.profile_completion,
      role: newClient.role,
      created_at: newClient.created_at
    };

    res.status(201).json({
      success: true,
      message: 'Registration completed successfully',
      token: authToken,
      user: clientData,
      redirect_to: '/client/dashboard'
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to complete registration',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/register/validate-token/:token - Validate registration token (PUBLIC)
router.get('/validate-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token format
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({ 
        success: false,
        valid: false, 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    if (decoded.type !== 'registration' && decoded.type !== 'client_registration') {
      return res.status(400).json({ 
        success: false,
        valid: false, 
        error: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Check if email is already registered
    const { data: existingUser } = await supabaseAdmin
      .from('registered_users')
      .select('id')
      .eq('email', decoded.email)
      .single();

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        valid: false, 
        error: 'Email already registered',
        code: 'EMAIL_ALREADY_REGISTERED'
      });
    }

    res.json({
      success: true,
      valid: true,
      token_data: {
        email: decoded.email,
        name: decoded.name,
        expires_at: new Date(decoded.exp * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ 
      success: false,
      valid: false, 
      error: 'Failed to validate token',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/register/resend-token - Resend registration token (PUBLIC)
router.post('/resend-token', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'Email is required',
        code: 'MISSING_EMAIL'
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

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('registered_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Generate new registration token
    const newToken = jwt.sign({
      email: email,
      type: 'registration',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }, process.env.JWT_SECRET);

    // Send registration email
    try {
      await sendEmail(email, 'registration_token_resent', {
        registration_url: `${process.env.FRONTEND_URL}/register?token=${newToken}`,
        token_expiry: '7 days',
        support_email: 'support@applybureau.com'
      });
    } catch (emailError) {
      console.error('Failed to send registration token email:', emailError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to send registration email',
        code: 'EMAIL_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'Registration token sent successfully',
      email: email,
      expires_in: '7 days'
    });
  } catch (error) {
    console.error('Resend token error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to resend registration token',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;