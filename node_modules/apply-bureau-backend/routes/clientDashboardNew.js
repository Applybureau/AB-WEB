const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireClient } = require('../middleware/auth');
const logger = require('../utils/logger');
const ClientDashboardController = require('../controllers/clientDashboardController');

const router = express.Router();

// All routes require authentication and client role
router.use(authenticateToken);
router.use(requireClient);

// ============================================
// MAIN DASHBOARD ENDPOINT
// ============================================

// GET /api/client/dashboard - Complete dashboard overview
router.get('/', async (req, res) => {
  try {
    const clientId = req.user.id;

    // Get client profile
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get 20 Questions onboarding status
    const { data: onboarding } = await supabaseAdmin
      .from('client_onboarding')
      .select('*')
      .eq('client_id', clientId)
      .single();

    // Get strategy call status
    const { data: strategyCalls } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    const latestStrategyCall = strategyCalls?.[0] || null;

    // Get file uploads
    const { data: files } = await supabaseAdmin
      .from('client_files')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Get applications
    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select('id, status')
      .eq('client_id', clientId);

    // Get subscription
    const { data: subscription } = await supabaseAdmin
      .from('client_subscriptions')
      .select(`
        *,
        subscription_plans (
          plan_name,
          tier,
          price_cad,
          duration_weeks,
          applications_per_week,
          features
        )
      `)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .single();

    // Calculate status
    const hasCompletedOnboarding = onboarding?.submitted_at !== null;
    const onboardingApproved = onboarding?.status === 'active';
    const hasConfirmedStrategyCall = latestStrategyCall?.admin_status === 'confirmed';
    
    let overallStatus = 'onboarding_in_progress';
    let statusMessage = 'Complete your onboarding to get started';
    
    if (!latestStrategyCall) {
      statusMessage = 'Book your strategy call to begin';
    } else if (latestStrategyCall.admin_status === 'pending') {
      statusMessage = 'Strategy call requested. Waiting for confirmation.';
    } else if (hasConfirmedStrategyCall && !hasCompletedOnboarding) {
      statusMessage = 'Strategy call confirmed. Complete your 20 Questions assessment.';
    } else if (hasCompletedOnboarding && !onboardingApproved) {
      statusMessage = 'Assessment submitted. Our team is reviewing your information.';
      overallStatus = 'onboarding_review';
    } else if (onboardingApproved) {
      statusMessage = 'Your account is active';
      overallStatus = 'active';
    }

    // Calculate progress
    let progressPercentage = 0;
    if (client.profile_unlocked) progressPercentage += 20;
    if (files?.some(f => f.file_type === 'resume')) progressPercentage += 15;
    if (files?.some(f => f.file_type === 'linkedin')) progressPercentage += 10;
    if (hasCompletedOnboarding) progressPercentage += 30;
    if (latestStrategyCall) progressPercentage += 15;
    if (hasConfirmedStrategyCall) progressPercentage += 10;

    // Format 20 Questions status
    const twentyQuestionsStatus = format20QStatus(onboarding);

    // Format strategy call status
    const strategyCallStatus = {
      has_booked: latestStrategyCall !== null,
      has_confirmed: hasConfirmedStrategyCall,
      latest_status: latestStrategyCall?.admin_status || null,
      scheduled_time: latestStrategyCall?.confirmed_time || null,
      meeting_link: latestStrategyCall?.meeting_link || null
    };

    // Format files
    const resumeFile = files?.find(f => f.file_type === 'resume');
    const linkedinFile = files?.find(f => f.file_type === 'linkedin');
    const portfolioFiles = files?.filter(f => f.file_type === 'portfolio') || [];

    const filesStatus = {
      resume_uploaded: !!resumeFile,
      linkedin_added: !!linkedinFile,
      portfolio_added: portfolioFiles.length > 0,
      files: files?.map(f => ({
        id: f.id,
        type: f.file_type,
        filename: f.filename,
        url: f.file_url || f.url,
        size: f.file_size,
        uploaded_at: f.uploaded_at
      })) || []
    };

    // Format applications
    const applicationStats = {
      total_count: applications?.length || 0,
      active_count: applications?.filter(a => 
        ['applied', 'interview'].includes(a.status)
      ).length || 0,
      interview_count: applications?.filter(a => a.status === 'interview').length || 0,
      offer_count: applications?.filter(a => a.status === 'offer').length || 0,
      can_view: overallStatus === 'active'
    };

    // Format subscription
    let subscriptionData = null;
    if (subscription && subscription.subscription_plans) {
      const plan = subscription.subscription_plans;
      subscriptionData = {
        plan_name: plan.plan_name,
        price: `$${plan.price_cad} CAD`,
        duration: `${plan.duration_weeks} weeks`,
        applications: plan.applications_per_week,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        features: plan.features || []
      };
    }

    // Generate next steps
    const nextSteps = generateNextSteps({
      hasStrategyCall: !!latestStrategyCall,
      strategyCallConfirmed: hasConfirmedStrategyCall,
      onboardingCompleted: hasCompletedOnboarding,
      onboardingApproved,
      hasResume: !!resumeFile,
      hasLinkedIn: !!linkedinFile,
      overallStatus
    });

    res.json({
      client: {
        id: client.id,
        full_name: client.full_name,
        email: client.email,
        profile_unlocked: client.profile_unlocked,
        payment_confirmed: client.payment_confirmed || client.payment_verified,
        onboarding_completed: client.onboarding_completed || hasCompletedOnboarding
      },
      status: {
        overall_status: overallStatus,
        message: statusMessage,
        progress_percentage: Math.min(progressPercentage, 100),
        can_view_applications: overallStatus === 'active',
        next_action: nextSteps[0]?.action || null
      },
      twenty_questions: twentyQuestionsStatus,
      strategy_call: strategyCallStatus,
      onboarding: {
        completed: hasCompletedOnboarding,
        approved: onboardingApproved,
        execution_status: onboarding?.status || 'not_started'
      },
      files: filesStatus,
      applications: applicationStats,
      subscription: subscriptionData,
      next_steps: nextSteps
    });

  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// ============================================
// PROGRESS ANALYTICS
// ============================================

// GET /api/client/dashboard/progress - Get comprehensive progress analytics
router.get('/progress', ClientDashboardController.getProgressTracking);

// ============================================
// 20 QUESTIONS ASSESSMENT
// ============================================

// GET /api/client/onboarding/status - Get 20Q status
router.get('/onboarding/status', async (req, res) => {
  try {
    const clientId = req.user.id;

    const { data: onboarding } = await supabaseAdmin
      .from('client_onboarding')
      .select('*')
      .eq('client_id', clientId)
      .single();

    const status = format20QStatus(onboarding);
    res.json(status);

  } catch (error) {
    logger.error('Onboarding status error:', error);
    res.status(500).json({ error: 'Failed to get onboarding status' });
  }
});

// POST /api/client/onboarding/submit - Submit 20Q assessment
router.post('/onboarding/submit', async (req, res) => {
  try {
    const clientId = req.user.id;
    const answers = req.body;

    // Validate required questions
    if (!answers.q1 || !answers.q4 || !answers.q8) {
      return res.status(400).json({ 
        error: 'Missing required questions (q1, q4, q8)' 
      });
    }

    // Check if already submitted
    const { data: existing } = await supabaseAdmin
      .from('client_onboarding')
      .select('id')
      .eq('client_id', clientId)
      .single();

    if (existing) {
      return res.status(400).json({ 
        error: 'Assessment already submitted' 
      });
    }

    // Insert onboarding record
    const { data: onboarding, error } = await supabaseAdmin
      .from('client_onboarding')
      .insert({
        client_id: clientId,
        ...answers,
        status: 'pending_approval',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Onboarding submission error:', error);
      return res.status(500).json({ error: 'Failed to submit assessment' });
    }

    // Update client record
    await supabaseAdmin
      .from('clients')
      .update({ 
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    res.json({
      success: true,
      message: 'Assessment submitted successfully',
      status: 'pending_approval'
    });

  } catch (error) {
    logger.error('Onboarding submission error:', error);
    res.status(500).json({ error: 'Failed to submit assessment' });
  }
});

// ============================================
// FILE UPLOADS
// ============================================

// GET /api/client/uploads/status - Get upload status
router.get('/uploads/status', async (req, res) => {
  try {
    const clientId = req.user.id;

    const { data: files } = await supabaseAdmin
      .from('client_files')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const resumeFile = files?.find(f => f.file_type === 'resume');
    const linkedinFile = files?.find(f => f.file_type === 'linkedin');
    const portfolioFiles = files?.filter(f => f.file_type === 'portfolio') || [];

    res.json({
      resume_uploaded: !!resumeFile,
      linkedin_added: !!linkedinFile,
      portfolio_added: portfolioFiles.length > 0,
      files: files?.map(f => ({
        id: f.id,
        type: f.file_type,
        filename: f.filename,
        url: f.file_url || f.url,
        size: f.file_size,
        uploaded_at: f.uploaded_at,
        added_at: f.created_at
      })) || []
    });

  } catch (error) {
    logger.error('Upload status error:', error);
    res.status(500).json({ error: 'Failed to get upload status' });
  }
});

// ============================================
// APPLICATIONS
// ============================================

// GET /api/applications/stats - Get application statistics
router.get('/applications/stats', async (req, res) => {
  try {
    const clientId = req.user.id;

    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select('id, status')
      .eq('client_id', clientId);

    const statusCounts = {
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0
    };

    applications?.forEach(app => {
      if (statusCounts.hasOwnProperty(app.status)) {
        statusCounts[app.status]++;
      }
    });

    res.json({
      total_count: applications?.length || 0,
      active_count: statusCounts.applied + statusCounts.interview,
      interview_count: statusCounts.interview,
      offer_count: statusCounts.offer,
      status_counts: statusCounts
    });

  } catch (error) {
    logger.error('Application stats error:', error);
    res.status(500).json({ error: 'Failed to get application stats' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function format20QStatus(onboarding) {
  if (!onboarding) {
    return {
      status: 'not_started',
      display_status: 'Not Yet Started',
      description: 'Complete your 20-question career assessment',
      color: 'gray',
      progress: 0,
      completed_at: null,
      approved_at: null,
      can_edit: true,
      target_roles: [],
      target_industries: [],
      experience_years: null,
      job_search_timeline: null
    };
  }

  const statusMap = {
    'pending_approval': {
      display_status: 'Pending Review',
      description: 'Your assessment is being reviewed by our career experts',
      color: 'yellow',
      progress: 75,
      can_edit: false
    },
    'active': {
      display_status: 'Active & Approved',
      description: 'Your career profile is optimized and active',
      color: 'green',
      progress: 100,
      can_edit: true
    },
    'completed': {
      display_status: 'Completed',
      description: 'Assessment completed successfully',
      color: 'blue',
      progress: 100,
      can_edit: false
    }
  };

  const statusInfo = statusMap[onboarding.status] || statusMap['pending_approval'];

  // Extract target roles from q1
  const targetRoles = onboarding.q1 
    ? onboarding.q1.split(',').map(r => r.trim()).filter(r => r)
    : [];

  return {
    status: onboarding.status,
    display_status: statusInfo.display_status,
    description: statusInfo.description,
    color: statusInfo.color,
    progress: statusInfo.progress,
    completed_at: onboarding.submitted_at,
    approved_at: onboarding.approved_at,
    can_edit: statusInfo.can_edit,
    target_roles: targetRoles,
    target_industries: [],
    experience_years: null,
    job_search_timeline: onboarding.q13 || 'Not specified'
  };
}

function generateNextSteps(params) {
  const {
    hasStrategyCall,
    strategyCallConfirmed,
    onboardingCompleted,
    onboardingApproved,
    hasResume,
    hasLinkedIn,
    overallStatus
  } = params;

  const steps = [];

  if (!hasStrategyCall) {
    steps.push({
      title: 'Book Strategy Call',
      description: 'Schedule your strategy call to align your goals and application strategy',
      action: 'book_strategy_call',
      priority: 1
    });
  } else if (!strategyCallConfirmed) {
    steps.push({
      title: 'Strategy Call Confirmation Pending',
      description: 'A lead strategist is reviewing your request',
      action: 'wait_strategy_confirmation',
      priority: 1
    });
  } else if (strategyCallConfirmed && !onboardingCompleted) {
    steps.push({
      title: 'Complete 20 Questions Assessment',
      description: 'Complete your detailed career profiling questionnaire',
      action: 'complete_20q',
      priority: 1
    });
  } else if (onboardingCompleted && !onboardingApproved) {
    steps.push({
      title: 'Assessment Under Review',
      description: 'Our team is reviewing your information',
      action: 'wait_approval',
      priority: 1
    });
  }

  if (!hasResume) {
    steps.push({
      title: 'Upload Resume (Optional)',
      description: 'If you have a resume, upload it here. Otherwise, we will build one together.',
      action: 'upload_resume',
      priority: 2
    });
  }

  if (!hasLinkedIn) {
    steps.push({
      title: 'Add LinkedIn Profile (Optional)',
      description: 'Add your LinkedIn profile for better targeting',
      action: 'add_linkedin',
      priority: 3
    });
  }

  if (overallStatus === 'active') {
    steps.push({
      title: 'View Applications',
      description: 'Track your job applications and interview progress',
      action: 'view_applications',
      priority: 4
    });
  }

  return steps.sort((a, b) => a.priority - b.priority);
}

module.exports = router;
