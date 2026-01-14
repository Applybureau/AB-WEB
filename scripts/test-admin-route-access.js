require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAdminRouteAccess() {
  try {
    console.log('🧪 TESTING ADMIN ROUTE ACCESS');
    console.log('=============================');
    
    // 1. Get admin token
    console.log('\n🔐 1. Getting admin token...');
    const adminCredentials = {
      email: 'admin@applybureau.com',
      password: 'admin123'
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, adminCredentials);
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // 2. Test different admin concierge routes
    const routes = [
      '/api/admin/concierge/consultations',
      '/api/admin/concierge/onboarding/test-id/approve'
    ];
    
    for (const route of routes) {
      console.log(`\n🔍 Testing route: ${route}`);
      try {
        const response = await axios.get(`${BASE_URL}${route}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        console.log(`✅ Route accessible - Status: ${response.status}`);
      } catch (error) {
        console.log(`❌ Route error - Status: ${error.response?.status}`);
        console.log(`   Error: ${error.response?.data?.error || error.message}`);
        
        if (error.response?.status === 404) {
          console.log('   This suggests the route is not found');
        } else if (error.response?.status === 405) {
          console.log('   This suggests wrong HTTP method');
        }
      }
    }
    
    // 3. Test POST to the approval route with a fake ID
    console.log('\n📝 3. Testing POST to approval route...');
    try {
      const response = await axios.post(
        `${BASE_URL}/api/admin/concierge/onboarding/fake-id/approve`,
        { admin_notes: 'test' },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ POST route accessible - Status: ${response.status}`);
    } catch (error) {
      console.log(`❌ POST route error - Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
      
      if (error.response?.status === 404 && error.response?.data?.error === 'Onboarding record not found') {
        console.log('   ✅ Route is working! The 404 is from our business logic, not routing');
      } else if (error.response?.status === 404) {
        console.log('   ❌ Route not found - this is a routing issue');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminRouteAccess().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});