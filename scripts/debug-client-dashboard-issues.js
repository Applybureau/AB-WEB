require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';
const TEST_CLIENT_EMAIL = 'testclient1768943293606@example.com';
const TEST_CLIENT_PASSWORD = 'TestClient123!';

async function debugClientDashboardIssues() {
  console.log('🔍 DEBUGGING CLIENT DASHBOARD ISSUES');
  console.log('====================================\n');

  try {
    // Login first
    console.log('1. Logging in as test client...');
    const loginRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: TEST_CLIENT_EMAIL,
      password: TEST_CLIENT_PASSWORD
    });
    
    const clientToken = loginRes.data.token;
    console.log(`✅ Logged in successfully. Token: ${clientToken.substring(0, 20)}...`);

    // ========================================
    // DEBUG PROFILE UPDATE
    // ========================================
    console.log('\n2. Debugging profile update...');
    try {
      const updateRes = await axios.patch(`${BACKEND_URL}/api/client-dashboard/profile`, {
        current_job_title: 'Software Engineer',
        target_role: 'Senior Software Engineer',
        years_experience: 3,
        linkedin_url: 'https://linkedin.com/in/testuser'
      }, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      console.log('✅ Profile update successful:', updateRes.data);
    } catch (error) {
      console.log('❌ Profile update failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
      console.log('Full error:', error.message);
    }

    // ========================================
    // DEBUG ONBOARDING SUBMISSION
    // ========================================
    console.log('\n3. Debugging onboarding submission...');
    try {
      const onboardingData = {
        target_job_titles: ['Software Engineer', 'Senior Software Engineer'],
        target_industries: ['Technology', 'Finance'],
        target_locations: ['New York, NY', 'Remote'],
        remote_work_preference: 'Hybrid',
        target_salary_range: '$100,000 - $130,000',
        years_of_experience: 3,
        key_technical_skills: ['JavaScript', 'React', 'Node.js'],
        job_search_timeline: 'Soon (1-3 months)',
        career_goals_short_term: 'Advance to a senior role with more technical leadership responsibilities.',
        biggest_career_challenges: ['Finding the right opportunities', 'Salary negotiation'],
        support_areas_needed: ['Resume optimization', 'Interview preparation']
      };
      
      const submitRes = await axios.post(`${BACKEND_URL}/api/client-dashboard/onboarding/submit`, onboardingData, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      console.log('✅ Onboarding submission successful:', submitRes.data);
    } catch (error) {
      console.log('❌ Onboarding submission failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
      console.log('Full error:', error.message);
    }

    // ========================================
    // DEBUG STRATEGY CALL BOOKING
    // ========================================
    console.log('\n4. Debugging strategy call booking...');
    try {
      const strategyCallRes = await axios.post(`${BACKEND_URL}/api/client-dashboard/schedule/strategy-call`, {
        preferred_slots: [
          { date: '2026-01-25', time: '14:00' },
          { date: '2026-01-26', time: '15:00' }
        ],
        message: 'Looking forward to discussing my career goals!'
      }, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      console.log('✅ Strategy call booking successful:', strategyCallRes.data);
    } catch (error) {
      console.log('❌ Strategy call booking failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
      console.log('Full error:', error.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugClientDashboardIssues();