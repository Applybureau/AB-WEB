const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.onrender.com';

async function debugRoutes() {
  console.log('🔍 Debugging deployed routes...');
  
  // Test different endpoints to see what's available
  const endpoints = [
    '/api/consultations',
    '/api/consultation-requests', 
    '/api/contact',
    '/api/auth/login'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📍 Testing ${endpoint}:`);
      
      // Try GET first
      try {
        const getResponse = await axios.get(`${BASE_URL}${endpoint}`);
        console.log(`  GET: ✅ ${getResponse.status} - ${JSON.stringify(getResponse.data).substring(0, 100)}...`);
      } catch (getError) {
        console.log(`  GET: ❌ ${getError.response?.status || 'ERROR'} - ${getError.response?.data?.error || getError.message}`);
      }
      
      // Try POST with minimal data
      try {
        const postResponse = await axios.post(`${BASE_URL}${endpoint}`, {
          test: 'data'
        });
        console.log(`  POST: ✅ ${postResponse.status} - ${JSON.stringify(postResponse.data).substring(0, 100)}...`);
      } catch (postError) {
        console.log(`  POST: ❌ ${postError.response?.status || 'ERROR'} - ${postError.response?.data?.error || postError.message}`);
      }
      
    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
    }
  }
  
  // Test admin login to get token
  console.log('\n🔐 Testing admin login:');
  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    console.log('✅ Admin login successful');
    
    const token = loginResponse.data.token;
    
    // Test authenticated GET to consultations
    console.log('\n🔒 Testing authenticated GET /api/consultations:');
    try {
      const authResponse = await axios.get(`${BASE_URL}/api/consultations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`✅ Authenticated GET: ${authResponse.status} - Found ${authResponse.data.length || 'unknown'} items`);
    } catch (authError) {
      console.log(`❌ Authenticated GET: ${authError.response?.status || 'ERROR'} - ${authError.response?.data?.error || authError.message}`);
    }
    
  } catch (loginError) {
    console.log(`❌ Admin login failed: ${loginError.response?.data?.error || loginError.message}`);
  }
}

debugRoutes();