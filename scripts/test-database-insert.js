const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.onrender.com';

async function testDatabaseInsert() {
  console.log('🧪 Testing database insert with exact structure match');
  
  try {
    // First get admin token
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    
    // Get existing consultation to see exact structure
    const getResponse = await axios.get(`${BASE_URL}/api/consultations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (getResponse.data.length > 0) {
      const existingConsultation = getResponse.data[0];
      console.log('✅ Existing consultation structure:');
      console.log(JSON.stringify(existingConsultation, null, 2));
      
      // Now try to create a consultation with the EXACT same structure
      const testData = {
        full_name: "API Test User",
        email: "apitest@example.com",
        role_targets: "Test Engineer"
      };
      
      console.log('\n📝 Testing POST with our data:');
      console.log(JSON.stringify(testData, null, 2));
      
      const postResponse = await axios.post(`${BASE_URL}/api/consultations`, testData);
      console.log('✅ POST successful:', postResponse.data);
      
    } else {
      console.log('❌ No existing consultations found to analyze structure');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.data?.details && error.response.data.details !== 'Failed to submit consultation request') {
      console.log('\n🔍 Database error details:', error.response.data.details);
    }
  }
}

testDatabaseInsert();