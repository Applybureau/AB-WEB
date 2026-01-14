require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSingleRegistration() {
  try {
    console.log('🧪 TESTING SINGLE REGISTRATION FLOW');
    console.log('===================================');
    
    // First, get a valid registration token from the database
    const { supabaseAdmin } = require('../utils/supabase');
    
    const { data: user, error } = await supabaseAdmin
      .from('registered_users')
      .select('registration_token, email, full_name, payment_confirmed, token_used')
      .eq('email', 'john.concierge@test.com')
      .single();
    
    if (error || !user) {
      console.log('❌ No test user found in database');
      return;
    }
    
    console.log('📋 User data from database:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.full_name}`);
    console.log(`   Payment Confirmed: ${user.payment_confirmed}`);
    console.log(`   Token Used: ${user.token_used}`);
    console.log(`   Token: ${user.registration_token?.substring(0, 50)}...`);
    
    if (!user.registration_token) {
      console.log('❌ No registration token found for user');
      return;
    }
    
    // Test token validation endpoint first
    console.log('\n🔍 Testing token validation endpoint...');
    try {
      const validateResponse = await axios.get(
        `${BASE_URL}/api/client-registration/validate-token/${user.registration_token}`
      );
      console.log('✅ Token validation successful');
      console.log('📋 Validation response:', JSON.stringify(validateResponse.data, null, 2));
    } catch (validateError) {
      console.log('❌ Token validation failed');
      console.log('📋 Error response:', JSON.stringify(validateError.response?.data, null, 2));
      
      // Let's decode the token manually to see what's wrong
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(user.registration_token, process.env.JWT_SECRET);
        console.log('🔍 Manually decoded token:', JSON.stringify(decoded, null, 2));
      } catch (jwtError) {
        console.log('❌ JWT verification failed:', jwtError.message);
      }
      
      return;
    }
    
    // Test registration endpoint
    console.log('\n👤 Testing registration endpoint...');
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
      console.log('✅ Registration successful');
      console.log('📋 Registration response:', JSON.stringify(registerResponse.data, null, 2));
    } catch (registerError) {
      console.log('❌ Registration failed');
      console.log('📋 Error response:', JSON.stringify(registerError.response?.data, null, 2));
      console.log('📋 Error status:', registerError.response?.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSingleRegistration().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});