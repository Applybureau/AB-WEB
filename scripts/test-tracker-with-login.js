require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testTrackerWithLogin() {
  try {
    console.log('🧪 TESTING TRACKER WITH LOGIN');
    console.log('=============================');
    
    // Try to login
    console.log('\n🔐 1. Logging in as client...');
    const loginData = {
      email: 'john.concierge@test.com',
      password: 'TestPassword123!'
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    const clientToken = loginResponse.data.token;
    console.log('✅ Client login successful');
    console.log(`   User: ${loginResponse.data.user.full_name}`);
    console.log(`   Profile Unlocked: ${loginResponse.data.user.profile_unlocked}`);
    
    // Test application tracker access
    console.log('\n📊 2. Testing application tracker access...');
    const trackerResponse = await axios.get(
      `${BASE_URL}/api/applications`,
      {
        headers: {
          'Authorization': `Bearer ${clientToken}`
        }
      }
    );
    
    console.log('✅ Application tracker access successful!');
    console.log('📋 Response:', JSON.stringify(trackerResponse.data, null, 2));
    
    // Test weekly application grouping
    console.log('\n📱 3. Testing weekly application grouping...');
    const weeklyResponse = await axios.get(
      `${BASE_URL}/api/applications/weekly?weeks_back=4`,
      {
        headers: {
          'Authorization': `Bearer ${clientToken}`
        }
      }
    );
    
    console.log('✅ Weekly application grouping successful!');
    console.log('📋 Response:', JSON.stringify(weeklyResponse.data, null, 2));
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('The application tracker is now accessible after manual profile unlock.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testTrackerWithLogin().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});