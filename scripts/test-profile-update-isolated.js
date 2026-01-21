require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';
const TEST_CLIENT_EMAIL = 'testclient1768943293606@example.com';
const TEST_CLIENT_PASSWORD = 'TestClient123!';

async function testProfileUpdateIsolated() {
  console.log('🎯 ISOLATED PROFILE UPDATE TEST');
  console.log('===============================\n');

  try {
    // Login first
    console.log('1. Logging in...');
    const loginRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: TEST_CLIENT_EMAIL,
      password: TEST_CLIENT_PASSWORD
    });
    
    const clientToken = loginRes.data.token;
    console.log('✅ Login successful');

    // Test profile update multiple times
    for (let i = 1; i <= 5; i++) {
      console.log(`\n${i}. Testing profile update attempt ${i}...`);
      
      try {
        const updateRes = await axios.patch(`${BACKEND_URL}/api/client-dashboard/profile`, {
          current_job_title: `Software Engineer ${i}`,
          target_role: `Senior Software Engineer ${i}`,
          years_experience: i + 2,
          linkedin_url: `https://linkedin.com/in/testuser-${i}`,
          current_company: `Tech Company ${i}`,
          preferred_locations: `Location ${i}, Remote`
        }, {
          headers: { Authorization: `Bearer ${clientToken}` }
        });
        
        console.log(`✅ Attempt ${i}: SUCCESS`);
        console.log(`   Status: ${updateRes.status}`);
        console.log(`   Completion: ${updateRes.data.completion?.percentage}%`);
        console.log(`   Job Title: ${updateRes.data.profile?.current_job_title}`);
        
      } catch (error) {
        console.log(`❌ Attempt ${i}: FAILED`);
        console.log(`   Status: ${error.response?.status}`);
        console.log(`   Error: ${error.response?.data?.error || error.message}`);
        console.log(`   Full response:`, error.response?.data);
      }
      
      // Wait between attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProfileUpdateIsolated();