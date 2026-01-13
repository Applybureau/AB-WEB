const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../utils/supabase');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// POST /api/auth/admin/login - Admin login (PUBLIC)
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Find admin user
    const { data: user, error } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, passcode_hash, full_name, role, is_active')
      .eq('email', email)
      .eq('role', 'admin')
      .single();

    if (error || !user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({ 
        success: false,
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passcode_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token according to spec
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, process.env.JWT_SECRET);

    // Update last login
    await supabaseAdmin
      .from('registered_users')
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    // Return response according to spec
    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Login failed',
      code: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/auth/verify - Verify JWT token (PROTECTED)
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // Token is already verified by middleware, user info is in req.user
    const userId = req.user.userId || req.user.id;

    // Get fresh user data from database
    const { data: user, error } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name, role, is_active')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ 
        valid: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if account is still active
    if (!user.is_active) {
      return res.status(401).json({ 
        valid: false,
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Return response according to spec
    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ 
      valid: false,
      error: 'Token verification failed',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/logout - Logout (PROTECTED)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // We can optionally log the logout event
    const userId = req.user.userId || req.user.id;

    await supabaseAdmin
      .from('registered_users')
      .update({ 
        last_logout: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Logout failed',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/refresh - Refresh JWT token (PROTECTED)
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Get fresh user data
    const { data: user, error } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name, role, is_active')
      .eq('id', userId)
      .single();

    if (error || !user || !user.is_active) {
      return res.status(401).json({ 
        success: false,
        error: 'Unable to refresh token',
        code: 'REFRESH_FAILED'
      });
    }

    // Generate new token
    const newToken = jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, process.env.JWT_SECRET);

    res.json({
      success: true,
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Token refresh failed',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;