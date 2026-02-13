#!/usr/bin/env node

/**
 * DigitalOcean Production Test Suite
 * Tests the live Apply Bureau backend on DigitalOcean
 */

const axios = require('axios');

// Production configuration
const BASE_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';
const ADMIN_EMAIL = 'applybureau@gmail.com';
const ADMIN_PASSWORD = 'Admin123@#';

// Test state
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  failures: []
};

let authTokens = {
  admin: null
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
};

const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 30000
    };

    if (data) {
      config.data = data;
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
const testHealthCheck = async () => {
  await test('Health Check', async () => {
    const response = await makeRequest('GET', '/health');
    if (!response.success || response.status !== 200) {
      throw new Error('Health check failed');
    }
    log(`Server status: ${response.data.status}`, 'info');
  });
};

const testAPIHealthCheck = async () => {
  await test('API Health Check', async () => {
    const response = await makeRequest('GET', '/api/health');
    if (!response.success || response.status !== 200) {
      throw new Error('API health check failed');
    }
    log(`API status: ${response.data.status}`, 'info');
  });
};

const testAuthentication = async () => {
  await test('Admin Authentication', async () => {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (!response.success) {
      throw new Error(`Login failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    
    if (!response.data.token) {
      throw new Error('No token received');
    }
    
    authTokens.admin = response.data.token;
    log('Admin authentication successful', 'success');
  });
};

const testPublicEndpoints = async () => {
  await test('Public Consultation Request', async () => {
    const response = await makeRequest('POST', '/api/public-consultations', {
      full_name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      package_interest: 'basic',
      preferred_times: ['morning'],
      message: 'Test consultation request from production test'
    });
    
    if (!response.success) {
      throw new Error(`Public consultation failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    log('Public consultation endpoint working', 'success');
  });
  
  await test('Contact Form Submission', async () => {
    const response = await makeRequest('POST', '/api/contact', {
      name: 'Test Contact',
      email: 'contact@example.com',
      subject: 'Production Test',
      message: 'Test message from production test suite'
    });
    
    if (!response.success) {
      throw new Error(`Contact form failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    log('Contact form endpoint working', 'success');
  });
};

const testAdminEndpoints = async () => {
  if (!authTokens.admin) {
    log('Skipping admin tests - no admin token', 'warning');
    return;
  }

  await test('Admin Dashboard Access', async () => {
    const response = await makeRequest('GET', '/api/admin-dashboard', null, {
      'Authorization': `Bearer ${authTokens.admin}`
    });
    
    if (!response.success) {
      throw new Error(`Admin dashboard failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    log('Admin dashboard accessible', 'success');
  });

  await test('Admin Stats Access', async () => {
    const response = await makeRequest('GET', '/api/admin/stats', null, {
      'Authorization': `Bearer ${authTokens.admin}`
    });
    
    if (!response.success) {
      throw new Error(`Admin stats failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    log('Admin stats accessible', 'success');
  });
};

const testErrorHandling = async () => {
  await test('404 Error Handling', async () => {
    const response = await makeRequest('GET', '/api/nonexistent-endpoint');
    
    if (response.status !== 404) {
      throw new Error(`Expected 404, got ${response.status}`);
    }
    log('404 errors handled correctly', 'success');
  });
};

// Main test runner
const runTests = async () => {
  log('🚀 Starting DigitalOcean Production Test Suite', 'info');
  log(`Testing against: ${BASE_URL}`, 'info');
  log('=' .repeat(60), 'info');
  
  // Core functionality tests
  await testHealthCheck();
  await testAPIHealthCheck();
  
  // Authentication tests
  await testAuthentication();
  
  // Admin functionality tests
  await testAdminEndpoints();
  
  // Public endpoint tests
  await testPublicEndpoints();
  
  // Error handling tests
  await testErrorHandling();
  
  // Results summary
  log('=' .repeat(60), 'info');
  log('🏁 Test Results Summary', 'info');
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
  
  if (successRate >= 90) {
    log('🎉 DigitalOcean production system is fully operational!', 'success');
  } else if (successRate >= 75) {
    log('⚠️ DigitalOcean production system is mostly working but needs attention', 'warning');
  } else {
    log('🚨 DigitalOcean production system has critical issues', 'error');
  }
  
  process.exit(testResults.failed > 0 ? 1 : 0);
};

// Run tests
runTests().catch(error => {
  log(`💥 Test runner crashed: ${error.message}`, 'error');
  process.exit(1);
});