const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.onrender.com';

async function checkDeploymentStatus() {
  console.log('🔍 Checking deployment status...');
  
  try {
    // Check health endpoint
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Check if new routes exist by testing different endpoints
    console.log('\n📍 Testing route availability:');
    
    const routes = [
      { path: '/api/consultations', method: 'POST', description: 'New consultation endpoint' },
      { path: '/api/contact', method: 'POST', description: 'New contact endpoint' },
      { path: '/api/consultation-requests', method: 'POST', description: 'Old consultation endpoint' }
    ];
    
    for (const route of routes) {
      try {
        const response = await axios({
          method: route.method,
          url: `${BASE_URL}${route.path}`,
          data: { test: 'data' },
          validateStatus: () => true // Don't throw on 4xx/5xx
        });
        
        const status = response.status;
        const error = response.data?.error || 'No error';
        
        if (status === 404) {
          console.log(`❌ ${route.path}: Route not found (old deployment)`);
        } else if (status === 400 && error.includes('Missing required fields')) {
          console.log(`✅ ${route.path}: Route exists (new deployment)`);
        } else if (status === 401 && error.includes('Access token required')) {
          console.log(`⚠️  ${route.path}: Route exists but requires auth (check route config)`);
        } else {
          console.log(`🔍 ${route.path}: ${status} - ${error}`);
        }
      } catch (error) {
        console.log(`❌ ${route.path}: Connection error`);
      }
    }
    
    // Check server startup time to see if it's a fresh deployment
    const uptime = healthResponse.data.uptime;
    console.log(`\n⏱️  Server uptime: ${uptime}`);
    
    if (uptime.includes('0.') || uptime.includes('0 hours')) {
      console.log('🚀 Fresh deployment detected!');
    } else {
      console.log('⏳ Deployment might still be in progress...');
    }
    
  } catch (error) {
    console.error('❌ Failed to check deployment status:', error.message);
  }
}

checkDeploymentStatus();