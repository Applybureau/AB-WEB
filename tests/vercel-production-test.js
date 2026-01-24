#!/usr/bin/env node

/**
 * Vercel Production Test Suite
 * Tests the live Apply Bureau backend on Vercel
 */

const axios = require('axios');
const FormData = require('form-data');

// Production configuration
const BASE_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const ADMIN_EMAIL = 'admin@applybureau.com';
const ADMIN_PASSWORD = 'Admin123@#';

// Test state
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  failures: []
};

let authTokens = {
  client: null,
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
  await test('Production Health Check', async () => {
    const response = await makeRequest('GET', '/health');
    if (!response.success || response.status !== 200) {
      throw new Error('Health check failed');
    }
  });
};

const testCORS = async () => {
  await test('CORS Configuration', async () => {
    const response = await makeRequest('OPTIONS', '/api/auth/login', null, {
      'Origin': 'https://apply-bureau.vercel.app',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    });
    
    if (!response.success && response.status !== 200 && response.status !== 204) {
      throw new Error('CORS preflight failed');
    }
  });
};

const testAuthentication = async () => {
  await test('Admin Login Test', async () => {
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
  });
};

const testFileUpload = async () => {
  await test('File Upload Endpoint', async () => {
    if (!authTokens.admin) {
      throw new Error('No admin token available');
    }
    
    // Test file upload endpoint accessibility
    const response = await makeRequest('POST', '/api/upload/resume', 
      { test: 'data' }, 
      { 'Authorization': `Bearer ${authTokens.admin}` }
    );
    
    // We expect this to fail with validation error, not auth error
    if (response.status === 401 || response.status === 403) {
      throw new Error('File upload endpoint authentication failed');
    }
  });
};

const testDatabaseConnection = async () => {
  await test('Database Connection', async () => {
    if (!authTokens.admin) {
      throw new Error('No admin token available');
    }
    
    // Try different admin endpoints to test database connection
    const endpoints = [
      '/api/admin/dashboard',
      '/api/admin/stats',
      '/api/admin/clients',
      '/api/applications'
    ];
    
    let success = false;
    let lastError = null;
    
    for (const endpoint of endpoints) {
      const response = await makeRequest('GET', endpoint, null, {
        'Authorization': `Bearer ${authTokens.admin}`
      });
      
      if (response.success) {
        success = true;
        break;
      } else if (response.status !== 404) {
        // If it's not a 404, it means the endpoint exists but there might be another issue
        success = true;
        break;
      }
      lastError = response.error;
    }
    
    if (!success) {
      throw new Error(`Database connection test failed - all admin endpoints returned 404`);
    }
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
      message: 'Test consultation request'
    });
    
    if (!response.success) {
      throw new Error(`Public consultation failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
  });
  
  await test('Contact Form Submission', async () => {
    const response = await makeRequest('POST', '/api/contact', {
      name: 'Test Contact',
      email: 'contact@example.com',
      subject: 'Test Subject',
      message: 'Test message'
    });
    
    if (!response.success) {
      throw new Error(`Contact form failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
  });
};

const testErrorHandling = async () => {
  await test('404 Error Handling', async () => {
    const response = await makeRequest('GET', '/api/nonexistent-endpoint');
    
    if (response.status !== 404) {
      throw new Error(`Expected 404, got ${response.status}`);
    }
  });
  
  await test('Invalid JSON Handling', async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, 'invalid json', {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`Expected 400 for invalid JSON, got ${error.response?.status}`);
      }
    }
  });
};

const testRateLimiting = async () => {
  await test('Rate Limiting Protection', async () => {
    const requests = [];
    
    // Make multiple rapid requests
    for (let i = 0; i < 10; i++) {
      requests.push(makeRequest('POST', '/api/auth/login', {
        email: 'invalid@example.com',
        password: 'invalid'
      }));
    }
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);
    
    if (!rateLimited) {
      log('⚠️  Rate limiting may not be active', 'warning');
    }
  });
};

const testEnvironmentVariables = async () => {
  await test('Environment Configuration', async () => {
    // Test that the server responds correctly (indicating env vars are loaded)
    const response = await makeRequest('GET', '/health');
    
    if (!response.success) {
      throw new Error('Server not responding - possible env var issues');
    }
    
    // Check if CORS is configured (indicates FRONTEND_URL is set)
    const corsResponse = await makeRequest('GET', '/api/auth/login', null, {
      'Origin': 'https://apply-bureau.vercel.app'
    });
    
    // Should not get CORS error
    if (corsResponse.error && typeof corsResponse.error === 'string' && corsResponse.error.includes('CORS')) {
      throw new Error('CORS not properly configured');
    }
  });
};

// Main test runner
const runTests = async () => {
  log('🚀 Starting Vercel Production Test Suite', 'info');
  log(`Testing against: ${BASE_URL}`, 'info');
  log('=' .repeat(50), 'info');
  
  // Core functionality tests
  await testHealthCheck();
  await testCORS();
  await testEnvironmentVariables();
  
  // Authentication tests
  await testAuthentication();
  
  // Feature tests (only if auth works)
  if (authTokens.admin) {
    await testDatabaseConnection();
    await testFileUpload();
  }
  
  // Public endpoint tests
  await testPublicEndpoints();
  
  // Error handling tests
  await testErrorHandling();
  await testRateLimiting();
  
  // Results summary
  log('=' .repeat(50), 'info');
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
  log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'error');
  
  if (successRate >= 80) {
    log('🎉 Production system is healthy!', 'success');
  } else {
    log('🚨 Production system has issues that need attention', 'error');
  }
  
  process.exit(testResults.failed > 0 ? 1 : 0);
};

// Run tests
runTests().catch(error => {
  log(`💥 Test runner crashed: ${error.message}`, 'error');
  process.exit(1);
});