const axios = require('axios');

// Test basic consultation request functionality
async function testConsultationRoute() {
  try {
    console.log('🧪 Testing Consultation Request Route...\n');

    const formData = {
      full_name: 'Test User Route Check',
      email: 'testroutecheck@example.com',
      phone: '+1234567890',
      linkedin_url: 'https://linkedin.com/in/testuser',
      role_targets: 'Software Engineer, Full Stack Developer',
      location_preferences: 'Remote, New York',
      minimum_salary: '120000',
      target_market: 'Tech Startups',
      employment_status: 'Currently Employed',
      package_interest: 'Tier 2',
      area_of_concern: 'Interview preparation',
      consultation_window: 'Next 2 weeks'
    };

    const baseURL = 'https://apply-bureau-backend.vercel.app';

    console.log(`📡 Sending request to: ${baseURL}/api/consultation-requests`);

    const response = await axios.post(`${baseURL}/api/consultation-requests`, formData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Route Test Results:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;

  } catch (error) {
    console.error('❌ Route Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  testConsultationRoute()
    .then(() => console.log('\n✅ Route test completed successfully!'))
    .catch(error => {
      console.error('\n❌ Route test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testConsultationRoute };