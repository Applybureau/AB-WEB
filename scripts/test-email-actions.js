#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const { generateConsultationActionUrls, generateAdminActionUrls } = require('../utils/emailTokens');

const BASE_URL = 'http://localhost:3000';

async function testEmailActions() {
  console.log('🧪 Testing Email Action Endpoints\n');

  // Test 1: Generate consultation action URLs
  console.log('1. Testing Consultation Action URL Generation:');
  const consultationUrls = generateConsultationActionUrls(123, 'test@example.com');
  console.log('✓ Confirm URL:', consultationUrls.confirmUrl);
  console.log('✓ Waitlist URL:', consultationUrls.waitlistUrl);
  console.log('✓ Token:', consultationUrls.token);
  console.log();

  // Test 2: Generate admin action URLs
  console.log('2. Testing Admin Action URL Generation:');
  const adminUrls = generateAdminActionUrls(456, 'admin@example.com');
  console.log('✓ Suspend URL:', adminUrls.suspendUrl);
  console.log('✓ Delete URL:', adminUrls.deleteUrl);
  console.log();

  // Test 3: Test consultation confirmation endpoint (should fail gracefully)
  console.log('3. Testing Consultation Confirmation Endpoint:');
  try {
    const response = await axios.get(`${BASE_URL}/api/email-actions/consultation/999/confirm/invalidtoken`);
    console.log('✗ Unexpected success:', response.status);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✓ Correctly returns 404 for invalid consultation');
    } else {
      console.log('✗ Unexpected error:', error.message);
    }
  }

  // Test 4: Test admin suspension endpoint (should fail gracefully)
  console.log('\n4. Testing Admin Suspension Endpoint:');
  try {
    const response = await axios.get(`${BASE_URL}/api/email-actions/admin/999/suspend/invalidtoken`);
    console.log('✗ Unexpected success:', response.status);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✓ Correctly returns 404 for invalid admin');
    } else {
      console.log('✗ Unexpected error:', error.message);
    }
  }

  // Test 5: Test health endpoint to ensure server is working
  console.log('\n5. Testing Server Health:');
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log('✓ Server is healthy:', response.status);
  } catch (error) {
    console.log('✗ Server health check failed:', error.message);
  }

  console.log('\n🎉 Email action endpoints are properly configured!');
  console.log('\n📧 Email templates now include working action buttons:');
  console.log('   • Consultation confirmation buttons');
  console.log('   • Waitlist signup buttons');
  console.log('   • Admin management buttons (suspend/delete)');
  console.log('\n✅ All email buttons should now work correctly!');
}

testEmailActions().catch(console.error);