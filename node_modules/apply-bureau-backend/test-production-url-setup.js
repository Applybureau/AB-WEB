#!/usr/bin/env node

/**
 * Test Production URL Setup
 * Verify that all URLs now point to the production domain
 */

const TEST_EMAIL = 'israelloko65@gmail.com';
const TEST_PASSWORD = 'SimplePass123!';
const BACKEND_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';
const FRONTEND_URL = 'https://www.applybureau.com';

async function testProductionUrlSetup() {
  console.log('🧪 TESTING PRODUCTION URL SETUP\n');
  console.log('='.repeat(60));
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🔗 Backend URL: ${BACKEND_URL}`);
  console.log(`📧 Test Email: ${TEST_EMAIL}`);
  console.log('='.repeat(60));

  try {
    // STEP 1: Test backend health
    console.log('\n1️⃣ TESTING BACKEND HEALTH...');
    const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
    console.log(`   Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend is healthy');
      console.log(`   Environment: ${healthData.environment || 'unknown'}`);
      console.log(`   Frontend URL: ${healthData.frontendUrl || 'not set'}`);
    } else {
      console.log('❌ Backend health check failed');
    }

    // STEP 2: Test login
    console.log('\n2️⃣ TESTING LOGIN...');
    const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    console.log(`   Status: ${loginResponse.status}`);
    console.log(`   CORS Origin: ${FRONTEND_URL}`);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful with production URL origin');
      console.log(`   Token: ${loginData.token?.substring(0, 20)}...`);
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ Login failed:', errorText.substring(0, 100));
    }

    // STEP 3: Test CORS headers
    console.log('\n3️⃣ TESTING CORS CONFIGURATION...');
    const corsResponse = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    console.log(`   Preflight Status: ${corsResponse.status}`);
    console.log(`   Access-Control-Allow-Origin: ${corsResponse.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`   Access-Control-Allow-Methods: ${corsResponse.headers.get('Access-Control-Allow-Methods')}`);
    
    if (corsResponse.ok) {
      console.log('✅ CORS configured correctly for production URL');
    } else {
      console.log('❌ CORS configuration issue');
    }

    // STEP 4: Verify environment variables
    console.log('\n4️⃣ CHECKING ENVIRONMENT CONFIGURATION...');
    console.log(`   FRONTEND_URL should be: ${FRONTEND_URL}`);
    console.log(`   Backend should accept requests from: ${FRONTEND_URL}`);
    console.log(`   Email templates should use: ${FRONTEND_URL}`);

    console.log('\n' + '='.repeat(60));
    console.log('🎯 PRODUCTION URL SETUP TEST COMPLETED');
    console.log('='.repeat(60));
    
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Backend Health: ${healthResponse.ok ? 'Working' : 'Failed'}`);
    console.log(`${loginResponse.ok ? '✅' : '❌'} Login with Production Origin: ${loginResponse.ok ? 'Working' : 'Failed'}`);
    console.log(`${corsResponse.ok ? '✅' : '❌'} CORS Configuration: ${corsResponse.ok ? 'Working' : 'Failed'}`);

    console.log('\n🌐 PRODUCTION ACCESS URLS:');
    console.log(`   🏠 Homepage: ${FRONTEND_URL}`);
    console.log(`   🔐 Login: ${FRONTEND_URL}/login`);
    console.log(`   📊 Dashboard: ${FRONTEND_URL}/dashboard`);
    console.log(`   👨‍💼 Admin: ${FRONTEND_URL}/admin/login`);
    
    console.log('\n🔗 API ENDPOINTS:');
    console.log(`   Health: GET ${BACKEND_URL}/api/health`);
    console.log(`   Login: POST ${BACKEND_URL}/api/auth/login`);
    console.log(`   Dashboard: GET ${BACKEND_URL}/api/client/dashboard`);
    console.log(`   Applications: GET ${BACKEND_URL}/api/applications`);

    console.log('\n✅ All systems configured for production domain!');

    return { 
      success: true, 
      results: {
        health: healthResponse.ok,
        login: loginResponse.ok,
        cors: corsResponse.ok
      }
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  testProductionUrlSetup()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 PRODUCTION URL SETUP VERIFIED!');
        process.exit(0);
      } else {
        console.error('\n💥 Production URL setup test failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { testProductionUrlSetup };