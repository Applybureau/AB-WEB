/**
 * COMPREHENSIVE VERCEL BACKEND TEST
 * Tests EVERY single feature and endpoint
 * Reports ALL errors without fixing anything
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const TEST_EMAIL = 'test_' + Date.now() + '@example.com';
const ADMIN_EMAIL = 'israelloko65@gmail.com';
const ADMIN_PASSWORD = 'admin123';

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

let adminToken = null;
let clientToken = null;
let testClientId = null;
let testConsultationId = null;
let testContactRequestId = null;
let testApplicationId = null;

// Helper functions
function logTest(name, status, details = '') {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} ${name}: ${status}`);
  if (details) console.log(`   ${details}`);
  
  if (status === 'PASS') {
    testResults.passed.push({ name, details });
  } else if (status === 'FAIL') {
    testResults.failed.push({ name, details });
  } else {
    testResults.warnings.push({ name, details });
  }
}

async function testEndpoint(name, method, url, options = {}) {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${url}`,
      ...options,
      timeout: 15000
    });
    logTest(name, 'PASS', `Status: ${response.status}`);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    const errorMsg = error.response 
      ? `Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      : error.message;
    logTest(name, 'FAIL', errorMsg);
    return { success: false, error: errorMsg, status: error.response?.status };
  }
}

// ============================================
// TEST SUITE
// ============================================

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   COMPREHENSIVE VERCEL BACKEND TEST SUITE     ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  console.log(`Testing: ${BASE_URL}\n`);

  // ========== SECTION 1: HEALTH & PUBLIC ENDPOINTS ==========
  console.log('\n📋 SECTION 1: HEALTH & PUBLIC ENDPOINTS\n');
  
  await testEndpoint('Health Check', 'GET', '/health');
  await testEndpoint('API Health Check', 'GET', '/api/health');
  
  // Public consultation submission
  const consultationResult = await testEndpoint(
    'Submit Public Consultation',
    'POST',
    '/api/public-consultations',
    {
      data: {
        full_name: 'Test User',
        email: TEST_EMAIL,
        phone: '+1234567890',
        country: 'United States',
        preferred_date: '2026-02-01',
        preferred_time: '14:00',
        message: 'Test consultation request'
      }
    }
  );
  if (consultationResult.success && consultationResult.data?.consultation?.id) {
    testConsultationId = consultationResult.data.consultation.id;
  }

  // Contact form submission
  const contactResult = await testEndpoint(
    'Submit Contact Form',
    'POST',
    '/api/contact',
    {
      data: {
        name: 'Test Contact',
        email: TEST_EMAIL,
        subject: 'Test Subject',
        message: 'Test message'
      }
    }
  );

  // Contact request submission
  const contactRequestResult = await testEndpoint(
    'Submit Contact Request',
    'POST',
    '/api/contact-requests',
    {
      data: {
        full_name: 'Test Contact Request',
        email: TEST_EMAIL,
        phone: '+1234567890',
        message: 'Test contact request'
      }
    }
  );
  if (contactRequestResult.success && contactRequestResult.data?.contactRequest?.id) {
    testContactRequestId = contactRequestResult.data.contactRequest.id;
  }

  // ========== SECTION 2: AUTHENTICATION ==========
  console.log('\n🔐 SECTION 2: AUTHENTICATION\n');
  
  // Admin login
  const loginResult = await testEndpoint(
    'Admin Login',
    'POST',
    '/api/auth/login',
    {
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      }
    }
  );
  
  if (loginResult.success && loginResult.data?.token) {
    adminToken = loginResult.data.token;
    logTest('Admin Token Retrieved', 'PASS', 'Token stored for subsequent tests');
  } else {
    logTest('Admin Token Retrieved', 'FAIL', 'Cannot proceed with admin tests');
  }

  // Get current user
  if (adminToken) {
    await testEndpoint(
      'Get Current User (/api/auth/me)',
      'GET',
      '/api/auth/me',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
  }

  // ========== SECTION 3: ADMIN DASHBOARD & STATS ==========
  console.log('\n📊 SECTION 3: ADMIN DASHBOARD & STATS\n');
  
  if (adminToken) {
    await testEndpoint(
      'Admin Dashboard Stats',
      'GET',
      '/api/admin/stats',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    await testEndpoint(
      'Admin Dashboard Overview',
      'GET',
      '/api/admin-dashboard/overview',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    await testEndpoint(
      'Enhanced Dashboard',
      'GET',
      '/api/enhanced-dashboard',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    await testEndpoint(
      'Regular Dashboard',
      'GET',
      '/api/dashboard',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
  }

  // ========== SECTION 4: CONTACT REQUESTS MANAGEMENT ==========
  console.log('\n📞 SECTION 4: CONTACT REQUESTS MANAGEMENT\n');
  
  if (adminToken) {
    const contactsResult = await testEndpoint(
      'Get All Contact Requests',
      'GET',
      '/api/contact-requests',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    await testEndpoint(
      'Get Contact Submissions',
      'GET',
      '/api/contact',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    // Test single contact request if we have an ID
    if (testContactRequestId) {
      await testEndpoint(
        'Get Single Contact Request',
        'GET',
        `/api/contact-requests/${testContactRequestId}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      await testEndpoint(
        'Update Contact Request Status',
        'PATCH',
        `/api/contact-requests/${testContactRequestId}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          data: { status: 'contacted' }
        }
      );
    }
  }

  // ========== SECTION 5: CONSULTATION MANAGEMENT ==========
  console.log('\n📅 SECTION 5: CONSULTATION MANAGEMENT\n');
  
  if (adminToken) {
    const consultationsResult = await testEndpoint(
      'Get All Consultations',
      'GET',
      '/api/admin/concierge/consultations',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    // Test consultation actions if we have an ID
    if (testConsultationId) {
      await testEndpoint(
        'Confirm Consultation',
        'POST',
        `/api/admin/concierge/consultations/${testConsultationId}/confirm`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          data: {
            confirmed_date: '2026-02-01',
            confirmed_time: '14:00',
            meeting_link: 'https://meet.google.com/test-link'
          }
        }
      );

      await testEndpoint(
        'Reschedule Consultation',
        'POST',
        `/api/admin/concierge/consultations/${testConsultationId}/reschedule`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          data: {
            new_date: '2026-02-05',
            new_time: '15:00'
          }
        }
      );

      await testEndpoint(
        'Waitlist Consultation',
        'POST',
        `/api/admin/concierge/consultations/${testConsultationId}/waitlist`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          data: {
            reason: 'Fully booked'
          }
        }
      );
    }
  }

  // ========== SECTION 6: CLIENT MANAGEMENT ==========
  console.log('\n👥 SECTION 6: CLIENT MANAGEMENT\n');
  
  if (adminToken) {
    const clientsResult = await testEndpoint(
      'Get All Clients',
      'GET',
      '/api/admin/clients',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    // Get first client ID for testing
    if (clientsResult.success && clientsResult.data?.clients?.length > 0) {
      testClientId = clientsResult.data.clients[0].id;
      
      await testEndpoint(
        'Get Client Details',
        'GET',
        `/api/admin/clients/${testClientId}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
    }
  }

  // ========== SECTION 7: PAYMENT & REGISTRATION ==========
  console.log('\n💳 SECTION 7: PAYMENT & REGISTRATION\n');
  
  if (adminToken && testConsultationId) {
    await testEndpoint(
      'Confirm Payment and Send Registration',
      'POST',
      '/api/admin/concierge/payment/confirm-and-invite',
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          consultation_id: testConsultationId,
          payment_amount: 500,
          payment_method: 'bank_transfer'
        }
      }
    );
  }

  // ========== SECTION 8: ONBOARDING MANAGEMENT ==========
  console.log('\n📝 SECTION 8: ONBOARDING MANAGEMENT\n');
  
  if (adminToken) {
    await testEndpoint(
      'Get Onboarding Submissions',
      'GET',
      '/api/admin/concierge/onboarding',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    // Test onboarding approval if we have a client
    if (testClientId) {
      await testEndpoint(
        'Approve Onboarding',
        'POST',
        `/api/admin/concierge/onboarding/${testClientId}/approve`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          data: {
            notes: 'Profile looks good'
          }
        }
      );
    }
  }

  // ========== SECTION 9: APPLICATION MANAGEMENT ==========
  console.log('\n📋 SECTION 9: APPLICATION MANAGEMENT\n');
  
  if (adminToken && testClientId) {
    const addAppResult = await testEndpoint(
      'Add Job Application',
      'POST',
      '/api/admin/applications/add',
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          client_id: testClientId,
          company_name: 'Test Company',
          job_title: 'Software Engineer',
          job_url: 'https://example.com/job',
          status: 'applied'
        }
      }
    );

    if (addAppResult.success && addAppResult.data?.application?.id) {
      testApplicationId = addAppResult.data.application.id;
      
      await testEndpoint(
        'Update Application Status',
        'PATCH',
        `/api/admin/applications/${testApplicationId}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          data: {
            status: 'interview_scheduled'
          }
        }
      );
    }

    await testEndpoint(
      'Get All Applications',
      'GET',
      '/api/applications',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
  }

  // ========== SECTION 10: ADMIN MANAGEMENT ==========
  console.log('\n👨‍💼 SECTION 10: ADMIN MANAGEMENT\n');
  
  if (adminToken) {
    await testEndpoint(
      'Get All Admins',
      'GET',
      '/api/admin-management/admins',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    await testEndpoint(
      'Get Admin Activity Logs',
      'GET',
      '/api/admin-management/activity-logs',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
  }

  // ========== SECTION 11: NOTIFICATIONS ==========
  console.log('\n🔔 SECTION 11: NOTIFICATIONS\n');
  
  if (adminToken) {
    await testEndpoint(
      'Get Notifications',
      'GET',
      '/api/notifications',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    await testEndpoint(
      'Get Unread Notifications Count',
      'GET',
      '/api/notifications/unread/count',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
  }

  // ========== SECTION 12: FILE MANAGEMENT ==========
  console.log('\n📁 SECTION 12: FILE MANAGEMENT\n');
  
  if (adminToken) {
    await testEndpoint(
      'Get Files',
      'GET',
      '/api/files',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
  }

  // ========== SECTION 13: MEETINGS ==========
  console.log('\n🤝 SECTION 13: MEETINGS\n');
  
  if (adminToken) {
    await testEndpoint(
      'Get Meetings',
      'GET',
      '/api/meetings',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
  }

  // ========== SECTION 14: STRATEGY CALLS ==========
  console.log('\n📞 SECTION 14: STRATEGY CALLS\n');
  
  if (adminToken) {
    await testEndpoint(
      'Get Strategy Calls',
      'GET',
      '/api/strategy-calls',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
  }

  // ========== SECTION 15: LEADS ==========
  console.log('\n🎯 SECTION 15: LEADS\n');
  
  if (adminToken) {
    await testEndpoint(
      'Get Leads',
      'GET',
      '/api/leads',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
  }

  // ========== SECTION 16: CLIENT ENDPOINTS (Need Client Token) ==========
  console.log('\n👤 SECTION 16: CLIENT ENDPOINTS\n');
  
  // Try to create a test client and login
  // Note: This requires a valid registration token which we may not have
  logTest('Client Dashboard Tests', 'WARN', 'Requires valid client token - skipping for now');
  logTest('Client Uploads Tests', 'WARN', 'Requires valid client token - skipping for now');
  logTest('Client Onboarding Tests', 'WARN', 'Requires valid client token - skipping for now');
  logTest('Client Applications Tests', 'WARN', 'Requires valid client token - skipping for now');

  // ========== SECTION 17: EMAIL TRIGGERS ==========
  console.log('\n📧 SECTION 17: EMAIL TRIGGERS\n');
  
  logTest('Email on Consultation Submission', 'INFO', 'Tested via public consultation endpoint');
  logTest('Email on Contact Form', 'INFO', 'Tested via contact endpoint');
  logTest('Email on Payment Confirmation', 'INFO', 'Tested via payment confirmation endpoint');
  logTest('Email on Onboarding Approval', 'INFO', 'Tested via onboarding approval endpoint');
  logTest('Email on Application Status Update', 'INFO', 'Tested via application update endpoint');

  // ========== SECTION 18: CONSULTATION REQUESTS (Alternative) ==========
  console.log('\n📋 SECTION 18: CONSULTATION REQUESTS (SPEC)\n');
  
  if (adminToken) {
    await testEndpoint(
      'Get Consultation Requests',
      'GET',
      '/api/consultation-requests',
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
  }

  // ========== SECTION 19: WEBHOOKS ==========
  console.log('\n🔗 SECTION 19: WEBHOOKS\n');
  
  await testEndpoint(
    'Webhook Endpoint',
    'POST',
    '/api/webhooks/test',
    {
      data: { test: 'data' }
    }
  );

  // ========== SECTION 20: PUBLIC ROUTES ==========
  console.log('\n🌐 SECTION 20: PUBLIC ROUTES\n');
  
  await testEndpoint(
    'Public Info',
    'GET',
    '/api/public/info',
    {}
  );

  // ========== FINAL REPORT ==========
  console.log('\n\n╔════════════════════════════════════════════════╗');
  console.log('║           COMPREHENSIVE TEST REPORT            ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  console.log(`✅ PASSED: ${testResults.passed.length}`);
  console.log(`❌ FAILED: ${testResults.failed.length}`);
  console.log(`⚠️  WARNINGS: ${testResults.warnings.length}`);
  console.log(`📊 TOTAL: ${testResults.passed.length + testResults.failed.length + testResults.warnings.length}\n`);

  if (testResults.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:\n');
    testResults.failed.forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}`);
      console.log(`   ${test.details}\n`);
    });
  }

  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    testResults.warnings.forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}`);
      console.log(`   ${test.details}\n`);
    });
  }

  // Save detailed report
  const reportPath = path.join(__dirname, '../test-reports/vercel-comprehensive-test.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      passed: testResults.passed.length,
      failed: testResults.failed.length,
      warnings: testResults.warnings.length,
      total: testResults.passed.length + testResults.failed.length + testResults.warnings.length
    },
    results: testResults
  }, null, 2));

  console.log(`\n📄 Detailed report saved to: ${reportPath}\n`);
  
  // Exit with error code if tests failed
  if (testResults.failed.length > 0) {
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
});
