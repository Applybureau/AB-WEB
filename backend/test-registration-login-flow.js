require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function testRegistrationLoginFlow() {
  console.log('\n🧪 TESTING REGISTRATION & LOGIN FLOW\n');
  console.log('=' .repeat(60));
  console.log(`Base URL: ${BASE_URL}\n`);

  try {
    // Test 1: Login with existing user
    console.log('\n📝 TEST 1: Login with existing user');
    console.log('-'.repeat(60));
    
    const loginData = {
      email: 'israelloko65@gmail.com',
      password: 'TestPassword123!' // Replace with actual password
    };

    console.log(`Attempting login for: ${loginData.email}`);
    console.log('⚠️  NOTE: Replace password with the actual password used during registration\n');

    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
      
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('\nResponse:');
      console.log(JSON.stringify(loginResponse.data, null, 2));
      
      if (loginResponse.data.token) {
        console.log('\n🎫 Auth Token received');
        console.log('User can now access protected endpoints');
      }

      // Test 2: Get user info with token
      console.log('\n\n📝 TEST 2: Get current user info');
      console.log('-'.repeat(60));
      
      const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });

      console.log('✅ USER INFO RETRIEVED!');
      console.log('\nUser Data:');
      console.log(JSON.stringify(meResponse.data, null, 2));

    } catch (loginError) {
      if (loginError.response) {
        console.log('❌ LOGIN FAILED');
        console.log(`Status: ${loginError.response.status}`);
        console.log('Error:', loginError.response.data);
        
        if (loginError.response.status === 401) {
          console.log('\n💡 TROUBLESHOOTING:');
          console.log('1. Verify the password is correct');
          console.log('2. Check that token_used = true in registered_users table');
          console.log('3. Check that is_active = true');
          console.log('4. Check that payment_confirmed = true');
          console.log('5. Verify passcode_hash is not null');
        }
      } else {
        console.log('❌ REQUEST ERROR:', loginError.message);
        console.log('\n💡 Make sure the backend server is running on', BASE_URL);
      }
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE\n');

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
  }
}

// Instructions
console.log('\n📋 INSTRUCTIONS:');
console.log('=' .repeat(60));
console.log('1. Make sure backend server is running');
console.log('2. Update the password in this script with the actual password');
console.log('3. Run: node test-registration-login-flow.js');
console.log('=' .repeat(60));

testRegistrationLoginFlow();
