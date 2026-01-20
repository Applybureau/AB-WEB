require('dotenv').config();
const axios = require('axios');

async function testAdminEndpointsSimple() {
  console.log('🔍 SIMPLE ADMIN ENDPOINTS TEST');
  console.log('==============================\n');

  try {
    // Login first
    console.log('1. Logging in...');
    const loginRes = await axios.post('https://apply-bureau-backend.vercel.app/api/auth/login', {
      email: 'admin@applybureau.com',
      password: 'Admin123@#'
    });
    
    const token = loginRes.data.token;
    const userId = loginRes.data.user?.id;
    console.log('✅ Login successful');
    console.log('User ID:', userId);
    console.log('User data:', JSON.stringify(loginRes.data.user, null, 2));

    // Test each endpoint individually
    console.log('\n2. Testing admin management root...');
    try {
      const rootRes = await axios.get('https://apply-bureau-backend.vercel.app/api/admin-management', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Root endpoint success:', rootRes.status);
    } catch (error) {
      console.log('❌ Root endpoint error:', error.response?.status, error.response?.data);
    }

    console.log('\n3. Testing admin list...');
    try {
      const listRes = await axios.get('https://apply-bureau-backend.vercel.app/api/admin-management/admins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Admin list success:', listRes.status, listRes.data);
    } catch (error) {
      console.log('❌ Admin list error:', error.response?.status, error.response?.data);
    }

    console.log('\n4. Testing admin profile...');
    try {
      const profileRes = await axios.get('https://apply-bureau-backend.vercel.app/api/admin-management/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Profile success:', profileRes.status);
      console.log('Profile data:', JSON.stringify(profileRes.data, null, 2));
    } catch (error) {
      console.log('❌ Profile error:', error.response?.status, error.response?.data);
    }

    console.log('\n5. Testing create admin...');
    try {
      const createRes = await axios.post('https://apply-bureau-backend.vercel.app/api/admin-management/admins', {
        email: 'testadmin@applybureau.com',
        password: 'TestAdmin123!',
        full_name: 'Test Administrator',
        phone: '+1234567890'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Create admin success:', createRes.status, createRes.data);
    } catch (error) {
      console.log('❌ Create admin error:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAdminEndpointsSimple();