require('dotenv').config();
const axios = require('axios');

const VERCEL_URL = 'https://apply-bureau-backend.vercel.app';

async function testLoginAfterRateLimit() {
  console.log('🔐 Testing Admin Login After Rate Limit Reset\n');
  console.log('='.repeat(60));
  console.log('\n⚠️  Make sure 15 minutes have passed since last attempt!\n');
  console.log('='.repeat(60));

  // Test 1: Valid admin login
  console.log('\n📝 Test 1: Valid Admin Login');
  console.log('Endpoint: POST /api/auth/login');
  console.log('Payload:', JSON.stringify({
    email: 'admin@applybureau.com',
    password: 'Admin@123456'
  }, null, 2));

  try {
    const response = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'Admin@123456'
    }, {
      validateStatus: () => true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log('\n🎉 SUCCESS! Login working correctly!');
      console.log('Token received:', response.data.token ? 'Yes ✓' : 'No ✗');
      console.log('User data:', response.data.user ? 'Yes ✓' : 'No ✗');
      
      if (response.data.token) {
        console.log('\n📋 You can use this token for testing:');
        console.log(response.data.token.substring(0, 50) + '...');
      }
    } else if (response.status === 401) {
      console.log('\n❌ AUTHENTICATION FAILED');
      console.log('This means the credentials are wrong or user not found.');
      console.log('Check if admin exists in database.');
    } else if (response.status === 400) {
      console.log('\n❌ VALIDATION ERROR');
      console.log('This means the payload format is wrong.');
      console.log('Error details:', response.data);
    } else if (response.status === 429) {
      console.log('\n⏳ STILL RATE LIMITED');
      console.log('Please wait', response.data.retryAfter, 'seconds before trying again.');
      console.log('That\'s about', Math.ceil(response.data.retryAfter / 60), 'minutes.');
    } else {
      console.log('\n⚠️  UNEXPECTED STATUS CODE');
      console.log('Something else went wrong.');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }

  // Test 2: Test with wrong password (should return 401, not 400)
  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Test 2: Wrong Password (Should Return 401)');
  
  try {
    const response = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'WrongPassword123'
    }, {
      validateStatus: () => true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Correct! Returns 401 for wrong password.');
    } else if (response.status === 429) {
      console.log('⏳ Rate limited - skip this test');
    } else {
      console.log('⚠️  Unexpected status:', response.status);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 3: Test with missing email (should return 400)
  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Test 3: Missing Email (Should Return 400)');
  
  try {
    const response = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      password: 'Admin@123456'
    }, {
      validateStatus: () => true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 400) {
      console.log('✅ Correct! Returns 400 for missing email.');
    } else if (response.status === 429) {
      console.log('⏳ Rate limited - skip this test');
    } else {
      console.log('⚠️  Unexpected status:', response.status);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log('- 200 = Login successful (backend working correctly)');
  console.log('- 400 = Validation error (wrong payload format)');
  console.log('- 401 = Wrong credentials (user not found or wrong password)');
  console.log('- 429 = Rate limited (wait 15 minutes)');
  console.log('\n💡 If you get 400 from frontend but 200 from this script,');
  console.log('   the issue is in the frontend payload format!');
  console.log('\n='.repeat(60));
}

testLoginAfterRateLimit();
