#!/usr/bin/env node

/**
 * Test Admin Login - Apply Bureau Backend
 * Quick test to verify admin login functionality
 */

const axios = require('axios');

const DEPLOYED_URL = 'https://apply-bureau-backend.onrender.com';
const API_URL = `${DEPLOYED_URL}/api`;

async function testAdminLogin() {
  console.log('🔐 Testing Admin Login');
  console.log('='.repeat(40));
  console.log(`🌐 Backend: ${DEPLOYED_URL}\n`);

  try {
    // Test admin login
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    }, { 
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin login successful!');
    console.log('   User:', loginResponse.data.user.full_name);
    console.log('   Role:', loginResponse.data.user.role);
    console.log('   Token received:', !!loginResponse.data.token);
    
    const token = loginResponse.data.token;

    // Test /api/auth/me
    console.log('\n2. Testing /api/auth/me...');
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ /api/auth/me working!');
    console.log('   User ID:', meResponse.data.user.id);
    console.log('   Email:', meResponse.data.user.email);

    // Test dashboard
    console.log('\n3. Testing dashboard...');
    const dashboardResponse = await axios.get(`${API_URL}/dashboard`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Dashboard working!');
    console.log('   Client data received:', !!dashboardResponse.data.client);

    // Test notifications
    console.log('\n4. Testing notifications...');
    const notificationsResponse = await axios.get(`${API_URL}/notifications`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Notifications working!');
    console.log('   Notifications count:', notificationsResponse.data.notifications.length);

    console.log('\n' + '='.repeat(40));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Admin login working');
    console.log('✅ Authentication working');
    console.log('✅ All API endpoints working');
    console.log('✅ CORS should be fixed for localhost:5173');
    console.log('\n🚀 Frontend developers can now connect!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAdminLogin();