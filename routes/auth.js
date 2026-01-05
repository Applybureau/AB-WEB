const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../utils/supabase');
const { generateToken, authenticateToken } = require('../utils/auth');
const { sendEmail } = require('../utils/email');
const { validate, schemas } = require('../utils/validation');

const router = express.Router();

// POST /api/auth/invite - Admin sends invite to client
router.post('/invite', authenticateToken, validate(schemas.invite), async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { email, full_name } = req.body;

    // Check if client already exists
    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('email', email)
      .single();

    if (existingClient) {
      return res.status(400).json({ error: 'Client already exists' });
    }

    // Create client record with temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .insert({
        email,
        full_name,
        password: hashedPassword,
        status: 'invited'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return res.status(500).json({ error: 'Failed to create client' });
    }

    // Generate registration token
    const registrationToken = generateToken({ 
      userId: client.id, 
      email: client.email,
      type: 'registration'
    });

    // Send invitation email
    await sendEmail(email, 'signup_invite', {
      client_name: full_name,
      registration_link: `${process.env.FRONTEND_URL}/complete-registration?token=${registrationToken}`
    });

    res.status(201).json({
      message: 'Invitation sent successfully',
      client_id: client.id
    });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// POST /api/auth/complete-registration - Client completes registration
router.post('/complete-registration', validate(schemas.completeRegistration), async (req, res) => {
  try {
    const { token, password, full_name } = req.body;

    // Verify registration token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'registration') {
      return res.status(400).json({ error: 'Invalid registration token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update client record
    const updateData = { 
      password: hashedPassword,
      status: 'active'
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
      console.error('Error updating client:', error);
      return res.status(500).json({ error: 'Failed to complete registration' });
    }

    // Generate auth token
    const authToken = generateToken({
      userId: client.id,
      email: client.email,
      role: client.role
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
    console.error('Complete registration error:', error);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

// POST /api/auth/login - Client login
router.post('/login', validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Get client from database
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, password, role')
      .eq('email', email)
      .single();

    console.log('Database query result:', { 
      found: !!client, 
      error: error?.message,
      hasPassword: !!client?.password 
    });

    if (error || !client) {
      console.log('Client not found or database error');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    console.log('Comparing passwords...');
    const validPassword = await bcrypt.compare(password, client.password);
    console.log('Password valid:', validPassword);
    
    if (!validPassword) {
      console.log('Password comparison failed');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate auth token
    const token = generateToken({
      userId: client.id,
      email: client.email,
      role: client.role || 'client'
    });

    console.log('Login successful for:', email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: client.id,
        email: client.email,
        full_name: client.full_name,
        role: client.role || 'client'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, role, onboarding_complete, resume_url')
      .eq('id', req.user.userId || req.user.id)
      .single();

    if (error || !client) {
      console.error('Get user error:', error);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: client
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

module.exports = router;