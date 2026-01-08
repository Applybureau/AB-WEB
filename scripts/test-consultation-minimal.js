const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.onrender.com';

// Minimal test data
const minimalData = {
  "full_name": "Test User",
  "email": "test@example.com", 
  "role_targets": "Software Engineer"
};

async function testMinimalConsultation() {
  console.log('🧪 Testing minimal consultation request');
  console.log('Data:', JSON.stringify(minimalData, null, 2));
  
  try {
    const response = await axios.post(`${BASE_URL}/api/consultations`, minimalData);
    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Test admin access
    console.log('\n🔐 Testing admin access');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const getResponse = await axios.get(`${BASE_URL}/api/consultations`, {
      headers: { 'Authorization': `Bearer ${loginResponse.data.token}` }
    });
    
    console.log('✅ Admin can view consultations:', getResponse.data.length);
    
    // Find our consultation
    const ourConsultation = getResponse.data.find(c => 
      c.full_name === 'Test User' && c.email === 'test@example.com'
    );
    
    if (ourConsultation) {
      console.log('✅ Found our consultation:', {
        id: ourConsultation.id,
        name: ourConsultation.full_name,
        status: ourConsultation.status
      });
      
      // Test PATCH
      console.log('\n📝 Testing status update');
      const patchResponse = await axios.patch(`${BASE_URL}/api/consultations/${ourConsultation.id}`, {
        status: 'approved',
        admin_notes: 'Test approval'
      }, {
        headers: { 'Authorization': `Bearer ${loginResponse.data.token}` }
      });
      
      console.log('✅ Status update successful:', patchResponse.data.message);
    }
    
    console.log('\n🎉 ALL CONSULTATION API ENDPOINTS WORKING!');
    
  } catch (error) {
    console.log('❌ FAILED:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
    
    // Additional debugging
    if (error.response?.status === 500) {
      console.log('\n🔍 Server error details:');
      console.log('This could be:');
      console.log('1. Email service configuration issue (RESEND_API_KEY)');
      console.log('2. Database foreign key constraint violation');
      console.log('3. Missing environment variables');
      console.log('4. Supabase connection issue');
      
      console.log('\n💡 Recommendation:');
      console.log('Check the Render logs for detailed error messages');
      console.log('The console.log statements in the route should show where it fails');
    }
  }
}

testMinimalConsultation();