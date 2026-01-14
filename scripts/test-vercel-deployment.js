#!/usr/bin/env node

/**
 * Comprehensive Test for Vercel Deployment
 * Tests the deployed backend at https://apply-bureau-backend.vercel.app/
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let passedTests = 0;
let failedTests = 0;
let warnings = 0;

console.log(`${colors.cyan}╔════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║   Apply Bureau Backend - Vercel Deployment    ║${colors.reset}`);
console.log(`${colors.cyan}║              Comprehensive Test                ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════╝${colors.reset}`);
console.log('');
console.log(`${colors.blue}Testing URL: ${BASE_URL}${colors.reset}`);
console.log('');

// Helper function to make HTTP requests
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test functions
async function testHealthEndpoint() {
  console.log(`${colors.yellow}[TEST 1] Health Check Endpoint${colors.reset}`);
  try {
    const response = await makeRequest('/health');
    
    if (response.status === 200) {
      console.log(`  ${colors.green}✓${colors.reset} Status: 200 OK`);
      console.log(`  ${colors.green}✓${colors.reset} Response:`, JSON.stringify(response.data, null, 2));
      
      if (response.data.status === 'healthy') {
        console.log(`  ${colors.green}✓${colors.reset} Server is healthy`);
        passedTests++;
      } else {
        console.log(`  ${colors.yellow}⚠${colors.reset} Server status: ${response.data.status}`);
        warnings++;
      }
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Status: ${response.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Error: ${error.message}`);
    failedTests++;
  }
  console.log('');
}

async function testAPIHealthEndpoint() {
  console.log(`${colors.yellow}[TEST 2] API Health Check Endpoint${colors.reset}`);
  try {
    const response = await makeRequest('/api/health');
    
    if (response.status === 200) {
      console.log(`  ${colors.green}✓${colors.reset} Status: 200 OK`);
      console.log(`  ${colors.green}✓${colors.reset} Response:`, JSON.stringify(response.data, null, 2));
      passedTests++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Status: ${response.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Error: ${error.message}`);
    failedTests++;
  }
  console.log('');
}

async function testContactEndpoint() {
  console.log(`${colors.yellow}[TEST 3] Contact Form Endpoint (POST)${colors.reset}`);
  try {
    const testData = {
      full_name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      company: 'Test Company',
      message: 'This is a test message from automated testing',
      country: 'United States'
    };
    
    const response = await makeRequest('/api/contact', {
      method: 'POST',
      body: testData
    });
    
    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 || response.status === 201) {
      console.log(`  ${colors.green}✓${colors.reset} Contact endpoint is working`);
      passedTests++;
    } else if (response.status === 400) {
      console.log(`  ${colors.yellow}⚠${colors.reset} Validation error (expected for test data)`);
      warnings++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Unexpected status: ${response.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Error: ${error.message}`);
    failedTests++;
  }
  console.log('');
}

async function testPublicConsultationEndpoint() {
  console.log(`${colors.yellow}[TEST 4] Public Consultation Request Endpoint${colors.reset}`);
  try {
    const testData = {
      full_name: 'Test Consultant',
      email: 'consultant@example.com',
      phone: '+1234567890',
      role_targets: 'Software Engineer, Senior Developer',
      package_interest: 'Tier 2',
      employment_status: 'Currently Employed',
      area_of_concern: 'Need help with interview preparation',
      consultation_window: 'Weekday evenings',
      country: 'United States'
    };
    
    const response = await makeRequest('/api/public-consultations', {
      method: 'POST',
      body: testData
    });
    
    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 || response.status === 201) {
      console.log(`  ${colors.green}✓${colors.reset} Consultation endpoint is working`);
      passedTests++;
    } else if (response.status === 400) {
      console.log(`  ${colors.yellow}⚠${colors.reset} Validation error (check data format)`);
      warnings++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Unexpected status: ${response.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Error: ${error.message}`);
    failedTests++;
  }
  console.log('');
}

async function testAuthEndpoint() {
  console.log(`${colors.yellow}[TEST 5] Authentication Endpoint (Login)${colors.reset}`);
  try {
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'testpassword'
      }
    });
    
    console.log(`  Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log(`  ${colors.green}✓${colors.reset} Auth endpoint is working (401 expected for invalid credentials)`);
      passedTests++;
    } else if (response.status === 200) {
      console.log(`  ${colors.yellow}⚠${colors.reset} Login succeeded (test user exists)`);
      warnings++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Unexpected status: ${response.status}`);
      console.log(`  Response:`, JSON.stringify(response.data, null, 2));
      failedTests++;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Error: ${error.message}`);
    failedTests++;
  }
  console.log('');
}

async function testProtectedEndpoint() {
  console.log(`${colors.yellow}[TEST 6] Protected Endpoint (Without Auth)${colors.reset}`);
  try {
    const response = await makeRequest('/api/client/dashboard');
    
    console.log(`  Status: ${response.status}`);
    
    if (response.status === 401 || response.status === 403) {
      console.log(`  ${colors.green}✓${colors.reset} Protected endpoint requires authentication`);
      passedTests++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Unexpected status: ${response.status}`);
      console.log(`  Response:`, JSON.stringify(response.data, null, 2));
      failedTests++;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Error: ${error.message}`);
    failedTests++;
  }
  console.log('');
}

async function test404Endpoint() {
  console.log(`${colors.yellow}[TEST 7] 404 Error Handling${colors.reset}`);
  try {
    const response = await makeRequest('/api/nonexistent-endpoint');
    
    console.log(`  Status: ${response.status}`);
    
    if (response.status === 404) {
      console.log(`  ${colors.green}✓${colors.reset} 404 handling works correctly`);
      passedTests++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Expected 404, got: ${response.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Error: ${error.message}`);
    failedTests++;
  }
  console.log('');
}

async function testCORSHeaders() {
  console.log(`${colors.yellow}[TEST 8] CORS Headers${colors.reset}`);
  try {
    const response = await makeRequest('/health');
    
    if (response.headers['access-control-allow-origin']) {
      console.log(`  ${colors.green}✓${colors.reset} CORS headers present`);
      console.log(`  Origin: ${response.headers['access-control-allow-origin']}`);
      passedTests++;
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} CORS headers not found`);
      warnings++;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Error: ${error.message}`);
    failedTests++;
  }
  console.log('');
}

async function testSecurityHeaders() {
  console.log(`${colors.yellow}[TEST 9] Security Headers${colors.reset}`);
  try {
    const response = await makeRequest('/health');
    
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];
    
    let foundHeaders = 0;
    securityHeaders.forEach(header => {
      if (response.headers[header]) {
        console.log(`  ${colors.green}✓${colors.reset} ${header}: ${response.headers[header]}`);
        foundHeaders++;
      }
    });
    
    if (foundHeaders > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Security headers present (${foundHeaders}/${securityHeaders.length})`);
      passedTests++;
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} No security headers found`);
      warnings++;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Error: ${error.message}`);
    failedTests++;
  }
  console.log('');
}

async function testResponseTime() {
  console.log(`${colors.yellow}[TEST 10] Response Time${colors.reset}`);
  try {
    const startTime = Date.now();
    await makeRequest('/health');
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`  Response time: ${responseTime}ms`);
    
    if (responseTime < 1000) {
      console.log(`  ${colors.green}✓${colors.reset} Response time is good (<1s)`);
      passedTests++;
    } else if (responseTime < 3000) {
      console.log(`  ${colors.yellow}⚠${colors.reset} Response time is acceptable (1-3s)`);
      warnings++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Response time is slow (>3s)`);
      failedTests++;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Error: ${error.message}`);
    failedTests++;
  }
  console.log('');
}

// Run all tests
async function runAllTests() {
  console.log(`${colors.cyan}Starting tests...${colors.reset}`);
  console.log('');
  
  await testHealthEndpoint();
  await testAPIHealthEndpoint();
  await testContactEndpoint();
  await testPublicConsultationEndpoint();
  await testAuthEndpoint();
  await testProtectedEndpoint();
  await test404Endpoint();
  await testCORSHeaders();
  await testSecurityHeaders();
  await testResponseTime();
  
  // Summary
  console.log('');
  console.log(`${colors.cyan}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}                  TEST SUMMARY                  ${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════${colors.reset}`);
  console.log('');
  console.log(`  ${colors.green}✓ Passed:${colors.reset}   ${passedTests}`);
  console.log(`  ${colors.red}✗ Failed:${colors.reset}   ${failedTests}`);
  console.log(`  ${colors.yellow}⚠ Warnings:${colors.reset} ${warnings}`);
  console.log('');
  
  const total = passedTests + failedTests;
  const percentage = total > 0 ? Math.round((passedTests / total) * 100) : 0;
  
  console.log(`  Success Rate: ${percentage}%`);
  console.log('');
  
  if (failedTests === 0) {
    console.log(`${colors.green}╔════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║     ✓ ALL TESTS PASSED - DEPLOYMENT OK!       ║${colors.reset}`);
    console.log(`${colors.green}╚════════════════════════════════════════════════╝${colors.reset}`);
    console.log('');
    console.log(`${colors.green}Your backend is live and working correctly!${colors.reset}`);
    console.log(`${colors.blue}URL: ${BASE_URL}${colors.reset}`);
  } else {
    console.log(`${colors.red}╔════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.red}║     ✗ SOME TESTS FAILED - NEEDS ATTENTION     ║${colors.reset}`);
    console.log(`${colors.red}╚════════════════════════════════════════════════╝${colors.reset}`);
    console.log('');
    console.log(`${colors.yellow}Please review the failed tests above.${colors.reset}`);
  }
  
  console.log('');
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
