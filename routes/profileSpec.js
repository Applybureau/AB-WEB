const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// POST /api/profile/complete - Complete user profile (PROTECTED - CLIENT)
router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      linkedin_url,
      current_job,
      target_job,
      years_of_experience,
      role_targets,
      country,
      user_location,
      location_preferences,
      minimum_salary,
      age,
      employment_status,
      target_market,
      profile_completion = 85
    } = req.body;

    const userId = req.user.userId || req.user.id;

    // Validate required fields
    if (!full_name || !email) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: full_name, email',
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

    // Check if user exists and is a client
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, role, profile_completed')
      .eq('id', userId)
      .single();

    if (userError || !currentUser) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (currentUser.role !== 'client') {
      return res.status(403).json({ 
        success: false,
        error: 'Only clients can complete profiles',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Update user profile
    const updateData = {
      full_name,
      email,
      phone,
      linkedin_url,
      current_job,
      target_job,
      years_of_experience,
      role_targets,
      country,
      user_location,
      location_preferences,
      minimum_salary,
      age,
      employment_status,
      target_market,
      profile_completion,
      profile_completed: true,
      profile_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        id, full_name, email, phone, linkedin_url, current_job, target_job,
        years_of_experience, role_targets, country, user_location, 
        location_preferences, minimum_salary, age, employment_status,
        target_market, profile_completion, profile_completed, 
        profile_completed_at, created_at, updated_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to complete profile',
        code: 'UPDATE_ERROR'
      });
    }

    // Send profile completion notification email
    try {
      const { sendEmail } = require('../utils/email');
      await sendEmail(email, 'profile_completed', {
        client_name: full_name,
        profile_completion: profile_completion,
        next_steps: 'Your profile is now complete! You can start tracking your job applications and accessing all our services.',
        dashboard_url: process.env.FRONTEND_URL + '/client/dashboard'
      });
    } catch (emailError) {
      console.error('Failed to send profile completion email:', emailError);
      // Don't fail the request if email fails
    }

    // Create profile completion notification
    try {
      const { NotificationHelpers } = require('../utils/notifications');
      await NotificationHelpers.profileCompleted(userId, updatedUser);
    } catch (notificationError) {
      console.error('Failed to create profile completion notification:', notificationError);
    }

    // Format response according to spec
    const profileData = {
      id: updatedUser.id,
      full_name: updatedUser.full_name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      linkedin_url: updatedUser.linkedin_url,
      current_job: updatedUser.current_job,
      target_job: updatedUser.target_job,
      years_of_experience: updatedUser.years_of_experience,
      role_targets: updatedUser.role_targets,
      country: updatedUser.country,
      user_location: updatedUser.user_location,
      location_preferences: updatedUser.location_preferences,
      minimum_salary: updatedUser.minimum_salary,
      age: updatedUser.age,
      employment_status: updatedUser.employment_status,
      target_market: updatedUser.target_market,
      profile_completion: updatedUser.profile_completion,
      profile_completed: updatedUser.profile_completed,
      profile_completed_at: updatedUser.profile_completed_at,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    };

    res.json({
      success: true,
      message: 'Profile completed successfully',
      profile: profileData,
      next_steps: 'You can now access all features and start tracking your job applications.'
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to complete profile',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/profile - Get user profile (PROTECTED)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const { data: user, error } = await supabaseAdmin
      .from('registered_users')
      .select(`
        id, full_name, email, phone, linkedin_url, current_job, target_job,
        years_of_experience, role_targets, country, user_location, 
        location_preferences, minimum_salary, age, employment_status,
        target_market, profile_completion, profile_completed, 
        profile_completed_at, role, created_at, updated_at
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ 
        success: false,
        error: 'User profile not found',
        code: 'NOT_FOUND'
      });
    }

    // Format response according to spec
    const profileData = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      linkedin_url: user.linkedin_url,
      current_job: user.current_job,
      target_job: user.target_job,
      years_of_experience: user.years_of_experience,
      role_targets: user.role_targets,
      country: user.country,
      user_location: user.user_location,
      location_preferences: user.location_preferences,
      minimum_salary: user.minimum_salary,
      age: user.age,
      employment_status: user.employment_status,
      target_market: user.target_market,
      profile_completion: user.profile_completion || 0,
      profile_completed: user.profile_completed || false,
      profile_completed_at: user.profile_completed_at,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    res.json({
      success: true,
      profile: profileData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch profile',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PATCH /api/profile - Update user profile (PROTECTED)
router.patch('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const updateFields = req.body;

    // Remove fields that shouldn't be updated via this endpoint
    delete updateFields.id;
    delete updateFields.role;
    delete updateFields.created_at;

    // Validate email if provided
    if (updateFields.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateFields.email)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        });
      }
    }

    // Add updated timestamp
    updateFields.updated_at = new Date().toISOString();

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update(updateFields)
      .eq('id', userId)
      .select(`
        id, full_name, email, phone, linkedin_url, current_job, target_job,
        years_of_experience, role_targets, country, user_location, 
        location_preferences, minimum_salary, age, employment_status,
        target_market, profile_completion, profile_completed, 
        profile_completed_at, role, created_at, updated_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update profile',
        code: 'UPDATE_ERROR'
      });
    }

    // Format response according to spec
    const profileData = {
      id: updatedUser.id,
      full_name: updatedUser.full_name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      linkedin_url: updatedUser.linkedin_url,
      current_job: updatedUser.current_job,
      target_job: updatedUser.target_job,
      years_of_experience: updatedUser.years_of_experience,
      role_targets: updatedUser.role_targets,
      country: updatedUser.country,
      user_location: updatedUser.user_location,
      location_preferences: updatedUser.location_preferences,
      minimum_salary: updatedUser.minimum_salary,
      age: updatedUser.age,
      employment_status: updatedUser.employment_status,
      target_market: updatedUser.target_market,
      profile_completion: updatedUser.profile_completion,
      profile_completed: updatedUser.profile_completed,
      profile_completed_at: updatedUser.profile_completed_at,
      role: updatedUser.role,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: profileData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update profile',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;