#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';

// Test configuration
const TEST_CONFIG = {
  DELAY_BETWEEN_TESTS: 2000, // 2 seconds to avoid rate limiting
  MAX_RETRIES: 3,
  TIMEOUT: 10000 // 10 seconds
};

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logTest = (testName, status, details = '') => {
  testResults.total++;
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusIcon} ${testName}: ${status}`);
  if (details) console.log(`   ${details}`);
  
  testResults.details.push({ testName, status, details });
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.skipped++;
};

const makeRequest = async (method, endpoint, data = null, token = null, retries = 0) => {
  try {
    const config = {
      method,
      url: `${BACKEND_URL}${endpoint}`,
      timeout: TEST_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    if (error.response?.status === 429 && retries < TEST_CONFIG.MAX_RETRIES) {
      console.log(`   Rate limited, retrying in ${TEST_CONFIG.DELAY_BETWEEN_TESTS * 2}ms...`);
      await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS * 2);
      return makeRequest(method, endpoint, data, token, retries + 1);
    }
    
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 0
    };
  }
};

async function testCompleteBackend() {
  console.log('🚀 COMPREHENSIVE BACKEND TEST SUITE');
  console.log('=====================================');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Test Configuration: ${JSON.stringify(TEST_CONFIG, null, 2)}\n`);

  let adminToken = null;
  let clientToken = null;

  // ========================================
  // 1. AUTHENTICATION TESTS
  // ========================================
  console.log('🔐 AUTHENTICATION TESTS');
  console.log('========================\n');

  // Test 1.1: Health Check
  console.log('1.1 Health Check...');
  const healthResult = await makeRequest('GET', '/api/health');
  logTest('Health Check', healthResult.success ? 'PASS' : 'FAIL', 
    healthResult.success ? `Status: ${healthResult.data.status}` : healthResult.error);
  await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

  // Test 1.2: Admin Login
  console.log('\n1.2 Admin Login...');
  const adminLoginResult = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@applybureau.com',
    password: 'admin123'
  });
  
  if (adminLoginResult.success) {
    adminToken = adminLoginResult.data.token;
    logTest('Admin Login', 'PASS', `Role: ${adminLoginResult.data.user?.role}`);
  } else {
    logTest('Admin Login', 'FAIL', adminLoginResult.error);
  }
  await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

  // Test 1.3: Token Validation
  if (adminToken) {
    console.log('\n1.3 Token Validation...');
    const tokenValidationResult = await makeRequest('GET', '/api/auth/me', null, adminToken);
    logTest('Token Validation', tokenValidationResult.success ? 'PASS' : 'FAIL',
      tokenValidationResult.success ? `User: ${tokenValidationResult.data.email}` : tokenValidationResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);
  }

  // ========================================
  // 2. DASHBOARD TESTS
  // ========================================
  console.log('\n📊 DASHBOARD TESTS');
  console.log('==================\n');

  if (adminToken) {
    // Test 2.1: Main Dashboard
    console.log('2.1 Main Dashboard...');
    const dashboardResult = await makeRequest('GET', '/api/dashboard', null, adminToken);
    logTest('Main Dashboard', dashboardResult.success ? 'PASS' : 'FAIL',
      dashboardResult.success ? `Stats loaded: ${Object.keys(dashboardResult.data.stats || {}).length} categories` : dashboardResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    // Test 2.2: Dashboard Stats
    console.log('\n2.2 Dashboard Statistics...');
    const statsResult = await makeRequest('GET', '/api/dashboard/stats', null, adminToken);
    logTest('Dashboard Statistics', statsResult.success ? 'PASS' : 'FAIL',
      statsResult.success ? `Total applications: ${statsResult.data.total_applications || 0}` : statsResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    // Test 2.3: Admin Dashboard
    console.log('\n2.3 Admin Dashboard...');
    const adminDashboardResult = await makeRequest('GET', '/api/admin-dashboard', null, adminToken);
    logTest('Admin Dashboard', adminDashboardResult.success ? 'PASS' : 'FAIL',
      adminDashboardResult.success ? `Dashboard type: ${adminDashboardResult.data.dashboard_type}` : adminDashboardResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    // Test 2.4: Admin Dashboard Clients
    console.log('\n2.4 Admin Dashboard Clients...');
    const adminClientsResult = await makeRequest('GET', '/api/admin-dashboard/clients', null, adminToken);
    logTest('Admin Dashboard Clients', adminClientsResult.success ? 'PASS' : 'FAIL',
      adminClientsResult.success ? `Clients found: ${adminClientsResult.data.total || 0}` : adminClientsResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    // Test 2.5: Admin Dashboard Analytics
    console.log('\n2.5 Admin Dashboard Analytics...');
    const analyticsResult = await makeRequest('GET', '/api/admin-dashboard/analytics', null, adminToken);
    logTest('Admin Dashboard Analytics', analyticsResult.success ? 'PASS' : 'FAIL',
      analyticsResult.success ? `Period: ${analyticsResult.data.period}` : analyticsResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    // Test 2.6: Enhanced Dashboard Admin Stats
    console.log('\n2.6 Enhanced Dashboard Admin Stats...');
    const enhancedAdminResult = await makeRequest('GET', '/api/enhanced-dashboard/admin/stats', null, adminToken);
    logTest('Enhanced Dashboard Admin Stats', enhancedAdminResult.success ? 'PASS' : 'FAIL',
      enhancedAdminResult.success ? `Online users: ${enhancedAdminResult.data.stats?.system?.online_users || 0}` : enhancedAdminResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);
  }

  // ========================================
  // 3. CONTACTS AND CONSULTATION TESTS
  // ========================================
  console.log('\n📞 CONTACTS & CONSULTATION TESTS');
  console.log('=================================\n');

  if (adminToken) {
    // Test 3.1: Consultation Requests
    console.log('3.1 Consultation Requests...');
    const consultationRequestsResult = await makeRequest('GET', '/api/consultation-requests', null, adminToken);
    logTest('Consultation Requests', consultationRequestsResult.success ? 'PASS' : 'FAIL',
      consultationRequestsResult.success ? `Records: ${consultationRequestsResult.data.data?.length || 0}` : consultationRequestsResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    // Test 3.2: Contact Requests
    console.log('\n3.2 Contact Requests...');
    const contactRequestsResult = await makeRequest('GET', '/api/contact-requests', null, adminToken);
    logTest('Contact Requests', contactRequestsResult.success ? 'PASS' : 'FAIL',
      contactRequestsResult.success ? `Records: ${contactRequestsResult.data.data?.length || 0}` : contactRequestsResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    // Test 3.3: Dashboard Contacts
    console.log('\n3.3 Dashboard Contacts...');
    const dashboardContactsResult = await makeRequest('GET', '/api/dashboard/contacts', null, adminToken);
    logTest('Dashboard Contacts', dashboardContactsResult.success ? 'PASS' : 'FAIL',
      dashboardContactsResult.success ? `Total: ${dashboardContactsResult.data.total || 0}` : dashboardContactsResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);
  }

  // ========================================
  // 4. ADMIN MANAGEMENT TESTS
  // ========================================
  console.log('\n👥 ADMIN MANAGEMENT TESTS');
  console.log('=========================\n');

  if (adminToken) {
    // Test 4.1: Admin Management List
    console.log('4.1 Admin Management List...');
    const adminManagementResult = await makeRequest('GET', '/api/admin-management', null, adminToken);
    logTest('Admin Management List', adminManagementResult.success ? 'PASS' : 'FAIL',
      adminManagementResult.success ? `Admins found: ${adminManagementResult.data.data?.length || 0}` : adminManagementResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    // Test 4.2: Admin Profile
    console.log('\n4.2 Admin Profile...');
    const adminProfileResult = await makeRequest('GET', '/api/admin/profile', null, adminToken);
    logTest('Admin Profile', adminProfileResult.success ? 'PASS' : 'FAIL',
      adminProfileResult.success ? `Admin: ${adminProfileResult.data.email}` : adminProfileResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);
  }

  // ========================================
  // 5. NOTIFICATION TESTS
  // ========================================
  console.log('\n🔔 NOTIFICATION TESTS');
  console.log('=====================\n');

  if (adminToken) {
    // Test 5.1: Get Notifications
    console.log('5.1 Get Notifications...');
    const notificationsResult = await makeRequest('GET', '/api/enhanced-dashboard/notifications', null, adminToken);
    logTest('Get Notifications', notificationsResult.success ? 'PASS' : 'FAIL',
      notificationsResult.success ? `Notifications: ${notificationsResult.data.notifications?.length || 0}` : notificationsResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    // Test 5.2: Dashboard Activities
    console.log('\n5.2 Dashboard Activities...');
    const activitiesResult = await makeRequest('GET', '/api/enhanced-dashboard/activities', null, adminToken);
    logTest('Dashboard Activities', activitiesResult.success ? 'PASS' : 'FAIL',
      activitiesResult.success ? `Activities: ${activitiesResult.data.activities?.length || 0}` : activitiesResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    // Test 5.3: Online Users
    console.log('\n5.3 Online Users...');
    const onlineUsersResult = await makeRequest('GET', '/api/enhanced-dashboard/online-users', null, adminToken);
    logTest('Online Users', onlineUsersResult.success ? 'PASS' : 'FAIL',
      onlineUsersResult.success ? `Online: ${onlineUsersResult.data.total_online || 0}` : onlineUsersResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);
  }

  // ========================================
  // 6. EMAIL ACTION TESTS
  // ========================================
  console.log('\n📧 EMAIL ACTION TESTS');
  console.log('=====================\n');

  // Test 6.1: Email Actions Health
  console.log('6.1 Email Actions Health...');
  const emailHealthResult = await makeRequest('GET', '/api/email-actions/health');
  logTest('Email Actions Health', emailHealthResult.success ? 'PASS' : 'FAIL',
    emailHealthResult.success ? `Service: ${emailHealthResult.data.service}` : emailHealthResult.error);
  await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

  // Test 6.2: Email Action Token Validation (should fail with 403)
  console.log('\n6.2 Email Action Token Validation...');
  const emailActionResult = await makeRequest('GET', '/api/email-actions/consultation/test-id/confirm/invalid-token');
  logTest('Email Action Token Validation', emailActionResult.status === 403 ? 'PASS' : 'FAIL',
    emailActionResult.status === 403 ? 'Correctly rejected invalid token' : `Unexpected status: ${emailActionResult.status}`);
  await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

  // ========================================
  // 7. PUBLIC ENDPOINT TESTS
  // ========================================
  console.log('\n🌐 PUBLIC ENDPOINT TESTS');
  console.log('========================\n');

  // Test 7.1: Submit Contact Request
  console.log('7.1 Submit Contact Request...');
  const contactSubmissionResult = await makeRequest('POST', '/api/contact-requests', {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    subject: 'Test Contact',
    message: 'This is a test contact submission'
  });
  logTest('Submit Contact Request', contactSubmissionResult.success ? 'PASS' : 'FAIL',
    contactSubmissionResult.success ? `Contact ID: ${contactSubmissionResult.data.id}` : contactSubmissionResult.error);
  await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

  // Test 7.2: Submit Consultation Request
  console.log('\n7.2 Submit Consultation Request...');
  const consultationSubmissionResult = await makeRequest('POST', '/api/consultation-requests', {
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
  });
  logTest('Submit Consultation Request', consultationSubmissionResult.success ? 'PASS' : 'FAIL',
    consultationSubmissionResult.success ? `Consultation ID: ${consultationSubmissionResult.data.id}` : consultationSubmissionResult.error);
  await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

  // ========================================
  // 8. WORKFLOW TESTS
  // ========================================
  console.log('\n🔄 WORKFLOW TESTS');
  console.log('=================\n');

  if (adminToken) {
    // Test 8.1: Workflow Consultation Requests
    console.log('8.1 Workflow Consultation Requests...');
    const workflowConsultationsResult = await makeRequest('GET', '/api/workflow/consultation-requests', null, adminToken);
    logTest('Workflow Consultation Requests', workflowConsultationsResult.success ? 'PASS' : 'FAIL',
      workflowConsultationsResult.success ? `Records: ${workflowConsultationsResult.data.data?.length || 0}` : workflowConsultationsResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

    // Test 8.2: Applications Workflow
    console.log('\n8.2 Applications Workflow...');
    const applicationsWorkflowResult = await makeRequest('GET', '/api/applications-workflow', null, adminToken);
    logTest('Applications Workflow', applicationsWorkflowResult.success ? 'PASS' : 'FAIL',
      applicationsWorkflowResult.success ? 'Workflow accessible' : applicationsWorkflowResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);
  }

  // ========================================
  // 9. MESSAGING TESTS
  // ========================================
  console.log('\n💬 MESSAGING TESTS');
  console.log('==================\n');

  if (adminToken) {
    // Test 9.1: Get Messages
    console.log('9.1 Get Messages...');
    const messagesResult = await makeRequest('GET', '/api/enhanced-dashboard/messages', null, adminToken);
    logTest('Get Messages', messagesResult.success ? 'PASS' : 'FAIL',
      messagesResult.success ? `Messages: ${messagesResult.data.messages?.length || 0}` : messagesResult.error);
    await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);
  }

  // ========================================
  // 10. ERROR HANDLING TESTS
  // ========================================
  console.log('\n⚠️ ERROR HANDLING TESTS');
  console.log('=======================\n');

  // Test 10.1: Unauthorized Access
  console.log('10.1 Unauthorized Access...');
  const unauthorizedResult = await makeRequest('GET', '/api/admin-dashboard');
  logTest('Unauthorized Access', unauthorizedResult.status === 401 ? 'PASS' : 'FAIL',
    unauthorizedResult.status === 401 ? 'Correctly rejected unauthorized request' : `Unexpected status: ${unauthorizedResult.status}`);
  await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

  // Test 10.2: Invalid Endpoint
  console.log('\n10.2 Invalid Endpoint...');
  const invalidEndpointResult = await makeRequest('GET', '/api/nonexistent-endpoint');
  logTest('Invalid Endpoint', invalidEndpointResult.status === 404 ? 'PASS' : 'FAIL',
    invalidEndpointResult.status === 404 ? 'Correctly returned 404' : `Unexpected status: ${invalidEndpointResult.status}`);
  await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);

  // ========================================
  // TEST RESULTS SUMMARY
  // ========================================
  console.log('\n🎯 TEST RESULTS SUMMARY');
  console.log('=======================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️ Skipped: ${testResults.skipped}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  // Detailed results
  console.log('\n📋 DETAILED RESULTS');
  console.log('===================');
  
  const failedTests = testResults.details.filter(test => test.status === 'FAIL');
  const passedTests = testResults.details.filter(test => test.status === 'PASS');
  
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(test => {
      console.log(`   - ${test.testName}: ${test.details}`);
    });
  }

  if (passedTests.length > 0) {
    console.log('\n✅ PASSED TESTS:');
    passedTests.forEach(test => {
      console.log(`   - ${test.testName}`);
    });
  }

  // System health assessment
  console.log('\n🏥 SYSTEM HEALTH ASSESSMENT');
  console.log('===========================');
  
  const successRate = (testResults.passed / testResults.total) * 100;
  let healthStatus = 'CRITICAL';
  let healthColor = '🔴';
  
  if (successRate >= 90) {
    healthStatus = 'EXCELLENT';
    healthColor = '🟢';
  } else if (successRate >= 75) {
    healthStatus = 'GOOD';
    healthColor = '🟡';
  } else if (successRate >= 50) {
    healthStatus = 'FAIR';
    healthColor = '🟠';
  }

  console.log(`${healthColor} Overall System Health: ${healthStatus} (${successRate.toFixed(1)}%)`);
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================');
  
  if (failedTests.length === 0) {
    console.log('✅ All systems operational - no action required');
  } else {
    console.log('⚠️ Issues detected:');
    if (failedTests.some(t => t.testName.includes('Login'))) {
      console.log('   - Authentication system needs attention');
    }
    if (failedTests.some(t => t.testName.includes('Dashboard'))) {
      console.log('   - Dashboard endpoints need investigation');
    }
    if (failedTests.some(t => t.testName.includes('Contact'))) {
      console.log('   - Contact/consultation system needs review');
    }
  }

  console.log('\n🎉 COMPREHENSIVE BACKEND TEST COMPLETE');
  console.log(`Test Duration: ${Date.now() - startTime}ms`);
  console.log('=======================================');
}

const startTime = Date.now();
testCompleteBackend().catch(console.error);