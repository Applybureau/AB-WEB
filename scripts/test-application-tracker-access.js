require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testApplicationTrackerAccess() {
  try {
    console.log('🧪 TESTING APPLICATION TRACKER ACCESS');
    console.log('====================================');
    
    // Get client token (we need to register again since the token might be expired)
    console.log('\n🔐 1. Getting client token...');
    
    // First get a valid registration token
    const { supabaseAdmin } = require('../utils/supabase');
    const { data: user, error } = await supabaseAdmin
      .from('registered_users')
      .select('registration_token')
      .eq('email', 'john.concierge@test.com')
      .single();
    
    if (error || !user || !user.registration_token) {
      console.log('❌ No valid registration token found');
      return;
    }
    
    // Register with the token to get a fresh client token
    const registrationData = {
      token: user.registration_token,
      password: 'TestPassword123!',
      confirm_password: 'TestPassword123!'
    };
    
    try {
      const registerResponse = await axios.post(
        `${BASE_URL}/api/client-registration/register`,
        registrationData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const clientToken = registerResponse.data.token;
      console.log('✅ Client token obtained');
      
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
      
    } catch (registerError) {
      if (registerError.response?.data?.error === 'Token already used') {
        console.log('⚠️  Token already used, trying to login instead...');
        
        // Try to login
        const loginData = {
          email: 'john.concierge@test.com',
          password: 'TestPassword123!'
        };
        
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
        const clientToken = loginResponse.data.token;
        console.log('✅ Client login successful');
        
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
        
      } else {
        throw registerError;
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testApplicationTrackerAccess().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});