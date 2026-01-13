const express = require('express');
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../utils/supabase');
const { generateToken, authenticateToken } = require('../utils/auth');
const { sendEmail } = require('../utils/email');
const { upload, uploadToSupabase } = require('../utils/upload');

const router = express.Router();

// POST /api/auth/login - Admin/Client login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: email, password',
        code: 'VALIDATION_ERROR'
      });
    }

    // Find user by email
    const { data: user, error } = await supabaseAdmin
      .from('registered_users')
      .select(`
        id,
        email,
        password,
        full_name,
        role,
        status,
        profile_picture,
        is_main_admin,
        can_create_admins,
        can_delete_admins,
        can_suspend_admins,
        can_manage_clients,
        can_schedule_consultations,
        can_view_reports,
        can_reset_passwords,
        must_change_password
      `)
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is suspended
    if (user.status === 'suspended') {
      return res.status(403).json({ 
        success: false,
        error: 'Account is suspended. Please contact administrator.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    await supabaseAdmin
      .from('registered_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    });

    // Format user data based on role
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      profile_picture: user.profile_picture
    };

    // Add admin permissions if user is admin
    if (user.role === 'admin') {
      userData.permissions = {
        can_create_admins: user.can_create_admins || false,
        can_delete_admins: user.can_delete_admins || false,
        can_suspend_admins: user.can_suspend_admins || false,
        can_manage_clients: user.can_manage_clients !== false,
        can_schedule_consultations: user.can_schedule_consultations !== false,
        can_view_reports: user.can_view_reports !== false,
        can_reset_passwords: user.can_reset_passwords || false
      };
    }

    res.json({
      success: true,
      token: token,
      user: userData,
      must_change_password: user.must_change_password || false
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Login failed',
      code: 'SERVER_ERROR'
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabaseAdmin
      .from('registered_users')
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        profile_picture,
        phone,
        linkedin_url,
        current_job,
        target_job,
        package_tier,
        package_expiry,
        profile_completion,
        is_main_admin,
        can_create_admins,
        can_delete_admins,
        can_suspend_admins,
        can_manage_clients,
        can_schedule_consultations,
        can_view_reports,
        can_reset_passwords,
        created_at,
        updated_at,
        last_login
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Format user data
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      profile_picture: user.profile_picture,
      phone: user.phone,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login
    };

    // Add role-specific data
    if (user.role === 'admin') {
      userData.is_main_admin = user.is_main_admin || false;
      userData.permissions = {
        can_create_admins: user.can_create_admins || false,
        can_delete_admins: user.can_delete_admins || false,
        can_suspend_admins: user.can_suspend_admins || false,
        can_manage_clients: user.can_manage_clients !== false,
        can_schedule_consultations: user.can_schedule_consultations !== false,
        can_view_reports: user.can_view_reports !== false,
        can_reset_passwords: user.can_reset_passwords || false
      };
    } else if (user.role === 'client') {
      userData.linkedin_url = user.linkedin_url;
      userData.current_job = user.current_job;
      userData.target_job = user.target_job;
      userData.package_tier = user.package_tier;
      userData.package_expiry = user.package_expiry;
      userData.profile_completion = user.profile_completion || 0;
    }

    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user information',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /api/register/complete - Complete client registration
router.post('/register/complete', upload.fields([
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
        code: 'VALIDATION_ERROR'
      });
    }

    // Verify registration token (implement token verification logic)
    // For now, we'll create a new client directly

    // Handle file uploads
    let profilePictureUrl = null;
    let resumeUrl = null;
    let resumePath = null;

    if (req.files?.profile_pic?.[0]) {
      try {
        const file = req.files.profile_pic[0];
        const fileName = `profile_${Date.now()}_${full_name.replace(/\s+/g, '_')}.${file.originalname.split('.').pop()}`;
        const uploadResult = await uploadToSupabase(file, 'profile-pictures', fileName);
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

    if (req.files?.resume?.[0]) {
      try {
        const file = req.files.resume[0];
        const fileName = `resume_${Date.now()}_${full_name.replace(/\s+/g, '_')}.pdf`;
        const uploadResult = await uploadToSupabase(file, 'client-resumes', fileName);
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
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passcode, 12);

    // Create client record
    const { data: client, error } = await supabaseAdmin
      .from('registered_users')
      .insert({
        full_name,
        email: `temp_${Date.now()}@example.com`, // This should come from token
        password: hashedPassword,
        role: 'client',
        status: 'active',
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
        profile_completion: 60 // Base completion for registration
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to complete registration',
        code: 'DATABASE_ERROR'
      });
    }

    // Generate login token
    const loginToken = generateToken({
      id: client.id,
      userId: client.id,
      email: client.email,
      role: client.role,
      full_name: client.full_name
    });

    // Send welcome email
    try {
      await sendEmail(client.email, 'client_welcome', {
        client_name: full_name,
        dashboard_url: process.env.FRONTEND_URL + '/client/dashboard'
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Registration completed successfully',
      token: loginToken,
      user: {
        id: client.id,
        email: client.email,
        full_name: client.full_name,
        role: client.role,
        profile_picture: client.profile_picture
      }
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to complete registration',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /api/auth/change-password - Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!current_password || !new_password) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: current_password, new_password',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get current user
    const { data: user, error } = await supabaseAdmin
      .from('registered_users')
      .select('password')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(new_password, 12);

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update({ 
        password: hashedNewPassword,
        must_change_password: false
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update password',
        code: 'DATABASE_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to change password',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Update last logout time
    await supabaseAdmin
      .from('registered_users')
      .update({ last_logout: new Date().toISOString() })
      .eq('id', userId);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Logout failed',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;