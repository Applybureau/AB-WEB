const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';

async function testConsultationWithCountry() {
  console.log('🧪 Testing Consultation Request with Current Country Field');
  console.log('URL:', BASE_URL);
  
  try {
    console.log('\n📝 Submitting consultation request with current_country...');
    
    const consultationData = {
      full_name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
      linkedin_url: "https://linkedin.com/in/johndoe",
      role_targets: "Software Engineer, Full Stack Developer",
      location_preferences: "Remote, New York, San Francisco",
      minimum_salary: "120000",
      target_market: "Tech Startups",
      employment_status: "Currently Employed",
      package_interest: "Premium Package",
      area_of_concern: "Interview preparation and salary negotiation",
      consultation_window: "Weekday evenings",
      current_country: "United States" // New field
    };
    
    const response = await axios.post(`${BASE_URL}/api/consultation-requests`, consultationData);
    
    console.log('✅ Consultation request submitted successfully!');
    console.log('Response:', response.data);
    
    // Test with different country
    console.log('\n📝 Testing with different country...');
    
    const consultationData2 = {
      ...consultationData,
      full_name: "Jane Smith",
      email: "jane.smith@example.com",
      current_country: "Canada"
    };
    
    const response2 = await axios.post(`${BASE_URL}/api/consultation-requests`, consultationData2);
    
    console.log('✅ Second consultation request submitted successfully!');
    console.log('Response:', response2.data);
    
    // Test admin login and fetch consultations to verify country field is stored
    console.log('\n🔐 Testing admin access to view country information...');
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    const consultationsResponse = await axios.get(`${BASE_URL}/api/consultations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Retrieved consultations:', consultationsResponse.data.length);
    
    // Find our test consultations and check if current_country is included
    const testConsultations = consultationsResponse.data.filter(c => 
      c.email === 'john.doe@example.com' || c.email === 'jane.smith@example.com'
    );
    
    console.log('\n📊 Test consultations with country field:');
    testConsultations.forEach(consultation => {
      console.log(`- ${consultation.full_name} (${consultation.email}): ${consultation.current_country || 'No country specified'}`);
    });
    
    console.log('\n✅ Current country field test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 400) {
      console.log('💡 This might be expected if the database column hasn\'t been added yet');
      console.log('💡 Run the ADD_CURRENT_COUNTRY_FIELD.sql script in Supabase first');
    }
  }
}

testConsultationWithCountry();