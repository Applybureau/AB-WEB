require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'https://jellyfish-app-t4m35.ondigitalocean.app';

// Test credentials from LOGIN_CREDENTIALS_AND_API.md
const ADMIN_CREDENTIALS = {
  email: 'applybureau@gmail.com',
  password: 'Admin123@#'
};

async function testApplicationEndpoints() {
  try {
    console.log('🔐 Logging in as admin...');
    
    // Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, ADMIN_CREDENTIALS);
    
    if (loginResponse.status !== 200) {
      console.error('❌ Admin login failed:', loginResponse.status);
      return;
    }
    
    const { token, user } = loginResponse.data;
    console.log(`✅ Admin login successful: ${user.email} (${user.role})`);
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test 1: Get all applications
    console.log('\n📋 Testing GET /api/applications...');
    try {
      const appsResponse = await axios.get(`${BASE_URL}/api/applications`, { headers });
      console.log(`✅ Applications endpoint working - found ${appsResponse.data.applications?.length || 0} applications`);
      
      if (appsResponse.data.applications && appsResponse.data.applications.length > 0) {
        console.log('📄 Sample applications:');
        appsResponse.data.applications.slice(0, 3).forEach(app => {
          console.log(`  - ${app.title || 'Untitled'} (${app.status}) - user_id: ${app.user_id ? 'set' : 'null'}`);
        });
      }
    } catch (error) {
      console.error('❌ Applications endpoint failed:', error.response?.data || error.message);
    }
    
    // Test 2: Get application stats
    console.log('\n📊 Testing GET /api/applications/stats...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/api/applications/stats`, { headers });
      console.log('✅ Application stats endpoint working');
      console.log('📈 Stats:', JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.error('❌ Application stats endpoint failed:', error.response?.data || error.message);
    }
    
    // Test 3: Get weekly applications
    console.log('\n📅 Testing GET /api/applications/weekly...');
    try {
      const weeklyResponse = await axios.get(`${BASE_URL}/api/applications/weekly`, { headers });
      console.log('✅ Weekly applications endpoint working');
      console.log('📅 Weekly data:', JSON.stringify(weeklyResponse.data, null, 2));
    } catch (error) {
      console.error('❌ Weekly applications endpoint failed:', error.response?.data || error.message);
    }
    
    // Test 4: Create a new application
    console.log('\n🆕 Testing POST /api/applications...');
    
    // First, get a client ID from existing applications
    try {
      const appsResponse = await axios.get(`${BASE_URL}/api/applications`, { headers });
      const existingApps = appsResponse.data.applications;
      
      if (existingApps && existingApps.length > 0) {
        const testClientId = existingApps[0].user_id || existingApps[0].client_id;
        
        const newApplication = {
          client_id: testClientId,
          company_name: 'Test Company Ltd',
          job_title: 'Senior Developer',
          job_description: 'Test application created by endpoint test',
          job_link: 'https://example.com/job',
          salary_range: '$80,000 - $100,000',
          location: 'Remote',
          application_method: 'Online',
          admin_notes: 'Created by application endpoint test script'
        };
        
        const createResponse = await axios.post(`${BASE_URL}/api/applications`, newApplication, { headers });
        console.log('✅ Application creation successful');
        console.log('📄 Created application:', {
          id: createResponse.data.application?.id,
          title: createResponse.data.application?.title,
          status: createResponse.data.application?.status
        });
        
        // Clean up - delete the test application
        if (createResponse.data.application?.id) {
          try {
            await axios.delete(`${BASE_URL}/api/applications/${createResponse.data.application.id}`, { headers });
            console.log('🧹 Test application cleaned up');
          } catch (deleteError) {
            console.log('⚠️  Could not delete test application (endpoint may not exist)');
          }
        }
        
      } else {
        console.log('⚠️  No existing applications found - cannot test creation without client_id');
      }
    } catch (error) {
      console.error('❌ Application creation failed:', error.response?.data || error.message);
    }
    
    // Test 5: Test discovery mode endpoint
    console.log('\n🔍 Testing GET /api/applications/discovery-mode...');
    try {
      const discoveryResponse = await axios.get(`${BASE_URL}/api/applications/discovery-mode`, { headers });
      console.log('✅ Discovery mode endpoint working');
      console.log('🔍 Discovery mode:', discoveryResponse.data);
    } catch (error) {
      console.error('❌ Discovery mode endpoint failed:', error.response?.data || error.message);
    }
    
    console.log('\n🎯 Application endpoints test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testApplicationEndpoints();