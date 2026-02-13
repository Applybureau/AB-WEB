const express = require('express');
const { supabase, supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireClient } = require('../middleware/auth');
const { validateOnboarding } = require('../utils/zodSchemas');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');

const router = express.Router();

// Apply Zero-Trust authentication
router.use(authenticateToken);

// POST /api/onboarding - Secure 20-Question Onboarding with Zero-Trust Validation
router.post('/', requireClient, validateOnboarding, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    // Log onboarding attempt
    logger.info('Onboarding submission started', { 
      userId, 
      userEmail,
      ip: req.ip 
    });

    // Check if user already completed onboarding (prevent duplicate submissions)
    const { data: existingOnboarding, error: checkError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('id, execution_status, completed_at')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('Error checking existing onboarding', checkError, { userId });
      return res.status(500).json({ 
        error: 'Failed to verify onboarding status',
        code: 'DATABASE_ERROR'
      });
    }

    if (existingOnboarding && existingOnboarding.execution_status === 'active') {
      logger.warn('Duplicate onboarding attempt', { userId, existingId: existingOnboarding.id });
      return res.status(409).json({ 
        error: 'Onboarding already completed and approved',
        code: 'ALREADY_COMPLETED'
      });
    }

    // Verify user exists and has proper permissions using RLS
    const { data: userProfile, error: userError } = await supabase
      .auth.getUser(req.token);

    if (userError || !userProfile.user) {
      logger.error('User verification failed', userError, { userId });
      return res.status(401).json({ 
        error: 'User verification failed',
        code: 'INVALID_USER'
      });
    }

    // Prepare onboarding data (already validated by Zod middleware)
    const onboardingData = {
      user_id: userId,
      ...req.body, // All data is pre-validated and sanitized by Zod
      execution_status: 'pending_approval', // Zero-Trust: requires admin approval
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert/update onboarding data with RLS protection
    const { data: savedOnboarding, error: saveError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .upsert(onboardingData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (saveError) {
      logger.error('Failed to save onboarding data', saveError, { userId });
      return res.status(500).json({ 
        error: 'Failed to save onboarding questionnaire',
        code: 'SAVE_ERROR'
      });
    }

    // Update user profile to mark onboarding as submitted
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        onboarding_submitted: true,
        onboarding_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (profileUpdateError) {
      logger.warn('Failed to update profile onboarding status', profileUpdateError, { userId });
      // Don't fail the request for this non-critical update
    }

    // Send confirmation email to client
    try {
      await sendEmail(userEmail, 'admin_onboarding_review_needed', {
        client_name: userProfile.user.user_metadata?.full_name || 'Client',
        target_roles: Array.isArray(req.body.target_job_titles) 
          ? req.body.target_job_titles.join(', ') 
          : req.body.target_job_titles,
        submission_id: savedOnboarding.id,
        next_steps: 'Your onboarding questionnaire is under review. You will be notified within 24-48 hours once approved.',
        support_email: process.env.SUPPORT_EMAIL || 'support@applybureau.com'
      });
    } catch (emailError) {
      logger.error('Failed to send onboarding confirmation email', emailError, { userId });
      // Don't fail the request for email issues
    }

    // Notify admin of new onboarding submission
    try {
      await sendEmail(
        process.env.ADMIN_EMAIL || 'admin@applybureau.com', 
        'admin_onboarding_review_needed', 
        {
          client_name: userProfile.user.user_metadata?.full_name || 'Client',
          client_email: userEmail,
          submission_id: savedOnboarding.id,
          target_roles: Array.isArray(req.body.target_job_titles) 
            ? req.body.target_job_titles.join(', ') 
            : req.body.target_job_titles,
          years_experience: req.body.years_of_experience,
          timeline: req.body.job_search_timeline,
          admin_review_url: `${process.env.FRONTEND_URL}/admin/onboarding/${savedOnboarding.id}`,
          submission_time: new Date().toLocaleString()
        }
      );
    } catch (emailError) {
      logger.error('Failed to send admin notification email', emailError, { userId });
      // Don't fail the request for email issues
    }

    const processingTime = Date.now() - startTime;
    
    // Log successful onboarding submission
    logger.info('Onboarding submitted successfully', { 
      userId, 
      onboardingId: savedOnboarding.id,
      processingTime: `${processingTime}ms`
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Onboarding questionnaire submitted successfully',
      data: {
        id: savedOnboarding.id,
        execution_status: savedOnboarding.execution_status,
        completed_at: savedOnboarding.completed_at,
        requires_approval: true
      },
      next_steps: 'Your submission is under review. You will be notified once approved.',
      processing_time: `${processingTime}ms`
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('Onboarding submission failed', error, { 
      userId: req.user?.id,
      processingTime: `${processingTime}ms`
    });
    
    res.status(500).json({ 
      error: 'Failed to submit onboarding questionnaire',
      code: 'INTERNAL_ERROR',
      processing_time: `${processingTime}ms`
    });
  }
});

// GET /api/onboarding/status - Get onboarding status with Zero-Trust verification
router.get('/status', requireClient, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get onboarding status using RLS-protected query
    const { data: onboarding, error: onboardingError } = await supabase
      .from('client_onboarding_20q')
      .select('id, execution_status, completed_at, approved_at, approved_by')
      .eq('user_id', userId)
      .single();

    if (onboardingError && onboardingError.code !== 'PGRST116') {
      logger.error('Error fetching onboarding status', onboardingError, { userId });
      return res.status(500).json({ 
        error: 'Failed to fetch onboarding status',
        code: 'DATABASE_ERROR'
      });
    }

    // Get user profile status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_unlocked, onboarding_submitted, onboarding_submitted_at')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.error('Error fetching profile status', profileError, { userId });
      return res.status(500).json({ 
        error: 'Failed to fetch profile status',
        code: 'DATABASE_ERROR'
      });
    }

    // Determine current status and next steps
    let status = 'not_started';
    let next_steps = 'Please complete your 20-question onboarding questionnaire.';
    let can_access_tracker = false;

    if (onboarding) {
      switch (onboarding.execution_status) {
        case 'pending_approval':
          status = 'pending_review';
          next_steps = 'Your onboarding is under review. You will be notified once approved.';
          break;
        case 'active':
          status = 'approved';
          next_steps = 'Your onboarding is approved! You can now access the Application Tracker.';
          can_access_tracker = profile?.profile_unlocked || false;
          break;
        case 'rejected':
          status = 'rejected';
          next_steps = 'Your onboarding was not approved. Please contact support for assistance.';
          break;
        default:
          status = 'unknown';
          next_steps = 'Please contact support for assistance.';
      }
    }

    res.json({
      status,
      onboarding: onboarding ? {
        id: onboarding.id,
        execution_status: onboarding.execution_status,
        completed_at: onboarding.completed_at,
        approved_at: onboarding.approved_at
      } : null,
      profile: {
        profile_unlocked: profile?.profile_unlocked || false,
        onboarding_submitted: profile?.onboarding_submitted || false,
        onboarding_submitted_at: profile?.onboarding_submitted_at
      },
      can_access_tracker,
      next_steps
    });

  } catch (error) {
    logger.error('Error fetching onboarding status', error, { userId: req.user?.id });
    res.status(500).json({ 
      error: 'Failed to fetch onboarding status',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;