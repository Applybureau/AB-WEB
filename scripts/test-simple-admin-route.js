require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSimpleAdminRoute() {
  try {
    console.log('🧪 TESTING SIMPLE ADMIN ROUTE');
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
    
    // 2. Test the consultations route (we know this works)
    console.log('\n📋 2. Testing consultations route...');
    try {
      const consultationsResponse = await axios.get(
        `${BASE_URL}/api/admin/concierge/consultations`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );
      console.log('✅ Consultations route works');
      console.log(`   Found ${consultationsResponse.data.consultations.length} consultations`);
    } catch (error) {
      console.log('❌ Consultations route failed:', error.response?.status);
    }
    
    // 3. Test a simple GET to the onboarding route (should be 405 Method Not Allowed)
    console.log('\n🔍 3. Testing onboarding route with GET...');
    try {
      const getResponse = await axios.get(
        `${BASE_URL}/api/admin/concierge/onboarding/test-id/approve`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );
      console.log('✅ GET request worked (unexpected)');
    } catch (error) {
      if (error.response?.status === 405) {
        console.log('✅ GET request returned 405 Method Not Allowed (expected)');
        console.log('   This means the route exists but only accepts POST');
      } else if (error.response?.status === 404) {
        console.log('❌ GET request returned 404 - route not found');
        console.log('   This suggests the route is not properly mounted');
      } else {
        console.log(`❌ GET request returned ${error.response?.status}: ${error.response?.data?.error}`);
      }
    }
    
    // 4. Test POST with a fake ID (should return our error message)
    console.log('\n📝 4. Testing POST with fake ID...');
    try {
      const postResponse = await axios.post(
        `${BASE_URL}/api/admin/concierge/onboarding/fake-id-12345/approve`,
        { admin_notes: 'test' },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ POST request worked (unexpected)');
    } catch (error) {
      if (error.response?.status === 404 && error.response?.data?.error === 'Onboarding record not found') {
        console.log('✅ POST request returned our custom error message');
        console.log('   This means the route is working but the database lookup is failing');
      } else if (error.response?.status === 404) {
        console.log('❌ POST request returned generic 404 - route not found');
        console.log('   Error:', error.response?.data);
      } else {
        console.log(`❌ POST request returned ${error.response?.status}: ${error.response?.data?.error}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleAdminRoute().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});