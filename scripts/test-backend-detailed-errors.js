#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BACKEND_URL}${endpoint}`,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    };

    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (data && (method === 'POST' || method === 'PATCH')) config.data = data;

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 0,
      details: {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      }
    };
  }
};

async function testBackendDetailedErrors() {
  console.log('🔍 DETAILED BACKEND ERROR ANALYSIS');
  console.log('===================================\n');

  // Get admin token
  console.log('1. Getting admin token...');
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@applybureau.com',
    password: 'admin123'
  });

  if (!loginResult.success) {
    console.log('❌ Cannot proceed - admin login failed');
    console.log('Error:', JSON.stringify(loginResult.details, null, 2));
    return;
  }

  const adminToken = loginResult.data.token;
  console.log('✅ Admin token obtained\n');

  // Test failing endpoints with detailed error reporting
  const failingEndpoints = [
    { name: 'Dashboard Statistics', endpoint: '/api/dashboard/stats' },
    { name: 'Admin Dashboard Clients', endpoint: '/api/admin-dashboard/clients' },
    { name: 'Dashboard Contacts', endpoint: '/api/dashboard/contacts' },
    { name: 'Admin Management List', endpoint: '/api/admin-management' },
    { name: 'Admin Profile', endpoint: '/api/admin/profile' },
    { name: 'Get Notifications', endpoint: '/api/enhanced-dashboard/notifications' },
    { name: 'Workflow Consultation Requests', endpoint: '/api/workflow/consultation-requests' },
    { name: 'Applications Workflow', endpoint: '/api/applications-workflow' }
  ];

  for (let i = 0; i < failingEndpoints.length; i++) {
    const test = failingEndpoints[i];
    console.log(`${i + 2}. Testing ${test.name}...`);
    console.log(`   Endpoint: ${test.endpoint}`);
    
    const result = await makeRequest('GET', test.endpoint, null, adminToken);
    
    if (result.success) {
      console.log(`   ✅ SUCCESS: ${test.name} is working`);
      console.log(`   Response keys: ${Object.keys(result.data).join(', ')}`);
    } else {
      console.log(`   ❌ FAILED: ${test.name}`);
      console.log(`   Status: ${result.status} ${result.details.statusText || ''}`);
      console.log(`   Error Message: ${result.details.message}`);
      
      if (result.details.response) {
        console.log(`   Response Details:`);
        if (typeof result.details.response === 'string') {
          console.log(`     ${result.details.response.substring(0, 200)}...`);
        } else {
          console.log(`     ${JSON.stringify(result.details.response, null, 4)}`);
        }
      }
    }
    
    console.log('');
    await delay(2000);
  }

  // Test consultation request submission with detailed error
  console.log(`${failingEndpoints.length + 2}. Testing Consultation Request Submission...`);
  const consultationData = {
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
  };

  const consultationResult = await makeRequest('POST', '/api/consultation-requests', consultationData);
  
  if (consultationResult.success) {
    console.log('   ✅ SUCCESS: Consultation request submitted');
    console.log(`   ID: ${consultationResult.data.id}`);
  } else {
    console.log('   ❌ FAILED: Consultation request submission');
    console.log(`   Status: ${consultationResult.status}`);
    console.log(`   Error: ${JSON.stringify(consultationResult.details, null, 2)}`);
  }

  console.log('\n🎯 ANALYSIS COMPLETE');
  console.log('====================');
}

testBackendDetailedErrors().catch(console.error);