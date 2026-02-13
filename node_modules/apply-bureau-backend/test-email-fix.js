#!/usr/bin/env node

/**
 * Test Email System Fix
 * Tests that emails are actually being sent after fixes
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';
const TEST_EMAIL = 'israelloko65@gmail.com';

const testEmailSystem = async () => {
  console.log('🧪 Testing Email System After Fixes...');
  console.log(`Testing against: ${BASE_URL}`);
  console.log('=' .repeat(50));

  try {
    // Test 1: Contact Form Email
    console.log('📧 Test 1: Contact Form Email Sending');
    const contactResponse = await axios.post(`${BASE_URL}/api/contact`, {
      name: 'Test User',
      email: TEST_EMAIL,
      subject: 'Email System Test',
      message: 'Testing if emails are being sent properly after the fixes. This should trigger both client confirmation and admin notification emails.'
    });

    if (contactResponse.status === 201) {
      console.log('✅ Contact form submitted successfully');
      console.log('📧 Should have sent 2 emails:');
      console.log('   1. Confirmation to:', TEST_EMAIL);
      console.log('   2. Notification to: admin@applybureau.com');
    } else {
      console.log('❌ Contact form submission failed');
    }

    // Test 2: Admin Login and Client Invitation
    console.log('\n📧 Test 2: Admin Login and Client Invitation');
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@applybureau.com',
        password: 'Admin123@#'
      });

      if (loginResponse.status === 200) {
        console.log('✅ Admin login successful');
        const adminToken = loginResponse.data.token;

        // Test client invitation
        const inviteResponse = await axios.post(`${BASE_URL}/api/auth/invite`, {
          email: TEST_EMAIL,
          full_name: 'Test Client User'
        }, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (inviteResponse.status === 201) {
          console.log('✅ Client invitation sent successfully');
          console.log('📧 Should have sent invitation email to:', TEST_EMAIL);
        } else {
          console.log('❌ Client invitation failed');
        }
      } else {
        console.log('❌ Admin login failed');
      }
    } catch (authError) {
      console.log('⚠️ Auth test skipped:', authError.response?.data?.error || authError.message);
    }

    // Test 3: Application Update Email (if we have an application)
    console.log('\n📧 Test 3: Application Update Email');
    console.log('ℹ️ This test requires an existing application and admin access');
    console.log('   You can test this manually through the admin dashboard');

    console.log('\n' + '=' .repeat(50));
    console.log('🎯 Email Test Summary:');
    console.log('✅ Fixed email parameter order in auth controller');
    console.log('✅ Fixed email parameter order in contact route');
    console.log('✅ Set correct "from" email address: admin@applybureau.com');
    console.log('✅ Added application update email functionality');
    
    console.log('\n📧 Check your email inbox for:');
    console.log('   - Contact form confirmation');
    console.log('   - Client invitation (if admin test worked)');
    
    console.log('\n💡 If emails still don\'t arrive:');
    console.log('   1. Check spam/junk folder');
    console.log('   2. Verify Resend API key is valid');
    console.log('   3. Ensure admin@applybureau.com is verified in Resend');
    console.log('   4. Check server logs for email errors');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

testEmailSystem();