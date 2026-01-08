const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';

async function testVercelBackend() {
  console.log('🧪 Testing Vercel Backend');
  console.log('URL:', BASE_URL);
  
  // Test 1: Health check
  console.log('\n1️⃣ Testing Health Check...');
  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health failed:', error.response?.data || error.message);
  }
  
  // Test 2: POST consultation (public)
  console.log('\n2️⃣ Testing POST /api/consultations...');
  try {
    const consultationResponse = await axios.post(`${BASE_URL}/api/consultations`, {
      full_name: "Test User",
      email: "test@example.com",
      role_targets: "Software Engineer",
      package_interest: "Tier 2"
    });
    console.log('✅ Consultation created:', consultationResponse.data);
  } catch (error) {
    console.log('❌ Consultation failed:', error.response?.data || error.message);
  }
  
  // Test 3: Admin login
  console.log('\n3️⃣ Testing Admin Login...');
  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    console.log('✅ Login successful');
    
    const token = loginResponse.data.token;
    
    // Test 4: GET consultations (admin)
    console.log('\n4️⃣ Testing GET /api/consultations (admin)...');
    const getResponse = await axios.get(`${BASE_URL}/api/consultations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Found', getResponse.data.length, 'consultations');
    
  } catch (error) {
    console.log('❌ Login/GET failed:', error.response?.data || error.message);
  }
  
  // Test 5: Contact form
  console.log('\n5️⃣ Testing POST /api/contact...');
  try {
    const contactResponse = await axios.post(`${BASE_URL}/api/contact`, {
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      subject: "Test inquiry",
      message: "This is a test message"
    });
    console.log('✅ Contact submitted:', contactResponse.data);
  } catch (error) {
    console.log('❌ Contact failed:', error.response?.data || error.message);
  }
  
  console.log('\n✅ Vercel backend test complete!');
}

testVercelBackend();