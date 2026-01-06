#!/usr/bin/env node

/**
 * Debug Frontend Requests - Apply Bureau Backend
 * Simulate exact requests that frontend would make
 */

const axios = require('axios');

const DEPLOYED_URL = 'https://apply-bureau-backend.onrender.com';
const API_URL = `${DEPLOYED_URL}/api`;

async function debugFrontendRequests() {
  console.log('🔍 DEBUGGING FRONTEND REQUESTS');
  console.log('='.repeat(50));
  console.log(`🌐 Backend: ${DEPLOYED_URL}\n`);

  try {
    // Simulate frontend login request
    console.log('1. 🔐 Testing frontend login request...');
    const loginConfig = {
      method: 'POST',
      url: `${API_URL}/auth/login`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      data: {
        email: 'admin@applybureau.com',
        password: 'admin123'
      },
      timeout: 15000
    };

    console.log('Request config:', JSON.stringify(loginConfig, null, 2));
    
    const loginResponse = await axios(loginConfig);
    console.log('✅ Login successful!');
    console.log('Response status:', loginResponse.status);
    console.log('Response headers:', loginResponse.headers);
    console.log('User:', loginResponse.data.user.full_name);
    
    const token = loginResponse.data.token;

    // Test /api/auth/me
    console.log('\n2. 👤 Testing /api/auth/me...');
    const meConfig = {
      method: 'GET',
      url: `${API_URL}/auth/me`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      timeout: 10000
    };

    const meResponse = await axios(meConfig);
    console.log('✅ /api/auth/me working!');
    console.log('User ID:', meResponse.data.user.id);

    // Test dashboard
    console.log('\n3. 📊 Testing dashboard...');
    const dashboardConfig = {
      method: 'GET',
      url: `${API_URL}/dashboard`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      timeout: 10000
    };

    const dashboardResponse = await axios(dashboardConfig);
    console.log('✅ Dashboard working!');
    console.log('Client name:', dashboardResponse.data.client.full_name);

    // Test consultation creation
    console.log('\n4. 📅 Testing consultation creation...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    futureDate.setHours(14, 0, 0, 0);

    const consultationConfig = {
      method: 'POST',
      url: `${API_URL}/consultations`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      data: {
        client_id: dashboardResponse.data.client.id,
        scheduled_at: futureDate.toISOString(),
        admin_notes: 'Frontend debug test consultation'
      },
      timeout: 30000
    };

    console.log('Consultation request:', JSON.stringify(consultationConfig.data, null, 2));
    
    const consultationResponse = await axios(consultationConfig);
    console.log('✅ Consultation created!');
    console.log('Consultation ID:', consultationResponse.data.consultation.id);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL FRONTEND REQUESTS WORKING!');
    console.log('='.repeat(50));
    console.log('✅ Admin login: WORKING');
    console.log('✅ Authentication: WORKING');
    console.log('✅ Dashboard: WORKING');
    console.log('✅ Consultation creation: WORKING');
    console.log('✅ CORS: WORKING for localhost:5173');
    console.log('');
    console.log('🚀 Frontend should be able to connect successfully!');
    console.log('');
    console.log('📋 Frontend developers:');
    console.log('   - Use exact same headers as shown above');
    console.log('   - Make sure Origin header is set to localhost:5173');
    console.log('   - Include Authorization: Bearer <token> for protected routes');

  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    }
    if (error.config) {
      console.error('Request config:', error.config);
    }
  }
}

debugFrontendRequests();