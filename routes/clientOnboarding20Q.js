const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const { authenticateToken } = require('../utils/auth');
const { NotificationHelpers } = require('../utils/notifications');

const router = express.Router();

// Apply authentication middleware
router.use(authenticateToken);

// Middleware to ensure user is a client
const requireClient = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Access denied. Client role required.' });
  }
  next();
};

// GET /api/client/onboarding-20q/status - Get onboarding status (CONCIERGE MODEL)
router.get('/status', requireClient, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user profile status
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('profile_unlocked, payment_confirmed, onboarding_completed')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return res.status(500).json({ error: 'Failed to fetch user status' });
    }

    // Get onboarding record if exists
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('execution_status, approved_by, approved_at, completed_at')
      .eq('user_id', userId)
      .single();

    // Determine next steps based on status
    let next_steps = '';
    let can_access_tracker = false;
    let show_discovery_mode = false;

    if (!user.payment_confirmed) {
      next_steps = 'Payment confirmation pending. Please contact support.';
      show_discovery_mode = true;
    } else if (!onboarding) {
      next_steps = 'Please complete your 20-question onboarding questionnaire.';
      show_discovery_mode = true;
    } else if (onboarding.execution_status === 'pending_approval') {
      next_steps = 'Your onboarding is under review. You will be notified when approved.';
      show_discovery_mode = true;
    } else if (onboarding.execution_status === 'active' && user.profile_unlocked) {
      next_steps = 'Your profile is active! You can now access the Application Tracker.';
      can_access_tracker = true;
      show_discovery_mode = false;
    }

    res.json({
      user: {
        profile_unlocked: user.profile_unlocked,
        payment_confirmed: user.payment_confirmed,
        onboarding_completed: user.onboarding_completed
      },
      onboarding: onboarding ? {
        execution_status: onboarding.execution_status,
        approved_by: onboarding.approved_by,
        approved_at: onboarding.approved_at,
        completed_at: onboarding.completed_at
      } : null,
      can_access_tracker,
      show_discovery_mode,
      next_steps
    });
  } catch (error) {
    console.error('Onboarding status error:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding status' });
  }
});

// POST /api/client/onboarding-20q/questionnaire - Submit 20-question onboarding (CONCIERGE MODEL)
router.post('/questionnaire', requireClient, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      // Role Targeting (Questions 1-5)
      target_job_titles,
      target_industries,
      target_company_sizes,
      target_locations,
      remote_work_preference,
      
      // Compensation Guardrails (Questions 6-8)
      current_salary_range,
      target_salary_range,
      salary_negotiation_comfort,
      
      // Experience & Skills (Questions 9-12)
      years_of_experience,
      key_technical_skills,
      soft_skills_strengths,
      certifications_licenses,
      
      // Job Search Strategy (Questions 13-16)
      job_search_timeline,
      application_volume_preference,
      networking_comfort_level,
      interview_confidence_level,
      
      // Career Goals & Challenges (Questions 17-20)
      career_goals_short_term,
      career_goals_long_term,
      biggest_career_challenges,
      support_areas_needed
    } = req.body;

    // Validate required fields (20-question model)
    const requiredFields = {
      target_job_titles: 'Target job titles',
      target_industries: 'Target industries',
      target_locations: 'Target locations',
      target_salary_range: 'Target salary range',
      years_of_experience: 'Years of experience',
      key_technical_skills: 'Key technical skills',
      job_search_timeline: 'Job search timeline',
      career_goals_short_term: 'Short-term career goals',
      biggest_career_challenges: 'Biggest career challenges',
      support_areas_needed: 'Support areas needed'
    };

    const missingFields = [];
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!req.body[field] || (Array.isArray(req.body[field]) && req.body[field].length === 0)) {
        missingFields.push(label);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Validate numeric fields
    if (isNaN(years_of_experience) || years_of_experience < 0) {
      return res.status(400).json({ error: 'Years of experience must be a valid number' });
    }

    if (salary_negotiation_comfort && (isNaN(salary_negotiation_comfort) || salary_negotiation_comfort < 1 || salary_negotiation_comfort > 10)) {
      return res.status(400).json({ error: 'Salary negotiation comfort must be between 1 and 10' });
    }

    if (networking_comfort_level && (isNaN(networking_comfort_level) || networking_comfort_level < 1 || networking_comfort_level > 10)) {
      return res.status(400).json({ error: 'Networking comfort level must be between 1 and 10' });
    }

    if (interview_confidence_level && (isNaN(interview_confidence_level) || interview_confidence_level < 1 || interview_confidence_level > 10)) {
      return res.status(400).json({ error: 'Interview confidence level must be between 1 and 10' });
    }

    // Create onboarding record (PENDING ADMIN APPROVAL)
    const onboardingData = {
      user_id: userId,
      
      // Role Targeting (Questions 1-5)
      target_job_titles: Array.isArray(target_job_titles) ? target_job_titles : [target_job_titles],
      target_industries: Array.isArray(target_industries) ? target_industries : [target_industries],
      target_company_sizes: Array.isArray(target_company_sizes) ? target_company_sizes : [],
      target_locations: Array.isArray(target_locations) ? target_locations : [target_locations],
      remote_work_preference: remote_work_preference || 'hybrid',
      
      // Compensation Guardrails (Questions 6-8)
      current_salary_range,
      target_salary_range,
      salary_negotiation_comfort: parseInt(salary_negotiation_comfort) || 5,
      
      // Experience & Skills (Questions 9-12)
      years_of_experience: parseInt(years_of_experience),
      key_technical_skills: Array.isArray(key_technical_skills) ? key_technical_skills : [key_technical_skills],
      soft_skills_strengths: Array.isArray(soft_skills_strengths) ? soft_skills_strengths : [],
      certifications_licenses: Array.isArray(certifications_licenses) ? certifications_licenses : [],
      
      // Job Search Strategy (Questions 13-16)
      job_search_timeline,
      application_volume_preference: application_volume_preference || 'quality_focused',
      networking_comfort_level: parseInt(networking_comfort_level) || 5,
      interview_confidence_level: parseInt(interview_confidence_level) || 5,
      
      // Career Goals & Challenges (Questions 17-20)
      career_goals_short_term,
      career_goals_long_term,
      biggest_career_challenges: Array.isArray(biggest_career_challenges) ? biggest_career_challenges : [biggest_career_challenges],
      support_areas_needed: Array.isArray(support_areas_needed) ? support_areas_needed : [support_areas_needed],
      
      // Admin Approval System (CONCIERGE MODEL)
      execution_status: 'pending_approval', // Requires admin approval to activate
      completed_at: new Date().toISOString()
    };

    // Insert onboarding data
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .upsert(onboardingData, { onConflict: 'user_id' })
      .select()
      .single();

    if (onboardingError) {
      console.error('Error saving onboarding data:', onboardingError);
      return res.status(500).json({ error: 'Failed to save onboarding questionnaire' });
    }

    // Send submission confirmation to client
    try {
      await sendEmail(req.user.email, 'onboarding_submitted_pending_approval', {
        client_name: req.user.full_name || 'Client',
        target_roles: Array.isArray(target_job_titles) ? target_job_titles.join(', ') : target_job_titles,
        target_industries: Array.isArray(target_industries) ? target_industries.join(', ') : target_industries,
        job_search_timeline,
        next_steps: 'Your onboarding questionnaire is under review. You will be notified when your profile is approved and the Application Tracker is unlocked.',
        message: 'Thank you for completing your detailed onboarding questionnaire. Our team will review your responses and activate your profile shortly.'
      });
    } catch (emailError) {
      console.error('Failed to send onboarding submission email:', emailError);
    }

    // Notify admin of completed onboarding (REQUIRES APPROVAL)
    try {
      await sendEmail('admin@applybureau.com', 'onboarding_completed_needs_approval', {
        client_name: req.user.full_name || 'Client',
        client_email: req.user.email,
        onboarding_id: onboarding.id,
        target_roles: Array.isArray(target_job_titles) ? target_job_titles.join(', ') : target_job_titles,
        target_industries: Array.isArray(target_industries) ? target_industries.join(', ') : target_industries,
        years_experience: years_of_experience,
        job_search_timeline,
        career_goals: career_goals_short_term,
        admin_approval_url: `${process.env.FRONTEND_URL}/admin/onboarding/${onboarding.id}/approve`,
        admin_dashboard_url: `${process.env.FRONTEND_URL}/admin/dashboard`
      });
    } catch (emailError) {
      console.error('Failed to send admin onboarding notification:', emailError);
    }

    // Create admin notification
    try {
      await NotificationHelpers.onboardingCompletedNeedsApproval(userId, onboarding);
    } catch (notificationError) {
      console.error('Failed to create onboarding notification:', notificationError);
    }

    res.status(201).json({
      message: 'Onboarding questionnaire submitted successfully',
      onboarding: {
        id: onboarding.id,
        execution_status: onboarding.execution_status,
        completed_at: onboarding.completed_at
      },
      next_steps: 'Your onboarding is under review. You will be notified when your profile is approved.',
      requires_admin_approval: true,
      can_access_tracker: false
    });
  } catch (error) {
    console.error('Submit onboarding questionnaire error:', error);
    res.status(500).json({ error: 'Failed to submit onboarding questionnaire' });
  }
});

// GET /api/client/onboarding-20q/questionnaire - Get existing questionnaire data
router.get('/questionnaire', requireClient, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get onboarding record
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (onboardingError && onboardingError.code !== 'PGRST116') {
      console.error('Error fetching onboarding data:', onboardingError);
      return res.status(500).json({ error: 'Failed to fetch onboarding data' });
    }

    if (!onboarding) {
      return res.status(404).json({ error: 'No onboarding questionnaire found' });
    }

    res.json({
      onboarding: {
        ...onboarding,
        // Don't expose sensitive admin fields to client
        approved_by: undefined,
        admin_notes: undefined
      }
    });
  } catch (error) {
    console.error('Get onboarding questionnaire error:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding questionnaire' });
  }
});

module.exports = router;