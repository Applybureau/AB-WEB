require('dotenv').config();
const axios = require('axios');

const VERCEL_URL = 'https://apply-bureau-backend.vercel.app';

async function testAdminCreation() {
  console.log('\n🧪 FINAL TEST: ADMIN CREATION ON VERCEL\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login
    console.log('\n📋 Step 1: Logging in...');
    const loginResponse = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });

    console.log('✅ Login successful!');
    console.log('User:', loginResponse.data.user.email);
    console.log('Role:', loginResponse.data.user.role);
    
    const token = loginResponse.data.token;

    // Step 2: Create admin
    console.log('\n📋 Step 2: Creating new admin...');
    
    const newAdminData = {
      full_name: 'Test Admin',
      email: `testadmin${Date.now()}@applybureau.com`,
      password: 'TestAdmin@123',
      phone: '+1234567890'
    };

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
    console.log('New admin:', createResponse.data.admin);

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n✅ Summary:');
    console.log('  - Login works with admin123');
    console.log('  - Admin creation works');
    console.log('  - Super admin permissions verified');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
      
      if (error.response.status === 403) {
        console.log('\n💡 403 Error means:');
        console.log('   - Login worked (token is valid)');
        console.log('   - But user is not recognized as super admin');
        console.log('   - The isSuperAdmin() function needs to check the admins table');
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
