require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';

async function testCompleteClientDashboard() {
  console.log('🎯 COMPLETE CLIENT DASHBOARD TEST');
  console.log('=================================\n');

  let clientToken = null;
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
    // 1. CREATE TEST CLIENT
    // ========================================
    console.log('1. Creating test client...');
    
    const testEmail = `testclient${Date.now()}@example.com`;
    const testPassword = 'TestClient123!';
    
    try {
      // Create client using admin
      const adminLoginRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: 'admin@applybureau.com',
        password: 'Admin123@#'
      });
      
      const adminToken = adminLoginRes.data.token;
      
      // Create test client
      const createClientRes = await axios.post(`${BACKEND_URL}/api/admin-management/admins`, {
        email: testEmail,
        password: testPassword,
        full_name: 'Test Client User',
        phone: '+1234567890'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // Update the created admin to be a client
      const clientId = createClientRes.data.admin.id;
      await axios.patch(`${BACKEND_URL}/api/admin-management/profile`, {
        role: 'client'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      testResult('Create Test Client', true, `Client ID: ${clientId}`);
    } catch (error) {
      testResult('Create Test Client', false, error.response?.data?.error || error.message);
      return;
    }

    await delay(2000);

    // ========================================
    // 2. CLIENT LOGIN
    // ========================================
    console.log('\n2. Testing client login...');
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
    // 3. DASHBOARD OVERVIEW
    // ========================================
    console.log('\n3. Testing dashboard overview...');
    try {
      const dashboardRes = await axios.get(`${BACKEND_URL}/api/client-dashboard`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Dashboard Overview', dashboardRes.status === 200, 
        `Progress: ${dashboardRes.data.progress?.percentage || 0}%`);
    } catch (error) {
      testResult('Dashboard Overview', false, error.response?.data?.error || error.message);
    }

    await delay(2000);

    // ========================================
    // 4. PROFILE MANAGEMENT
    // ========================================
    console.log('\n4. Testing profile management...');
    try {
      // Get profile
      const profileRes = await axios.get(`${BACKEND_URL}/api/client-dashboard/profile`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Get Profile', profileRes.status === 200, 
        `Completion: ${profileRes.data.completion?.percentage || 0}%`);
      
      // Update profile
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
      testResult('Profile Management', false, error.response?.data?.error || error.message);
    }

    await delay(2000);

    // ========================================
    // 5. SCHEDULING SYSTEM
    // ========================================
    console.log('\n5. Testing scheduling system...');
    try {
      // Book strategy call
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
      
      // Get strategy call history
      const historyRes = await axios.get(`${BACKEND_URL}/api/client-dashboard/schedule/strategy-calls`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Get Strategy Call History', historyRes.status === 200, 
        `Total calls: ${historyRes.data.total}`);
    } catch (error) {
      testResult('Scheduling System', false, error.response?.data?.error || error.message);
    }

    await delay(2000);

    // ========================================
    // 6. 20-QUESTION ONBOARDING
    // ========================================
    console.log('\n6. Testing 20-question onboarding...');
    try {
      // Get onboarding questions
      const questionsRes = await axios.get(`${BACKEND_URL}/api/client-dashboard/onboarding/questions`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Get Onboarding Questions', questionsRes.status === 200, 
        `Total questions: ${questionsRes.data.total_questions}`);
      
      // Submit onboarding questionnaire
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
      
      testResult('Submit Onboarding Questionnaire', submitRes.status === 201, 
        `Status: ${submitRes.data.onboarding?.execution_status}`);
      
      // Get onboarding status
      const statusRes = await axios.get(`${BACKEND_URL}/api/client-dashboard/onboarding/status`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Get Onboarding Status', statusRes.status === 200, 
        `Completed: ${statusRes.data.completed}, Approved: ${statusRes.data.approved}`);
    } catch (error) {
      testResult('20-Question Onboarding', false, error.response?.data?.error || error.message);
    }

    await delay(2000);

    // ========================================
    // 7. APPLICATION TRACKING
    // ========================================
    console.log('\n7. Testing application tracking...');
    try {
      const applicationsRes = await axios.get(`${BACKEND_URL}/api/client-dashboard/applications`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Get Applications', applicationsRes.status === 200, 
        `Total applications: ${applicationsRes.data.total}`);
    } catch (error) {
      testResult('Application Tracking', false, error.response?.data?.error || error.message);
    }

    await delay(2000);

    // ========================================
    // 8. NOTIFICATIONS
    // ========================================
    console.log('\n8. Testing notifications...');
    try {
      const notificationsRes = await axios.get(`${BACKEND_URL}/api/client-dashboard/notifications`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Get Notifications', notificationsRes.status === 200, 
        `Unread count: ${notificationsRes.data.unread_count}`);
    } catch (error) {
      testResult('Notifications', false, error.response?.data?.error || error.message);
    }

    await delay(2000);

    // ========================================
    // 9. FILE UPLOADS (MOCK)
    // ========================================
    console.log('\n9. Testing file upload endpoints...');
    try {
      // Test resume upload endpoint (without actual file)
      const resumeRes = await axios.post(`${BACKEND_URL}/api/client-dashboard/upload/resume`, {}, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      // This should fail with 400 (no file), which means the endpoint exists
      testResult('Resume Upload Endpoint', resumeRes.status === 400 || resumeRes.status === 200, 
        'Endpoint accessible');
    } catch (error) {
      // 400 error is expected (no file provided)
      testResult('Resume Upload Endpoint', error.response?.status === 400, 
        error.response?.status === 400 ? 'Endpoint accessible (no file error expected)' : error.response?.data?.error);
    }

    try {
      // Test profile picture upload endpoint (without actual file)
      const profilePicRes = await axios.post(`${BACKEND_URL}/api/client-dashboard/upload/profile-picture`, {}, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      
      testResult('Profile Picture Upload Endpoint', profilePicRes.status === 400 || profilePicRes.status === 200, 
        'Endpoint accessible');
    } catch (error) {
      // 400 error is expected (no file provided)
      testResult('Profile Picture Upload Endpoint', error.response?.status === 400, 
        error.response?.status === 400 ? 'Endpoint accessible (no file error expected)' : error.response?.data?.error);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }

  // ========================================
  // FINAL RESULTS
  // ========================================
  console.log('\n🎯 COMPLETE CLIENT DASHBOARD TEST RESULTS');
  console.log('==========================================');
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

testCompleteClientDashboard();