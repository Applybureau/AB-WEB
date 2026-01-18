const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');
const { sendEmail } = require('../utils/email');
const { NotificationHelpers } = require('../utils/notifications');

const router = express.Router();

// POST /api/users/onboarding - Submit 20-field onboarding questionnaire (PROTECTED - CLIENT)
router.post('/onboarding', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const {
      onboarding_current_position,
      onboarding_years_experience,
      onboarding_education_level,
      onboarding_target_roles,
      onboarding_target_industries,
      onboarding_career_timeline,
      onboarding_current_salary,
      onboarding_target_salary,
      onboarding_benefits_priorities,
      onboarding_work_arrangement,
      onboarding_company_size,
      onboarding_work_culture,
      onboarding_current_location,
      onboarding_willing_to_relocate,
      onboarding_preferred_locations,
      onboarding_key_skills,
      onboarding_skill_gaps,
      onboarding_learning_goals,
      onboarding_application_volume,
      onboarding_success_metrics
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'onboarding_current_position',
      'onboarding_years_experience',
      'onboarding_target_roles',
      'onboarding_target_industries',
      'onboarding_career_timeline',
      'onboarding_target_salary',
      'onboarding_work_arrangement',
      'onboarding_current_location',
      'onboarding_key_skills',
      'onboarding_success_metrics'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Verify user exists and is a client
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, role, full_name, email, onboarding_completed')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.role !== 'client') {
      return res.status(403).json({ 
        success: false,
        error: 'Only clients can complete onboarding',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (user.onboarding_completed) {
      return res.status(409).json({ 
        success: false,
        error: 'Onboarding already completed',
        code: 'ONBOARDING_ALREADY_COMPLETED'
      });
    }

    // Update user with onboarding data
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update({
        onboarding_current_position,
        onboarding_years_experience,
        onboarding_education_level,
        onboarding_target_roles,
        onboarding_target_industries,
        onboarding_career_timeline,
        onboarding_current_salary,
        onboarding_target_salary,
        onboarding_benefits_priorities,
        onboarding_work_arrangement,
        onboarding_company_size,
        onboarding_work_culture,
        onboarding_current_location,
        onboarding_willing_to_relocate,
        onboarding_preferred_locations,
        onboarding_key_skills,
        onboarding_skill_gaps,
        onboarding_learning_goals,
        onboarding_application_volume,
        onboarding_success_metrics,
        onboarding_completed: true,
        onboarding_completion_date: new Date().toISOString(),
        profile_unlocked: false, // Requires admin approval
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user onboarding:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to complete onboarding',
        code: 'UPDATE_ERROR'
      });
    }

    // Send onboarding completion email to client
    try {
      await sendEmail(user.email, 'onboarding_completed', {
        client_name: user.full_name,
        next_steps: 'Your onboarding is now under review. You will receive an email once your profile is unlocked and you can access the full Application Tracker.',
        review_timeline: '24-48 hours',
        support_email: 'support@applybureau.com'
      });
    } catch (emailError) {
      console.error('Failed to send onboarding completion email:', emailError);
    }

    // Send notification to admin about completed onboarding
    try {
      await sendEmail('admin@applybureau.com', 'admin_onboarding_review_needed', {
        client_name: user.full_name,
        client_email: user.email,
        completion_date: new Date().toLocaleDateString(),
        target_roles: onboarding_target_roles,
        target_salary: onboarding_target_salary,
        admin_dashboard_url: process.env.FRONTEND_URL + '/admin/clients',
        review_url: process.env.FRONTEND_URL + `/admin/clients/${userId}`
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
    }

    // Create admin notification
    try {
      await NotificationHelpers.onboardingCompletedForReview(updatedUser);
    } catch (notificationError) {
      console.error('Failed to create onboarding notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        id: updatedUser.id,
        onboarding_completed: updatedUser.onboarding_completed,
        onboarding_completion_date: updatedUser.onboarding_completion_date,
        profile_unlocked: updatedUser.profile_unlocked
      }
    });
  } catch (error) {
    console.error('Onboarding submission error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to complete onboarding',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PATCH /api/admin/clients/:client_id/unlock - Admin profile unlock (PROTECTED - ADMIN)
router.patch('/admin/clients/:client_id/unlock', authenticateToken, async (req, res) => {
  try {
    const { client_id } = req.params;
    const { profile_unlocked, admin_notes } = req.body;
    const adminId = req.user.userId || req.user.id;

    // Verify admin permissions - check admins table where admin is stored
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, role, full_name')
      .eq('id', adminId)
      .eq('role', 'admin')
      .single();

    if (adminError || !admin) {
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get client details
    const { data: client, error: clientError } = await supabaseAdmin
      .from('registered_users')
      .select('id, full_name, email, onboarding_completed, profile_unlocked')
      .eq('id', client_id)
      .eq('role', 'client')
      .single();

    if (clientError || !client) {
      return res.status(404).json({ 
        success: false,
        error: 'Client not found',
        code: 'CLIENT_NOT_FOUND'
      });
    }

    if (!client.onboarding_completed) {
      return res.status(400).json({ 
        success: false,
        error: 'Client must complete onboarding before profile can be unlocked',
        code: 'ONBOARDING_NOT_COMPLETED'
      });
    }

    // Update client profile unlock status
    const updateData = {
      profile_unlocked: profile_unlocked,
      updated_at: new Date().toISOString()
    };

    if (profile_unlocked) {
      updateData.profile_unlock_date = new Date().toISOString();
      updateData.profile_unlocked_by = adminId;
    }

    if (admin_notes) {
      updateData.profile_unlock_notes = admin_notes;
    }

    const { data: updatedClient, error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update(updateData)
      .eq('id', client_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating client profile unlock:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update profile unlock status',
        code: 'UPDATE_ERROR'
      });
    }

    // Send email notification to client
    if (profile_unlocked) {
      try {
        await sendEmail(client.email, 'profile_unlocked', {
          client_name: client.full_name,
          admin_name: admin.full_name,
          unlock_date: new Date().toLocaleDateString(),
          dashboard_url: process.env.FRONTEND_URL + '/client/dashboard',
          next_steps: 'Your profile has been unlocked! You now have full access to the Application Tracker and all features.',
          admin_notes: admin_notes || 'Your profile has been reviewed and approved.'
        });
      } catch (emailError) {
        console.error('Failed to send profile unlock email:', emailError);
      }

      // Create client notification
      try {
        await NotificationHelpers.profileUnlocked(client_id, admin);
      } catch (notificationError) {
        console.error('Failed to create profile unlock notification:', notificationError);
      }
    }

    res.json({
      success: true,
      message: profile_unlocked ? 'Profile unlocked successfully' : 'Profile lock status updated',
      client: {
        id: updatedClient.id,
        profile_unlocked: updatedClient.profile_unlocked,
        profile_unlock_date: updatedClient.profile_unlock_date
      }
    });
  } catch (error) {
    console.error('Profile unlock error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update profile unlock status',
      code: 'INTERNAL_ERROR'
    });
  }
});

// PATCH /api/consultation-requests/:id/verify-payment - Payment verification (PROTECTED - ADMIN)
router.patch('/consultation-requests/:id/verify-payment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      payment_verified,
      payment_method,
      payment_amount,
      payment_reference,
      package_tier,
      admin_notes
    } = req.body;
    const adminId = req.user.userId || req.user.id;

    // Verify admin permissions - check admins table where admin is stored
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, role, full_name')
      .eq('id', adminId)
      .eq('role', 'admin')
      .single();

    if (adminError || !admin) {
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get consultation request
    const { data: consultation, error: consultationError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (consultationError || !consultation) {
      return res.status(404).json({ 
        success: false,
        error: 'Consultation request not found',
        code: 'NOT_FOUND'
      });
    }

    // Generate registration token if payment is verified
    let registrationToken = null;
    let tokenExpiresAt = null;

    if (payment_verified) {
      const jwt = require('jsonwebtoken');
      registrationToken = jwt.sign({
        consultationId: id,
        email: consultation.email,
        name: consultation.full_name,
        type: 'client_registration',
        package_tier: package_tier,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      }, process.env.JWT_SECRET);

      tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Update consultation request with payment verification
    const updateData = {
      payment_verified,
      payment_method,
      payment_amount,
      payment_reference,
      package_tier,
      payment_verification_date: payment_verified ? new Date().toISOString() : null,
      registration_token: registrationToken,
      token_expires_at: tokenExpiresAt,
      token_used: false,
      status: payment_verified ? 'payment_verified' : consultation.status,
      verified_by: adminId,
      admin_notes: admin_notes,
      updated_at: new Date().toISOString()
    };

    const { data: updatedConsultation, error: updateError } = await supabaseAdmin
      .from('consultation_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment verification:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to verify payment',
        code: 'UPDATE_ERROR'
      });
    }

    // Send payment verification email to client
    if (payment_verified && registrationToken) {
      try {
        const registrationUrl = `${process.env.FRONTEND_URL}/register?token=${registrationToken}`;
        await sendEmail(consultation.email, 'payment_verified_registration', {
          client_name: consultation.full_name,
          payment_amount: payment_amount,
          payment_method: payment_method,
          package_tier: package_tier,
          registration_url: registrationUrl,
          token_expiry: '7 days',
          admin_name: admin.full_name,
          next_steps: 'Click the registration link to create your account and begin your onboarding process.'
        });
      } catch (emailError) {
        console.error('Failed to send payment verification email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      consultation_request: {
        id: updatedConsultation.id,
        status: updatedConsultation.status,
        payment_verified: updatedConsultation.payment_verified,
        payment_verification_date: updatedConsultation.payment_verification_date,
        registration_token: registrationToken ? 'Generated' : null
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to verify payment',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/admin/clients/:id - Get client with onboarding data (PROTECTED - ADMIN)
router.get('/admin/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId || req.user.id;

    // Verify admin permissions - check admins table where admin is stored
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, role')
      .eq('id', adminId)
      .eq('role', 'admin')
      .single();

    if (adminError || !admin) {
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get client with all onboarding data
    const { data: client, error: clientError } = await supabaseAdmin
      .from('registered_users')
      .select(`
        id, full_name, email, phone, profile_picture, linkedin_url,
        onboarding_completed, profile_unlocked, onboarding_completion_date, profile_unlock_date,
        onboarding_current_position, onboarding_years_experience, onboarding_education_level,
        onboarding_target_roles, onboarding_target_industries, onboarding_career_timeline,
        onboarding_current_salary, onboarding_target_salary, onboarding_benefits_priorities,
        onboarding_work_arrangement, onboarding_company_size, onboarding_work_culture,
        onboarding_current_location, onboarding_willing_to_relocate, onboarding_preferred_locations,
        onboarding_key_skills, onboarding_skill_gaps, onboarding_learning_goals,
        onboarding_application_volume, onboarding_success_metrics,
        package_tier, created_at, updated_at
      `)
      .eq('id', id)
      .eq('role', 'client')
      .single();

    if (clientError || !client) {
      return res.status(404).json({ 
        success: false,
        error: 'Client not found',
        code: 'CLIENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      client: client
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch client data',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/user/profile - User profile check for Discovery Mode (PROTECTED - CLIENT)
router.get('/user/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Get user profile with onboarding status
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select(`
        id, full_name, email, role,
        onboarding_completed, profile_unlocked,
        onboarding_completion_date, profile_unlock_date
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      profile: user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user profile',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;