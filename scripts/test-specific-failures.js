#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';

async function testSpecificFailures() {
  console.log('🔍 TESTING SPECIFIC FAILING ENDPOINTS');
  console.log('=====================================\n');

  // Get admin token first
  let adminToken = null;
  try {
    const loginResult = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    adminToken = loginResult.data.token;
    console.log('✅ Admin login successful\n');
  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.data || error.message);
    return;
  }

  // Test each failing endpoint with detailed error reporting
  const tests = [
    {
      name: 'Consultation Requests GET',
      method: 'GET',
      url: '/api/consultation-requests',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    },
    {
      name: 'Submit Contact Request',
      method: 'POST',
      url: '/api/contact-requests',
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        subject: 'Test Contact',
        message: 'This is a test contact submission'
      }
    },
    {
      name: 'Submit Consultation Request',
      method: 'POST',
      url: '/api/consultation-requests',
      data: {
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        message: 'Test consultation request',
        preferredSlots: [
          { date: '2026-01-25', time: '14:00' },
          { date: '2026-01-26', time: '15:00' }
        ],
        consultation_type: 'general_consultation',
        urgency_level: 'normal'
      }
    },
    {
      name: 'Dashboard Contacts',
      method: 'GET',
      url: '/api/dashboard/contacts',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    },
    {
      name: 'Admin Management List',
      method: 'GET',
      url: '/api/admin-management',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    },
    {
      name: 'Admin Profile',
      method: 'GET',
      url: '/api/admin/profile',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    },
    {
      name: 'Workflow Consultation Requests',
      method: 'GET',
      url: '/api/workflow/consultation-requests',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    },
    {
      name: 'Applications Workflow',
      method: 'GET',
      url: '/api/applications-workflow',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    },
    {
      name: 'Get Messages',
      method: 'GET',
      url: '/api/enhanced-dashboard/messages',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }
  ];

  for (const test of tests) {
    console.log(`🧪 Testing: ${test.name}`);
    console.log(`   ${test.method} ${test.url}`);
    
    try {
      const config = {
        method: test.method,
        url: `${BACKEND_URL}${test.url}`,
        headers: {
          'Content-Type': 'application/json',
          ...test.headers
        },
        timeout: 15000
      };

      if (test.data) {
        config.data = test.data;
      }

      const response = await axios(config);
      console.log(`   ✅ SUCCESS: ${response.status}`);
      console.log(`   📊 Response keys: ${Object.keys(response.data).join(', ')}`);
      
      if (response.data.error) {
        console.log(`   ⚠️  Response contains error: ${response.data.error}`);
      }
      
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.response?.status || 'NO_RESPONSE'}`);
      
      if (error.response?.data) {
        console.log(`   🔍 Error Details:`);
        console.log(`      Status: ${error.response.status}`);
        console.log(`      Data: ${JSON.stringify(error.response.data, null, 6)}`);
      } else {
        console.log(`   🔍 Network Error: ${error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('🎯 DETAILED TESTING COMPLETE');
}

testSpecificFailures().catch(console.error);