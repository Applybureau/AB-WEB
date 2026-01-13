const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://apply-bureau-backend.vercel.app'
  : 'http://localhost:3000';

console.log('🧪 Testing Apply Bureau New Workflow');
console.log('=====================================');
console.log(`Base URL: ${BASE_URL}`);
console.log('');

// Test data
const testClient = {
  full_name: 'John Workflow Test',
  email: 'john.workflow@test.com',
  phone: '+1-555-0123',
  linkedin_url: 'https://linkedin.com/in/johnworkflow',
  role_targets: 'Senior Software Engineer',
  location_preferences: 'Toronto, Vancouver',
  minimum_salary: '120000',
  target_market: 'Tech Startups',
  employment_status: 'Currently Employed',
  package_interest: 'Tier 2 - Premium Package',
  area_of_concern: 'Interview preparation and salary negotiation',
  current_country: 'Canada',
  preferred_time_1: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  preferred_time_2: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
  preferred_time_3: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
  timezone: 'America/Toronto'
};

const adminCredentials = {
  email: 'admin@applybureau.com',
  passcode: 'admin123'
};

let adminToken = '';
let clientToken = '';
let consultationId = '';
let registrationToken = '';
let strategyCallId = '';

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null, isFormData = false) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      if (isFormData) {
        config.data = data;
        config.headers = { ...config.headers, ...data.getHeaders() };
      } else {
        config.data = data;
        config.headers['Content-Type'] = 'application/json';
      }
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test functions
async function testPublicConsultationSubmission() {
  console.log('📝 Testing Public Consultation Submission...');
  
  const result = await apiRequest('POST', '/api/public-consultations', testClient);
  
  if (result.success) {
    consultationId = result.data.id;
    console.log('✅ Consultation submitted successfully');
    console.log(`   ID: ${consultationId}`);
    console.log(`   Status: ${result.data.status}`);
    console.log(`   Message: ${result.data.message}`);
    return true;
  } else {
    console.log('❌ Consultation submission failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testAdminLogin() {
  console.log('🔐 Testing Admin Login...');
  
  const result = await apiRequest('POST', '/api/auth/login', adminCredentials);
  
  if (result.success && result.data.token) {
    adminToken = result.data.token;
    console.log('✅ Admin login successful');
    console.log(`   Role: ${result.data.user.role}`);
    return true;
  } else {
    console.log('❌ Admin login failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testAdminConsultationList() {
  console.log('📋 Testing Admin Consultation List...');
  
  const result = await apiRequest('GET', '/api/admin/consultations', null, adminToken);
  
  if (result.success) {
    console.log('✅ Admin consultation list retrieved');
    console.log(`   Total consultations: ${result.data.length}`);
    
    const testConsultation = result.data.find(c => c.id === consultationId);
    if (testConsultation) {
      console.log('✅ Test consultation found in admin list');
      console.log(`   Status: ${testConsultation.status}`);
      console.log(`   Workflow Stage: ${testConsultation.workflow_stage}`);
      console.log(`   Time Slots: ${testConsultation.time_slots.length}`);
    } else {
      console.log('⚠️  Test consultation not found in admin list');
    }
    return true;
  } else {
    console.log('❌ Admin consultation list failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testAdminConfirmTime() {
  console.log('⏰ Testing Admin Time Confirmation...');
  
  const confirmData = {
    selected_time_slot: 2, // Select the second time slot
    meeting_details: 'This consultation is a brief conversation to understand your goals, explain how Apply Bureau works, and determine whether there is a mutual fit to move forward.',
    meeting_link: 'https://meet.google.com/test-meeting-link',
    meeting_type: 'video_call',
    admin_notes: 'Client seems well-prepared and motivated. Good fit for our services.'
  };
  
  const result = await apiRequest('POST', `/api/admin/consultations/${consultationId}/confirm-time`, confirmData, adminToken);
  
  if (result.success) {
    console.log('✅ Time confirmation successful');
    console.log(`   Confirmed Time: ${result.data.confirmed_time}`);
    console.log(`   Status: ${result.data.consultation.status}`);
    console.log(`   Workflow Stage: ${result.data.consultation.workflow_stage}`);
    return true;
  } else {
    console.log('❌ Time confirmation failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testConsultationCompletion() {
  console.log('✅ Testing Consultation Completion...');
  
  const completionData = {
    outcome: 'proceeding',
    selected_tier: 'Tier 2 - Premium Package',
    admin_notes: 'Client decided to proceed with Tier 2 package. Very motivated and clear about goals.',
    next_steps: 'Payment invoice will be sent via email. Payment via Interac e-transfer.'
  };
  
  const result = await apiRequest('POST', `/api/admin/consultations/${consultationId}/complete`, completionData, adminToken);
  
  if (result.success) {
    console.log('✅ Consultation completion successful');
    console.log(`   Outcome: ${result.data.consultation.consultation_outcome}`);
    console.log(`   Selected Tier: ${result.data.consultation.selected_tier}`);
    console.log(`   Workflow Stage: ${result.data.consultation.workflow_stage}`);
    return true;
  } else {
    console.log('❌ Consultation completion failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testPaymentReceived() {
  console.log('💳 Testing Payment Received...');
  
  const paymentData = {
    payment_amount: 2500.00,
    payment_method: 'interac_etransfer',
    payment_reference: 'ETRF-TEST-12345',
    admin_notes: 'Payment received via Interac e-transfer. Registration token generated.'
  };
  
  const result = await apiRequest('POST', `/api/admin/consultations/${consultationId}/payment-received`, paymentData, adminToken);
  
  if (result.success) {
    registrationToken = result.data.registration_token;
    console.log('✅ Payment recorded successfully');
    console.log(`   Amount: $${result.data.consultation.payment_amount}`);
    console.log(`   Status: ${result.data.consultation.status}`);
    console.log(`   Workflow Stage: ${result.data.consultation.workflow_stage}`);
    console.log(`   Registration Token Generated: ${registrationToken ? 'Yes' : 'No'}`);
    return true;
  } else {
    console.log('❌ Payment recording failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testTokenValidation() {
  console.log('🔍 Testing Registration Token Validation...');
  
  const result = await apiRequest('GET', `/api/client-registration/validate-token/${registrationToken}`);
  
  if (result.success && result.data.valid) {
    console.log('✅ Token validation successful');
    console.log(`   Valid: ${result.data.valid}`);
    console.log(`   Client Name: ${result.data.consultation.full_name}`);
    console.log(`   Email: ${result.data.consultation.email}`);
    console.log(`   Tier: ${result.data.consultation.selected_tier}`);
    return true;
  } else {
    console.log('❌ Token validation failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testClientRegistration() {
  console.log('👤 Testing Client Registration...');
  
  const registrationData = {
    token: registrationToken,
    password: 'SecurePassword123!',
    confirm_password: 'SecurePassword123!'
  };
  
  const result = await apiRequest('POST', '/api/client-registration/register', registrationData);
  
  if (result.success) {
    clientToken = result.data.token;
    console.log('✅ Client registration successful');
    console.log(`   User ID: ${result.data.user.id}`);
    console.log(`   Email: ${result.data.user.email}`);
    console.log(`   Role: ${result.data.user.role}`);
    console.log(`   Tier: ${result.data.user.tier}`);
    console.log(`   Redirect To: ${result.data.redirect_to}`);
    return true;
  } else {
    console.log('❌ Client registration failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testOnboardingStatus() {
  console.log('📊 Testing Onboarding Status...');
  
  const result = await apiRequest('GET', '/api/client/onboarding/status', null, clientToken);
  
  if (result.success) {
    console.log('✅ Onboarding status retrieved');
    console.log(`   Onboarding Completed: ${result.data.user.onboarding_completed}`);
    console.log(`   Next Steps: ${result.data.next_steps}`);
    return true;
  } else {
    console.log('❌ Onboarding status failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testOnboardingQuestionnaire() {
  console.log('📝 Testing Onboarding Questionnaire...');
  
  const onboardingData = {
    // Personal and Professional Background
    current_location: 'Toronto, ON',
    willing_to_relocate: true,
    preferred_locations: ['Toronto', 'Vancouver', 'Montreal'],
    years_of_experience: 8,
    current_employment_status: 'Employed',
    current_job_title: 'Senior Software Developer',
    current_company: 'Tech Corp Inc.',
    current_salary: 110000,
    target_salary_range: '120000-150000',
    
    // Career Goals and Preferences
    target_roles: ['Senior Software Engineer', 'Tech Lead', 'Engineering Manager'],
    target_industries: ['Technology', 'Fintech', 'Healthcare Tech'],
    target_company_sizes: ['Startup (1-50)', 'Scale-up (51-200)', 'Mid-size (201-1000)'],
    work_preferences: ['Remote', 'Hybrid'],
    career_goals_short_term: 'Secure a senior engineering role with leadership opportunities',
    career_goals_long_term: 'Transition into engineering management and eventually CTO role',
    
    // Skills and Qualifications
    key_skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes'],
    certifications: ['AWS Solutions Architect', 'Certified Kubernetes Administrator'],
    education_level: 'Bachelor\'s Degree in Computer Science',
    languages_spoken: ['English', 'French'],
    
    // Job Search Specifics
    job_search_timeline: '3-6 months',
    application_volume_preference: 'quality_focused',
    networking_comfort_level: 7,
    interview_confidence_level: 8,
    
    // Challenges and Support Needs
    biggest_job_search_challenges: ['Salary negotiation', 'Finding the right company culture', 'Technical interview preparation'],
    areas_needing_support: ['Resume optimization', 'Interview coaching', 'Salary negotiation'],
    previous_job_search_experience: 'Last job search was 3 years ago, found it challenging to stand out',
    
    // Additional Information
    additional_comments: 'Looking for a role that offers growth opportunities and work-life balance',
    special_circumstances: 'Currently on H1B visa, need employer sponsorship',
    availability_for_calls: ['Weekday evenings', 'Weekend mornings'],
    preferred_communication_method: 'email'
  };
  
  const result = await apiRequest('POST', '/api/client/onboarding/questionnaire', onboardingData, clientToken);
  
  if (result.success) {
    console.log('✅ Onboarding questionnaire submitted successfully');
    console.log(`   Next Steps: ${result.data.next_steps}`);
    console.log(`   Strategy Call Available: ${result.data.strategy_call_available}`);
    return true;
  } else {
    console.log('❌ Onboarding questionnaire failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testStrategyCallRequest() {
  console.log('📞 Testing Strategy Call Request...');
  
  const strategyCallData = {
    preferred_time_1: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    preferred_time_2: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days from now
    preferred_time_3: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days from now
    timezone: 'America/Toronto',
    preparation_notes: 'I have reviewed my onboarding responses and prepared questions about targeting fintech companies.',
    specific_topics: ['Resume positioning for senior roles', 'Salary negotiation strategies', 'Interview preparation for technical leadership roles'],
    urgency_level: 'normal'
  };
  
  const result = await apiRequest('POST', '/api/strategy-calls/request', strategyCallData, clientToken);
  
  if (result.success) {
    strategyCallId = result.data.id;
    console.log('✅ Strategy call requested successfully');
    console.log(`   ID: ${strategyCallId}`);
    console.log(`   Status: ${result.data.status}`);
    console.log(`   Message: ${result.data.message}`);
    console.log(`   Call Type: ${result.data.call_type}`);
    return true;
  } else {
    console.log('❌ Strategy call request failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testAdminStrategyCallList() {
  console.log('📋 Testing Admin Strategy Call List...');
  
  const result = await apiRequest('GET', '/api/strategy-calls/admin/all', null, adminToken);
  
  if (result.success) {
    console.log('✅ Admin strategy call list retrieved');
    console.log(`   Total strategy calls: ${result.data.length}`);
    
    const testCall = result.data.find(c => c.id === strategyCallId);
    if (testCall) {
      console.log('✅ Test strategy call found in admin list');
      console.log(`   Client: ${testCall.client_name}`);
      console.log(`   Status: ${testCall.status}`);
      console.log(`   Time Slots: ${testCall.time_slots.length}`);
    } else {
      console.log('⚠️  Test strategy call not found in admin list');
    }
    return true;
  } else {
    console.log('❌ Admin strategy call list failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testAdminConfirmStrategyCall() {
  console.log('⏰ Testing Admin Strategy Call Confirmation...');
  
  const confirmData = {
    selected_time_slot: 1, // Select the first time slot
    meeting_details: 'Strategy & Role Alignment Call - We will finalize your resume direction, role strategy, and search boundaries to kickoff your application execution.',
    meeting_link: 'https://meet.google.com/strategy-call-test',
    meeting_type: 'video_call',
    admin_notes: 'Client is well-prepared and has clear goals. Ready for strategy discussion.'
  };
  
  const result = await apiRequest('POST', `/api/strategy-calls/admin/${strategyCallId}/confirm-time`, confirmData, adminToken);
  
  if (result.success) {
    console.log('✅ Strategy call confirmation successful');
    console.log(`   Confirmed Time: ${result.data.confirmed_time}`);
    console.log(`   Status: ${result.data.strategy_call.status}`);
    console.log(`   Next Steps: ${result.data.next_steps}`);
    return true;
  } else {
    console.log('❌ Strategy call confirmation failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testClientStrategyCallList() {
  console.log('📱 Testing Client Strategy Call List...');
  
  const result = await apiRequest('GET', '/api/strategy-calls/my-calls', null, clientToken);
  
  if (result.success) {
    console.log('✅ Client strategy call list retrieved');
    console.log(`   Total calls: ${result.data.length}`);
    
    const confirmedCall = result.data.find(c => c.status === 'confirmed');
    if (confirmedCall) {
      console.log('✅ Confirmed strategy call found');
      console.log(`   Confirmed Time: ${confirmedCall.confirmed_time}`);
      console.log(`   Meeting Link: ${confirmedCall.meeting_link ? 'Provided' : 'Not provided'}`);
    }
    return true;
  } else {
    console.log('❌ Client strategy call list failed');
    console.log('   Error:', result.error);
    return false;
  }
}

// Main test runner
async function runWorkflowTests() {
  console.log('🚀 Starting Complete Workflow Test');
  console.log('==================================');
  
  const tests = [
    { name: 'Public Consultation Submission', fn: testPublicConsultationSubmission },
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'Admin Consultation List', fn: testAdminConsultationList },
    { name: 'Admin Time Confirmation', fn: testAdminConfirmTime },
    { name: 'Consultation Completion', fn: testConsultationCompletion },
    { name: 'Payment Received', fn: testPaymentReceived },
    { name: 'Token Validation', fn: testTokenValidation },
    { name: 'Client Registration', fn: testClientRegistration },
    { name: 'Onboarding Status', fn: testOnboardingStatus },
    { name: 'Onboarding Questionnaire', fn: testOnboardingQuestionnaire },
    { name: 'Strategy Call Request', fn: testStrategyCallRequest },
    { name: 'Admin Strategy Call List', fn: testAdminStrategyCallList },
    { name: 'Admin Strategy Call Confirmation', fn: testAdminConfirmStrategyCall },
    { name: 'Client Strategy Call List', fn: testClientStrategyCallList }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n${test.name}`);
    console.log('='.repeat(test.name.length));
    
    try {
      const success = await test.fn();
      if (success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log('❌ Test threw an exception');
      console.log('   Error:', error.message);
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏁 Test Summary');
  console.log('===============');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${tests.length}`);
  console.log(`📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! The new workflow is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
  
  console.log('\n📋 Test Data Summary');
  console.log('===================');
  console.log(`Consultation ID: ${consultationId}`);
  console.log(`Registration Token: ${registrationToken ? 'Generated' : 'Not generated'}`);
  console.log(`Strategy Call ID: ${strategyCallId}`);
  console.log(`Admin Token: ${adminToken ? 'Valid' : 'Invalid'}`);
  console.log(`Client Token: ${clientToken ? 'Valid' : 'Invalid'}`);
}

// Run the tests
runWorkflowTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});