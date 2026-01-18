#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';

async function testVerifyButton() {
  console.log('🔍 Testing Verify Button Functionality\n');
  
  try {
    // Step 1: Login as admin
    console.log('1. Admin Login...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Step 2: Get a consultation request to verify
    console.log('\n2. Getting consultation requests...');
    const consultationsResponse = await axios.get(`${BACKEND_URL}/api/consultation-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const consultations = consultationsResponse.data.data;
    console.log(`✅ Found ${consultations.length} consultation requests`);
    
    if (consultations.length === 0) {
      console.log('❌ No consultation requests found to test verification');
      return;
    }
    
    const testConsultation = consultations[0];
    console.log(`📋 Testing with consultation: ${testConsultation.fullName} (${testConsultation.email})`);
    
    // Step 3: Test payment verification endpoint
    console.log('\n3. Testing payment verification...');
    
    const verificationData = {
      payment_verified: true,
      payment_method: 'credit_card',
      payment_amount: '$500.00',
      payment_reference: 'TEST_REF_123',
      package_tier: 'premium',
      admin_notes: 'Test payment verification'
    };
    
    try {
      const verifyResponse = await axios.patch(
        `${BACKEND_URL}/api/workflow/consultation-requests/${testConsultation.id}/verify-payment`,
        verificationData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Payment verification successful');
      console.log('Response:', JSON.stringify(verifyResponse.data, null, 2));
      
    } catch (verifyError) {
      console.log('❌ Payment verification failed');
      console.log('Status:', verifyError.response?.status);
      console.log('Error:', JSON.stringify(verifyError.response?.data, null, 2));
      
      // Check if the endpoint exists
      if (verifyError.response?.status === 404) {
        console.log('\n🔍 Checking if endpoint exists...');
        
        // Try alternative endpoint paths
        const alternativePaths = [
          `/api/consultation-requests/${testConsultation.id}/verify-payment`,
          `/api/admin/consultation-requests/${testConsultation.id}/verify-payment`,
          `/api/onboarding/consultation-requests/${testConsultation.id}/verify-payment`
        ];
        
        for (const path of alternativePaths) {
          try {
            console.log(`Testing: ${path}`);
            await axios.patch(`${BACKEND_URL}${path}`, verificationData, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`✅ Found working endpoint: ${path}`);
            break;
          } catch (altError) {
            console.log(`❌ ${path} - Status: ${altError.response?.status}`);
          }
        }
      }
    }
    
    // Step 4: Test other verification endpoints
    console.log('\n4. Testing other verification endpoints...');
    
    // Test email verification endpoints
    const emailActionPaths = [
      `/api/email-actions/consultation/${testConsultation.id}/confirm/test123`,
      `/api/email-actions/consultation/${testConsultation.id}/waitlist/test123`
    ];
    
    for (const path of emailActionPaths) {
      try {
        console.log(`Testing: ${path}`);
        const response = await axios.get(`${BACKEND_URL}${path}`);
        console.log(`✅ ${path} - Status: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${path} - Status: ${error.response?.status} (${error.response?.statusText})`);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testVerifyButton().catch(console.error);