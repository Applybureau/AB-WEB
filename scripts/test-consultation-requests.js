const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.onrender.com';

console.log('🧪 Testing Consultation Request System');
console.log('Base URL:', BASE_URL);

// Test data
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
  message: "Hello, I have a question about your career advisory packages and would like to learn more about the consultation process."
};

const adminCredentials = {
  email: "admin@applybureau.com",
  password: "admin123"
};

async function testConsultationRequestSystem() {
  try {
    console.log('\n📝 Testing POST /api/consultations (Public)');
    
    const consultationResponse = await axios.post(`${BASE_URL}/api/consultations`, testConsultationRequest);
    
    console.log('✅ Consultation request created successfully');
    console.log('Response:', consultationResponse.data);
    
    const consultationId = consultationResponse.data.id;
    
    console.log('\n📧 Testing POST /api/contact (Public)');
    
    const contactResponse = await axios.post(`${BASE_URL}/api/contact`, testContactForm);
    
    console.log('✅ Contact form submitted successfully');
    console.log('Response:', contactResponse.data);
    
    console.log('\n🔐 Testing Admin Login');
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, adminCredentials);
    
    console.log('✅ Admin login successful');
    const token = loginResponse.data.token;
    
    console.log('\n📋 Testing GET /api/consultations (Admin)');
    
    const getConsultationsResponse = await axios.get(`${BASE_URL}/api/consultations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Consultation requests fetched successfully');
    console.log('Found consultations:', getConsultationsResponse.data.length);
    console.log('Latest consultation:', getConsultationsResponse.data[0]);
    
    console.log('\n📝 Testing PATCH /api/consultations/:id (Admin)');
    
    const updateResponse = await axios.patch(`${BASE_URL}/api/consultations/${consultationId}`, {
      status: 'approved',
      admin_notes: 'Great candidate, approved for Tier 2 package consultation.'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Consultation request updated successfully');
    console.log('Response:', updateResponse.data);
    
    console.log('\n🔍 Testing GET /api/consultations/:id (Admin)');
    
    const getSpecificResponse = await axios.get(`${BASE_URL}/api/consultations/${consultationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Specific consultation request fetched successfully');
    console.log('Consultation details:', getSpecificResponse.data);
    
    console.log('\n🎉 All consultation request tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n💡 This might be a database schema issue. Let\'s check if the tables exist.');
    }
    
    if (error.response?.status === 401) {
      console.log('\n💡 Authentication failed. Check admin credentials.');
    }
    
    if (error.response?.status === 404) {
      console.log('\n💡 Route not found. Check if the routes are properly registered.');
    }
  }
}

async function testHealthCheck() {
  try {
    console.log('\n🏥 Testing Health Check');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed');
    console.log('Status:', healthResponse.data);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

async function runTests() {
  await testHealthCheck();
  await testConsultationRequestSystem();
}

runTests();