#!/usr/bin/env node

/**
 * Production Ready Test for Apply Bureau Backend
 * Comprehensive test to ensure the backend is error-free for frontend developers
 */

const axios = require('axios');
const colors = require('colors');

const DEPLOYED_URL = 'https://apply-bureau-backend.onrender.com';
const API_URL = `${DEPLOYED_URL}/api`;
const TEST_EMAIL = 'israelloko65@gmail.com';

console.log('🚀 PRODUCTION READY TEST - Apply Bureau Backend'.green.bold);
console.log('='.repeat(60).gray);
console.log(`🌐 Testing: ${DEPLOYED_URL}`.cyan);
console.log(`📧 Email: ${TEST_EMAIL}`.cyan);
console.log('');

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(name, success, details = '') {
  if (success) {
    console.log(`✅ ${name}`.green + (details ? ` - ${details}`.gray : ''));
    testResults.passed++;
  } else {
    console.log(`❌ ${name}`.red + (details ? ` - ${details}`.red : ''));
    testResults.failed++;
    testResults.errors.push(name);
  }
}

async function runProductionTests() {
  try {
    // 1. Health Check
    console.log('🏥 HEALTH & INFRASTRUCTURE'.yellow.bold);
    try {
      const health = await axios.get(`${DEPLOYED_URL}/health`, { timeout: 30000 });
      logTest('Health endpoint', health.status === 200, `Service: ${health.data.service}`);
      logTest('Health response format', health.data.service && health.data.status, 'Contains required fields');
    } catch (error) {
      logTest('Health endpoint', false, error.message);
    }

    // 2. Static Assets
    console.log('\n🖼️  STATIC ASSETS'.yellow.bold);
    try {
      const logo = await axios.get(`${DEPLOYED_URL}/emails/assets/logo.png`, { timeout: 10000 });
      logTest('Logo asset', logo.status === 200, `Size: ${logo.headers['content-length']} bytes`);
    } catch (error) {
      logTest('Logo asset', false, error.message);
    }

    // 3. Authentication System
    console.log('\n🔐 AUTHENTICATION SYSTEM'.yellow.bold);
    let adminToken = null;
    
    try {
      const login = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@applybureau.com',
        password: 'admin123'
      }, { timeout: 15000 });
      
      logTest('Admin login', login.status === 200, `User: ${login.data.user?.full_name}`);
      logTest('JWT token generation', !!login.data.token, 'Token provided');
      logTest('User data structure', login.data.user?.id && login.data.user?.email, 'Complete user object');
      
      adminToken = login.data.token;
    } catch (error) {
      logTest('Admin login', false, error.response?.data?.error || error.message);
    }

    // 4. Authorization & Security
    console.log('\n🛡️  SECURITY & AUTHORIZATION'.yellow.bold);
    try {
      await axios.get(`${API_URL}/dashboard`, {
        headers: { Authorization: 'Bearer invalid-token' },
        timeout: 5000
      });
      logTest('Invalid token rejection', false, 'Should have been rejected');
    } catch (error) {
      const isUnauthorized = error.response?.status === 401 || error.response?.status === 403;
      logTest('Invalid token rejection', isUnauthorized, 'Properly secured');
    }

    // 5. Email System
    console.log('\n📧 EMAIL SYSTEM'.yellow.bold);
    if (adminToken) {
      try {
        const invite = await axios.post(`${API_URL}/auth/invite`, {
          email: `test-${Date.now()}@example.com`,
          full_name: 'Production Test User'
        }, {
          headers: { Authorization: `Bearer ${adminToken}` },
          timeout: 20000
        });
        
        logTest('Email invitation system', invite.status === 201, 'Invitation sent successfully');
        logTest('Client creation', !!invite.data.client_id, `Client ID: ${invite.data.client_id}`);
      } catch (error) {
        const isExpectedError = error.response?.data?.error === 'Client already exists';
        logTest('Email invitation system', isExpectedError || error.response?.status === 201, 
               isExpectedError ? 'System working (duplicate handled)' : error.response?.data?.error);
      }
    }

    // 6. Database Operations
    console.log('\n🗄️  DATABASE OPERATIONS'.yellow.bold);
    if (adminToken) {
      try {
        const dashboard = await axios.get(`${API_URL}/dashboard`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          timeout: 15000
        });
        
        logTest('Database connectivity', dashboard.status === 200, 'Dashboard data retrieved');
        logTest('Data structure integrity', typeof dashboard.data === 'object', 'Valid response format');
      } catch (error) {
        logTest('Database connectivity', false, error.response?.data?.error || error.message);
      }
    }

    // 7. API Endpoints
    console.log('\n🔗 API ENDPOINTS'.yellow.bold);
    const endpoints = [
      { path: '/health', method: 'GET', auth: false },
      { path: '/api/auth/me', method: 'GET', auth: true },
      { path: '/api/dashboard', method: 'GET', auth: true },
      { path: '/api/consultations', method: 'GET', auth: true },
      { path: '/api/applications', method: 'GET', auth: true }
    ];

    for (const endpoint of endpoints) {
      try {
        const config = { timeout: 10000 };
        if (endpoint.auth && adminToken) {
          config.headers = { Authorization: `Bearer ${adminToken}` };
        }

        const response = await axios[endpoint.method.toLowerCase()](`${DEPLOYED_URL}${endpoint.path}`, config);
        logTest(`${endpoint.method} ${endpoint.path}`, response.status === 200, 'Responds correctly');
      } catch (error) {
        const isAuthError = !endpoint.auth || (endpoint.auth && !adminToken);
        const expectedStatus = isAuthError ? [401, 403] : [200];
        const actualStatus = error.response?.status;
        
        if (isAuthError && expectedStatus.includes(actualStatus)) {
          logTest(`${endpoint.method} ${endpoint.path}`, true, 'Properly secured');
        } else {
          logTest(`${endpoint.method} ${endpoint.path}`, false, error.response?.data?.error || error.message);
        }
      }
    }

    // 8. Email Templates
    console.log('\n📄 EMAIL TEMPLATES'.yellow.bold);
    const templates = [
      'signup_invite.html',
      'consultation_scheduled.html', 
      'application_status_update.html',
      'onboarding_completion.html'
    ];

    for (const template of templates) {
      try {
        const response = await axios.get(`${DEPLOYED_URL}/emails/templates/${template}`, { timeout: 5000 });
        const hasLogo = response.data.includes('logo.png');
        const hasGreenBranding = response.data.includes('#10b981');
        const hasWhiteButtons = response.data.includes('color: #ffffff !important');
        
        logTest(`Template: ${template}`, response.status === 200, 'Accessible');
        logTest(`${template} - Logo`, hasLogo, 'Logo reference found');
        logTest(`${template} - Branding`, hasGreenBranding, 'Green branding applied');
        logTest(`${template} - Button text`, hasWhiteButtons, 'White button text');
      } catch (error) {
        logTest(`Template: ${template}`, false, 'Not accessible');
      }
    }

    // Final Results
    console.log('\n' + '='.repeat(60).gray);
    console.log('📊 TEST RESULTS'.cyan.bold);
    console.log('='.repeat(60).gray);
    
    const total = testResults.passed + testResults.failed;
    const successRate = Math.round((testResults.passed / total) * 100);
    
    console.log(`✅ Passed: ${testResults.passed}`.green);
    console.log(`❌ Failed: ${testResults.failed}`.red);
    console.log(`📈 Success Rate: ${successRate}%`.cyan);
    
    if (testResults.failed === 0) {
      console.log('\n🎉 PRODUCTION READY! ✨'.green.bold);
      console.log('🚀 Backend is error-free and ready for frontend development!'.green);
      console.log('\n📋 FRONTEND DEVELOPERS CAN START:'.yellow.bold);
      console.log('✅ All API endpoints working'.green);
      console.log('✅ Authentication system functional'.green);
      console.log('✅ Email system operational'.green);
      console.log('✅ Database connectivity confirmed'.green);
      console.log('✅ Security measures active'.green);
      console.log('✅ Professional email templates ready'.green);
      
      console.log('\n🔗 API BASE URL:'.cyan.bold);
      console.log(`   ${DEPLOYED_URL}`.cyan);
      
      console.log('\n📚 KEY ENDPOINTS:'.cyan.bold);
      console.log(`   POST ${API_URL}/auth/login`.gray);
      console.log(`   GET  ${API_URL}/auth/me`.gray);
      console.log(`   GET  ${API_URL}/dashboard`.gray);
      console.log(`   POST ${API_URL}/auth/invite`.gray);
      console.log(`   GET  ${API_URL}/consultations`.gray);
      console.log(`   GET  ${API_URL}/applications`.gray);
      
    } else {
      console.log('\n⚠️  ISSUES FOUND:'.red.bold);
      testResults.errors.forEach(error => {
        console.log(`   • ${error}`.red);
      });
      console.log('\n🔧 Please fix these issues before frontend development'.yellow);
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:'.red.bold, error.message);
    console.log('🔧 Backend may not be accessible or properly deployed'.red);
  }
}

// Run the tests
runProductionTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});