#!/usr/bin/env node

/**
 * Local Authentication Test
 * Tests authentication logic locally without hitting production
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../utils/supabase');

const ADMIN_EMAIL = 'admin@applybureau.com';
const ADMIN_PASSWORD = 'Admin123@#';

const testLocalAuth = async () => {
  console.log('🔍 Testing authentication logic locally...');
  
  try {
    // Step 1: Check admin exists in database
    console.log('1. Checking admin in database...');
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, password, role')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (adminError || !admin) {
      console.error('❌ Admin not found in database:', adminError);
      return false;
    }

    console.log('✅ Admin found:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      hasPassword: !!admin.password
    });

    // Step 2: Test password verification
    console.log('2. Testing password verification...');
    const passwordValid = await bcrypt.compare(ADMIN_PASSWORD, admin.password);
    
    if (!passwordValid) {
      console.error('❌ Password verification failed');
      return false;
    }

    console.log('✅ Password verification successful');

    // Step 3: Test token generation
    console.log('3. Testing token generation...');
    const tokenPayload = {
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      full_name: admin.full_name,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET);
    console.log('✅ Token generated successfully');

    // Step 4: Test token verification
    console.log('4. Testing token verification...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.userId !== admin.id || decoded.email !== admin.email) {
      console.error('❌ Token verification failed - data mismatch');
      return false;
    }

    console.log('✅ Token verification successful:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });

    // Step 5: Test complete login flow
    console.log('5. Testing complete login flow...');
    
    // Simulate the login route logic
    const loginEmail = ADMIN_EMAIL;
    const loginPassword = ADMIN_PASSWORD;

    // Find user (same as auth route)
    const { data: user } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, password, role')
      .eq('email', loginEmail)
      .single();

    if (!user) {
      console.error('❌ User not found in login flow');
      return false;
    }

    // Verify password (same as auth route)
    const validPassword = await bcrypt.compare(loginPassword, user.password);
    if (!validPassword) {
      console.error('❌ Password invalid in login flow');
      return false;
    }

    // Generate token (same as auth route)
    const loginToken = jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }, process.env.JWT_SECRET);

    console.log('✅ Complete login flow successful');

    // Step 6: Test middleware token verification
    console.log('6. Testing middleware token verification...');
    
    try {
      const middlewareDecoded = jwt.verify(loginToken, process.env.JWT_SECRET);
      const middlewareUser = {
        id: middlewareDecoded.userId || middlewareDecoded.id,
        email: middlewareDecoded.email,
        role: middlewareDecoded.role || 'client',
        full_name: middlewareDecoded.full_name
      };

      if (middlewareUser.id !== user.id) {
        console.error('❌ Middleware verification failed');
        return false;
      }

      console.log('✅ Middleware verification successful:', {
        id: middlewareUser.id,
        email: middlewareUser.email,
        role: middlewareUser.role
      });

    } catch (middlewareError) {
      console.error('❌ Middleware verification error:', middlewareError.message);
      return false;
    }

    console.log('');
    console.log('🎉 All authentication tests passed locally!');
    console.log('The issue is that production deployment needs the updated code.');
    
    return true;

  } catch (error) {
    console.error('💥 Local auth test failed:', error);
    return false;
  }
};

testLocalAuth().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test crashed:', error);
  process.exit(1);
});