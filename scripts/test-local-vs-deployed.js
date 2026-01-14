const axios = require('axios');

async function testBothEnvironments() {
  console.log('🧪 Testing Local vs Deployed Backend');
  console.log('=====================================');
  
  // Test local
  console.log('\n🏠 Testing Local Backend...');
  try {
    const localResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Local backend working');
    console.log('Status:', localResponse.status);
    console.log('Data:', localResponse.data);
  } catch (error) {
    console.log('❌ Local backend failed');
    console.log('Error:', error.message);
    console.log('Note: Make sure local server is running with: npm start');
  }
  
  // Test deployed
  console.log('\n🌐 Testing Deployed Backend...');
  try {
    const deployedResponse = await axios.get('https://apply-bureau-backend.vercel.app/health');
    console.log('✅ Deployed backend working');
    console.log('Status:', deployedResponse.status);
    console.log('Data:', deployedResponse.data);
  } catch (error) {
    console.log('❌ Deployed backend failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n🔍 Deployment Issues Detected:');
      console.log('1. Environment variables might be missing in Vercel');
      console.log('2. Database connection might be failing');
      console.log('3. Route imports might have errors');
      console.log('4. Dependencies might not be installed properly');
    }
  }
  
  console.log('\n🎯 Recommendation:');
  console.log('Since routes are accessible but returning 500 errors,');
  console.log('the issue is likely in the server startup or environment configuration.');
  console.log('We should test locally first, then fix deployment issues.');
}

testBothEnvironments();