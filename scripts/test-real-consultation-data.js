const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.onrender.com';

// Exact data format provided by user
const realConsultationData = {
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "role_targets": "Senior Software Engineer, Product Manager",
  "location_preferences": "remote",
  "minimum_salary": "$120,000 CAD",
  "target_market": "technology",
  "employment_status": "employed",
  "package_interest": "TIER 2 — Accelerated Application Support",
  "area_of_concern": "interview-preparation",
  "consultation_window": "morning"
};

async function testRealConsultationData() {
  console.log('🧪 Testing with REAL consultation data from user');
  console.log('Data:', JSON.stringify(realConsultationData, null, 2));
  
  try {
    console.log('\n📝 Testing POST /api/consultations');
    const response = await axios.post(`${BASE_URL}/api/consultations`, realConsultationData);
    
    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    const consultationId = response.data.id;
    
    // Test admin login and GET
    console.log('\n🔐 Testing admin access to view the consultation');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    
    const getResponse = await axios.get(`${BASE_URL}/api/consultations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Admin can view consultations');
    console.log('Total consultations:', getResponse.data.length);
    
    // Find our new consultation
    const ourConsultation = getResponse.data.find(c => c.id === consultationId);
    if (ourConsultation) {
      console.log('✅ Found our new consultation:');
      console.log('  ID:', ourConsultation.id);
      console.log('  Name:', ourConsultation.full_name);
      console.log('  Email:', ourConsultation.email);
      console.log('  Status:', ourConsultation.status);
    }
    
    // Test PATCH to update status
    if (consultationId) {
      console.log('\n📝 Testing PATCH /api/consultations/:id');
      const patchResponse = await axios.patch(`${BASE_URL}/api/consultations/${consultationId}`, {
        status: 'approved',
        admin_notes: 'Excellent candidate for TIER 2 package. Approved for consultation.'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Status update successful');
      console.log('Response:', patchResponse.data.message);
    }
    
    console.log('\n🎉 ALL TESTS PASSED! The consultation request system is working perfectly.');
    
  } catch (error) {
    console.log('❌ FAILED:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
    
    if (error.response?.status === 500) {
      console.log('\n🔍 This is a server error. Let me check what might be wrong...');
      
      // Check if it's a database issue
      console.log('Possible issues:');
      console.log('1. Database table structure mismatch');
      console.log('2. Missing required database fields');
      console.log('3. Foreign key constraint violations');
      console.log('4. Email service configuration issues');
    }
  }
}

testRealConsultationData();