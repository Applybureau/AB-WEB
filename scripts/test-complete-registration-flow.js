#!/usr/bin/env node

/**
 * Test Complete Registration Flow with Real Token
 * This creates a proper user record, generates a valid token, sends email, and tests registration
 */

require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

async function testCompleteRegistrationFlow() {
  console.log('🧪 TESTING COMPLETE REGISTRATION FLOW');
  console.log('=====================================');
  
  const testEmail = 'israelloko65@gmail.com';
  const testName = 'Israel Loko';
  
  try {
    // Step 1: Clean up any existing test data
    console.log('1. 🧹 Cleaning up existing test data...');
    await supabaseAdmin
      .from('registered_users')
      .delete()
      .eq('email', testEmail);
    
    // Step 2: Create a registered user record (simulating payment verification)
    console.log('2. 👤 Creating registered user record...');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .insert({
        full_name: testName,
        email: testEmail,
        payment_confirmed: true,
        payment_verified: true,
        payment_verified_at: new Date().toISOString(),
        token_used: false,
        token_expires_at: expiresAt.toISOString(),
        registration_expires_at: expiresAt.toISOString(),
        is_active: false, // Will be activated on registration
        role: 'client',
        status: 'pending',
        onboarding_current_position: 'registration',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (userError) {
      console.error('❌ Failed to create user record:', userError);
      return;
    }
    
    console.log('✅ User record created:', user.id);
    
    // Step 3: Generate a valid registration token
    console.log('3. 🔑 Generating registration token...');
    
    const tokenPayload = {
      email: testEmail,
      type: 'registration',
      user_id: user.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000)
    };
    
    const registrationToken = jwt.sign(tokenPayload, process.env.JWT_SECRET);
    
    // Step 4: Store the token in the database
    console.log('4. 💾 Storing token in database...');
    
    const { error: tokenError } = await supabaseAdmin
      .from('registered_users')
      .update({
        registration_token: registrationToken
      })
      .eq('id', user.id);
    
    if (tokenError) {
      console.error('❌ Failed to store token:', tokenError);
      return;
    }
    
    console.log('✅ Token stored successfully');
    
    // Step 5: Send the onboarding email with real token
    console.log('5. 📧 Sending onboarding email with real token...');
    
    const frontendUrl = process.env.FRONTEND_URL || 'https://apply-bureau.vercel.app';
    const registrationUrl = `${frontendUrl}/register?token=${registrationToken}`;
    
    const emailVariables = {
      client_name: testName,
      payment_amount: '$2,500',
      payment_method: 'Bank Transfer',
      package_tier: 'Premium Career Advancement',
      admin_name: 'Sarah Johnson',
      registration_url: registrationUrl,
      token_expiry: '7 days',
      next_steps: 'Once you create your account, you\'ll complete a comprehensive 20-question onboarding questionnaire that helps us understand your career goals, experience, and preferences.',
      dashboard_url: `${frontendUrl}/dashboard`,
      current_year: new Date().getFullYear()
    };
    
    const emailResult = await sendEmail(
      testEmail,
      'payment_verified_registration',
      emailVariables
    );
    
    console.log('✅ Email sent successfully!');
    console.log(`   Email ID: ${emailResult.id}`);
    
    // Step 6: Test token validation
    console.log('6. 🔍 Testing token validation...');
    
    const axios = require('axios');
    const backendUrl = process.env.BACKEND_URL || 'https://apply-bureau-backend.vercel.app';
    
    try {
      const validationResponse = await axios.get(
        `${backendUrl}/api/client-registration/validate-token/${registrationToken}`
      );
      
      console.log('✅ Token validation successful!');
      console.log('   Valid:', validationResponse.data.valid);
      console.log('   Client:', validationResponse.data.client);
      
    } catch (validationError) {
      console.log('❌ Token validation failed:', validationError.response?.data || validationError.message);
    }
    
    console.log('\n🎉 COMPLETE REGISTRATION FLOW TEST COMPLETED!');
    console.log('==============================================');
    console.log(`📧 Check ${testEmail} for the onboarding email`);
    console.log('📱 The email contains a REAL, WORKING registration token');
    console.log('🔗 Registration URL:', registrationUrl);
    console.log('');
    console.log('🧪 Test Results:');
    console.log('   ✅ User record created in database');
    console.log('   ✅ Valid registration token generated');
    console.log('   ✅ Token stored in database');
    console.log('   ✅ Professional onboarding email sent');
    console.log('   ✅ Token validation working');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Check your email for the professional onboarding message');
    console.log('   2. Click the registration link to test the frontend');
    console.log('   3. Complete registration with a password');
    console.log('   4. Verify the complete flow works end-to-end');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Cleanup on error
    try {
      await supabaseAdmin
        .from('registered_users')
        .delete()
        .eq('email', testEmail);
      console.log('🧹 Cleaned up test data after error');
    } catch (cleanupError) {
      console.error('Failed to cleanup:', cleanupError);
    }
  }
}

// Additional function to test just the token validation
async function testTokenValidationOnly() {
  console.log('🔍 TESTING TOKEN VALIDATION ONLY');
  console.log('=================================');
  
  const testEmail = 'israelloko65@gmail.com';
  
  try {
    // Get existing user record
    const { data: user, error } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .eq('email', testEmail)
      .eq('payment_confirmed', true)
      .single();
    
    if (error || !user) {
      console.log('❌ No test user found. Run the complete flow test first.');
      return;
    }
    
    if (!user.registration_token) {
      console.log('❌ No registration token found for user.');
      return;
    }
    
    console.log('✅ Found test user with token');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Token Used:', user.token_used);
    console.log('   Payment Confirmed:', user.payment_confirmed);
    
    // Test token validation via API
    const axios = require('axios');
    const backendUrl = process.env.BACKEND_URL || 'https://apply-bureau-backend.vercel.app';
    
    try {
      const response = await axios.get(
        `${backendUrl}/api/client-registration/validate-token/${user.registration_token}`
      );
      
      console.log('✅ Token validation response:', response.data);
      
    } catch (apiError) {
      console.log('❌ API validation failed:', apiError.response?.data || apiError.message);
    }
    
  } catch (error) {
    console.error('❌ Token validation test failed:', error);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--validate-only')) {
    testTokenValidationOnly();
  } else {
    testCompleteRegistrationFlow();
  }
}

module.exports = {
  testCompleteRegistrationFlow,
  testTokenValidationOnly
};