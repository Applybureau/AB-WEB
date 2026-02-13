const fetch = require('node-fetch');

const PRODUCTION_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

// Test client credentials
const TEST_CLIENT = {
  email: 'israelloko65@gmail.com',
  password: 'Great123@'
};

let clientToken = null;

async function testEndpoint(name, method, endpoint, body = null, isFormData = false) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   ${method} ${endpoint}`);
  
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${clientToken}`
      }
    };

    if (body && !isFormData) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    } else if (body && isFormData) {
      options.body = body;
    }

    const response = await fetch(`${PRODUCTION_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`   ✅ SUCCESS (${response.status})`);
      console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
      return { success: true, data };
    } else {
      console.log(`   ❌ FAILED (${response.status})`);
      console.log(`   Error:`, data);
      return { success: false, error: data, status: response.status };
    }
  } catch (error) {
    console.log(`   ❌ ERROR:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Production Client Dashboard Endpoints');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 1: Login
  console.log('1️⃣ Logging in as client...');
  try {
    const loginResponse = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_CLIENT)
    });

    const loginData = await loginResponse.json();

    if (loginResponse.ok && loginData.token) {
      clientToken = loginData.token;
      console.log('   ✅ Login successful');
      console.log(`   Token: ${clientToken.substring(0, 20)}...`);
    } else {
      console.log('   ❌ Login failed:', loginData);
      console.log('\n⚠️  Cannot proceed without valid token. Please check credentials.');
      return;
    }
  } catch (error) {
    console.log('   ❌ Login error:', error.message);
    return;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 2: Test Main Dashboard
  await testEndpoint(
    'Main Dashboard',
    'GET',
    '/api/client/dashboard'
  );

  // Step 3: Test Strategy Call Booking
  await testEndpoint(
    'Book Strategy Call',
    'POST',
    '/api/strategy-calls',
    {
      preferred_slots: [
        { date: '2026-02-20', time: '10:00' },
        { date: '2026-02-21', time: '14:00' }
      ]
    }
  );

  // Step 4: Test Strategy Call Status
  await testEndpoint(
    'Strategy Call Status',
    'GET',
    '/api/strategy-calls/status'
  );

  // Step 5: Test Upload Status
  await testEndpoint(
    'Upload Status',
    'GET',
    '/api/client/dashboard/uploads/status'
  );

  // Step 6: Test LinkedIn Upload
  await testEndpoint(
    'Add LinkedIn',
    'POST',
    '/api/client/uploads/linkedin',
    {
      linkedin_url: 'https://linkedin.com/in/testuser'
    }
  );

  // Step 7: Test Portfolio Upload
  await testEndpoint(
    'Add Portfolio',
    'POST',
    '/api/client/uploads/portfolio',
    {
      portfolio_urls: ['https://testuser.com', 'https://github.com/testuser']
    }
  );

  // Step 8: Test 20Q Status
  await testEndpoint(
    '20Q Status',
    'GET',
    '/api/client/dashboard/onboarding/status'
  );

  // Step 9: Test Applications
  await testEndpoint(
    'Get Applications',
    'GET',
    '/api/applications'
  );

  // Step 10: Test Notifications
  await testEndpoint(
    'Get Notifications',
    'GET',
    '/api/notifications'
  );

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Testing Complete!\n');
}

// Run tests
runTests().catch(console.error);
