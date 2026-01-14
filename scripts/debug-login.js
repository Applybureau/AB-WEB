require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function debugLogin() {
  try {
    console.log('🔍 DEBUGGING LOGIN');
    console.log('==================');
    
    const loginData = {
      email: 'john.concierge@test.com',
      password: 'ConciergeTest123!' // This was the password used in the comprehensive test
    };
    
    console.log('Attempting login with:');
    console.log(`   Email: ${loginData.email}`);
    console.log(`   Password: ${loginData.password}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
      console.log('✅ Login successful!');
      console.log('📋 Response:', JSON.stringify(response.data, null, 2));
      
      // Now test the application tracker
      const clientToken = response.data.token;
      console.log('\n📊 Testing application tracker...');
      
      const trackerResponse = await axios.get(
        `${BASE_URL}/api/applications`,
        {
          headers: {
            'Authorization': `Bearer ${clientToken}`
          }
        }
      );
      
      console.log('✅ Application tracker access successful!');
      console.log('📋 Tracker response:', JSON.stringify(trackerResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ Login failed');
      console.log('📋 Error response:', JSON.stringify(error.response?.data, null, 2));
      console.log('📋 Status code:', error.response?.status);
      
      if (error.response?.status === 401) {
        console.log('\n🔍 This suggests invalid credentials');
        console.log('The password might be different from what we expect');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugLogin().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});