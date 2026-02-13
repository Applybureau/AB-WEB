const axios = require('axios');

async function testProductionEndpoint() {
  console.log('🧪 Testing Production Application Creation Endpoint...\n');

  const PRODUCTION_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

  // Test 1: Check if endpoint exists (without auth)
  console.log('📍 Test 1: Checking if endpoint exists...');
  try {
    const response = await axios.post(`${PRODUCTION_URL}/api/applications`, {
      client_id: 'test',
      company: 'Test',
      job_title: 'Test'
    });
    console.log('Response:', response.status);
  } catch (error) {
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Message: ${error.response.data?.error || error.response.data}`);
      
      if (error.response.status === 401) {
        console.log('✅ Endpoint EXISTS (got 401 Unauthorized - expected without token)');
      } else if (error.response.status === 404) {
        console.log('❌ Endpoint NOT FOUND (404)');
      } else {
        console.log(`✅ Endpoint EXISTS (got ${error.response.status})`);
      }
    } else {
      console.log('❌ Network error:', error.message);
    }
  }

  console.log('\n');

  // Test 2: Check health endpoint
  console.log('📍 Test 2: Checking health endpoint...');
  try {
    const response = await axios.get(`${PRODUCTION_URL}/health`);
    console.log('✅ Health check passed');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  console.log('\n');

  // Test 3: Check if /api/admin/applications exists
  console.log('📍 Test 3: Checking /api/admin/applications endpoint...');
  try {
    const response = await axios.post(`${PRODUCTION_URL}/api/admin/applications`, {
      client_id: 'test',
      company: 'Test',
      job_title: 'Test'
    });
    console.log('Response:', response.status);
  } catch (error) {
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Message: ${error.response.data?.error || error.response.data}`);
      
      if (error.response.status === 401) {
        console.log('✅ Endpoint EXISTS (got 401 Unauthorized - expected without token)');
      } else if (error.response.status === 404) {
        console.log('❌ Endpoint NOT FOUND (404)');
      } else {
        console.log(`✅ Endpoint EXISTS (got ${error.response.status})`);
      }
    } else {
      console.log('❌ Network error:', error.message);
    }
  }

  console.log('\n');

  // Test 4: List all available routes
  console.log('📍 Test 4: Testing various endpoints...');
  const endpoints = [
    '/api/auth/login',
    '/api/applications',
    '/api/admin/applications',
    '/api/client/applications',
    '/api/consultations'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${PRODUCTION_URL}${endpoint}`);
      console.log(`✅ ${endpoint} - ${response.status}`);
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          console.log(`❌ ${endpoint} - NOT FOUND (404)`);
        } else if (status === 401) {
          console.log(`✅ ${endpoint} - EXISTS (401 Unauthorized)`);
        } else {
          console.log(`✅ ${endpoint} - EXISTS (${status})`);
        }
      } else {
        console.log(`❌ ${endpoint} - Network error`);
      }
    }
  }
}

testProductionEndpoint()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
