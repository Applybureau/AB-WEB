require('dotenv').config();
const axios = require('axios');

const VERCEL_URL = 'https://apply-bureau-backend.vercel.app';

async function testAdminCreation() {
  console.log('\n🧪 TESTING ADMIN CREATION ON VERCEL\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login as super admin
    console.log('\n📋 Step 1: Logging in as super admin...');
    console.log('URL:', `${VERCEL_URL}/api/auth/login`);
    console.log('Credentials: admin@applybureau.com / admin123');

    const loginResponse = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });

    console.log('✅ Login successful!');
    console.log('Status:', loginResponse.status);
    console.log('User:', loginResponse.data.user);
    
    const token = loginResponse.data.token;
    console.log('Token received:', token.substring(0, 50) + '...');

    // Step 2: Test creating a new admin
    console.log('\n📋 Step 2: Creating new admin account...');
    console.log('URL:', `${VERCEL_URL}/api/admin-management/admins`);
    
    const newAdminData = {
      full_name: 'Test Admin',
      email: `testadmin${Date.now()}@applybureau.com`,
      password: 'TestAdmin@123',
      phone: '+1234567890'
    };

    console.log('New admin data:', {
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
    console.log('Status:', createResponse.status);
    console.log('Response:', createResponse.data);

    console.log('\n🎉 TEST PASSED - Admin creation works on Vercel!');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
      
      if (error.response.status === 400) {
        console.log('\n💡 400 Error - Validation issue:');
        console.log('   - Check if email/password format is correct');
        console.log('   - Check if admin with this email already exists');
      } else if (error.response.status === 401) {
        console.log('\n💡 401 Error - Authentication failed:');
        console.log('   - Login credentials are incorrect');
        console.log('   - Password might not match in database');
      } else if (error.response.status === 403) {
        console.log('\n💡 403 Error - Permission denied:');
        console.log('   - User is not recognized as super admin');
        console.log('   - Token might not have correct role');
        console.log('   - isSuperAdmin() check is failing');
      }
    } else {
      console.error('Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
}

// Run test
testAdminCreation()
  .then(() => {
    console.log('Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
