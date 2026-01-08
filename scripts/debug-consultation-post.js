const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.onrender.com';

async function debugConsultationPost() {
  console.log('🔍 Debugging POST /api/consultations...');
  
  // Test with minimal required fields first
  const minimalData = {
    full_name: "Test User",
    email: "test@example.com",
    role_targets: "Software Engineer"
  };
  
  console.log('\n1️⃣ Testing with minimal required fields:');
  console.log('Data:', JSON.stringify(minimalData, null, 2));
  
  try {
    const response = await axios.post(`${BASE_URL}/api/consultations`, minimalData);
    console.log('✅ SUCCESS:', response.data);
  } catch (error) {
    console.log('❌ FAILED:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
    
    // If it's a validation error, try with more fields
    if (error.response?.status === 400) {
      console.log('\n2️⃣ Testing with all fields:');
      
      const fullData = {
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
      
      console.log('Data:', JSON.stringify(fullData, null, 2));
      
      try {
        const fullResponse = await axios.post(`${BASE_URL}/api/consultations`, fullData);
        console.log('✅ SUCCESS with full data:', fullResponse.data);
      } catch (fullError) {
        console.log('❌ FAILED with full data:', fullError.response?.data || fullError.message);
        
        // Check if it's a database constraint issue
        if (fullError.response?.data?.error?.includes('constraint') || 
            fullError.response?.data?.error?.includes('violates')) {
          console.log('\n💡 This appears to be a database constraint violation.');
          console.log('   The consultation_requests table might have foreign key constraints');
          console.log('   that are failing. Check the processed_by field reference.');
        }
      }
    }
  }
  
  // Test the GET endpoint to see what structure exists
  console.log('\n3️⃣ Checking existing consultation structure:');
  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const getResponse = await axios.get(`${BASE_URL}/api/consultations`, {
      headers: { 'Authorization': `Bearer ${loginResponse.data.token}` }
    });
    
    if (getResponse.data.length > 0) {
      console.log('✅ Existing consultation structure:');
      console.log(JSON.stringify(getResponse.data[0], null, 2));
    } else {
      console.log('ℹ️  No existing consultations found');
    }
  } catch (error) {
    console.log('❌ Failed to get existing consultations:', error.response?.data || error.message);
  }
}

debugConsultationPost();