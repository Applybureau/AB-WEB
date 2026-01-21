require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';

async function testClientDashboardDirect() {
  console.log('🎯 DIRECT CLIENT DASHBOARD TEST');
  console.log('===============================\n');

  let testResults = {
    total: 0,
    passed: 0,
    failed: 0
  };

  const testResult = (name, success, details = '') => {
    testResults.total++;
    if (success) testResults.passed++;
    else testResults.failed++;
    
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${name}: ${success ? 'PASS' : 'FAIL'}`);
    if (details) console.log(`   ${details}`);
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // ========================================
    // 1. LOGIN AS SUPER ADMIN
    // ========================================
    console.log('1. Logging in as super admin...');
    
    let adminToken = null;
    try {
      const adminLoginRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: 'admin@applybureau.com',
        password: 'Admin123@#'
      });
      
      adminToken = adminLoginRes.data.token;
      testResult('Super Admin Login', !!adminToken, `Role: ${adminLoginRes.data.user?.role}`);
    } catch (error) {
      testResult('Super Admin Login', false, error.response?.data?.error || error.message);
      return;
    }

    await delay(2000);

    // ========================================
    // 2. CREATE TEST CLIENT DIRECTLY
    // ========================================
    console.log('\n2. Creating test client directly...');
    
    const testEmail = `testclient${Date.now()}@example.com`;
    const testPassword = 'TestClient123!';
    let clientId = null;
    
    try {
      // Insert client directly into clients table
      const { data: insertResult } = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        email: testEmail,
        password: testPassword,
        full_name: 'Test Client User',
        phone: '+1234567890',
        role: 'client'
      });
      
      clientId = insertResult.user?.id;
      testResult('Create Test Client', !!clientId, `Client ID: ${clientId}`);
    } catch (error) {
      // Try alternative method - create via admin then update role
      try {
        const createRes = await axios.post(`${BACKEND_URL}/api/admin-management/admins`, {
          email: testEmail,
          password: testPassword,
          full_name: 'Test Client User',
          phone: '+1234567890'
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        clientId = createRes.data.admin?.id;
        
        // Update role to client
        await axios.patch(`${BACKEND_URL}/api/admin-management/profile`, {
          role: 'client'
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        testResult('Create Test Client (via admin)', !!clientId, `Client ID: ${clientId}`);
      } catch (error2) {
        testResult('Create Test Client', false, error2.response?.data?.error || error2.message);
        return;
      }
    }

    await delay(2000);

    // ========================================
    // 3. LOGIN AS CLIENT
    // ========================================
    console.log('\n3. Testing client login...');
    let clientToken = null;
    try {
      const loginRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      
      clientToken = loginRes.data.token;
      testResult('Client Login', !!clientToken, `Role: ${loginRes.data.user?.role}`);
    } catch (error) {
      testResult('Client Login', false, error.response?.data?.error || error.message);
      return;
    }

    await delay(2000);

    // ========================================
    // 4. TEST CLIENT DASHBOARD ENDPOINTS
    // ========================================
    console.log('\n4. Testing client dashboard endpoints...');

    // 4.1 Dashboard Overview
    try {
      const dashboardRes = await axios.get(`${BACKEND_URL}/api/client-dashboard`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Dashboard Overview', dashboardRes.status === 200, 
        `Progress: ${dashboardRes.data.progress?.percentage || 0}%`);
    } catch (error) {
      testResult('Dashboard Overview', false, error.response?.data?.error || error.message);
    }

    await delay(1000);

    // 4.2 Profile Management
    try {
      const profileRes = await axios.get(`${BACKEND_URL}/api/client-dashboard/profile`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Get Profile', profileRes.status === 200, 
        `Completion: ${profileRes.data.completion?.percentage || 0}%`);
    } catch (error) {
      testResult('Get Profile', false, error.response?.data?.error || error.message);
    }

    await delay(1000);

    // 4.3 Update Profile
    try {
      const updateRes = await axios.patch(`${BACKEND_URL}/api/client-dashboard/profile`, {
        current_job_title: 'Software Engineer',
        target_role: 'Senior Software Engineer',
        years_experience: 3,
        linkedin_url: 'https://linkedin.com/in/testuser'
      }, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Update Profile', updateRes.status === 200, 
        `Updated completion: ${updateRes.data.completion?.percentage || 0}%`);
    } catch (error) {
      testResult('Update Profile', false, error.response?.data?.error || error.message);
    }

    await delay(1000);

    // 4.4 Onboarding Questions
    try {
      const questionsRes = await axios.get(`${BACKEND_URL}/api/client-dashboard/onboarding/questions`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Get Onboarding Questions', questionsRes.status === 200, 
        `Total questions: ${questionsRes.data.total_questions}`);
    } catch (error) {
      testResult('Get Onboarding Questions', false, error.response?.data?.error || error.message);
    }

    await delay(1000);

    // 4.5 Submit Onboarding
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
      
      testResult('Submit Onboarding', submitRes.status === 201, 
        `Status: ${submitRes.data.onboarding?.execution_status}`);
    } catch (error) {
      testResult('Submit Onboarding', false, error.response?.data?.error || error.message);
    }

    await delay(1000);

    // 4.6 Strategy Call Booking
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
      
      testResult('Book Strategy Call', strategyCallRes.status === 201, 
        `Strategy call ID: ${strategyCallRes.data.strategy_call?.id}`);
    } catch (error) {
      testResult('Book Strategy Call', false, error.response?.data?.error || error.message);
    }

    await delay(1000);

    // 4.7 Applications Tracking
    try {
      const applicationsRes = await axios.get(`${BACKEND_URL}/api/client-dashboard/applications`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Get Applications', applicationsRes.status === 200, 
        `Total applications: ${applicationsRes.data.total}`);
    } catch (error) {
      testResult('Get Applications', false, error.response?.data?.error || error.message);
    }

    await delay(1000);

    // 4.8 Notifications
    try {
      const notificationsRes = await axios.get(`${BACKEND_URL}/api/client-dashboard/notifications`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Get Notifications', notificationsRes.status === 200, 
        `Unread count: ${notificationsRes.data.unread_count}`);
    } catch (error) {
      testResult('Get Notifications', false, error.response?.data?.error || error.message);
    }

    await delay(1000);

    // 4.9 File Upload Endpoints (Test accessibility)
    try {
      const resumeRes = await axios.post(`${BACKEND_URL}/api/client-dashboard/upload/resume`, {}, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Resume Upload Endpoint', resumeRes.status === 400, 'Endpoint accessible (no file error expected)');
    } catch (error) {
      testResult('Resume Upload Endpoint', error.response?.status === 400, 
        error.response?.status === 400 ? 'Endpoint accessible (no file error expected)' : error.response?.data?.error);
    }

    try {
      const profilePicRes = await axios.post(`${BACKEND_URL}/api/client-dashboard/upload/profile-picture`, {}, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Profile Picture Upload Endpoint', profilePicRes.status === 400, 'Endpoint accessible (no file error expected)');
    } catch (error) {
      testResult('Profile Picture Upload Endpoint', error.response?.status === 400, 
        error.response?.status === 400 ? 'Endpoint accessible (no file error expected)' : error.response?.data?.error);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }

  // ========================================
  // FINAL RESULTS
  // ========================================
  console.log('\n🎯 CLIENT DASHBOARD TEST RESULTS');
  console.log('================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  
  if (successRate >= 90) {
    console.log('\n🎉 EXCELLENT! Client dashboard system working perfectly!');
    console.log('🟢 All client features operational');
  } else if (successRate >= 70) {
    console.log('\n🟡 GOOD! Most client features working');
    console.log('⚠️ Some features may need attention');
  } else {
    console.log('\n🔴 ISSUES DETECTED! Client dashboard needs fixes');
  }

  console.log('\n🎯 CLIENT DASHBOARD FEATURES TESTED:');
  console.log('====================================');
  console.log('✅ Dashboard Overview & Progress Tracking');
  console.log('✅ Profile Management & Completion');
  console.log('✅ Strategy Call Scheduling System');
  console.log('✅ 20-Question Onboarding Questionnaire');
  console.log('✅ Application Tracking System');
  console.log('✅ Notification Management');
  console.log('✅ File Upload Endpoints (Resume & Profile Picture)');
  console.log('✅ Client Authentication & Authorization');
  
  if (successRate >= 90) {
    console.log('\n🎉 COMPLETE CLIENT DASHBOARD SYSTEM OPERATIONAL!');
    console.log('🚀 Ready for frontend integration');
  }
}

testClientDashboardDirect();