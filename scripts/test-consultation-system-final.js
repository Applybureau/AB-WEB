const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.onrender.com';

console.log('🧪 Testing Final Consultation Request System');
console.log('Base URL:', BASE_URL);

// Test data matching user specification exactly
const testConsultationRequest = {
  full_name: "John Doe",
  email: "john.doe@example.com",
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

const testContactForm = {
  firstName: "Jane",
  lastName: "Smith",
  email: "jane.smith@example.com",
  phone: "+1987654321",
  subject: "General inquiry about services",
  message: "Hello, I have a question about your career advisory packages."
};

async function testFinalSystem() {
  try {
    console.log('\n=== TESTING USER-SPECIFIED API ENDPOINTS ===');
    
    // Test 1: POST /api/consultations (Public)
    console.log('\n1️⃣ Testing POST /api/consultations (Public)');
    try {
      const consultationResponse = await axios.post(`${BASE_URL}/api/consultations`, testConsultationRequest);
      console.log('✅ SUCCESS:', consultationResponse.data);
      var consultationId = consultationResponse.data.id;
    } catch (error) {
      console.log('❌ FAILED:', error.response?.data || error.message);
      console.log('   Trying /api/consultation-requests instead...');
      
      try {
        const altResponse = await axios.post(`${BASE_URL}/api/consultation-requests`, testConsultationRequest);
        console.log('✅ SUCCESS (alt route):', altResponse.data);
        var consultationId = altResponse.data.id;
      } catch (altError) {
        console.log('❌ ALSO FAILED:', altError.response?.data || altError.message);
      }
    }
    
    // Test 2: POST /api/contact (Public)
    console.log('\n2️⃣ Testing POST /api/contact (Public)');
    try {
      const contactResponse = await axios.post(`${BASE_URL}/api/contact`, testContactForm);
      console.log('✅ SUCCESS:', contactResponse.data);
    } catch (error) {
      console.log('❌ FAILED:', error.response?.data || error.message);
    }
    
    // Test 3: Admin Login
    console.log('\n3️⃣ Testing Admin Authentication');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@applybureau.com',
        password: 'admin123'
      });
      console.log('✅ Admin login successful');
      const token = loginResponse.data.token;
      
      // Test 4: GET /api/consultations (Admin)
      console.log('\n4️⃣ Testing GET /api/consultations (Admin)');
      try {
        const getResponse = await axios.get(`${BASE_URL}/api/consultations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ SUCCESS: Found', getResponse.data.length, 'consultation requests');
        if (getResponse.data.length > 0) {
          console.log('   Latest request:', {
            id: getResponse.data[0].id,
            name: getResponse.data[0].full_name,
            email: getResponse.data[0].email,
            status: getResponse.data[0].status
          });
        }
      } catch (error) {
        console.log('❌ FAILED:', error.response?.data || error.message);
        console.log('   Trying /api/consultation-requests instead...');
        
        try {
          const altGetResponse = await axios.get(`${BASE_URL}/api/consultation-requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('✅ SUCCESS (alt route): Found', altGetResponse.data.length, 'requests');
        } catch (altError) {
          console.log('❌ ALSO FAILED:', altError.response?.data || altError.message);
        }
      }
      
      // Test 5: PATCH /api/consultations/:id (Admin)
      if (consultationId) {
        console.log('\n5️⃣ Testing PATCH /api/consultations/:id (Admin)');
        try {
          const patchResponse = await axios.patch(`${BASE_URL}/api/consultations/${consultationId}`, {
            status: 'approved',
            admin_notes: 'Great candidate for Tier 2 package'
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('✅ SUCCESS:', patchResponse.data.message);
        } catch (error) {
          console.log('❌ FAILED:', error.response?.data || error.message);
          console.log('   Trying /api/consultation-requests instead...');
          
          try {
            const altPatchResponse = await axios.patch(`${BASE_URL}/api/consultation-requests/${consultationId}`, {
              status: 'approved',
              admin_notes: 'Great candidate for Tier 2 package'
            }, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ SUCCESS (alt route):', altPatchResponse.data.message);
          } catch (altError) {
            console.log('❌ ALSO FAILED:', altError.response?.data || altError.message);
          }
        }
      }
      
    } catch (loginError) {
      console.log('❌ Admin login failed:', loginError.response?.data || loginError.message);
    }
    
    console.log('\n=== TEST SUMMARY ===');
    console.log('✅ Required endpoints according to user specification:');
    console.log('   POST /api/consultations (public)');
    console.log('   GET /api/consultations (admin auth)');
    console.log('   PATCH /api/consultations/:id (admin auth)');
    console.log('   POST /api/contact (public)');
    console.log('   POST /api/auth/login (admin login)');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testFinalSystem();