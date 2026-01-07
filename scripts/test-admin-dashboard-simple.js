#!/usr/bin/env node

/**
 * Simple Admin Dashboard Test
 * Tests basic admin functionality locally
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

const TEST_ADMIN = {
  email: 'admin@applybureau.com',
  password: 'admin123'
};

let adminToken = null;

async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function testHealthCheck() {
  console.log('🏥 Testing Health Check...');
  const result = await makeRequest('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health check passed');
    return true;
  } else {
    console.log('❌ Health check failed:', result.error);
    return false;
  }
}

async function testAdminLogin() {
  console.log('🔐 Testing Admin Login...');
  const result = await makeRequest('POST', '/auth/login', TEST_ADMIN);
  
  if (result.success) {
    adminToken = result.data.token;
    console.log('✅ Admin login successful');
    console.log(`   User: ${result.data.user.full_name}`);
    console.log(`   Role: ${result.data.user.role}`);
    console.log(`   Dashboard Type: ${result.data.user.dashboard_type || 'not set'}`);
    return true;
  } else {
    console.log('❌ Admin login failed:', result.error);
    return false;
  }
}

async function testAuthMe() {
  console.log('🔍 Testing Auth Me...');
  const result = await makeRequest('GET', '/auth/me', null, adminToken);
  
  if (result.success) {
    console.log('✅ Auth me successful');
    console.log(`   Dashboard Type: ${result.data.user.dashboard_type || 'not set'}`);
    console.log(`   Role: ${result.data.user.role}`);
    return true;
  } else {
    console.log('❌ Auth me failed:', result.error);
    return false;
  }
}

async function testClientDashboard() {
  console.log('📱 Testing Client Dashboard...');
  const result = await makeRequest('GET', '/dashboard', null, adminToken);
  
  if (result.success) {
    console.log('✅ Client dashboard accessible');
    return true;
  } else {
    console.log('❌ Client dashboard failed:', result.error);
    return false;
  }
}

async function testAdminDashboard() {
  console.log('📊 Testing Admin Dashboard...');
  const result = await makeRequest('GET', '/admin-dashboard', null, adminToken);
  
  if (result.success) {
    console.log('✅ Admin dashboard accessible');
    console.log(`   Dashboard Type: ${result.data.dashboard_type}`);
    return true;
  } else {
    console.log('❌ Admin dashboard failed:', result.error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Simple Admin Dashboard Tests...');
  console.log(`📍 Testing against: ${BASE_URL}`);
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'Auth Me', fn: testAuthMe },
    { name: 'Client Dashboard', fn: testClientDashboard },
    { name: 'Admin Dashboard', fn: testAdminDashboard }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} threw an error:`, error.message);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All basic tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed.');
  }
}

runTests().catch(console.error);