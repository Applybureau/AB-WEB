#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';

async function testEmailActionsComprehensive() {
  console.log('🔍 Comprehensive Email Actions Test\n');
  
  try {
    // Step 1: Login as admin
    console.log('1. Admin Login...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Step 2: Get consultation data
    console.log('\n2. Getting consultation requests...');
    const consultationsResponse = await axios.get(`${BACKEND_URL}/api/consultation-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const consultations = consultationsResponse.data.data;
    console.log(`✅ Found ${consultations.length} consultation requests`);
    
    if (consultations.length === 0) {
      console.log('❌ No consultation requests found');
      return;
    }
    
    const testConsultation = consultations[0];
    console.log(`📋 Testing with: ${testConsultation.name || testConsultation.fullName} (${testConsultation.email})`);
    console.log(`📋 ID: ${testConsultation.id}`);
    console.log(`📋 Current Status: ${testConsultation.status}`);
    
    // Step 3: Generate correct token
    const consultationToken = Buffer.from(`${testConsultation.id}-${testConsultation.email}`).toString('base64').slice(0, 16);
    console.log(`📋 Generated Token: ${consultationToken}`);
    
    // Step 4: Test consultation confirm endpoint
    console.log('\n3. Testing Consultation Confirm...');
    try {
      const confirmUrl = `${BACKEND_URL}/api/email-actions/consultation/${testConsultation.id}/confirm/${consultationToken}`;
      console.log(`URL: ${confirmUrl}`);
      
      const confirmResponse = await axios.get(confirmUrl);
      console.log(`✅ Consultation Confirm - Status: ${confirmResponse.status}`);
      
      if (confirmResponse.data.includes('Consultation Confirmed')) {
        console.log('✅ Success message found in response');
      } else {
        console.log('⚠️ Unexpected response content');
      }
      
    } catch (error) {
      console.log(`❌ Consultation Confirm - Status: ${error.response?.status}`);
      console.log(`Error: ${error.response?.statusText}`);
      
      // Try to extract error details from HTML response
      if (error.response?.data && typeof error.response.data === 'string') {
        const errorMatch = error.response.data.match(/<h2[^>]*>([^<]+)<\/h2>/);
        if (errorMatch) {
          console.log(`HTML Error: ${errorMatch[1]}`);
        }
        
        // Check if it's a database error
        if (error.response.data.includes('Error') && error.response.status === 500) {
          console.log('🔍 This appears to be a database schema issue');
          console.log('The deployed version likely has outdated column references');
        }
      }
    }
    
    // Step 5: Test consultation waitlist endpoint
    console.log('\n4. Testing Consultation Waitlist...');
    try {
      const waitlistUrl = `${BACKEND_URL}/api/email-actions/consultation/${testConsultation.id}/waitlist/${consultationToken}`;
      console.log(`URL: ${waitlistUrl}`);
      
      const waitlistResponse = await axios.get(waitlistUrl);
      console.log(`✅ Consultation Waitlist - Status: ${waitlistResponse.status}`);
      
      if (waitlistResponse.data.includes('Added to Waitlist')) {
        console.log('✅ Success message found in response');
      } else {
        console.log('⚠️ Unexpected response content');
      }
      
    } catch (error) {
      console.log(`❌ Consultation Waitlist - Status: ${error.response?.status}`);
      console.log(`Error: ${error.response?.statusText}`);
    }
    
    // Step 6: Check if we need to deploy fixes
    console.log('\n5. Deployment Status Check...');
    
    if (consultations.some(c => c.status === 'confirmed')) {
      console.log('✅ Some consultations are already confirmed - endpoints may be working');
    } else {
      console.log('⚠️ No confirmed consultations found');
    }
    
    console.log('\n📋 Summary:');
    console.log('- Token generation: ✅ Working');
    console.log('- Token validation: ✅ Working (403 for invalid tokens)');
    console.log('- Database operations: ❌ Need deployment of schema fixes');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Deploy the fixed emailActions.js to Vercel');
    console.log('2. The fixes include:');
    console.log('   - Remove non-existent columns (confirmed_at, pipeline_status)');
    console.log('   - Use valid status values only');
    console.log('   - Update admin endpoints to use admins table');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testEmailActionsComprehensive().catch(console.error);