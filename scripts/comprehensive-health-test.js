#!/usr/bin/env node

/**
 * Comprehensive Backend Health Test
 * Tests all critical endpoints and functionality
 */

require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`)
};

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function testPublicEndpoints() {
  log.title('Testing Public Endpoints');
  
  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      path: '/api/health',
      expectedStatus: 200
    },
    {
      name: 'Public Consultation Request',
      method: 'POST',
      path: '/api/consultation-requests',
      data: {
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        message: 'Health check test consultation request',
        preferredSlots: ['2024-02-01T10:00:00Z', '2024-02-01T14:00:00Z'],
        consultation_type: 'general_consultation',
        urgency_level: 'normal',
        source: 'health_check'
      },
      expectedStatus: 201
    }
  ];
  
  let passed = 0;
  
  for (const test of tests) {
    try {
      const config = {
        method: test.method,
        url: `${BASE_URL}${test.path}`,
        timeout: 10000
      };
      
      if (test.data) {
        config.data = test.data;
      }
      
      const response = await axios(config);
      
      if (response.status === test.expectedStatus) {
        log.success(`${test.name}: OK (${response.status})`);
        passed++;
      } else {
        log.warning(`${test.name}: Unexpected status ${response.status} (expected ${test.expectedStatus})`);
      }
    } catch (error) {
      if (error.response) {
        log.error(`${test.name}: ${error.response.status} - ${error.response.data?.error || error.message}`);
      } else {
        log.error(`${test.name}: ${error.message}`);
      }
    }
  }
  
  return passed === tests.length;
}

async function testAuthEndpoints() {
  log.title('Testing Auth Endpoints');
  
  const tests = [
    {
      name: 'Admin Login (without credentials)',
      method: 'POST',
      path: '/api/auth/login',
      data: {
        email: 'invalid@test.com',
        password: 'invalid'
      },
      expectedStatus: 401
    }
  ];
  
  let passed = 0;
  
  for (const test of tests) {
    try {
      const config = {
        method: test.method,
        url: `${BASE_URL}${test.path}`,
        timeout: 10000
      };
      
      if (test.data) {
        config.data = test.data;
      }
      
      const response = await axios(config);
      
      if (response.status === test.expectedStatus) {
        log.success(`${test.name}: OK (${response.status})`);
        passed++;
      } else {
        log.warning(`${test.name}: Unexpected status ${response.status} (expected ${test.expectedStatus})`);
      }
    } catch (error) {
      if (error.response && error.response.status === test.expectedStatus) {
        log.success(`${test.name}: OK (${error.response.status})`);
        passed++;
      } else if (error.response) {
        log.error(`${test.name}: ${error.response.status} - ${error.response.data?.error || error.message}`);
      } else {
        log.error(`${test.name}: ${error.message}`);
      }
    }
  }
  
  return passed === tests.length;
}

async function testDatabaseConnectivity() {
  log.title('Testing Database Connectivity');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    // Test critical tables
    const tables = [
      'clients',
      'admins', 
      'applications',
      'consultations',
      'consultation_requests',
      'contact_submissions',
      'notifications'
    ];
    
    let passed = 0;
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error && error.code === 'PGRST116') {
          log.warning(`Table ${table}: Does not exist`);
        } else if (error) {
          log.error(`Table ${table}: ${error.message}`);
        } else {
          log.success(`Table ${table}: Accessible`);
          passed++;
        }
      } catch (err) {
        log.error(`Table ${table}: ${err.message}`);
      }
    }
    
    return passed > 0;
  } catch (error) {
    log.error(`Database connectivity: ${error.message}`);
    return false;
  }
}

async function testServerPerformance() {
  log.title('Testing Server Performance');
  
  try {
    const start = Date.now();
    const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
    const responseTime = Date.now() - start;
    
    if (response.status === 200) {
      if (responseTime < 1000) {
        log.success(`Response time: ${responseTime}ms (excellent)`);
      } else if (responseTime < 3000) {
        log.warning(`Response time: ${responseTime}ms (acceptable)`);
      } else {
        log.error(`Response time: ${responseTime}ms (slow)`);
        return false;
      }
      return true;
    } else {
      log.error(`Health endpoint returned ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Performance test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`
${colors.bold}${colors.blue}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           Comprehensive Backend Health Test                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}
`);
  
  const tests = [
    { name: 'Database Connectivity', fn: testDatabaseConnectivity },
    { name: 'Server Performance', fn: testServerPerformance },
    { name: 'Public Endpoints', fn: testPublicEndpoints },
    { name: 'Auth Endpoints', fn: testAuthEndpoints }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      log.error(`${test.name} test failed: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  log.title('Comprehensive Health Test Summary');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    if (result.passed) {
      log.success(`${result.name}: PASSED`);
    } else {
      log.error(`${result.name}: FAILED`);
    }
  });
  
  console.log(`\n${colors.bold}Overall: ${passed}/${total} test suites passed${colors.reset}`);
  
  if (passed === total) {
    log.success('🎉 All tests passed! Backend is healthy and ready for production.');
    process.exit(0);
  } else if (passed >= total * 0.75) {
    log.warning('⚠️  Most tests passed. Backend is functional with minor issues.');
    process.exit(0);
  } else {
    log.error('❌ Multiple test failures. Backend needs attention.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    log.error(`Health test failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };