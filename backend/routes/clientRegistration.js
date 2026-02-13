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
        error: 'Registration link expired',
        message: 'This registration link has expired. Please contact support for a new link.'
      });
    }

    if (decoded.type !== 'registration') {
      return res.status(400).json({ 
        valid: false, 
        error: 'Invalid registration link',
        message: 'This link is not valid for registration. Please use the link from your registration email.'
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
        error: 'Registration link not found',
        message: 'This registration link is not valid. Please contact support.'
      });
    }

    // Verify that the token matches what's stored in the database
    if (user.registration_token !== token) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Registration link mismatch',
        message: 'Please use the registration link from your most recent email.'
      });
    }

    if (user.token_used) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Registration link expired',
        message: 'This registration link has already been used. Your account has been created. Please login instead.',
        redirect_to_login: true
      });
    }

    if (!user.payment_confirmed) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Payment not confirmed',
        message: 'Payment verification is pending. Please contact support.'
      });
    }

    if (new Date() > new Date(user.token_expires_at)) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Registration link expired',
        message: 'This registration link has expired. Please contact support for a new link.'
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
      error: 'Failed to validate registration link',
      message: 'An error occurred while validating your registration link. Please try again or contact support.'
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
      return res.status(400).json({ 
        error: 'Registration link expired',
        message: 'This registration link has expired. Please contact support for a new link.'
      });
    }

    if (decoded.type !== 'registration') {
      return res.status(400).json({ 
        error: 'Invalid registration link',
        message: 'This link is not valid for registration.'
      });
    }

    // Get user record from registered_users using email from decoded token
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .eq('email', decoded.email)
      .eq('payment_confirmed', true) // Must have payment confirmed
      .single();

    if (userError || !user) {
      return res.status(400).json({ 
        error: 'Invalid registration link',
        message: 'This registration link is not valid or payment has not been confirmed.'
      });
    }

    // Check if token has already been used
    if (user.token_used) {
      return res.status(400).json({ 
        error: 'Registration link expired',
        message: 'This registration link has already been used. Your account has been created. Please login instead.',
        redirect_to_login: true
      });
    }

    // Verify that the token matches what's stored in the database
    if (user.registration_token !== token) {
      return res.status(400).json({ 
        error: 'Registration link mismatch',
        message: 'Please use the registration link from your most recent email.'
      });
    }

    // Check if token is expired
    if (new Date() > new Date(user.token_expires_at)) {
      return res.status(400).json({ 
        error: 'Registration link expired',
        message: 'This registration link has expired. Please contact support for a new link.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user account with password and mark token as used (SINGLE USE)
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update({
        passcode_hash: hashedPassword,
        token_used: true, // Mark as used - prevents reuse
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .eq('token_used', false) // Only update if not already used (race condition protection)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user account:', updateError);
      
      // Check if it was already used
      if (updateError.code === 'PGRST116') {
        return res.status(400).json({ 
          error: 'Registration link expired',
          message: 'This registration link has already been used. Please login instead.',
          redirect_to_login: true
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to create account',
        message: 'An error occurred while creating your account. Please try again or contact support.'
      });
    }

    if (!updatedUser) {
      return res.status(400).json({ 
        error: 'Registration link expired',
        message: 'This registration link has already been used. Please login instead.',
        redirect_to_login: true
      });
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

    // Create client record in clients table (for foreign key constraints)
    try {
      const { error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          id: updatedUser.id,
          email: updatedUser.email,
          full_name: updatedUser.full_name,
          role: 'client',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (clientError && clientError.code !== '23505') { // Ignore duplicate key errors
        console.error('Error creating client record:', clientError);
        // Don't fail registration if client record creation fails
      }
    } catch (clientCreationError) {
      console.error('Failed to create client record:', clientCreationError);
      // Don't fail registration
    }

    // Send account created confirmation email (NOT temp password)
    try {
      await sendEmail(updatedUser.email, 'onboarding_completed_secure', {
        client_name: updatedUser.full_name,
        email: updatedUser.email, // Just the email, no password
        dashboard_url: buildUrl('/client/dashboard'),
        login_url: buildUrl('/login'),
        next_steps: 'Log in to your dashboard to complete your onboarding questionnaire.',
        current_year: new Date().getFullYear()
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
    res.status(500).json({ 
      error: 'Failed to complete registration',
      message: 'An error occurred during registration. Please try again or contact support.'
    });
  }
});

module.exports = router;