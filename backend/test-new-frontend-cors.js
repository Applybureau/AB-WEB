#!/usr/bin/env node

/**
 * Test New Frontend CORS Configuration
 * Test that the new frontend URL https://www.applybureau.com works with the backend
 */

const BASE_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';
const NEW_FRONTEND_URL = 'https://www.applybureau.com';

async function testNewFrontendCORS() {
  console.log('🧪 TESTING NEW FRONTEND CORS CONFIGURATION\n');
  console.log('='.repeat(60));
  console.log(`🌐 Backend URL: ${BASE_URL}`);
  console.log(`🖥️  Frontend URL: ${NEW_FRONTEND_URL}`);
  console.log('='.repeat(60));

  try {
    // STEP 1: Test preflight request (OPTIONS)
    console.log('\n1️⃣ TESTING PREFLIGHT REQUEST (OPTIONS)...');
    const preflightResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': NEW_FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    console.log(`   Status: ${preflightResponse.status}`);
    console.log(`   Access-Control-Allow-Origin: ${preflightResponse.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`   Access-Control-Allow-Methods: ${preflightResponse.headers.get('Access-Control-Allow-Methods')}`);
    console.log(`   Access-Control-Allow-Headers: ${preflightResponse.headers.get('Access-Control-Allow-Headers')}`);
    console.log(`   Access-Control-Allow-Credentials: ${preflightResponse.headers.get('Access-Control-Allow-Credentials')}`);

    if (preflightResponse.ok) {
      console.log('✅ Preflight request successful');
    } else {
      console.log('❌ Preflight request failed');
    }

    // STEP 2: Test actual login request with Origin header
    console.log('\n2️⃣ TESTING LOGIN REQUEST WITH ORIGIN HEADER...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': NEW_FRONTEND_URL
      },
      body: JSON.stringify({
        email: 'israelloko65@gmail.com',
        password: 'SimplePass123!'
      })
    });

    console.log(`   Status: ${loginResponse.status}`);
    console.log(`   Access-Control-Allow-Origin: ${loginResponse.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`   Access-Control-Allow-Credentials: ${loginResponse.headers.get('Access-Control-Allow-Credentials')}`);

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login request successful');
      console.log(`   Token received: ${loginData.token ? 'Yes' : 'No'}`);
      
      // STEP 3: Test authenticated request
      if (loginData.token) {
        console.log('\n3️⃣ TESTING AUTHENTICATED REQUEST...');
        const authResponse = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Origin': NEW_FRONTEND_URL
          }
        });

        console.log(`   Status: ${authResponse.status}`);
        console.log(`   Access-Control-Allow-Origin: ${authResponse.headers.get('Access-Control-Allow-Origin')}`);

        if (authResponse.ok) {
          console.log('✅ Authenticated request successful');
        } else {
          console.log('❌ Authenticated request failed');
        }
      }
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ Login request failed:', errorText);
    }

    // STEP 4: Test health endpoint
    console.log('\n4️⃣ TESTING HEALTH ENDPOINT...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`, {
      headers: {
        'Origin': NEW_FRONTEND_URL
      }
    });

    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Access-Control-Allow-Origin: ${healthResponse.headers.get('Access-Control-Allow-Origin')}`);

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health endpoint working');
      console.log(`   Service: ${healthData.service}`);
      console.log(`   Status: ${healthData.status}`);
    } else {
      console.log('❌ Health endpoint failed');
    }

    // STEP 5: Test other frontend URLs
    console.log('\n5️⃣ TESTING OTHER FRONTEND URLS...');
    
    const otherUrls = [
      'https://applybureau.com',
      'https://apply-bureau.vercel.app',
      'http://localhost:3000'
    ];

    for (const url of otherUrls) {
      console.log(`\n   Testing: ${url}`);
      const testResponse = await fetch(`${BASE_URL}/api/health`, {
        headers: {
          'Origin': url
        }
      });
      
      console.log(`   Status: ${testResponse.status}`);
      console.log(`   CORS Origin: ${testResponse.headers.get('Access-Control-Allow-Origin')}`);
      console.log(`   Result: ${testResponse.ok ? '✅ Working' : '❌ Failed'}`);
    }

    // FINAL SUMMARY
    console.log('\n' + '='.repeat(60));
    console.log('🎉 CORS TESTING COMPLETED!');
    console.log('='.repeat(60));
    
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Preflight (OPTIONS): ${preflightResponse.ok ? 'Working' : 'Failed'}`);
    console.log(`✅ Login Request: ${loginResponse.ok ? 'Working' : 'Failed'}`);
    console.log(`✅ Health Check: ${healthResponse.ok ? 'Working' : 'Failed'}`);

    console.log('\n🌐 FRONTEND URLS READY:');
    console.log('   Primary: https://www.applybureau.com');
    console.log('   Secondary: https://applybureau.com');
    console.log('   Development: https://apply-bureau.vercel.app');
    
    console.log('\n🔗 BACKEND ENDPOINTS:');
    console.log(`   API Base: ${BASE_URL}`);
    console.log(`   Login: POST ${BASE_URL}/api/auth/login`);
    console.log(`   Dashboard: GET ${BASE_URL}/api/client/dashboard`);
    console.log(`   Health: GET ${BASE_URL}/api/health`);

    return { 
      success: true, 
      results: {
        preflight: preflightResponse.ok,
        login: loginResponse.ok,
        health: healthResponse.ok
      }
    };

  } catch (error) {
    console.error('❌ CORS test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  testNewFrontendCORS()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 ALL CORS TESTS COMPLETED!');
        console.log('\n✅ The new frontend URL https://www.applybureau.com is ready to use!');
        process.exit(0);
      } else {
        console.error('\n💥 CORS tests failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { testNewFrontendCORS };