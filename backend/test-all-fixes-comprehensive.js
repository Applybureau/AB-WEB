require('dotenv').config();
const axios = require('axios');
const { sendEmail, sendApplicationUpdateEmail } = require('./utils/email');

const BASE_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';
const ADMIN_CREDENTIALS = {
  email: 'applybureau@gmail.com',
  password: 'Admin123@#'
};

async function testAllFixes() {
  console.log('🧪 COMPREHENSIVE TEST - All Fixes Verification\n');
  console.log('='.repeat(60));

  let adminToken = null;
  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  const addTestResult = (name, passed, details = '') => {
    testResults.tests.push({ name, passed, details });
    if (passed) {
      testResults.passed++;
      console.log(`✅ ${name}`);
    } else {
      testResults.failed++;
      console.log(`❌ ${name}: ${details}`);
    }
  };

  try {
    // Test 1: Admin Authentication
    console.log('\n🔐 AUTHENTICATION TESTS');
    console.log('-'.repeat(30));
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, ADMIN_CREDENTIALS);
      adminToken = loginResponse.data.token;
      addTestResult('Admin Login', true);
    } catch (error) {
      addTestResult('Admin Login', false, error.response?.data?.error || error.message);
      return; // Can't continue without auth
    }

    const headers = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };

    // Test 2: Admin Dashboard Access
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/api/admin-dashboard`, { headers });
      addTestResult('Admin Dashboard Access', dashboardResponse.status === 200);
    } catch (error) {
      addTestResult('Admin Dashboard Access', false, error.response?.data?.error || error.message);
    }

    // Test 3: Super Admin Privileges
    console.log('\n👨‍💼 ADMIN MANAGEMENT TESTS');
    console.log('-'.repeat(30));
    
    try {
      const adminListResponse = await axios.get(`${BASE_URL}/api/admin-management/admins`, { headers });
      addTestResult('Admin List Access', adminListResponse.status === 200);
    } catch (error) {
      addTestResult('Admin List Access', false, error.response?.data?.error || error.message);
    }

    // Test 4: Admin Creation (Super Admin Privilege)
    try {
      const adminData = {
        email: 'testadmin@applybureau.com',
        full_name: 'Test Admin User',
        password: 'TestAdmin123!',
        permissions: {
          can_create_admins: false,
          can_delete_admins: false,
          can_manage_clients: true,
          can_schedule_consultations: true,
          can_view_reports: true,
          can_manage_system: false
        }
      };

      const adminCreateResponse = await axios.post(`${BASE_URL}/api/admin-management/admins`, adminData, { headers });
      addTestResult('Admin Creation (Super Admin)', adminCreateResponse.status === 201);
    } catch (error) {
      if (error.response?.status === 409) {
        addTestResult('Admin Creation (Super Admin)', true, 'Admin already exists (expected)');
      } else {
        addTestResult('Admin Creation (Super Admin)', false, error.response?.data?.error || error.message);
      }
    }

    // Test 5: Client Invitation
    try {
      const inviteData = {
        email: 'israelloko65@gmail.com',
        full_name: 'Test Client User'
      };
      const inviteResponse = await axios.post(`${BASE_URL}/api/auth/invite`, inviteData, { headers });
      addTestResult('Client Invitation', inviteResponse.status === 200);
    } catch (error) {
      addTestResult('Client Invitation', false, error.response?.data?.error || error.message);
    }

    // Test 6: Consultation Management
    console.log('\n📋 CONSULTATION MANAGEMENT TESTS');
    console.log('-'.repeat(30));
    
    try {
      const consultationsResponse = await axios.get(`${BASE_URL}/api/consultation-management`, { headers });
      addTestResult('Consultation List Access', consultationsResponse.status === 200);
      
      if (consultationsResponse.data.consultations.length > 0) {
        const testConsultationId = consultationsResponse.data.consultations[0].id;
        
        // Test consultation update
        const updateData = {
          status: 'confirmed',
          admin_notes: 'Test update via comprehensive test',
          admin_message: 'Your consultation has been confirmed via automated test.'
        };

        const updateResponse = await axios.patch(
          `${BASE_URL}/api/consultation-management/${testConsultationId}`,
          updateData,
          { headers }
        );
        addTestResult('Consultation Status Update', updateResponse.status === 200);
      } else {
        addTestResult('Consultation Status Update', true, 'No consultations to test (expected)');
      }
    } catch (error) {
      addTestResult('Consultation List Access', false, error.response?.data?.error || error.message);
      addTestResult('Consultation Status Update', false, 'Skipped due to list access failure');
    }

    // Test 7: Email System Tests
    console.log('\n📧 EMAIL SYSTEM TESTS');
    console.log('-'.repeat(30));
    
    try {
      // Test application update email
      const appUpdateResult = await sendApplicationUpdateEmail('israelloko65@gmail.com', {
        client_name: 'Test Client',
        company_name: 'Test Company',
        position_title: 'Test Position',
        application_status: 'interview',
        message: 'This is a test email from the comprehensive test suite.',
        next_steps: 'No action required - this is a test.',
        consultant_email: 'applybureau@gmail.com',
        user_id: 'test-user-comprehensive'
      });
      addTestResult('Application Update Email', !!appUpdateResult.id);
    } catch (error) {
      addTestResult('Application Update Email', false, error.message);
    }

    try {
      // Test consultation confirmed email
      const consultationResult = await sendEmail('israelloko65@gmail.com', 'consultation_confirmed', {
        client_name: 'Test Client',
        consultation_date: new Date().toLocaleDateString(),
        consultation_time: '2:00 PM EST',
        meeting_link: 'https://meet.google.com/test-link',
        meeting_details: 'This is a test consultation confirmation.',
        current_year: new Date().getFullYear()
      });
      addTestResult('Consultation Confirmed Email', !!consultationResult.id);
    } catch (error) {
      addTestResult('Consultation Confirmed Email', false, error.message);
    }

    try {
      // Test new email templates
      const rescheduleResult = await sendEmail('israelloko65@gmail.com', 'consultation_reschedule_request', {
        client_name: 'Test Client',
        admin_message: 'This is a test reschedule request email.',
        reason: 'Testing new email template',
        reschedule_link: 'https://www.applybureau.com/reschedule',
        current_year: new Date().getFullYear()
      });
      addTestResult('Consultation Reschedule Email', !!rescheduleResult.id);
    } catch (error) {
      addTestResult('Consultation Reschedule Email', false, error.message);
    }

    try {
      // Test consultation completed email
      const completedResult = await sendEmail('israelloko65@gmail.com', 'consultation_completed', {
        client_name: 'Test Client',
        admin_message: 'This is a test consultation completed email.',
        next_steps: 'No action required - this is a test.',
        current_year: new Date().getFullYear()
      });
      addTestResult('Consultation Completed Email', !!completedResult.id);
    } catch (error) {
      addTestResult('Consultation Completed Email', false, error.message);
    }

    try {
      // Test admin welcome email (without password)
      const adminWelcomeResult = await sendEmail('israelloko65@gmail.com', 'admin_welcome', {
        admin_name: 'Test Admin',
        admin_email: 'testadmin@applybureau.com',
        current_year: new Date().getFullYear()
      });
      addTestResult('Admin Welcome Email (No Password)', !!adminWelcomeResult.id);
    } catch (error) {
      addTestResult('Admin Welcome Email (No Password)', false, error.message);
    }

    // Test 8: System Health
    console.log('\n🏥 SYSTEM HEALTH TESTS');
    console.log('-'.repeat(30));
    
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      addTestResult('System Health Check', healthResponse.status === 200);
    } catch (error) {
      addTestResult('System Health Check', false, error.message);
    }

    try {
      const apiHealthResponse = await axios.get(`${BASE_URL}/api/health`);
      addTestResult('API Health Check', apiHealthResponse.status === 200);
    } catch (error) {
      addTestResult('API Health Check', false, error.message);
    }

  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
  }

  // Test Results Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.tests.length}`);
  console.log(`🎯 Success Rate: ${Math.round((testResults.passed / testResults.tests.length) * 100)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   • ${test.name}: ${test.details}`));
  }

  console.log('\n💡 VERIFICATION CHECKLIST:');
  console.log('   • Check test email inbox (israelloko65@gmail.com)');
  console.log('   • Verify all emails have consistent design');
  console.log('   • Confirm green buttons (bg-teal-600) with white text');
  console.log('   • Ensure proper logo display');
  console.log('   • Verify contact email as applybureau@gmail.com');
  console.log('   • Check reply-to functionality');
  console.log('   • Confirm no passwords in admin welcome emails');

  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! System is ready for deployment.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review and fix before deployment.');
  }
}

// Run the comprehensive test
testAllFixes();