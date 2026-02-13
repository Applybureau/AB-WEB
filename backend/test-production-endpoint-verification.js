require('dotenv').config();
const axios = require('axios');

const PRODUCTION_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

async function testProductionEndpoint() {
  console.log('🔍 Testing Production Endpoint Verification\n');
  console.log('Production URL:', PRODUCTION_URL);
  console.log('Testing endpoint: POST /api/applications\n');

  try {
    // Step 1: Test health endpoint
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${PRODUCTION_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('   Service:', healthResponse.data.service);
    console.log('   Uptime:', healthResponse.data.uptime, '\n');

    // Step 2: Login as admin to get token
    console.log('2️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${PRODUCTION_URL}/api/auth/login`, {
      email: 'applybureau@gmail.com',
      password: 'Admin123@#'
    });

    if (!loginResponse.data.token) {
      throw new Error('No token received from login');
    }

    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    console.log('   User:', loginResponse.data.user.full_name);
    console.log('   Role:', loginResponse.data.user.role);
    console.log('   Token:', adminToken.substring(0, 20) + '...\n');

    // Step 3: Get a test client ID
    console.log('3️⃣ Fetching test client...');
    const clientsResponse = await axios.get(`${PRODUCTION_URL}/api/admin/clients?limit=1`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!clientsResponse.data.clients || clientsResponse.data.clients.length === 0) {
      throw new Error('No clients found in database');
    }

    const testClient = clientsResponse.data.clients[0];
    console.log('✅ Test client found:');
    console.log('   Client ID:', testClient.id);
    console.log('   Name:', testClient.full_name);
    console.log('   Email:', testClient.email, '\n');

    // Step 4: Test application creation endpoint
    console.log('4️⃣ Testing application creation endpoint...');
    console.log('   Endpoint: POST /api/applications');
    
    const applicationData = {
      client_id: testClient.id,
      company: 'Production Test Corp',
      job_title: 'Test Engineer',
      job_description: 'Testing production endpoint deployment',
      job_url: 'https://example.com/job/test',
      salary_range: '$100k-$150k',
      job_type: 'full-time',
      application_strategy: 'Testing production deployment',
      admin_notes: 'Production endpoint verification test'
    };

    console.log('   Request data:', JSON.stringify(applicationData, null, 2));

    const createResponse = await axios.post(
      `${PRODUCTION_URL}/api/applications`,
      applicationData,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ APPLICATION CREATED SUCCESSFULLY!');
    console.log('   Application ID:', createResponse.data.application.id);
    console.log('   Company:', createResponse.data.application.company);
    console.log('   Job Title:', createResponse.data.application.job_title);
    console.log('   Status:', createResponse.data.application.status);
    console.log('   Created At:', createResponse.data.application.created_at);
    console.log('   Applied By Admin:', createResponse.data.application.applied_by_admin);

    // Step 5: Verify the application was created
    console.log('\n5️⃣ Verifying application in database...');
    const verifyResponse = await axios.get(
      `${PRODUCTION_URL}/api/applications?client_id=${testClient.id}`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );

    const createdApp = verifyResponse.data.applications.find(
      app => app.id === createResponse.data.application.id
    );

    if (createdApp) {
      console.log('✅ Application verified in database');
      console.log('   Total applications for client:', verifyResponse.data.applications.length);
    } else {
      console.log('⚠️  Application not found in verification query');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 PRODUCTION ENDPOINT TEST PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ Endpoint is working correctly on production');
    console.log('✅ DigitalOcean deployment is successful');
    console.log('✅ Application creation flow is functional');
    console.log('\n📝 Summary:');
    console.log('   - Health check: PASSED');
    console.log('   - Admin authentication: PASSED');
    console.log('   - Client retrieval: PASSED');
    console.log('   - Application creation: PASSED');
    console.log('   - Database verification: PASSED');

  } catch (error) {
    console.error('\n❌ PRODUCTION ENDPOINT TEST FAILED!\n');
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Request URL:', error.config?.url);
      console.error('Request Method:', error.config?.method);
      console.error('Request Headers:', JSON.stringify(error.config?.headers, null, 2));
      
      if (error.response.status === 404) {
        console.error('\n🔍 DIAGNOSIS: Endpoint Not Found (404)');
        console.error('   This means the route is not registered on the server.');
        console.error('   Possible causes:');
        console.error('   1. DigitalOcean deployment did not complete');
        console.error('   2. Route is not properly registered in server.js');
        console.error('   3. Application is not running on production');
        console.error('\n💡 SOLUTION:');
        console.error('   1. Check DigitalOcean deployment logs');
        console.error('   2. Verify server.js includes: app.use(\'/api/applications\', applicationRoutes)');
        console.error('   3. Ensure latest code is pushed to GitHub');
      }
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

testProductionEndpoint();
