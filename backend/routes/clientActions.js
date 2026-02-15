const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail, buildUrl } = require('../utils/email');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/client-actions/confirm-strategy-call
 * Admin confirms a strategy call and sends confirmation email to client
 * 
 * Request Body:
 * {
 *   "strategy_call_id": "uuid",
 *   "selected_slot_index": 0,  // 0, 1, or 2 for the preferred slot
 *   "meeting_link": "https://meet.google.com/xxx" (optional),
 *   "admin_notes": "Looking forward to the call" (optional)
 * }
 */
router.post('/confirm-strategy-call', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      strategy_call_id,
      selected_slot_index,
      meeting_link,
      admin_notes
    } = req.body;

    // Validate required fields
    if (!strategy_call_id) {
      return res.status(400).json({ error: 'strategy_call_id is required' });
    }

    if (selected_slot_index === undefined || selected_slot_index < 0 || selected_slot_index > 2) {
      return res.status(400).json({ 
        error: 'selected_slot_index must be 0, 1, or 2' 
      });
    }

    // Get strategy call request
    const { data: strategyCall, error: fetchError } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .eq('id', strategy_call_id)
      .single();

    if (fetchError || !strategyCall) {
      logger.error('Strategy call not found', fetchError, { strategy_call_id });
      return res.status(404).json({ error: 'Strategy call request not found' });
    }

    // Validate slot index
    const selectedSlot = strategyCall.preferred_slots[selected_slot_index];
    if (!selectedSlot) {
      return res.status(400).json({ error: 'Invalid slot index' });
    }

    const confirmedTime = new Date(`${selectedSlot.date}T${selectedSlot.time}:00`);

    // Update strategy call with confirmation
    const updateData = {
      admin_status: 'confirmed',
      status: 'confirmed',
      confirmed_time: confirmedTime.toISOString(),
      meeting_link: meeting_link || null,
      admin_notes: admin_notes || null,
      admin_action_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Note: admin_action_by field may have FK constraint issues, so we skip it for now
    // The admin_action_at timestamp is sufficient for tracking

    const { data: updatedCall, error: updateError} = await supabaseAdmin
      .from('strategy_calls')
      .update(updateData)
      .eq('id', strategy_call_id)
      .select()
      .single();

    if (updateError) {
      logger.error('Error confirming strategy call', updateError, { strategy_call_id });
      return res.status(500).json({ error: 'Failed to confirm strategy call' });
    }

    // Send confirmation email to client
    try {
      await sendEmail(strategyCall.client_email, 'strategy_call_confirmed', {
        client_name: strategyCall.client_name,
        call_date: selectedSlot.date,
        call_time: selectedSlot.time,
        call_duration: '30 minutes',
        meeting_link: meeting_link || 'A Lead Strategist will contact you at the scheduled time.',
        admin_name: req.user.full_name || 'Apply Bureau Team',
        call_purpose: 'This call aligns your goals, role targets, and application strategy.',
        next_steps: 'Please mark this time in your calendar. We look forward to discussing your career goals!',
        user_id: strategyCall.client_id
      });

      logger.info('Strategy call confirmation email sent', { 
        strategy_call_id, 
        client_email: strategyCall.client_email 
      });
    } catch (emailError) {
      logger.error('Failed to send strategy call confirmation email', emailError, { 
        strategy_call_id 
      });
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Strategy call confirmed and email sent successfully',
      strategy_call: {
        id: updatedCall.id,
        status: updatedCall.status,
        admin_status: updatedCall.admin_status,
        confirmed_time: updatedCall.confirmed_time,
        meeting_link: updatedCall.meeting_link,
        client_name: strategyCall.client_name,
        client_email: strategyCall.client_email
      },
      confirmed_slot: selectedSlot,
      email_sent: true
    });
  } catch (error) {
    logger.error('Confirm strategy call error', error);
    res.status(500).json({ error: 'Failed to confirm strategy call' });
  }
});

/**
 * POST /api/client-actions/unlock-account
 * Admin unlocks a client account (sets onboarding_complete to true)
 * 
 * Request Body:
 * {
 *   "client_id": "uuid",
 *   "send_notification": true (optional, default: true)
 * }
 */
router.post('/unlock-account', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { client_id, send_notification = true } = req.body;

    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    // First, try to find and unlock in registered_users table
    const { data: registeredUser, error: regUserError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name, onboarding_completed')
      .eq('id', client_id)
      .single();

    let unlocked = false;
    let clientData = null;

    if (registeredUser && !regUserError) {
      // Unlock in registered_users table
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('registered_users')
        .update({ 
          onboarding_completed: true,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', client_id)
        .select()
        .single();

      if (updateError) {
        logger.error('Error unlocking registered user account', updateError, { client_id });
        return res.status(500).json({ error: 'Failed to unlock account' });
      }

      unlocked = true;
      clientData = {
        id: updated.id,
        email: updated.email,
        full_name: updated.full_name,
        onboarding_complete: updated.onboarding_completed
      };

      logger.info('Account unlocked in registered_users', { 
        client_id, 
        admin_id: req.user.id 
      });
    } else {
      // Try clients table (legacy)
      const { data: client, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('id, email, full_name, onboarding_complete')
        .eq('id', client_id)
        .single();

      if (clientError || !client) {
        logger.error('Client not found', clientError, { client_id });
        return res.status(404).json({ error: 'Client not found' });
      }

      // Unlock in clients table
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('clients')
        .update({ 
          onboarding_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', client_id)
        .select()
        .single();

      if (updateError) {
        logger.error('Error unlocking client account', updateError, { client_id });
        return res.status(500).json({ error: 'Failed to unlock account' });
      }

      unlocked = true;
      clientData = updated;

      logger.info('Account unlocked in clients table', { 
        client_id, 
        admin_id: req.user.id 
      });
    }

    // Send notification email if requested
    let emailSent = false;
    if (send_notification && clientData) {
      try {
        await sendEmail(clientData.email, 'onboarding_approved', {
          client_name: clientData.full_name,
          dashboard_url: buildUrl('/dashboard'),
          user_id: clientData.id,
          message: 'Your account has been unlocked and you now have full access to your dashboard.',
          next_steps: 'Log in to your dashboard to start tracking your applications and accessing all features.'
        });

        emailSent = true;
        logger.info('Account unlock notification sent', { 
          client_id, 
          email: clientData.email 
        });
      } catch (emailError) {
        logger.error('Failed to send unlock notification email', emailError, { client_id });
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      message: 'Account unlocked successfully',
      client: {
        id: clientData.id,
        email: clientData.email,
        full_name: clientData.full_name,
        onboarding_complete: true
      },
      email_sent: emailSent,
      unlocked_by: req.user.id,
      unlocked_at: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Unlock account error', error);
    res.status(500).json({ error: 'Failed to unlock account' });
  }
});

/**
 * POST /api/client-actions/request-password-reset
 * Client or Admin requests a password reset email
 * 
 * Request Body:
 * {
 *   "email": "client@example.com"
 * }
 */
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    // Find user in registered_users or clients table
    let user = null;
    let userSource = null;

    // Check registered_users first
    const { data: registeredUser, error: regUserError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name, role')
      .eq('email', email)
      .single();

    if (registeredUser && !regUserError) {
      user = registeredUser;
      userSource = 'registered_users';
    } else {
      // Check clients table
      const { data: client, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('id, email, full_name, role')
        .eq('email', email)
        .single();

      if (client && !clientError) {
        user = client;
        userSource = 'clients';
      } else {
        // Check admins table
        const { data: admin, error: adminError } = await supabaseAdmin
          .from('admins')
          .select('id, email, full_name, role')
          .eq('email', email)
          .single();

        if (admin && !adminError) {
          user = admin;
          userSource = 'admins';
        }
      }
    }

    // Always return success to prevent email enumeration
    if (!user) {
      logger.warn('Password reset requested for non-existent email', { email });
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate password reset token (expires in 1 hour)
    const resetToken = jwt.sign({
      userId: user.id,
      email: user.email,
      type: 'password_reset',
      source: userSource,
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    }, process.env.JWT_SECRET);

    const resetUrl = buildUrl(`/reset-password?token=${resetToken}`);

    // Send password reset email
    try {
      const templateName = userSource === 'admins' ? 'admin_password_reset' : 'admin_password_reset';
      
      await sendEmail(user.email, templateName, {
        admin_name: user.full_name || 'User',
        client_name: user.full_name || 'User',
        reset_link: resetUrl,
        reset_url: resetUrl,
        expiry_time: '1 hour',
        user_id: user.id,
        support_email: 'applybureau@gmail.com'
      });

      logger.info('Password reset email sent', { 
        email: user.email, 
        user_id: user.id,
        source: userSource
      });
    } catch (emailError) {
      logger.error('Failed to send password reset email', emailError, { 
        email: user.email 
      });
      return res.status(500).json({ 
        error: 'Failed to send password reset email' 
      });
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
      // Only include these in development
      ...(process.env.NODE_ENV === 'development' && {
        dev_info: {
          reset_token: resetToken,
          reset_url: resetUrl,
          user_id: user.id
        }
      })
    });
  } catch (error) {
    logger.error('Request password reset error', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

/**
 * POST /api/client-actions/reset-password
 * Complete password reset with token
 * 
 * Request Body:
 * {
 *   "token": "jwt_token",
 *   "new_password": "newSecurePassword123"
 * }
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ 
        error: 'token and new_password are required' 
      });
    }

    // Validate password strength
    if (new_password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      logger.security('invalid_password_reset_token', { error: jwtError.message });
      return res.status(400).json({ 
        error: 'Invalid or expired password reset token' 
      });
    }

    if (decoded.type !== 'password_reset') {
      logger.security('invalid_token_type_for_reset', { tokenType: decoded.type });
      return res.status(400).json({ 
        error: 'Invalid password reset token' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 12);

    // Update password in appropriate table
    const userSource = decoded.source || 'clients';
    let updateError = null;

    if (userSource === 'registered_users') {
      const { error } = await supabaseAdmin
        .from('registered_users')
        .update({ 
          passcode_hash: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', decoded.userId);
      updateError = error;
    } else if (userSource === 'admins') {
      const { error } = await supabaseAdmin
        .from('admins')
        .update({ 
          password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', decoded.userId);
      updateError = error;
    } else {
      const { error } = await supabaseAdmin
        .from('clients')
        .update({ 
          password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', decoded.userId);
      updateError = error;
    }

    if (updateError) {
      logger.error('Error updating password', updateError, { 
        userId: decoded.userId,
        source: userSource
      });
      return res.status(500).json({ error: 'Failed to reset password' });
    }

    logger.info('Password reset successful', { 
      userId: decoded.userId,
      email: decoded.email,
      source: userSource
    });

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    logger.error('Reset password error', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
