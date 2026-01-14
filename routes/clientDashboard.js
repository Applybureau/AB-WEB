const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken, requireClient } = require('../utils/auth');

const router = express.Router();

// GET /api/client/dashboard - Get client dashboard data
router.get('/', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;

    // Get client profile
    const { data: client, error: clientError } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get strategy call status
    const { data: strategyCalls, error: strategyError } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    const latestStrategyCall = strategyCalls?.[0] || null;
    const hasConfirmedStrategyCall = strategyCalls?.some(call => call.admin_status === 'confirmed') || false;

    // Get onboarding status
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('user_id', clientId)
      .single();

    const hasCompletedOnboarding = onboarding?.completed_at !== null;
    const onboardingApproved = onboarding?.execution_status === 'active';

    // Get file uploads status
    const hasResume = client.resume_url !== null;
    const hasLinkedIn = client.linkedin_profile_url !== null;
    const hasPortfolio = client.portfolio_urls !== null && client.portfolio_urls.length > 0;

    // Get applications count
    const { data: applications, error: appsError } = await supabaseAdmin
      .from('applications')
      .select('id, status')
      .eq('client_id', clientId);

    const applicationsCount = applications?.length || 0;
    const activeApplications = applications?.filter(app => 
      ['applied', 'in_review', 'interview_requested', 'interview_completed'].includes(app.status)
    ).length || 0;

    // Determine overall status and next steps
    let overallStatus = 'onboarding_in_progress';
    let statusMessage = 'Onboarding in progress. Please book your strategy call to begin.';
    let nextSteps = [];

    if (!latestStrategyCall) {
      nextSteps.push({
        action: 'book_strategy_call',
        title: 'Book Strategy Call',
        description: 'This call aligns your goals, role targets, and application strategy.',
        priority: 1,
        required: true
      });
    } else if (latestStrategyCall.admin_status === 'pending') {
      statusMessage = 'Strategy call requested. Waiting for confirmation.';
      nextSteps.push({
        action: 'wait_strategy_confirmation',
        title: 'Strategy Call Confirmation Pending',
        description: 'A lead strategist is reviewing your request.',
        priority: 1,
        required: false
      });
    } else if (hasConfirmedStrategyCall && !hasCompletedOnboarding) {
      statusMessage = 'Strategy call confirmed. Complete your onboarding questionnaire.';
      nextSteps.push({
        action: 'complete_onboarding',
        title: 'Complete Onboarding Questionnaire',
        description: 'Complete after your strategy call.',
        priority: 1,
        required: true
      });
    } else if (hasCompletedOnboarding && !onboardingApproved) {
      statusMessage = 'Onboarding submitted. Our team is reviewing your information.';
      overallStatus = 'onboarding_review';
    } else if (onboardingApproved) {
      statusMessage = 'Setup complete. Applications are being processed.';
      overallStatus = 'active';
    }

    // Add optional steps
    if (!hasResume) {
      nextSteps.push({
        action: 'upload_resume',
        title: 'Upload Resume (Optional)',
        description: 'If you already have a resume, upload it here. If not, we will build one together.',
        priority: 2,
        required: false
      });
    }

    if (!hasLinkedIn) {
      nextSteps.push({
        action: 'add_linkedin',
        title: 'LinkedIn Profile URL (Optional)',
        description: 'Add your LinkedIn profile for better targeting.',
        priority: 3,
        required: false
      });
    }

    // Always show application tracker (but may be inactive)
    nextSteps.push({
      action: 'view_applications',
      title: 'Application Tracker',
      description: overallStatus === 'active' 
        ? `${applicationsCount} applications submitted, ${activeApplications} active`
        : 'Applications will appear here once we begin applying on your behalf.',
      priority: 4,
      required: false,
      active: overallStatus === 'active'
    });

    res.json({
      client: {
        id: client.id,
        full_name: client.full_name,
        email: client.email,
        profile_unlocked: client.profile_unlocked,
        payment_confirmed: client.payment_confirmed,
        onboarding_completed: client.onboarding_completed
      },
      status: {
        overall_status: overallStatus,
        message: statusMessage,
        progress_percentage: calculateProgressPercentage(
          hasConfirmedStrategyCall,
          hasCompletedOnboarding,
          onboardingApproved
        )
      },
      strategy_call: {
        has_booked: latestStrategyCall !== null,
        has_confirmed: hasConfirmedStrategyCall,
        latest_status: latestStrategyCall?.admin_status || null,
        confirmed_time: latestStrategyCall?.confirmed_time || null,
        meeting_link: latestStrategyCall?.meeting_link || null
      },
      onboarding: {
        completed: hasCompletedOnboarding,
        approved: onboardingApproved,
        execution_status: onboarding?.execution_status || 'not_started',
        completed_at: onboarding?.completed_at || null
      },
      files: {
        resume_uploaded: hasResume,
        linkedin_added: hasLinkedIn,
        portfolio_added: hasPortfolio,
        resume_url: client.resume_url,
        linkedin_url: client.linkedin_profile_url,
        portfolio_urls: client.portfolio_urls || []
      },
      applications: {
        total_count: applicationsCount,
        active_count: activeApplications,
        can_view: overallStatus === 'active'
      },
      next_steps: nextSteps.sort((a, b) => a.priority - b.priority)
    });
  } catch (error) {
    console.error('Client dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// Helper function to calculate progress percentage
function calculateProgressPercentage(hasConfirmedStrategyCall, hasCompletedOnboarding, onboardingApproved) {
  let progress = 0;
  
  if (hasConfirmedStrategyCall) progress += 33;
  if (hasCompletedOnboarding) progress += 33;
  if (onboardingApproved) progress += 34;
  
  return Math.min(progress, 100);
}

// GET /api/client/dashboard/status - Get simplified status for status bar
router.get('/status', authenticateToken, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;

    // Get key status indicators
    const { data: client } = await supabaseAdmin
      .from('registered_users')
      .select('profile_unlocked, onboarding_completed')
      .eq('id', clientId)
      .single();

    const { data: strategyCalls } = await supabaseAdmin
      .from('strategy_calls')
      .select('admin_status')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1);

    const { data: onboarding } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('execution_status')
      .eq('user_id', clientId)
      .single();

    const hasConfirmedStrategyCall = strategyCalls?.[0]?.admin_status === 'confirmed';
    const onboardingApproved = onboarding?.execution_status === 'active';

    let status = 'onboarding_in_progress';
    let message = 'Onboarding in progress. Please book your strategy call to begin.';

    if (!strategyCalls || strategyCalls.length === 0) {
      message = 'Onboarding in progress. Please book your strategy call to begin.';
    } else if (strategyCalls[0]?.admin_status === 'pending') {
      message = 'Strategy call requested. Waiting for confirmation.';
    } else if (hasConfirmedStrategyCall && !client?.onboarding_completed) {
      message = 'Strategy call confirmed. Complete your onboarding questionnaire.';
    } else if (client?.onboarding_completed && !onboardingApproved) {
      message = 'Onboarding submitted. Our team is reviewing your information.';
      status = 'onboarding_review';
    } else if (onboardingApproved) {
      message = 'Setup complete. Applications are being processed.';
      status = 'active';
    }

    res.json({
      status,
      message,
      can_book_strategy_call: !strategyCalls || strategyCalls.length === 0,
      can_complete_onboarding: hasConfirmedStrategyCall && !client?.onboarding_completed,
      can_view_applications: onboardingApproved
    });
  } catch (error) {
    console.error('Dashboard status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

module.exports = router;