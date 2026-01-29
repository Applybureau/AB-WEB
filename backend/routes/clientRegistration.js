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

    if (decoded.type !== 'registration') {
      return res.status(400).json({ 
        valid: false, 
        error: 'Invalid token type' 
      });
    }

    // Check user record from registered_users using email from decoded token
    const { data: user, error } = await supabaseAdmin
      .from('registered_users')
      .select('id, full_name, email, token_expires_at, token_used, payment_confirmed, registration_token')
      .eq('email', decoded.email)
      .single();

    if (error || !user) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Token not found' 
      });
    }

    // Verify that the token matches what's stored in the database
    if (user.registration_token !== token) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Token mismatch - please use the token from your email' 
      });
    }

    if (user.token_used) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Token already used' 
      });
    }

    if (!user.payment_confirmed) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Payment not confirmed - registration not available' 
      });
    }

    if (new Date() > new Date(user.token_expires_at)) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Token expired' 
      });
    }

    res.json({
      valid: true,
      client: {
        full_name: user.full_name,
        email: user.email,
        expires_at: user.token_expires_at
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

    if (decoded.type !== 'registration') {
      return res.status(400).json({ error: 'Invalid registration token type' });
    }

    // Get user record from registered_users using email from decoded token
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .eq('email', decoded.email)
      .eq('token_used', false)
      .eq('payment_confirmed', true) // Must have payment confirmed
      .single();

    if (userError || !user) {
      return res.status(400).json({ error: 'Invalid registration token or payment not confirmed' });
    }

    // Verify that the token matches what's stored in the database
    if (user.registration_token !== token) {
      return res.status(400).json({ error: 'Token mismatch - please use the token from your email' });
    }

    // Check if token is expired
    if (new Date() > new Date(user.token_expires_at)) {
      return res.status(400).json({ error: 'Registration token has expired' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user account with password and mark token as used
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update({
        passcode_hash: hashedPassword,
        token_used: true,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user account:', updateError);
      return res.status(500).json({ error: 'Failed to create account' });
    }
    // Generate auth token
    const authToken = jwt.sign({
      userId: updatedUser.id,
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      full_name: updatedUser.full_name,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, process.env.JWT_SECRET);

    // Send welcome email
    try {
      await sendEmail(updatedUser.email, 'client_portal_welcome', {
        client_name: updatedUser.full_name,
        dashboard_url: buildUrl('/client/dashboard'),
        next_steps: 'Complete your onboarding questionnaire to unlock your Application Tracker.',
        login_url: buildUrl('/login')
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    // Create notification
    try {
      await NotificationHelpers.clientRegistrationComplete(updatedUser.id, updatedUser);
    } catch (notificationError) {
      console.error('Failed to create registration notification:', notificationError);
    }

    res.status(201).json({
      message: 'Account created successfully',
      token: authToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        role: updatedUser.role,
        profile_unlocked: updatedUser.profile_unlocked,
        payment_confirmed: updatedUser.payment_confirmed,
        onboarding_completed: updatedUser.onboarding_completed
      },
      next_steps: 'Complete your onboarding questionnaire to unlock your Application Tracker.'
    });
  } catch (error) {
    console.error('Client registration error:', error);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

module.exports = router;