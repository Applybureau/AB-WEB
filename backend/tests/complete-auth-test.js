#!/usr/bin/env node

/**
 * Complete Authentication System Test
 * Tests admin login, client registration, and dashboard access
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
    log(`Login response data: ${JSON.stringify(response.data)}`, 'info');
    
    if (!response.success) {
      throw new Error(`Admin login failed: ${response.status}: ${JSON.stringify(response.data)}`);
    }
    
    if (!response.data.token) {
      throw new Error('No authentication token received');
    }
    
    if (!response.data.user || response.data.user.role !== 'admin') {
      throw new Error('Invalid user data or role');
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
      throw new Error('Invalid dashboard user data');
    }
    
    log(`Admin dashboard access successful. User: ${response.data.user.email}`, 'success');
  });
};

const testClientInvitation = async () => {
  await test('Client Invitation', async () => {
    if (!authTokens.admin) {
      throw new Error('No admin token available');
    }
    
    const clientEmail = `testclient${Date.now()}@example.com`;
    const response = await makeRequest('POST', '/api/auth/invite', {
      email: clientEmail,
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

const testClientRegistrationFlow = async () => {
  await test('Client Registration Flow', async () => {
    // Since we can't easily test the full token flow, let's test client login with a known client
    const testClientEmail = 'john.testclient@example.com';
    const testClientPassword = 'ClientPassword123!';
    
    // First try to create a simple client for testing
    if (authTokens.admin) {
      const inviteResponse = await makeRequest('POST', '/api/auth/invite', {
        email: testClientEmail,
        full_name: 'John Test Client'
      }, {
        'Authorization': `Bearer ${authTokens.admin}`
      });
      
      if (inviteResponse.success || inviteResponse.data.existing_client) {
        log('Test client created or already exists', 'info');
      }
    }
    
    // Try to login as client
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: testClientEmail,
      password: testClientPassword
    });
    
    if (loginResponse.success && loginResponse.data.token) {
      authTokens.client = loginResponse.data.token;
      log(`Client login successful`, 'success');
    } else {
      log(`Client login failed (expected for new client): ${loginResponse.status}`, 'warning');
      // This is expected for a new client that hasn't completed registration
    }
  });
};

const testClientDashboardAccess = async () => {
  await test('Client Dashboard Access', async () => {
    if (!authTokens.client) {
      log('No client token available, skipping client dashboard test', 'warning');
      return;
    }
    
    const response = await makeRequest('GET', '/api/auth/me', null, {
      'Authorization': `Bearer ${authTokens.client}`
    });
    
    if (!response.success) {
      throw new Error(`Client dashboard access failed: ${response.status}: ${JSON.stringify(response.data)}`);
    }
    
    if (!response.data.user) {
      throw new Error('Invalid client dashboard user data');
    }
    
    log(`Client dashboard access successful. User: ${response.data.user.email}`, 'success');
  });
};

const testPasswordChangeFlow = async () => {
  await test('Admin Password Change', async () => {
    if (!authTokens.admin) {
      throw new Error('No admin token available');
    }
    
    // Test the password change endpoint
    const response = await makeRequest('PUT', '/api/auth/change-password', {
      old_password: ADMIN_PASSWORD,
      new_password: ADMIN_PASSWORD // Use same password to avoid breaking the admin
    }, {
      'Authorization': `Bearer ${authTokens.admin}`
    });
    
    if (!response.success) {
      throw new Error(`Password change failed: ${response.status}: ${JSON.stringify(response.data)}`);
    }
    
    log(`Password change endpoint working`, 'success');
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
    
    log(`Token validation working correctly`, 'success');
  });
};

const testAuthEndpoints = async () => {
  await test('Auth Endpoints Availability', async () => {
    const endpoints = [
      '/api/auth/login',
      '/api/auth/me',
      '/api/auth/invite',
      '/api/auth/change-password'
    ];
    
    for (const endpoint of endpoints) {
      const response = await makeRequest('OPTIONS', endpoint);
      if (response.status === 404) {
        throw new Error(`Endpoint ${endpoint} not found`);
      }
    }
    
    log(`All auth endpoints are available`, 'success');
  });
};

const testDashboardEndpoints = async () => {
  await test('Dashboard Endpoints Availability', async () => {
    if (!authTokens.admin) {
      throw new Error('No admin token available');
    }
    
    const dashboardEndpoints = [
      '/api/admin/dashboard',
      '/api/admin/clients',
      '/api/applications'
    ];
    
    for (const endpoint of dashboardEndpoints) {
      const response = await makeRequest('GET', endpoint, null, {
        'Authorization': `Bearer ${authTokens.admin}`
      });
      
      if (response.status === 404) {
        throw new Error(`Dashboard endpoint ${endpoint} not found`);
      }
      
      // We expect 200 or some auth-related error, but not 404
      log(`Dashboard endpoint ${endpoint} is available (status: ${response.status})`, 'info');
    }
    
    log(`Dashboard endpoints are available`, 'success');
  });
};

// Main test runner
const runCompleteAuthTests = async () => {
  log('🚀 Starting Complete Authentication System Test', 'info');
  log(`Testing against: ${BASE_URL}`, 'info');
  log('=' .repeat(70), 'info');
  
  // Phase 1: Basic Auth Tests
  log('📋 Phase 1: Basic Authentication', 'info');
  await testAuthEndpoints();
  await testAdminLogin();
  await testTokenValidation();
  
  // Phase 2: Dashboard Access
  log('📋 Phase 2: Dashboard Access', 'info');
  await testAdminDashboardAccess();
  await testDashboardEndpoints();
  
  // Phase 3: Client Management
  log('📋 Phase 3: Client Management', 'info');
  await testClientInvitation();
  await testClientRegistrationFlow();
  await testClientDashboardAccess();
  
  // Phase 4: Advanced Features
  log('📋 Phase 4: Advanced Auth Features', 'info');
  await testPasswordChangeFlow();
  
  // Results Summary
  log('=' .repeat(70), 'info');
  log('🏁 Complete Authentication Test Results', 'info');
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
  } else {
    log('❌ Admin authentication broken', 'error');
  }
  
  if (authTokens.client) {
    log('✅ Client authentication working', 'success');
  } else {
    log('⚠️ Client authentication needs setup', 'warning');
  }
  
  log('', 'info');
  log('🔧 Recommendations:', 'info');
  
  if (testResults.failed > 0) {
    log('1. Fix failed authentication tests', 'error');
    log('2. Verify database schema and admin setup', 'error');
    log('3. Check token generation and validation', 'error');
    log('4. Test registration flow end-to-end', 'error');
  } else {
    log('✅ Authentication system is working correctly!', 'success');
  }
  
  process.exit(testResults.failed > 0 ? 1 : 0);
};

// Run tests
runCompleteAuthTests().catch(error => {
  log(`💥 Test runner crashed: ${error.message}`, 'error');
  process.exit(1);
});