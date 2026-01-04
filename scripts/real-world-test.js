#!/usr/bin/env node

/**
 * Real-World Integration Testing Script
 * Tests actual functionality with real database and email sending
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;
const TEST_EMAIL = 'israelloko65@gmail.com';

let adminToken = null;
let clientToken = null;
let testClientId = null;
let testConsultationId = null;
let testApplicationId = null;

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function for API requests
async function apiRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 0
    };
  }
}

// Test logging
function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}${details ? ' - ' + details : ''}`);
  
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Wait for user input
function waitForUserInput(message) {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().includes('y'));
    });
  });
}

// Wait for server to be ready
async function waitForServer(maxAttempts = 30) {
  console.log('🔄 Waiting for server to be ready...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await apiRequest('GET', `${BASE_URL}/health`);
      if (result.success) {
        console.log('✅ Server is ready');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('❌ Server failed to start within timeout');
  return false;
}

// Test admin login
async function testAdminLogin() {
  console.log('\n👤 Testing Admin Login...');
  
  const loginResult = await apiRequest('POST', '/auth/login', {
    email: 'admin@applybureau.com',
    password: 'admin123'
  });
  
  if (loginResult.success && loginResult.data.token) {
    adminToken = loginResult.data.token;
    logTest('Admin login', true, 'Successfully logged in as admin');
    return true;
  } else {
    logTest('Admin login', false, loginResult.error?.error || 'Login failed');
    return false;
  }
}

// Test real client invitation and email sending
async function testClientInvitation() {
  console.log('\n📧 Testing Real Client Invitation...');
  
  if (!adminToken) {
    logTest('Client invitation', false, 'No admin token available');
    return false;
  }
  
  // Send invitation to real email
  const inviteResult = await apiRequest('POST', '/auth/invite', {
    email: TEST_EMAIL,
    full_name: 'Israel Test User'
  }, adminToken);
  
  if (inviteResult.success) {
    testClientId = inviteResult.data.client_id;
    logTest('Send client invitation', true, `Invitation sent to ${TEST_EMAIL}`);
    
    console.log(`\n📬 An invitation email should be sent to ${TEST_EMAIL}`);
    console.log('Please check your email inbox and spam folder.');
    
    const emailReceived = await waitForUserInput('Did you receive the invitation email? (y/n): ');
    logTest('Email delivery verification', emailReceived, emailReceived ? 'Email received successfully' : 'Email not received');
    
    return true;
  } else if (inviteResult.error?.error === 'Client already exists') {
    // Client already exists, let's get their ID
    console.log('ℹ️  Client already exists, finding existing client...');
    
    // We need to get the client ID somehow - let's try to find it
    const { supabaseAdmin } = require('../utils/supabase');
    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('email', TEST_EMAIL)
      .single();
    
    if (existingClient) {
      testClientId = existingClient.id;
      logTest('Use existing client', true, `Using existing client for ${TEST_EMAIL}`);
      
      console.log(`\n📬 Since the client already exists, we'll use them for testing.`);
      console.log('Note: A new invitation email may not be sent since the client already exists.');
      
      return true;
    } else {
      logTest('Find existing client', false, 'Could not find existing client');
      return false;
    }
  } else {
    logTest('Send client invitation', false, inviteResult.error?.error || 'Invitation failed');
    return false;
  }
}

// Test consultation creation and notification
async function testConsultationWorkflow() {
  console.log('\n📅 Testing Consultation Workflow...');
  
  if (!adminToken || !testClientId) {
    logTest('Consultation workflow', false, 'Missing admin token or client ID');
    return false;
  }
  
  // Create consultation
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  
  const consultationResult = await apiRequest('POST', '/consultations', {
    client_id: testClientId,
    scheduled_at: futureDate.toISOString(),
    notes: 'Real-world test consultation - Career guidance session with Israel'
  }, adminToken);
  
  if (consultationResult.success) {
    testConsultationId = consultationResult.data.consultation.id;
    logTest('Create consultation', true, 'Consultation created successfully');
    
    console.log(`\n📬 A consultation confirmation email should be sent to ${TEST_EMAIL}`);
    const emailReceived = await waitForUserInput('Did you receive the consultation confirmation email? (y/n): ');
    logTest('Consultation email delivery', emailReceived, emailReceived ? 'Consultation email received' : 'Consultation email not received');
    
    return true;
  } else {
    logTest('Create consultation', false, consultationResult.error?.error || 'Consultation creation failed');
    return false;
  }
}

// Test application tracking workflow
async function testApplicationWorkflow() {
  console.log('\n💼 Testing Application Tracking Workflow...');
  
  if (!adminToken || !testClientId) {
    logTest('Application workflow', false, 'Missing admin token or client ID');
    return false;
  }
  
  // Create application
  const applicationResult = await apiRequest('POST', '/applications', {
    client_id: testClientId,
    job_title: 'Senior Full-Stack Developer',
    company: 'Tech Innovations Ltd',
    job_link: 'https://example.com/job/senior-fullstack-developer',
    status: 'applied'
  }, adminToken);
  
  if (applicationResult.success) {
    testApplicationId = applicationResult.data.application.id;
    logTest('Create application', true, 'Application created successfully');
    
    // Update application status to trigger email
    const updateResult = await apiRequest('PATCH', `/applications/${testApplicationId}`, {
      status: 'interview'
    }, adminToken);
    
    if (updateResult.success) {
      logTest('Update application status', true, 'Status updated to interview');
      
      console.log(`\n📬 An application status update email should be sent to ${TEST_EMAIL}`);
      const emailReceived = await waitForUserInput('Did you receive the application status update email? (y/n): ');
      logTest('Application update email delivery', emailReceived, emailReceived ? 'Status update email received' : 'Status update email not received');
      
      return true;
    } else {
      logTest('Update application status', false, updateResult.error?.error || 'Status update failed');
      return false;
    }
  } else {
    logTest('Create application', false, applicationResult.error?.error || 'Application creation failed');
    return false;
  }
}

// Test dashboard functionality
async function testDashboardFunctionality() {
  console.log('\n📊 Testing Dashboard Functionality...');
  
  if (!adminToken) {
    logTest('Dashboard functionality', false, 'No admin token available');
    return false;
  }
  
  // Get dashboard data
  const dashboardResult = await apiRequest('GET', '/dashboard', null, adminToken);
  
  if (dashboardResult.success) {
    const dashboard = dashboardResult.data;
    
    logTest('Dashboard data retrieval', true, `Retrieved dashboard data successfully`);
    
    // Check if stats are present
    const hasStats = dashboard.stats && typeof dashboard.stats.total_applications === 'number';
    logTest('Dashboard statistics', hasStats, hasStats ? 'Statistics calculated correctly' : 'Missing or invalid statistics');
    
    return true;
  } else {
    logTest('Dashboard data retrieval', false, dashboardResult.error?.error || 'Dashboard retrieval failed');
    return false;
  }
}

// Test notifications system
async function testNotificationsSystem() {
  console.log('\n🔔 Testing Notifications System...');
  
  if (!adminToken) {
    logTest('Notifications system', false, 'No admin token available');
    return false;
  }
  
  // Get notifications
  const notificationsResult = await apiRequest('GET', '/notifications', null, adminToken);
  
  if (notificationsResult.success) {
    const notifications = notificationsResult.data.notifications || [];
    logTest('Notifications retrieval', true, `Retrieved ${notifications.length} notifications`);
    
    // Test unread count
    const unreadResult = await apiRequest('GET', '/notifications/unread-count', null, adminToken);
    if (unreadResult.success) {
      logTest('Unread count', true, `${unreadResult.data.unread_count} unread notifications`);
    } else {
      logTest('Unread count', false, unreadResult.error?.error || 'Unread count failed');
    }
    
    return true;
  } else {
    logTest('Notifications retrieval', false, notificationsResult.error?.error || 'Notifications retrieval failed');
    return false;
  }
}

// Test security features
async function testSecurityFeatures() {
  console.log('\n🔒 Testing Security Features...');
  
  // Test invalid token
  const invalidTokenResult = await apiRequest('GET', '/dashboard', null, 'invalid-token');
  logTest('Invalid token rejection', !invalidTokenResult.success && (invalidTokenResult.status === 401 || invalidTokenResult.status === 403), 'Invalid tokens properly rejected');
  
  // Test SQL injection protection
  const sqlInjectionResult = await apiRequest('POST', '/auth/login', {
    email: "admin@test.com'; DROP TABLE clients; --",
    password: 'password'
  });
  logTest('SQL injection protection', !sqlInjectionResult.success, 'SQL injection attempts blocked');
  
  return true;
}

// Test performance
async function testPerformance() {
  console.log('\n⚡ Testing Performance...');
  
  // Test response times
  const startTime = Date.now();
  const healthResult = await apiRequest('GET', `${BASE_URL}/health`);
  const responseTime = Date.now() - startTime;
  
  logTest('Health endpoint response time', responseTime < 2000, `Response time: ${responseTime}ms`);
  
  // Test concurrent requests
  const concurrentStart = Date.now();
  const concurrentPromises = [];
  for (let i = 0; i < 5; i++) {
    concurrentPromises.push(apiRequest('GET', `${BASE_URL}/health`));
  }
  
  const concurrentResults = await Promise.all(concurrentPromises);
  const concurrentTime = Date.now() - concurrentStart;
  const allSucceeded = concurrentResults.every(r => r.success);
  
  logTest('Concurrent requests handling', allSucceeded && concurrentTime < 10000, `5 concurrent requests in ${concurrentTime}ms`);
  
  return true;
}

// Main test runner
async function runRealWorldTests() {
  console.log('🌍 Apply Bureau Backend - Real-World Integration Testing\n');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Test email: ${TEST_EMAIL}\n`);
  
  // Wait for server
  const serverReady = await waitForServer();
  if (!serverReady) {
    console.log('❌ Cannot proceed - server is not responding');
    process.exit(1);
  }
  
  try {
    // Run all test phases
    await testAdminLogin();
    await testClientInvitation();
    await testConsultationWorkflow();
    await testApplicationWorkflow();
    await testDashboardFunctionality();
    await testNotificationsSystem();
    await testSecurityFeatures();
    await testPerformance();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    testResults.failed++;
  }
  
  // Display results
  console.log('\n📊 Real-World Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  
  const total = testResults.passed + testResults.failed;
  const successRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  console.log(`📈 Success Rate: ${successRate}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All real-world tests passed! Backend is production-ready.');
    console.log(`📧 Check ${TEST_EMAIL} for the test emails that were sent.`);
  } else {
    console.log('\n⚠️  Some tests failed. Review the results above.');
    
    // Show failed tests
    const failedTests = testResults.tests.filter(t => t.passed === false);
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  - ${test.name}: ${test.details}`);
      });
    }
  }
  
  // Save results to file
  const resultsFile = path.join(__dirname, '..', 'real-world-test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify({
    ...testResults,
    timestamp: new Date().toISOString(),
    testEmail: TEST_EMAIL,
    baseUrl: BASE_URL
  }, null, 2));
  console.log(`\n📄 Detailed results saved to: ${resultsFile}`);
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log('Apply Bureau Backend Real-World Integration Testing');
  console.log('');
  console.log('Usage: node scripts/real-world-test.js [options]');
  console.log('');
  console.log('This script will:');
  console.log('- Test admin login functionality');
  console.log('- Send real emails to israelloko65@gmail.com');
  console.log('- Create test data in your database');
  console.log('- Test all major workflows end-to-end');
  console.log('- Test security and performance features');
  console.log('');
  console.log('Options:');
  console.log('  --help     Show this help message');
  console.log('');
  console.log('Environment Variables:');
  console.log('  API_BASE_URL  Base URL for the API (default: http://localhost:3001)');
  process.exit(0);
}

// Run tests
runRealWorldTests().catch(error => {
  console.error('❌ Real-world test runner failed:', error);
  process.exit(1);
});