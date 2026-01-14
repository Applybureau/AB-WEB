require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAdminApprovalWithFreshUser() {
  try {
    console.log('🧪 TESTING ADMIN APPROVAL WITH FRESH USER');
    console.log('=========================================');
    
    const onboardingId = '398e94ed-cad5-4fe2-a96f-603dd4e8a060';
    
    // 1. Get admin token
    console.log('\n🔐 1. Getting admin token...');
    const adminCredentials = {
      email: 'admin@applybureau.com',
      password: 'admin123'
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, adminCredentials);
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // 2. Test the approval endpoint
    console.log('\n✅ 2. Testing approval endpoint...');
    const approvalData = {
      admin_notes: 'Fresh user test - approved for testing purposes'
    };
    
    try {
      const approvalResponse = await axios.post(
        `${BASE_URL}/api/admin/concierge/onboarding/${onboardingId}/approve`,
        approvalData,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Approval successful!');
      console.log('📋 Response:', JSON.stringify(approvalResponse.data, null, 2));
      
      // 3. Test client login and application tracker access
      console.log('\n👤 3. Testing client access...');
      const clientCredentials = {
        email: 'fresh.test@example.com',
        password: 'FreshTest123!'
      };
      
      const clientLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, clientCredentials);
      const clientToken = clientLoginResponse.data.token;
      console.log('✅ Client login successful');
      console.log(`   Profile Unlocked: ${clientLoginResponse.data.user.profile_unlocked}`);
      
      // 4. Test application tracker access
      console.log('\n📊 4. Testing application tracker access...');
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
      
      // 5. Test weekly application grouping
      console.log('\n📱 5. Testing weekly application grouping...');
      const weeklyResponse = await axios.get(
        `${BASE_URL}/api/applications/weekly?weeks_back=4`,
        {
          headers: {
            'Authorization': `Bearer ${clientToken}`
          }
        }
      );
      
      console.log('✅ Weekly application grouping successful!');
      console.log('📋 Weekly response:', JSON.stringify(weeklyResponse.data, null, 2));
      
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('The admin approval workflow is now working correctly.');
      
      return true;
      
    } catch (approvalError) {
      console.log('❌ Approval failed');
      console.log('📋 Error response:', JSON.stringify(approvalError.response?.data, null, 2));
      console.log('📋 Error status:', approvalError.response?.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return false;
  }
}

testAdminApprovalWithFreshUser().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});