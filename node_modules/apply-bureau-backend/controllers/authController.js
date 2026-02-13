const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const logger = require('../utils/logger');
const securityManager = require('../utils/security');

class AuthController {
  // POST /api/auth/invite - Admin sends invite to client
  static async inviteClient(req, res) {
    try {
      const { email, full_name } = req.body;
      const adminId = req.user.id;

      logger.info('Admin inviting client', { adminId, email, full_name });

      // Check if client already exists
      const { data: existingClient } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('email', email)
        .single();

      if (existingClient) {
        logger.warn('Attempt to invite existing client', { email, adminId });
        return res.status(400).json({ error: 'Client already exists' });
      }

      // Create client record with temporary password
      const tempPassword = securityManager.generateSecureToken(12);
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      const { data: client, error } = await supabaseAdmin
        .from('clients')
        .insert({
          email,
          full_name,
          password: hashedPassword,
          onboarding_complete: false,
          role: 'client'
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create client', error, { email, adminId });
        return res.status(500).json({ error: 'Failed to create client' });
      }

      // Generate registration token with expiration
      const registrationToken = jwt.sign({ 
        userId: client.id, 
        email: client.email,
        type: 'registration',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }, process.env.JWT_SECRET);

      // Send invitation email
      await sendEmail(email, 'signup_invite', {
        client_name: full_name,
        registration_link: `${process.env.FRONTEND_URL}/complete-registration?token=${registrationToken}`,
        user_id: client.id
      });

      logger.info('Client invitation sent successfully', { 
        clientId: client.id, 
        email, 
        adminId 
      });

      res.status(201).json({
        message: 'Invitation sent successfully',
        client_id: client.id
      });
    } catch (error) {
      logger.error('Invite client error', error, { 
        email: req.body.email, 
        adminId: req.user?.id 
      });
      res.status(500).json({ error: 'Failed to send invitation' });
    }
  }

  // POST /api/auth/complete-registration - Client completes registration
  static async completeRegistration(req, res) {
    try {
      const { token, password, full_name } = req.body;
      const ip = req.ip;

      logger.info('Registration completion attempt', { ip });

      // Verify registration token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        logger.security('invalid_registration_token', { ip, error: jwtError.message });
        return res.status(400).json({ error: 'Invalid or expired registration token' });
      }
      
      if (decoded.type !== 'registration') {
        logger.security('invalid_token_type', { ip, tokenType: decoded.type });
        return res.status(400).json({ error: 'Invalid registration token' });
      }

      // Hash new password with high security
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update client record
      const updateData = { 
        password: hashedPassword,
        onboarding_complete: true
      };
      
      if (full_name) {
        updateData.full_name = full_name;
      }

      const { data: client, error } = await supabaseAdmin
        .from('clients')
        .update(updateData)
        .eq('id', decoded.userId)
        .select('id, email, full_name, role')
        .single();

      if (error) {
        logger.error('Failed to complete registration', error, { userId: decoded.userId });
        return res.status(500).json({ error: 'Failed to complete registration' });
      }

      // Generate auth token
      const authToken = jwt.sign({
        userId: client.id,
        email: client.email,
        role: client.role,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }, process.env.JWT_SECRET);

      logger.info('Registration completed successfully', { 
        userId: client.id, 
        email: client.email 
      });

      res.json({
        message: 'Registration completed successfully',
        token: authToken,
        user: {
          id: client.id,
          email: client.email,
          full_name: client.full_name,
          role: client.role
        }
      });
    } catch (error) {
      logger.error('Complete registration error', error, { ip: req.ip });
      res.status(500).json({ error: 'Failed to complete registration' });
    }
  }

  // POST /api/auth/login - Client login
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const ip = req.ip;

      logger.info('Login attempt', { email, ip });

      // Check if IP is blocked
      if (securityManager.isBlocked(ip)) {
        logger.security('blocked_ip_login_attempt', { email, ip });
        return res.status(403).json({ error: 'Access temporarily blocked' });
      }

      let user = null;
      let userSource = null;

      // First, try to find user in admins table (new admin system)
      const { data: admin, error: adminError } = await supabaseAdmin
        .from('admins')
        .select('id, email, full_name, password, role, is_active, is_super_admin')
        .eq('email', email)
        .single();

      if (admin && !adminError) {
        user = {
          ...admin,
          onboarding_complete: true // Admins are always considered onboarded
        };
        userSource = 'admins';
      } else {
        // Check registered_users table (for clients who registered via payment flow)
        const { data: registeredUser, error: regUserError } = await supabaseAdmin
          .from('registered_users')
          .select('id, email, full_name, passcode_hash, role, is_active, onboarding_completed')
          .eq('email', email)
          .single();

        if (registeredUser && !regUserError) {
          user = {
            ...registeredUser,
            password: registeredUser.passcode_hash, // Map passcode_hash to password for consistency
            onboarding_complete: registeredUser.onboarding_completed || false
          };
          userSource = 'registered_users';
        } else {
          // Fallback to clients table (legacy system)
          const { data: client, error: clientError } = await supabaseAdmin
            .from('clients')
            .select('id, email, full_name, password, role, onboarding_complete')
            .eq('email', email)
            .single();

          if (client && !clientError) {
            user = client;
            userSource = 'clients';
          }
        }
      }

      if (!user) {
        const failedAttempt = securityManager.recordFailedAttempt(email, ip);
        logger.security('invalid_login_credentials', { email, ip, attempts: failedAttempt.attempts });
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if admin account is active
      if (userSource === 'admins' && user.is_active === false) {
        logger.security('inactive_admin_login_attempt', { email, ip });
        return res.status(401).json({ error: 'Account is suspended' });
      }

      // Check if registered user is active
      if (userSource === 'registered_users' && user.is_active === false) {
        logger.security('inactive_user_login_attempt', { email, ip });
        return res.status(401).json({ error: 'Account is not active' });
      }

      // Verify password
      const passwordField = user.password;
      const validPassword = await bcrypt.compare(password, passwordField);
      if (!validPassword) {
        const failedAttempt = securityManager.recordFailedAttempt(email, ip);
        logger.security('invalid_password', { email, ip, attempts: failedAttempt.attempts });
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Clear failed attempts on successful login
      securityManager.clearFailedAttempts(email, ip);

      // Update last login time
      if (userSource === 'admins') {
        await supabaseAdmin
          .from('admins')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', user.id);
      } else if (userSource === 'registered_users') {
        await supabaseAdmin
          .from('registered_users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', user.id);
      } else {
        await supabaseAdmin
          .from('clients')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      // Generate auth token
      const token = jwt.sign({
        userId: user.id,
        id: user.id,
        email: user.email,
        role: user.role || 'client',
        full_name: user.full_name,
        is_super_admin: user.is_super_admin || false,
        source: userSource,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }, process.env.JWT_SECRET);

      logger.info('Login successful', { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        source: userSource,
        is_super_admin: user.is_super_admin || false
      });

      // Determine dashboard type based on source and role
      let dashboardType = 'client';
      if (userSource === 'admins') {
        // Anyone from admins table gets admin dashboard
        dashboardType = 'admin';
      } else if (userSource === 'registered_users' || userSource === 'clients') {
        // Check role for registered_users and clients tables
        const userRole = user.role || 'client';
        if (userRole === 'admin' || userRole === 'super_admin') {
          dashboardType = 'admin';
        } else {
          dashboardType = 'client';
        }
      }

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role || 'client',
          onboarding_complete: user.onboarding_complete,
          is_super_admin: user.is_super_admin || false,
          dashboard_type: dashboardType,
          source: userSource
        }
      });
    } catch (error) {
      logger.error('Login error', error, { email: req.body.email, ip: req.ip });
      res.status(500).json({ error: 'Login failed' });
    }
  }

  // GET /api/auth/me - Get current user info
  static async getCurrentUser(req, res) {
    try {
      const userId = req.user.id;
      const userSource = req.user.source || 'clients'; // Default to clients for backward compatibility

      let user = null;

      if (userSource === 'admins') {
        // Get from admins table
        const { data: admin, error } = await supabaseAdmin
          .from('admins')
          .select('id, email, full_name, role, is_active, is_super_admin, created_at, last_login_at')
          .eq('id', userId)
          .single();

        if (admin && !error) {
          user = {
            ...admin,
            onboarding_complete: true // Admins are always considered onboarded
          };
        }
      } else {
        // Get from clients table
        const { data: client, error } = await supabaseAdmin
          .from('clients')
          .select('id, email, full_name, role, onboarding_complete, resume_url, created_at')
          .eq('id', userId)
          .single();

        if (client && !error) {
          user = client;
        }
      }

      if (!user) {
        logger.warn('User not found in getCurrentUser', { userId, source: userSource });
        return res.status(404).json({ error: 'User not found' });
      }

      logger.debug('User info retrieved', { userId, email: user.email, source: userSource });

      res.json({
        user: user
      });
    } catch (error) {
      logger.error('Get current user error', error, { userId: req.user?.id });
      res.status(500).json({ error: 'Failed to get user info' });
    }
  }

  // POST /api/auth/logout - Logout user (invalidate token)
  static async logout(req, res) {
    try {
      const userId = req.user.id;
      
      // In a more advanced implementation, you would maintain a blacklist of tokens
      // For now, we'll just log the logout event
      logger.info('User logged out', { userId });

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error', error, { userId: req.user?.id });
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  // POST /api/auth/refresh - Refresh JWT token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      // Verify refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      } catch (jwtError) {
        logger.security('invalid_refresh_token', { ip: req.ip });
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Get current user data
      const { data: client, error } = await supabaseAdmin
        .from('clients')
        .select('id, email, role')
        .eq('id', decoded.userId)
        .single();

      if (error || !client) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Generate new access token
      const newToken = jwt.sign({
        userId: client.id,
        email: client.email,
        role: client.role,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }, process.env.JWT_SECRET);

      logger.info('Token refreshed', { userId: client.id });

      res.json({
        token: newToken,
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      logger.error('Refresh token error', error);
      res.status(500).json({ error: 'Failed to refresh token' });
    }
  }
}

module.exports = AuthController;