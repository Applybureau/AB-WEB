const express = require('express');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail, buildUrl } = require('../utils/email');
const { NotificationHelpers } = require('../utils/notifications');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

// GET /api/client-registration/validate-token/:token - Validate registration token (PUBLIC)
router.get('/validate-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token format
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Invalid or expired token' 
      });
    }

    if (decoded.type !== 'client_registration') {
      return res.status(400).json({ 
        valid: false, 
        error: 'Invalid token type' 
      });
    }

    // Check consultation request
    const { data: consultation, error } = await supabaseAdmin
      .from('consultation_requests')
      .select('id, full_name, email, token_expires_at, token_used, payment_received, selected_tier')
      .eq('id', decoded.consultationId)
      .eq('registration_token', token)
      .single();

    if (error || !consultation) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Token not found' 
      });
    }

    if (consultation.token_used) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Token already used' 
      });
    }

    if (!consultation.payment_received) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Payment not received - registration not available' 
      });
    }

    if (new Date() > new Date(consultation.token_expires_at)) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Token expired' 
      });
    }

    res.json({
      valid: true,
      consultation: {
        full_name: consultation.full_name,
        email: consultation.email,
        selected_tier: consultation.selected_tier,
        expires_at: consultation.token_expires_at
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ 
      valid: false, 
      error: 'Failed to validate token' 
    });
  }
});

// POST /api/client-registration/register - Client registration using payment token (PUBLIC)
router.post('/register', async (req, res) => {
  try {
    const { token, password, confirm_password } = req.body;

    if (!token || !password || !confirm_password) {
      return res.status(400).json({ 
        error: 'Registration token, password, and password confirmation are required' 
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    // Verify registration token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({ error: 'Invalid or expired registration token' });
    }

    if (decoded.type !== 'client_registration') {
      return res.status(400).json({ error: 'Invalid registration token type' });
    }

    // Get consultation request
    const { data: consultation, error: consultationError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('id', decoded.consultationId)
      .eq('registration_token', token)
      .eq('token_used', false)
      .eq('payment_received', true) // Must have payment
      .single();

    if (consultationError || !consultation) {
      return res.status(400).json({ error: 'Invalid registration token or payment not received' });
    }

    // Check if token is expired
    if (new Date() > new Date(consultation.token_expires_at)) {
      return res.status(400).json({ error: 'Registration token has expired' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create client account
    const { data: client, error: clientError } = await supabaseAdmin
      .from('registered_users')
      .insert({
        lead_id: consultation.id,
        email: consultation.email,
        passcode_hash: hashedPassword,
        full_name: consultation.full_name,
        role: 'client',
        is_active: true,
        tier: consultation.selected_tier,
        payment_received: true,
        onboarding_completed: false
      })
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client account:', clientError);
      return res.status(500).json({ error: 'Failed to create client account' });
    }

    // Update consultation request
    await supabaseAdmin
      .from('consultation_requests')
      .update({
        status: 'registered',
        workflow_stage: 'client_registered_awaiting_onboarding',
        registered_at: new Date().toISOString(),
        user_id: client.id,
        token_used: true
      })
      .eq('id', consultation.id);

    // Generate auth token
    const authToken = jwt.sign({
      userId: client.id,
      email: client.email,
      role: client.role,
      tier: client.tier,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, process.env.JWT_SECRET);

    // Send welcome email
    try {
      await sendEmail(client.email, 'client_portal_welcome', {
        client_name: client.full_name,
        selected_tier: consultation.selected_tier || 'Your selected package',
        dashboard_url: buildUrl('/client/dashboard'),
        onboarding_url: buildUrl('/client/onboarding'),
        next_steps: 'Complete your onboarding questionnaire to unlock all features and schedule your strategy call.',
        support_email: 'support@applybureau.com',
        portal_features: [
          'Complete onboarding questionnaire',
          'Upload your resume and documents',
          'Provide job-search email credentials',
          'Schedule your Strategy & Role Alignment Call'
        ]
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Create welcome notification
    try {
      await NotificationHelpers.clientRegistrationComplete(client.id, consultation);
    } catch (notificationError) {
      console.error('Failed to create welcome notification:', notificationError);
    }

    res.status(201).json({
      message: 'Registration completed successfully',
      token: authToken,
      user: {
        id: client.id,
        email: client.email,
        full_name: client.full_name,
        role: client.role,
        tier: client.tier,
        onboarding_completed: false
      },
      redirect_to: '/client/onboarding'
    });
  } catch (error) {
    console.error('Client registration error:', error);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

module.exports = router;