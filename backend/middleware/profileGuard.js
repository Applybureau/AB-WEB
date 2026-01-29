const { supabaseAdmin } = require('../utils/supabase');

// Middleware to check if client profile is unlocked (CONCIERGE GATEKEEPER)
const isProfileUnlocked = async (req, res, next) => {
  try {
    // Only apply to clients
    if (req.user.role !== 'client') {
      return next();
    }

    const userId = req.user.id;

    // Get user profile status from clients table (primary source)
    const { data: user, error: userError } = await supabaseAdmin
      .from('clients')
      .select('profile_unlocked, payment_verified, is_active, onboarding_complete')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error checking profile status:', userError);
      return res.status(500).json({ error: 'Failed to verify profile status' });
    }

    // Check if profile is unlocked
    if (!user.profile_unlocked) {
      return res.status(403).json({
        error: 'Profile locked',
        message: 'Your profile is currently locked. Please complete onboarding and wait for admin approval.',
        discovery_mode: true,
        next_steps: user.payment_verified 
          ? 'Complete your onboarding questionnaire and wait for approval.'
          : 'Payment confirmation pending. Please contact support.'
      });
    }

    // Get onboarding execution status (if exists)
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('execution_status')
      .eq('user_id', userId)
      .single();

    // If onboarding doesn't exist or isn't active, but profile is unlocked, allow access
    if (onboardingError || !onboarding) {
      console.log('No onboarding record found, but profile is unlocked - allowing access');
      return next();
    }

    if (onboarding.execution_status !== 'active') {
      return res.status(403).json({
        error: 'Profile not active',
        message: 'Your onboarding is not yet approved. Please wait for admin approval.',
        discovery_mode: true,
        execution_status: onboarding?.execution_status || 'not_started',
        next_steps: 'Your onboarding questionnaire is under review. You will be notified when approved.'
      });
    }

    // Profile is unlocked and active - proceed
    next();
  } catch (error) {
    console.error('Profile unlock check error:', error);
    res.status(500).json({ error: 'Failed to verify profile access' });
  }
};

// Middleware to show discovery mode banner for locked profiles
const discoveryModeInfo = async (req, res, next) => {
  try {
    // Only apply to clients
    if (req.user.role !== 'client') {
      return next();
    }

    const userId = req.user.id;

    // Get profile status from clients table (primary source)
    const { data: user, error: userError } = await supabaseAdmin
      .from('clients')
      .select('profile_unlocked, payment_verified, is_active, onboarding_complete')
      .eq('id', userId)
      .single();

    if (userError) {
      req.discoveryMode = { error: 'Unable to check profile status' };
      return next();
    }

    // Get onboarding status
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('execution_status, completed_at')
      .eq('user_id', userId)
      .single();

    // Determine discovery mode status
    let discoveryMode = {
      active: false,
      message: '',
      next_steps: ''
    };

    if (!user.payment_verified) {
      discoveryMode = {
        active: true,
        message: 'Payment Confirmation Pending',
        next_steps: 'Please contact support to confirm your payment.',
        status: 'payment_pending'
      };
    } else if (!onboarding || !onboarding.completed_at) {
      discoveryMode = {
        active: true,
        message: 'Onboarding Required',
        next_steps: 'Please complete your 20-question onboarding questionnaire.',
        status: 'onboarding_required'
      };
    } else if (onboarding.execution_status === 'pending_approval') {
      discoveryMode = {
        active: true,
        message: 'Onboarding Under Review',
        next_steps: 'Your questionnaire is being reviewed. You will be notified when approved.',
        status: 'pending_approval'
      };
    } else if (!user.profile_unlocked || onboarding.execution_status !== 'active') {
      discoveryMode = {
        active: true,
        message: 'Profile Activation Pending',
        next_steps: 'Your profile is being activated. Please wait for confirmation.',
        status: 'activation_pending'
      };
    }

    req.discoveryMode = discoveryMode;
    next();
  } catch (error) {
    console.error('Discovery mode check error:', error);
    req.discoveryMode = { error: 'Unable to determine profile status' };
    next();
  }
};

module.exports = {
  isProfileUnlocked,
  discoveryModeInfo
};