#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';

async function testFailingEndpoints() {
  console.log('🔍 DEBUGGING FAILING ENDPOINTS');
  console.log('===============================\n');

  // Get admin token first
  let adminToken = null;
  try {
    const loginResult = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    adminToken = loginResult.data.token;
    console.log('✅ Admin login successful');
  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.data || error.message);
    return;
  }

  // Test failing endpoints one by one
  const failingEndpoints = [
    { name: 'Consultation Requests', method: 'GET', url: '/api/consultation-requests' },
    { name: 'Dashboard Contacts', method: 'GET', url: '/api/dashboard/contacts' },
    { name: 'Admin Management List', method: 'GET', url: '/api/admin-management' },
    { name: 'Admin Profile', method: 'GET', url: '/api/admin/profile' },
    { name: 'Workflow Consultation Requests', method: 'GET', url: '/api/workflow/consultation-requests' },
    { name: 'Applications Workflow', method: 'GET', url: '/api/applications-workflow' },
    { name: 'Get Messages', method: 'GET', url: '/api/enhanced-dashboard/messages' }
  ];

  for (const endpoint of failingEndpoints) {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    console.log(`   ${endpoint.method} ${endpoint.url}`);
    
    try {
      const config = {
        method: endpoint.method,
        url: `${BACKEND_URL}${endpoint.url}`,
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      const response = await axios(config);
      console.log(`   ✅ SUCCESS: ${response.status}`);
      console.log(`   📊 Data keys: ${Object.keys(response.data).join(', ')}`);
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.response?.status || 'NO_RESPONSE'}`);
      console.log(`   🔍 Error: ${JSON.stringify(error.response?.data || error.message, null, 2)}`);
    }
  }

  // Test public endpoints
  console.log('\n🌐 Testing Public Endpoints:');
  
  const publicTests = [
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
    }
  ];

  for (const test of publicTests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   ${test.method} ${test.url}`);
    
    try {
      const config = {
        method: test.method,
        url: `${BACKEND_URL}${test.url}`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: test.data,
        timeout: 10000
      };

      const response = await axios(config);
      console.log(`   ✅ SUCCESS: ${response.status}`);
      console.log(`   📊 Response: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.response?.status || 'NO_RESPONSE'}`);
      console.log(`   🔍 Error: ${JSON.stringify(error.response?.data || error.message, null, 2)}`);
    }
  }

  console.log('\n🎯 DEBUGGING COMPLETE');
}

testFailingEndpoints().catch(console.error);