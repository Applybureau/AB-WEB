require('dotenv').config();
const axios = require('axios');

const VERCEL_URL = 'https://apply-bureau-backend.vercel.app';

async function testAdminCreation() {
  console.log('\n🧪 TEST: ADMIN CREATION WITHOUT PHOTO\n');
  console.log('=' .repeat(60));

  try {
    // Login
    console.log('\n📋 Step 1: Logging in...');
    const loginResponse = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });

    console.log('✅ Login successful!');
    const token = loginResponse.data.token;

    // Create admin with minimal data
    console.log('\n📋 Step 2: Creating admin (no photo)...');
    
    const newAdminData = {
      full_name: 'Test Admin',
      email: `testadmin${Date.now()}@applybureau.com`,
      password: 'TestAdmin123!',
      phone: ''  // Empty phone
    };

    console.log('Data:', {
      ...newAdminData,
      password: '***hidden***'
    });

    const createResponse = await axios.post(
      `${VERCEL_URL}/api/admin-management/admins`,
      newAdminData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Admin created successfully!');
    console.log('Response:', createResponse.data);

    console.log('\n🎉 SUCCESS! Admin creation works!');

  } catch (error) {
    console.error('\n❌ FAILED');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
      
      if (error.response.status === 500) {
        console.log('\n💡 500 Error suggests:');
        console.log('   - Super admin check passed');
        console.log('   - But something failed during creation');
        console.log('   - Could be: database insert, email sending, or file upload');
      }
    } else {
      console.error('Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
}

testAdminCreation()
  .then(() => {
    console.log('Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
