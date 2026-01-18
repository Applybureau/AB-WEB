#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

async function testStatusValues() {
  console.log('🔍 Testing Valid Status Values\n');
  
  try {
    // Step 1: Login
    console.log('1. Admin Login...');
    const loginResponse = await axios.post('https://apply-bureau-backend.vercel.app/api/auth/login', {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Step 2: Get consultation requests
    console.log('\n2. Getting consultation requests...');
    const consultationsResponse = await axios.get('https://apply-bureau-backend.vercel.app/api/consultation-requests', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const consultations = consultationsResponse.data.data;
    const testConsultation = consultations[0];
    console.log(`📋 Testing with consultation: ${testConsultation.fullName}`);
    console.log(`Current status: ${testConsultation.status}`);
    
    // Step 3: Test different status values using the working consultation endpoint
    const statusesToTest = [
      'pending',
      'confirmed', 
      'scheduled',
      'waitlisted',
      'rejected',
      'approved',
      'under_review'
    ];
    
    for (const status of statusesToTest) {
      console.log(`\n3. Testing status: ${status}`);
      
      try {
        const updateResponse = await axios.patch(
          `https://apply-bureau-backend.vercel.app/api/consultation-requests/${testConsultation.id}`,
          {
            status: status,
            admin_notes: `Test status change to ${status}`
          },
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`✅ Status '${status}' - SUCCESS`);
        
        // Revert back to original status
        await axios.patch(
          `https://apply-bureau-backend.vercel.app/api/consultation-requests/${testConsultation.id}`,
          {
            status: testConsultation.status,
            admin_notes: testConsultation.admin_notes
          },
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
      } catch (error) {
        console.log(`❌ Status '${status}' - FAILED: ${error.response?.status} ${error.response?.data?.error || error.message}`);
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

testStatusValues().catch(console.error);