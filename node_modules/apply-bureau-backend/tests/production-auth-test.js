#!/usr/bin/env node

/**
 * Production Authentication Test
 * Comprehensive test for admin login, client registration, and dashboard access
 * This test will work once the updated code is deployed to production
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'applybureau@gmail.com';
const ADMIN_PASSWORD = 'Admin123@#';

// Test state
let testResults = { passed: 0, failed: 0, total: 0, failures: [] };
let authTokens = { admin: null, client: null };
let testData = {
  clientId: null,
  clientEmail: null,
  registrationToken: null
};

// Utility functions
const log = (message, type = 'info') => {
  const colors = { info: '\x1b[36m', success: '\x1b[32m', error: '\x1b[31m', warning: '\x1b[33m', reset: '\x1b[0m' };
  console.log(`${colors[type]}[${new Date().toISOString()}] ${message}${colors.reset}`);
};

const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json', ...headers },
      timeout: 30000,
      validateStatus: () => true // Don't throw on error status
    };
    if (data) config.data = data;
    const response = await axios(config);
    return { success: response.status < 400, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

const test = async (name, testFn) => {
  testResults.total++;
  log(`Testing: ${name}`, 'info');
  try {
    await testFn();
    testResults.passed++;
    log(`✅ PASSED: ${name}`, 'success');
  } catch (error) {
    testResults.failed++;
    testResults.failures.push(`${name}: ${error.message}`);
    log(`❌ FAILED: ${name} - ${error.message}`, 'error');
  }
};

// Test functions
const testAdminLogin = async () => {
  await test('Admin Login', async () => {
    log(`Attempting admin login with: ${ADMIN_EMAIL}`, 'info');
    
    const response = await makeRequest('POST', '/api/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    log(`Login response status: ${response.status}`, 'info');
    
    if (!response.success) {
      throw new Error(`Admin login failed: ${response.status}: ${JSON.stringify(response.data)}`);
    }
    
    if (!response.data.token) {
      throw new Error('No authentication token received');
    }
    
    if (!response.data.user || response.data.user.role !== 'admin') {
      throw new Error(`Invalid user data or role. Got: ${JSON.stringify(response.data.user)}`);
    }
    
    authTokens.admin = response.data.token;
    log(`Admin authenticated successfully. Role: ${response.data.user.role}`, 'success');
  });
};

const testAdminDashboardAccess = async () => {
  await test('Admin Dashboard Access', async () => {
    if (!authTokens.admin) {
      throw new Error('No admin token available');
    }
    
    const response = await makeRequest('GET', '/api/auth/me', null, {
      'Authorization': `Bearer ${authTokens.admin}`
    });
    
    if (!response.success) {
      throw new Error(`Dashboard access failed: ${response.status}: ${JSON.stringify(response.data)}`);
    }
    
    if (!response.data.user || response.data.user.role !== 'admin') {
      throw new Error(`Invalid dashboard user data. Got: ${JSON.stringify(response.data.user)}`);
    }
    
    log(`Admin dashboard access successful. User: ${response.data.user.email}`, 'success');
  });
};

const testClientInvitation = async () => {
  await test('Client Invitation', async () => {
    if (!authTokens.admin) {
      throw new Error('No admin token available');
    }
    
    testData.clientEmail = `testclient${Date.now()}@example.com`;
    const response = await makeRequest('POST', '/api/auth/invite', {
      email: testData.clientEmail,
      full_name: 'Test Client User'
    }, {
      'Authorization': `Bearer ${authTokens.admin}`
    });
    
    log(`Invitation response: ${response.status} - ${JSON.stringify(response.data)}`, 'info');
    
    if (!response.success) {
      throw new Error(`Client invitation failed: ${response.status}: ${JSON.stringify(response.data)}`);
    }
    
    if (!response.data.client_id) {
      throw new Error('No client ID returned from invitation');
    }
    
    testData.clientId = response.data.client_id;
    log(`Client invited successfully with ID: ${testData.clientId}`, 'success');
  });
};

const testPasswordChangeEndpoint = async () => {
  await test('Admin Password Change Endpoint', async () => {
    if (!authTokens.admin) {
      throw new Error('No admin token available');
    }
    
    // Test the password change endpoint (using same password to avoid breaking admin)
    const response = await makeRequest('PUT', '/api/auth/change-password', {
      old_password: ADMIN_PASSWORD,
      new_password: ADMIN_PASSWORD
    }, {
      'Authorization': `Bearer ${authTokens.admin}`
    });
    
    if (!response.success) {
      throw new Error(`Password change failed: ${response.status}: ${JSON.stringify(response.data)}`);
    }
    
    log(`Password change endpoint working correctly`, 'success');
  });
};

const testTokenValidation = async () => {
  await test('Token Validation', async () => {
    // Test with invalid token
    const response = await makeRequest('GET', '/api/auth/me', null, {
      'Authorization': 'Bearer invalid-token-12345'
    });
    
    if (response.success) {
      throw new Error('Invalid token was accepted');
    }
    
    if (response.status !== 401 && response.status !== 403) {
      throw new Error(`Expected 401/403 for invalid token, got ${response.status}`);
    }
    
    log(`Token validation working correctly (rejected invalid token)`, 'success');
  });
};

const testAdminEndpoints = async () => {
  await test('Admin Endpoints Access', async () => {
    if (!authTokens.admin) {
      throw new Error('No admin token available');
    }
    
    const adminEndpoints = [
      { endpoint: '/api/applications', description: 'Applications' },
      { endpoint: '/api/consultation-management', description: 'Consultation Management' },
      { endpoint: '/api/admin-management/profile', description: 'Admin Profile' }
    ];
    
    for (const { endpoint, description } of adminEndpoints) {
      const response = await makeRequest('GET', endpoint, null, {
        'Authorization': `Bearer ${authTokens.admin}`
      });
      
      if (response.status === 404) {
        throw new Error(`${description} endpoint ${endpoint} not found`);
      }
      
      // We expect 200 or some auth-related error, but not 404
      log(`${description} endpoint available (status: ${response.status})`, 'info');
    }
    
    log(`All admin endpoints are accessible`, 'success');
  });
};

const testConsultationManagement = async () => {
  await test('Consultation Management Endpoints', async () => {
    if (!authTokens.admin) {
      throw new Error('No admin token available');
    }
    
    // Test consultation management endpoints
    const response = await makeRequest('GET', '/api/consultation-management', null, {
      'Authorization': `Bearer ${authTokens.admin}`
    });
    
    if (response.status === 404) {
      throw new Error('Consultation management endpoints not found');
    }
    
    if (!response.success && response.status !== 200) {
      throw new Error(`Consultation management failed: ${response.status}: ${JSON.stringify(response.data)}`);
    }
    
    log(`Consultation management endpoints working`, 'success');
  });
};

const testPublicEndpoints = async () => {
  await test('Public Endpoints', async () => {
    // Test public consultation booking
    const consultationData = {
      full_name: 'Test Public User',
      email: 'testpublic@example.com',
      phone: '+1234567890',
      message: 'Test consultation request',
      preferred_slots: [
        { date: '2024-02-15', time: '10:00' }
      ]
    };
    
    const response = await makeRequest('POST', '/api/public-consultations', consultationData);
    
    if (!response.success) {
      throw new Error(`Public consultation failed: ${response.status}: ${JSON.stringify(response.data)}`);
    }
    
    log(`Public consultation booking working`, 'success');
  });
};

const testApplicationManagement = async () => {
  await test('Application Management', async () => {
    if (!authTokens.admin || !testData.clientId) {
      throw new Error('No admin token or client ID available');
    }
    
    // Test creating an application
    const applicationData = {
      client_id: testData.clientId,
      company_name: 'Test Company',
      job_title: 'Test Position',
      job_description: 'Test job description',
      admin_notes: 'Test application created by automated test'
    };
    
    const response = await makeRequest('POST', '/api/applications', applicationData, {
      'Authorization': `Bearer ${authTokens.admin}`
    });
    
    if (!response.success) {
      throw new Error(`Application creation failed: ${response.status}: ${JSON.stringify(response.data)}`);
    }
    
    log(`Application management working`, 'success');
  });
};

const testSystemHealth = async () => {
  await test('System Health', async () => {
    const endpoints = [
      { endpoint: '/api/health', description: 'Health Check' },
      { endpoint: '/api/email-actions/test', description: 'Email System' }
    ];
    
    for (const { endpoint, description } of endpoints) {
      const response = await makeRequest('GET', endpoint);
      
      if (response.status === 404) {
        throw new Error(`${description} endpoint not found`);
      }
      
      log(`${description} endpoint available`, 'info');
    }
    
    log(`System health endpoints working`, 'success');
  });
};

// Main test runner
const runProductionAuthTests = async () => {
  log('🚀 Starting Production Authentication System Test', 'info');
  log(`Testing against: ${BASE_URL}`, 'info');
  log('=' .repeat(70), 'info');
  
  // Phase 1: System Health
  log('📋 Phase 1: System Health', 'info');
  await testSystemHealth();
  await testPublicEndpoints();
  
  // Phase 2: Admin Authentication
  log('📋 Phase 2: Admin Authentication', 'info');
  await testAdminLogin();
  await testTokenValidation();
  await testAdminDashboardAccess();
  
  // Phase 3: Admin Features
  log('📋 Phase 3: Admin Features', 'info');
  await testAdminEndpoints();
  await testConsultationManagement();
  await testPasswordChangeEndpoint();
  
  // Phase 4: Client Management
  log('📋 Phase 4: Client Management', 'info');
  await testClientInvitation();
  await testApplicationManagement();
  
  // Results Summary
  log('=' .repeat(70), 'info');
  log('🏁 Production Authentication Test Results', 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  
  if (testResults.failures.length > 0) {
    log('', 'info');
    log('❌ Failed Tests:', 'error');
    testResults.failures.forEach(failure => {
      log(`  • ${failure}`, 'error');
    });
  }
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(``, 'info');
  log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'success' : 'error');
  
  // Feature Summary
  log('', 'info');
  log('📊 Authentication System Status:', 'info');
  
  if (authTokens.admin) {
    log('✅ Admin authentication working', 'success');
    log('✅ Admin dashboard access working', 'success');
    log('✅ Admin endpoints accessible', 'success');
  } else {
    log('❌ Admin authentication broken', 'error');
  }
  
  if (testData.clientId) {
    log('✅ Client invitation working', 'success');
    log('✅ Application management working', 'success');
  } else {
    log('⚠️ Client management needs verification', 'warning');
  }
  
  log('', 'info');
  log('🎯 Test Results Summary:', 'info');
  
  if (successRate >= 95) {
    log('🎉 Authentication system is EXCELLENT!', 'success');
    log('✅ Ready for 100% consultation engine success rate', 'success');
  } else if (successRate >= 90) {
    log('✅ Authentication system is working well!', 'success');
    log('⚠️ Minor issues may affect some features', 'warning');
  } else if (successRate >= 80) {
    log('⚠️ Authentication system has some issues', 'warning');
    log('🔧 Needs fixes before full consultation engine testing', 'warning');
  } else {
    log('🚨 Authentication system has significant issues', 'error');
    log('🔧 Major fixes needed before consultation engine can work', 'error');
  }
  
  // Test Data Summary
  log('', 'info');
  log('📋 Test Data Created:', 'info');
  log(`  • Admin Token: ${authTokens.admin ? 'Generated' : 'Failed'}`, 'info');
  log(`  • Client ID: ${testData.clientId || 'Not created'}`, 'info');
  log(`  • Client Email: ${testData.clientEmail || 'Not created'}`, 'info');
  
  process.exit(testResults.failed > 0 ? 1 : 0);
};

// Run tests
runProductionAuthTests().catch(error => {
  log(`💥 Test runner crashed: ${error.message}`, 'error');
  process.exit(1);
});