const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.onrender.com';

// Test data matching what the deployed version might expect
const testConsultationRequest = {
  full_name: "John Doe",
  email: "john.doe@example.com",
  consultation_type: "Career Advisory", // This might be the missing field
  phone: "+1234567890",
  linkedin_url: "https://linkedin.com/in/johndoe",
  role_targets: "Senior Software Engineer, Product Manager",
  location_preferences: "Toronto, Remote",
  minimum_salary: "$120,000 CAD",
  target_market: "Technology",
  employment_status: "Currently Employed",
  package_interest: "Tier 2",
  area_of_concern: "Interview preparation",
  consultation_window: "Morning (9 AM - 12 PM EST)"
};

async function testCurrentDeployed() {
  console.log('🧪 Testing current deployed consultation-requests endpoint');
  
  try {
    console.log('\n📝 Testing POST /api/consultation-requests');
    const response = await axios.post(`${BASE_URL}/api/consultation-requests`, testConsultationRequest);
    console.log('✅ Success:', response.data);
    
    // Get admin token
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    
    // Test GET
    console.log('\n📋 Testing GET /api/consultation-requests (Admin)');
    const getResponse = await axios.get(`${BASE_URL}/api/consultation-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Found consultations:', getResponse.data.length);
    console.log('Latest:', getResponse.data[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCurrentDeployed();