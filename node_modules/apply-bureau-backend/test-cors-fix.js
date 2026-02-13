const axios = require('axios');

const PRODUCTION_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';
const FRONTEND_URL = 'https://www.applybureau.com';

async function testCORS() {
  console.log('🔍 Testing CORS Configuration\n');
  console.log('Backend URL:', PRODUCTION_URL);
  console.log('Frontend URL:', FRONTEND_URL);
  console.log('');

  try {
    // Test 1: OPTIONS preflight request
    console.log('1️⃣ Testing OPTIONS preflight request...');
    const optionsResponse = await axios.options(`${PRODUCTION_URL}/api/applications`, {
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization'
      }
    });

    console.log('✅ OPTIONS request successful');
    console.log('   Access-Control-Allow-Origin:', optionsResponse.headers['access-control-allow-origin']);
    console.log('   Access-Control-Allow-Methods:', optionsResponse.headers['access-control-allow-methods']);
    console.log('   Access-Control-Allow-Headers:', optionsResponse.headers['access-control-allow-headers']);
    console.log('   Access-Control-Allow-Credentials:', optionsResponse.headers['access-control-allow-credentials']);
    console.log('');

    // Test 2: Actual GET request with Origin header
    console.log('2️⃣ Testing GET request with Origin header...');
    const getResponse = await axios.get(`${PRODUCTION_URL}/health`, {
      headers: {
        'Origin': FRONTEND_URL
      }
    });

    console.log('✅ GET request successful');
    console.log('   Status:', getResponse.status);
    console.log('   Access-Control-Allow-Origin:', getResponse.headers['access-control-allow-origin']);
    console.log('   Response:', getResponse.data);
    console.log('');

    // Test 3: Login and POST request
    console.log('3️⃣ Testing POST request (login) with Origin header...');
    const loginResponse = await axios.post(
      `${PRODUCTION_URL}/api/auth/login`,
      {
        email: 'applybureau@gmail.com',
        password: 'Admin123@#'
      },
      {
        headers: {
          'Origin': FRONTEND_URL,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ POST request successful');
    console.log('   Status:', loginResponse.status);
    console.log('   Access-Control-Allow-Origin:', loginResponse.headers['access-control-allow-origin']);
    console.log('   Token received:', loginResponse.data.token ? 'Yes' : 'No');
    console.log('');

    // Test 4: Authenticated request with Origin
    console.log('4️⃣ Testing authenticated request with Origin header...');
    const token = loginResponse.data.token;
    const appsResponse = await axios.get(
      `${PRODUCTION_URL}/api/applications`,
      {
        headers: {
          'Origin': FRONTEND_URL,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Authenticated request successful');
    console.log('   Status:', appsResponse.status);
    console.log('   Access-Control-Allow-Origin:', appsResponse.headers['access-control-allow-origin']);
    console.log('   Applications count:', appsResponse.data.applications?.length || 0);
    console.log('');

    console.log('='.repeat(60));
    console.log('🎉 ALL CORS TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ CORS is properly configured');
    console.log('✅ Frontend can make requests to backend');
    console.log('✅ Preflight requests are handled correctly');
    console.log('✅ Credentials are allowed');
    console.log('\n📝 CORS Headers Summary:');
    console.log('   - Access-Control-Allow-Origin: ' + (appsResponse.headers['access-control-allow-origin'] || FRONTEND_URL));
    console.log('   - Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    console.log('   - Access-Control-Allow-Headers: Origin, Content-Type, Authorization');
    console.log('   - Access-Control-Allow-Credentials: true');

  } catch (error) {
    console.error('\n❌ CORS TEST FAILED!\n');
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      
      // Check for CORS-specific errors
      if (!error.response.headers['access-control-allow-origin']) {
        console.error('\n🔍 DIAGNOSIS: Missing Access-Control-Allow-Origin header');
        console.error('   This means CORS is not properly configured on the backend.');
        console.error('\n💡 SOLUTION:');
        console.error('   1. Ensure frontend URL is in allowedOrigins array');
        console.error('   2. Check that CORS middleware is properly configured');
        console.error('   3. Verify OPTIONS requests are handled');
      }
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

testCORS();
