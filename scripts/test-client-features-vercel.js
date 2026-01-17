/**
 * CLIENT FEATURES COMPREHENSIVE TEST
 * Tests all client-side functionality on Vercel
 */

const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'israelloko65@gmail.com';
const ADMIN_PASSWORD = 'admin123';

const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

let adminToken = null;
let clientToken = null;
let registrationToken = null;
let testClientId = null;
let testConsultationId = null;

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

async function runClientTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║      CLIENT FEATURES COMPREHENSIVE TEST        ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Step 1: Admin login
  console.log('\n🔐 STEP 1: ADMIN LOGIN\n');
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
  } else {
    console.log('\n❌ Cannot proceed without admin token\n');
    return;
  }

  // Step 2: Create consultation and get registration token
  console.log('\n📅 STEP 2: CREATE CONSULTATION & GET REGISTRATION TOKEN\n');
  
  const testEmail = 'clienttest_' + Date.now() + '@example.com';
  
  const consultationResult = await testEndpoint(
    'Submit Consultation Request',
    'POST',
    '/api/public-consultations',
    {
      data: {
        full_name: 'Test Client User',
        email: testEmail,
        phone: '+1234567890',
        country: 'United States',
        preferred_date: '2026-02-01',
        preferred_time: '14:00',
        message: 'Test consultation for client testing'
      }
    }
  );

  if (consultationResult.success && consultationResult.data?.consultation?.id) {
    testConsultationId = consultationResult.data.consultation.id;
    console.log(`   Consultation ID: ${testConsultationId}`);
  }

  // Step 3: Confirm payment and generate registration token
  console.log('\n💳 STEP 3: CONFIRM PAYMENT & GENERATE REGISTRATION TOKEN\n');
  
  if (testConsultationId) {
    const paymentResult = await testEndpoint(
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

    if (paymentResult.success && paymentResult.data?.registration_token) {
      registrationToken = paymentResult.data.registration_token;
      console.log(`   Registration Token: ${registrationToken}`);
    }
  }

  // Step 4: Complete client registration
  console.log('\n📝 STEP 4: COMPLETE CLIENT REGISTRATION\n');
  
  if (registrationToken) {
    const registrationResult = await testEndpoint(
      'Complete Client Registration',
      'POST',
      '/api/client-registration/register',
      {
        data: {
          token: registrationToken,
          password: 'TestPassword123!',
          confirm_password: 'TestPassword123!'
        }
      }
    );

    if (registrationResult.success && registrationResult.data?.token) {
      clientToken = registrationResult.data.token;
      testClientId = registrationResult.data.user?.id;
      console.log(`   Client Token: ${clientToken}`);
      console.log(`   Client ID: ${testClientId}`);
    }
  }

  // Step 5: Test client dashboard
  console.log('\n📊 STEP 5: CLIENT DASHBOARD\n');
  
  if (clientToken) {
    await testEndpoint(
      'Get Client Dashboard',
      'GET',
      '/api/client/dashboard',
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );

    await testEndpoint(
      'Get Client Profile',
      'GET',
      '/api/client/profile',
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );
  }

  // Step 6: Test onboarding submission
  console.log('\n📋 STEP 6: ONBOARDING SUBMISSION\n');
  
  if (clientToken) {
    await testEndpoint(
      'Submit 20-Question Onboarding',
      'POST',
      '/api/client/onboarding-20q/submit',
      {
        headers: { Authorization: `Bearer ${clientToken}` },
        data: {
          current_location: 'New York, USA',
          target_countries: ['Canada', 'UK'],
          education_level: 'Bachelor',
          field_of_study: 'Computer Science',
          years_of_experience: 5,
          current_job_title: 'Software Engineer',
          industry: 'Technology',
          english_proficiency: 'Fluent',
          other_languages: 'Spanish',
          has_job_offer: false,
          relocation_timeline: '6-12 months',
          budget_range: '$10,000-$20,000',
          family_members: 0,
          previous_visa_rejections: false,
          criminal_record: false,
          health_conditions: false,
          motivation: 'Career advancement',
          concerns: 'None',
          how_did_you_hear: 'Google',
          additional_info: 'Looking forward to working with you'
        }
      }
    );

    await testEndpoint(
      'Get Onboarding Status',
      'GET',
      '/api/client/onboarding-20q/status',
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );
  }

  // Step 7: Test file uploads
  console.log('\n📁 STEP 7: FILE UPLOADS\n');
  
  if (clientToken) {
    await testEndpoint(
      'Get Uploaded Files',
      'GET',
      '/api/client/uploads',
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );

    // Note: Actual file upload would require FormData
    logTest('Upload Resume', 'WARN', 'Requires multipart/form-data - manual test needed');
  }

  // Step 8: Test client applications
  console.log('\n📋 STEP 8: CLIENT APPLICATIONS\n');
  
  if (clientToken) {
    await testEndpoint(
      'Get My Applications',
      'GET',
      '/api/client/applications',
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );
  }

  // Step 9: Test client notifications
  console.log('\n🔔 STEP 9: CLIENT NOTIFICATIONS\n');
  
  if (clientToken) {
    await testEndpoint(
      'Get My Notifications',
      'GET',
      '/api/notifications',
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );
  }

  // Step 10: Approve onboarding (admin action)
  console.log('\n✅ STEP 10: ADMIN APPROVES ONBOARDING\n');
  
  if (adminToken && testClientId) {
    await testEndpoint(
      'Approve Client Onboarding',
      'POST',
      `/api/admin/concierge/onboarding/${testClientId}/approve`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          notes: 'Profile approved for testing'
        }
      }
    );
  }

  // Step 11: Test unlocked profile features
  console.log('\n🔓 STEP 11: UNLOCKED PROFILE FEATURES\n');
  
  if (clientToken) {
    await testEndpoint(
      'Get Dashboard After Unlock',
      'GET',
      '/api/client/dashboard',
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );
  }

  // Step 12: Admin adds application for client
  console.log('\n📋 STEP 12: ADMIN ADDS APPLICATION\n');
  
  if (adminToken && testClientId) {
    const addAppResult = await testEndpoint(
      'Admin Adds Job Application',
      'POST',
      '/api/admin/applications/add',
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          client_id: testClientId,
          company_name: 'Test Tech Corp',
          job_title: 'Senior Software Engineer',
          job_url: 'https://example.com/job/12345',
          status: 'applied',
          location: 'Toronto, Canada'
        }
      }
    );

    if (addAppResult.success) {
      // Step 13: Client views new application
      console.log('\n👀 STEP 13: CLIENT VIEWS APPLICATION\n');
      
      await testEndpoint(
        'Client Views Applications',
        'GET',
        '/api/client/applications',
        {
          headers: { Authorization: `Bearer ${clientToken}` }
        }
      );
    }
  }

  // Step 14: Test strategy calls
  console.log('\n📞 STEP 14: STRATEGY CALLS\n');
  
  if (clientToken) {
    await testEndpoint(
      'Get Strategy Calls',
      'GET',
      '/api/strategy-calls',
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );
  }

  // Step 15: Test meetings
  console.log('\n🤝 STEP 15: MEETINGS\n');
  
  if (clientToken) {
    await testEndpoint(
      'Get My Meetings',
      'GET',
      '/api/meetings',
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );
  }

  // Final Report
  console.log('\n\n╔════════════════════════════════════════════════╗');
  console.log('║        CLIENT FEATURES TEST REPORT             ║');
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

  console.log('\n📝 TEST SUMMARY:\n');
  console.log('This test covered:');
  console.log('- Client registration flow');
  console.log('- Client dashboard access');
  console.log('- Onboarding submission and approval');
  console.log('- File upload endpoints');
  console.log('- Application tracking');
  console.log('- Notifications');
  console.log('- Strategy calls and meetings\n');
}

runClientTests().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
});
