const axios = require('axios');

async function testApplicationsWorkflow() {
  try {
    // First login to get token
    const loginRes = await axios.post('https://apply-bureau-backend.vercel.app/api/auth/login', {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('Login successful, token received');
    
    // Test applications workflow
    const res = await axios.get('https://apply-bureau-backend.vercel.app/api/applications-workflow', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('SUCCESS:', JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.log('ERROR Status:', error.response?.status);
    console.log('ERROR Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('ERROR Message:', error.message);
  }
}

testApplicationsWorkflow();