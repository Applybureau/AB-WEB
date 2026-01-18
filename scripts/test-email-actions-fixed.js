#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';

async function testEmailActionsFixed() {
  console.log('🔍 Testing Email Action Buttons with Correct Token Format\n');
  
  try {
    // Step 1: Login as admin to get consultation data
    console.log('1. Admin Login...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Step 2: Get a consultation request to test with
    console.log('\n2. Getting consultation requests...');
    const consultationsResponse = await axios.get(`${BACKEND_URL}/api/consultation-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const consultations = consultationsResponse.data.data;
    console.log(`✅ Found ${consultations.length} consultation requests`);
    
    if (consultations.length === 0) {
      console.log('❌ No consultation requests found to test with');
      return;
    }
    
    const testConsultation = consultations[0];
    console.log(`📋 Testing with consultation: ${testConsultation.fullName} (${testConsultation.email})`);
    console.log(`📋 Consultation ID: ${testConsultation.id}`);
    
    // Step 3: Generate correct tokens using the same logic as the backend
    console.log('\n3. Generating correct tokens...');
    
    // Generate token using the same logic as emailActions.js
    const consultationToken = Buffer.from(`${testConsultation.id}-${testConsultation.email}`).toString('base64').slice(0, 16);
    console.log(`✅ Generated consultation token: ${consultationToken}`);
    
    // Step 4: Test email action endpoints with correct tokens
    console.log('\n4. Testing email action endpoints with correct tokens...');
    
    const emailActionTests = [
      {
        name: 'Consultation Confirm',
        url: `/api/email-actions/consultation/${testConsultation.id}/confirm/${consultationToken}`,
        expectedStatus: 200
      },
      {
        name: 'Consultation Waitlist',
        url: `/api/email-actions/consultation/${testConsultation.id}/waitlist/${consultationToken}`,
        expectedStatus: 200
      }
    ];
    
    for (const test of emailActionTests) {
      try {
        console.log(`\nTesting: ${test.name}`);
        console.log(`URL: ${BACKEND_URL}${test.url}`);
        
        const response = await axios.get(`${BACKEND_URL}${test.url}`);
        console.log(`✅ ${test.name} - Status: ${response.status} (Success)`);
        
        // Check if response contains success HTML
        if (response.data.includes('Consultation Confirmed') || response.data.includes('Added to Waitlist')) {
          console.log('✅ Response contains expected success message');
        }
        
      } catch (error) {
        console.log(`❌ ${test.name} - Status: ${error.response?.status} (${error.response?.statusText})`);
        
        if (error.response?.status === 403) {
          console.log('🔍 403 Forbidden - Token validation failed');
          console.log('Expected token format:', consultationToken);
        }
        
        if (error.response?.data && typeof error.response.data === 'string') {
          // Extract error message from HTML response
          const errorMatch = error.response.data.match(/<h2[^>]*>([^<]+)<\/h2>/);
          if (errorMatch) {
            console.log('Error message:', errorMatch[1]);
          }
        }
      }
    }
    
    // Step 5: Test with wrong token to verify validation works
    console.log('\n5. Testing with invalid token (should fail)...');
    
    try {
      const invalidResponse = await axios.get(`${BACKEND_URL}/api/email-actions/consultation/${testConsultation.id}/confirm/invalid123`);
      console.log('❌ Invalid token test failed - should have returned 403');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Invalid token correctly rejected with 403');
      } else {
        console.log(`❌ Unexpected status for invalid token: ${error.response?.status}`);
      }
    }
    
    // Step 6: Show how to generate tokens for any consultation
    console.log('\n6. Token Generation Guide:');
    console.log('To generate a valid token for any consultation:');
    console.log('```javascript');
    console.log('const token = Buffer.from(`${consultationId}-${email}`).toString("base64").slice(0, 16);');
    console.log('```');
    console.log(`Example for this consultation: Buffer.from("${testConsultation.id}-${testConsultation.email}").toString("base64").slice(0, 16)`);
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testEmailActionsFixed().catch(console.error);