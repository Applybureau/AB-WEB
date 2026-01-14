const axios = require('axios');

async function testDeployedHealth() {
  try {
    console.log('🏥 Testing deployed backend health...');
    
    const response = await axios.get('https://apply-bureau-backend.vercel.app/health');
    
    console.log('✅ Health check successful');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
    return true;
  } catch (error) {
    console.log('❌ Health check failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('🔍 Server error detected - checking deployment logs...');
    }
    
    return false;
  }
}

testDeployedHealth();