require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testAdminCreation() {
  console.log('🧪 Testing Admin Creation System\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Login as master admin
    console.log('\n📝 Step 1: Login as master admin...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'Admin@123456'
    });

    if (!loginResponse.data.token) {
      console.error('❌ Login failed - no token received');
      console.log('Response:', loginResponse.data);
      return;
    }

    const masterToken = loginResponse.data.token;
    console.log('✅ Master admin logged in successfully');
    console.log('Token:', masterToken.substring(0, 20) + '...');

    // Step 2: Try to create a new admin
    console.log('\n📝 Step 2: Creating new admin account...');
    
    const newAdminData = {
      full_name: 'Test Admin User',
      email: `testadmin${Date.now()}@applybureau.com`,
      password: 'TestAdmin@123456',
      phone: '+1234567890'
    };

    console.log('Admin data:', {
      ...newAdminData,
      password: '***hidden***'
    });

    try {
      const createResponse = await axios.post(
        `${API_URL}/api/admin-management/admins`,
        newAdminData,
        {
          headers: {
            'Authorization': `Bearer ${masterToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Admin created successfully!');
      console.log('Response:', JSON.stringify(createResponse.data, null, 2));

    } catch (createError) {
      console.error('❌ Admin creation failed!');
      
      if (createError.response) {
        console.error('Status:', createError.response.status);
        console.error('Error:', JSON.stringify(createError.response.data, null, 2));
        console.error('Headers:', createError.response.headers);
      } else if (createError.request) {
        console.error('No response received');
        console.error('Request:', createError.request);
      } else {
        console.error('Error:', createError.message);
      }
      
      throw createError;
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

testAdminCreation();
