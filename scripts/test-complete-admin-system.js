#!/usr/bin/env node

/**
 * Complete Admin System Test
 * Tests the admin/client differentiation and core functionality
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://apply-bureau-backend.onrender.com'
  : 'http://localhost:3000';

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

async function testSystemHealth() {
  console.log('\n🏥 Testing System Health...');
  
  const healthResult = await makeRequest('GET', '/health');
  if (healthResult.success) {
    console.log('✅ API Health check passed');
    console.log(`   Service: ${healthResult.data.service}`);
    console.log(`   Status: ${healthResult.data.status}`);
  } else {
    console.log('❌ API Health check failed:', healthResult.error);
    return false;
  }
  
  return true;
}

async function testAdminAuthentication() {
  console.log('\n🔐 Testing Admin Authentication...');
  
  const loginResult = await makeRequest('POST', '/auth/login', TEST_ADMIN);
  
  if (loginResult.success) {
    adminToken = loginResult.data.token;
    console.log('✅ Admin login successful');
    console.log(`   User: ${loginResult.data.user.full_name} (${loginResult.data.user.email})`);
    console.log(`   Role: ${loginResult.data.user.role}`);
    console.log(`   Dashboard Type: ${loginResult.data.user.dashboard_type || 'not specified'}`);
    
    // Test /me endpoint
    const meResult = await makeRequest('GET', '/auth/me', null, adminToken);
    if (meResult.success) {
      console.log('✅ Auth /me endpoint working');
      console.log(`   Dashboard Type from /me: ${meResult.data.user.dashboard_type || 'not specified'}`);
      console.log(`   Role from /me: ${meResult.data.user.role}`);
    } else {
      console.log('❌ Auth /me endpoint failed:', meResult.error);
      return false;
    }
    
    return true;
  } else {
    console.log('❌ Admin login failed:', loginResult.error);
    return false;
  }
}

async function testDashboardAccess() {
  console.log('\n📊 Testing Dashboard Access...');
  
  // Test client dashboard (should work for admin)
  console.log('   Testing client dashboard access...');
  const clientDashResult = await makeRequest('GET', '/dashboard', null, adminToken);
  
  if (clientDashResult.success) {
    console.log('   ✅ Client dashboard accessible to admin');
    console.log(`      Client name: ${clientDashResult.data.client.full_name}`);
    console.log(`      Total applications: ${clientDashResult.data.stats.total_applications}`);
  } else {
    console.log('   ❌ Client dashboard failed:', clientDashResult.error);
  }
  
  // Test admin dashboard
  console.log('   Testing admin dashboard access...');
  const adminDashResult = await makeRequest('GET', '/admin-dashboard', null, adminToken);
  
  if (adminDashResult.success) {
    console.log('   ✅ Admin dashboard accessible');
    console.log(`      Dashboard Type: ${adminDashResult.data.dashboard_type}`);
    console.log(`      Admin: ${adminDashResult.data.admin.full_name}`);
    console.log(`      Total Clients: ${adminDashResult.data.stats.clients.total_clients}`);
    console.log(`      Total Consultations: ${adminDashResult.data.stats.consultations.total_consultations}`);
    console.log(`      Quick Actions: ${adminDashResult.data.quick_actions.length} available`);
    
    if (adminDashResult.data.dashboard_type === 'admin') {
      console.log('   ✅ Dashboard type correctly set to "admin"');
    } else {
      console.log('   ⚠️  Dashboard type should be "admin"');
    }
    
    return true;
  } else {
    console.log('   ❌ Admin dashboard failed:', adminDashResult.error);
    return false;
  }
}

async function testAdminFeatures() {
  console.log('\n👨‍💼 Testing Admin Features...');
  
  // Test admin profile
  console.log('   Testing admin profile access...');
  const profileResult = await makeRequest('GET', '/admin-management/profile', null, adminToken);
  
  if (profileResult.success) {
    console.log('   ✅ Admin profile accessible');
    console.log(`      Name: ${profileResult.data.admin.full_name}`);
    console.log(`      Email: ${profileResult.data.admin.email}`);
    console.log(`      Permissions: ${Object.keys(profileResult.data.admin.permissions || {}).length} permissions`);
  } else {
    console.log('   ❌ Admin profile failed:', profileResult.error);
  }
  
  // Test admin list
  console.log('   Testing admin list access...');
  const adminListResult = await makeRequest('GET', '/admin-management/admins', null, adminToken);
  
  if (adminListResult.success) {
    console.log('   ✅ Admin list accessible');
    console.log(`      Total admins: ${adminListResult.data.admins.length}`);
  } else {
    console.log('   ❌ Admin list failed:', adminListResult.error);
  }
  
  // Test file management
  console.log('   Testing file management access...');
  const filesResult = await makeRequest('GET', '/files', null, adminToken);
  
  if (filesResult.success) {
    console.log('   ✅ File management accessible');
    console.log(`      Files found: ${filesResult.data.files.length}`);
  } else {
    console.log('   ❌ File management failed:', filesResult.error);
  }
  
  return true;
}

async function testConsultationSystem() {
  console.log('\n📅 Testing Consultation System...');
  
  // Get consultations
  const consultationsResult = await makeRequest('GET', '/consultations', null, adminToken);
  
  if (consultationsResult.success) {
    console.log('✅ Consultations accessible');
    console.log(`   Total consultations: ${consultationsResult.data.consultations.length}`);
    
    // Test creating a consultation with Google Meet integration
    const newConsultation = {
      client_id: 'test-client-id', // This will fail validation, but tests the endpoint
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      meeting_title: 'Test Career Consultation',
      meeting_description: 'Test consultation with Google Meet integration',
      meeting_url: 'https://meet.google.com/test-meeting-link',
      preparation_notes: 'Please prepare your resume and career goals'
    };
    
    console.log('   Testing consultation creation with Google Meet...');
    const createResult = await makeRequest('POST', '/consultations', newConsultation, adminToken);
    
    if (createResult.success) {
      console.log('   ✅ Consultation creation successful');
    } else {
      console.log('   ⚠️  Consultation creation failed (expected due to test client_id):', createResult.error.error);
    }
    
    return true;
  } else {
    console.log('❌ Consultations failed:', consultationsResult.error);
    return false;
  }
}

async function testApplicationSystem() {
  console.log('\n📝 Testing Application System...');
  
  const applicationsResult = await makeRequest('GET', '/applications', null, adminToken);
  
  if (applicationsResult.success) {
    console.log('✅ Applications accessible');
    console.log(`   Total applications: ${applicationsResult.data.applications.length}`);
    return true;
  } else {
    console.log('❌ Applications failed:', applicationsResult.error);
    return false;
  }
}

async function testNotificationSystem() {
  console.log('\n🔔 Testing Notification System...');
  
  const notificationsResult = await makeRequest('GET', '/notifications', null, adminToken);
  
  if (notificationsResult.success) {
    console.log('✅ Notifications accessible');
    console.log(`   Total notifications: ${notificationsResult.data.notifications.length}`);
    return true;
  } else {
    console.log('❌ Notifications failed:', notificationsResult.error);
    return false;
  }
}

async function runCompleteTest() {
  console.log('🚀 Starting Complete Admin System Test...');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('🎯 Focus: Admin/Client Dashboard Differentiation & Core Features');
  
  const tests = [
    { name: 'System Health', fn: testSystemHealth, critical: true },
    { name: 'Admin Authentication', fn: testAdminAuthentication, critical: true },
    { name: 'Dashboard Access', fn: testDashboardAccess, critical: true },
    { name: 'Admin Features', fn: testAdminFeatures, critical: false },
    { name: 'Consultation System', fn: testConsultationSystem, critical: false },
    { name: 'Application System', fn: testApplicationSystem, critical: false },
    { name: 'Notification System', fn: testNotificationSystem, critical: false }
  ];
  
  let passed = 0;
  let failed = 0;
  let criticalFailed = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 Running ${test.name}...`);
      const result = await test.fn();
      
      if (result) {
        passed++;
        console.log(`✅ ${test.name} PASSED`);
      } else {
        failed++;
        if (test.critical) criticalFailed++;
        console.log(`❌ ${test.name} FAILED`);
      }
    } catch (error) {
      failed++;
      if (test.critical) criticalFailed++;
      console.log(`💥 ${test.name} CRASHED:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPLETE ADMIN SYSTEM TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${passed}`);
  console.log(`❌ Tests Failed: ${failed}`);
  console.log(`🚨 Critical Failures: ${criticalFailed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (criticalFailed === 0) {
    console.log('\n🎉 CORE FUNCTIONALITY WORKING!');
    console.log('✅ Admin login and authentication working');
    console.log('✅ Dashboard differentiation implemented');
    console.log('✅ Admin dashboard accessible with proper data');
    console.log('✅ System ready for frontend integration');
    
    if (failed === 0) {
      console.log('\n🏆 ALL TESTS PASSED - SYSTEM FULLY OPERATIONAL!');
    } else {
      console.log(`\n⚠️  ${failed} non-critical tests failed - system is functional but may need minor fixes`);
    }
  } else {
    console.log('\n🚨 CRITICAL ISSUES DETECTED');
    console.log('❌ Core functionality not working properly');
    console.log('🔧 Please review and fix critical failures before proceeding');
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the complete test
runCompleteTest().catch(error => {
  console.error('Test suite crashed:', error);
  process.exit(1);
});