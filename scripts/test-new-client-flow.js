require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://apply-bureau-backend.vercel.app'
  : 'http://localhost:3000';

console.log('🧪 APPLY BUREAU NEW CLIENT FLOW - COMPREHENSIVE TEST');
console.log('===================================================');
console.log(`Base URL: ${BASE_URL}`);
console.log('Testing the complete new client flow...\n');

// Test data
const testClient = {
  full_name: 'Israel Test Client',
  email: 'israel.testclient@example.com',
  phone: '+1-555-0123',
  message: 'I am interested in your services and would like to book a consultation to discuss my career goals and transition strategy.',
  preferred_slots: [
    { date: '2024-02-15', time: '14:00' },
    { date: '2024-02-16', time: '15:00' },
    { date: '2024-02-17', time: '16:00' }
  ]
};

const strategyCallData = {
  preferred_slots: [
    { date: '2024-02-20', time: '10:00' },
    { date: '2024-02-21', time: '11:00' },
    { date: '2024-02-22', time: '14:00' }
  ],
  message: 'Looking forward to discussing my career goals and application strategy.'
};

const onboardingData = {
  // Role Targeting (Questions 1-5)
  target_job_titles: ['Senior Software Engineer', 'Tech Lead'],
  target_industries: ['Technology', 'Fintech'],
  target_company_sizes: ['Startup (1-50)', 'Scale-up (51-200)'],
  target_locations: ['Toronto', 'Vancouver'],
  remote_work_preference: 'hybrid',
  
  // Compensation Guardrails (Questions 6-8)
  current_salary_range: '100000-120000',
  target_salary_range: '130000-160000',
  salary_negotiation_comfort: 7,
  
  // Experience & Skills (Questions 9-12)
  years_of_experience: 8,
  key_technical_skills: ['JavaScript', 'React', 'Node.js', 'Python'],
  soft_skills_strengths: ['Leadership', 'Communication', 'Problem Solving'],
  certifications_licenses: ['AWS Solutions Architect'],
  
  // Job Search Strategy (Questions 13-16)
  job_search_timeline: '3_6_months',
  application_volume_preference: 'quality_focused',
  networking_comfort_level: 6,
  interview_confidence_level: 8,
  
  // Career Goals & Challenges (Questions 17-20)
  career_goals_short_term: 'Secure a senior engineering role with leadership opportunities',
  career_goals_long_term: 'Transition into engineering management',
  biggest_career_challenges: ['Salary negotiation', 'Finding right company culture'],
  support_areas_needed: ['Resume optimization', 'Interview coaching']
};

const adminCredentials = {
  email: 'admin@applybureau.com',
  password: 'admin123'
};

let adminToken = '';
let clientToken = '';
let consultationId = '';
let strategyCallId = '';
let registrationToken = '';
let onboardingId = '';

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null) {
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
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
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
async function testStep1ConsultationBooking() {
  console.log('📝 STEP 1: Book a Consultation (Public)');
  console.log('======================================');
  
  const result = await apiRequest('POST', '/api/public-consultations', testClient);
  
  if (result.success) {
    consultationId = result.data.id;
    console.log('✅ Consultation booked successfully');
    console.log(`   ID: ${consultationId}`);
    console.log(`   Status: ${result.data.status}`);
    console.log(`   Message: ${result.data.message}`);
    console.log(`   Next Steps: ${result.data.next_steps}`);
    return true;
  } else {
    console.log('❌ Consultation booking failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testAdminConsultationConfirmation() {
  console.log('\n🔐 ADMIN: Confirm Consultation');
  console.log('==============================');
  
  // Admin login
  const loginResult = await apiRequest('POST', '/api/auth/login', adminCredentials);
  if (!loginResult.success) {
    console.log('❌ Admin login failed');
    return false;
  }
  
  adminToken = loginResult.data.token;
  console.log('✅ Admin logged in successfully');
  
  // Confirm consultation
  const confirmData = {
    selected_slot_index: 1,
    meeting_details: 'Initial consultation to discuss career goals and mutual fit.',
    meeting_link: 'https://meet.google.com/test-consultation',
    admin_notes: 'Client seems motivated and well-prepared.'
  };
  
  const result = await apiRequest('POST', `/api/admin/concierge/consultations/${consultationId}/confirm`, confirmData, adminToken);
  
  if (result.success) {
    console.log('✅ Consultation confirmed by admin');
    console.log(`   Confirmed Time: ${result.data.confirmed_time}`);
    return true;
  } else {
    console.log('❌ Consultation confirmation failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testPaymentConfirmationAndRegistration() {
  console.log('\n💳 ADMIN: Confirm Payment & Send Registration Invite');
  console.log('===================================================');
  
  const paymentData = {
    client_email: testClient.email,
    client_name: testClient.full_name,
    payment_amount: 2500.00,
    payment_method: 'interac_etransfer',
    payment_reference: 'TEST-FLOW-12345',
    admin_notes: 'Payment confirmed for new client flow test'
  };
  
  const result = await apiRequest('POST', '/api/admin/concierge/payment/confirm-and-invite', paymentData, adminToken);
  
  if (result.success) {
    registrationToken = result.data.registration_token;
    console.log('✅ Payment confirmed and registration invite sent');
    console.log(`   Registration Token: ${registrationToken ? 'Generated' : 'Failed'}`);
    return true;
  } else {
    console.log('❌ Payment confirmation failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testClientRegistration() {
  console.log('\n👤 CLIENT: Complete Registration');
  console.log('================================');
  
  const registrationData = {
    token: registrationToken,
    password: 'TestClient123!',
    confirm_password: 'TestClient123!'
  };
  
  const result = await apiRequest('POST', '/api/client-registration/register', registrationData);
  
  if (result.success) {
    clientToken = result.data.token;
    console.log('✅ Client registration successful');
    console.log(`   Client Token: ${clientToken ? 'Generated' : 'Failed'}`);
    return true;
  } else {
    console.log('❌ Client registration failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testClientDashboardStatus() {
  console.log('\n📊 CLIENT: Check Dashboard Status');
  console.log('=================================');
  
  const result = await apiRequest('GET', '/api/client/dashboard/status', null, clientToken);
  
  if (result.success) {
    console.log('✅ Dashboard status retrieved');
    console.log(`   Status: ${result.data.status}`);
    console.log(`   Message: ${result.data.message}`);
    console.log(`   Can Book Strategy Call: ${result.data.can_book_strategy_call}`);
    return true;
  } else {
    console.log('❌ Dashboard status failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testStrategyCallBooking() {
  console.log('\n📞 CLIENT: Book Strategy Call');
  console.log('=============================');
  
  const result = await apiRequest('POST', '/api/strategy-calls', strategyCallData, clientToken);
  
  if (result.success) {
    strategyCallId = result.data.id;
    console.log('✅ Strategy call booked successfully');
    console.log(`   ID: ${strategyCallId}`);
    console.log(`   Status: ${result.data.status}`);
    console.log(`   Next Steps: ${result.data.next_steps}`);
    return true;
  } else {
    console.log('❌ Strategy call booking failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testAdminStrategyCallConfirmation() {
  console.log('\n🔐 ADMIN: Confirm Strategy Call');
  console.log('===============================');
  
  const confirmData = {
    selected_slot_index: 0,
    meeting_link: 'https://meet.google.com/strategy-call-test',
    admin_notes: 'Strategy call confirmed for role alignment discussion.'
  };
  
  const result = await apiRequest('POST', `/api/strategy-calls/admin/${strategyCallId}/confirm`, confirmData, adminToken);
  
  if (result.success) {
    console.log('✅ Strategy call confirmed by admin');
    console.log(`   Confirmed Time: ${result.data.confirmed_time}`);
    return true;
  } else {
    console.log('❌ Strategy call confirmation failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testFileUploads() {
  console.log('\n📁 CLIENT: Test File Uploads');
  console.log('============================');
  
  // Test LinkedIn URL
  const linkedinResult = await apiRequest('POST', '/api/client/uploads/linkedin', {
    linkedin_url: 'https://linkedin.com/in/israel-test'
  }, clientToken);
  
  if (linkedinResult.success) {
    console.log('✅ LinkedIn URL added successfully');
  } else {
    console.log('❌ LinkedIn URL failed:', linkedinResult.error);
  }
  
  // Test Portfolio URLs
  const portfolioResult = await apiRequest('POST', '/api/client/uploads/portfolio', {
    portfolio_urls: [
      'https://github.com/israel-test',
      'https://israel-portfolio.com'
    ]
  }, clientToken);
  
  if (portfolioResult.success) {
    console.log('✅ Portfolio URLs added successfully');
  } else {
    console.log('❌ Portfolio URLs failed:', portfolioResult.error);
  }
  
  // Check upload status
  const statusResult = await apiRequest('GET', '/api/client/uploads/status', null, clientToken);
  
  if (statusResult.success) {
    console.log('✅ Upload status retrieved');
    console.log(`   LinkedIn Added: ${statusResult.data.linkedin.added}`);
    console.log(`   Portfolio Count: ${statusResult.data.portfolio.count}`);
    return true;
  } else {
    console.log('❌ Upload status failed');
    return false;
  }
}

async function testOnboardingQuestionnaire() {
  console.log('\n📝 CLIENT: Complete Onboarding Questionnaire');
  console.log('============================================');
  
  const result = await apiRequest('POST', '/api/client/onboarding-20q/questionnaire', onboardingData, clientToken);
  
  if (result.success) {
    onboardingId = result.data.onboarding.id;
    console.log('✅ Onboarding questionnaire submitted');
    console.log(`   ID: ${onboardingId}`);
    console.log(`   Status: ${result.data.onboarding.execution_status}`);
    console.log(`   Client Message: ${result.data.client_message.headline}`);
    console.log(`   Requires Admin Approval: ${result.data.requires_admin_approval}`);
    return true;
  } else {
    console.log('❌ Onboarding questionnaire failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testAdminOnboardingApproval() {
  console.log('\n🔐 ADMIN: Approve Onboarding');
  console.log('============================');
  
  const approvalData = {
    admin_notes: 'Excellent onboarding responses. Client is ready for application execution.'
  };
  
  const result = await apiRequest('POST', `/api/admin/concierge/onboarding/${onboardingId}/approve`, approvalData, adminToken);
  
  if (result.success) {
    console.log('✅ Onboarding approved by admin');
    console.log(`   Profile Unlocked: ${result.data.profile_unlocked}`);
    return true;
  } else {
    console.log('❌ Onboarding approval failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testAdminOnboardingConfirmationTrigger() {
  console.log('\n🔐 ADMIN: Send Onboarding Confirmation Email');
  console.log('============================================');
  
  const result = await apiRequest('POST', `/api/admin/onboarding-triggers/${onboardingId}/send-confirmation`, {
    custom_message: 'Welcome to Apply Bureau! We are excited to help you achieve your career goals.'
  }, adminToken);
  
  if (result.success) {
    console.log('✅ Onboarding confirmation email sent');
    console.log(`   Sent to: ${result.data.client_email}`);
    return true;
  } else {
    console.log('❌ Onboarding confirmation email failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testFinalDashboardView() {
  console.log('\n📊 CLIENT: Final Dashboard View');
  console.log('===============================');
  
  const result = await apiRequest('GET', '/api/client/dashboard', null, clientToken);
  
  if (result.success) {
    console.log('✅ Final dashboard retrieved');
    console.log(`   Overall Status: ${result.data.status.overall_status}`);
    console.log(`   Status Message: ${result.data.status.message}`);
    console.log(`   Progress: ${result.data.status.progress_percentage}%`);
    console.log(`   Can View Applications: ${result.data.applications.can_view}`);
    console.log(`   Next Steps Count: ${result.data.next_steps.length}`);
    return true;
  } else {
    console.log('❌ Final dashboard failed');
    console.log('   Error:', result.error);
    return false;
  }
}

async function testApplicationTrackerWithInterviewNotification() {
  console.log('\n📊 ADMIN: Test Application Tracker & Interview Notification');
  console.log('==========================================================');
  
  // Create a test application
  const appData = {
    company: 'TechCorp Inc.',
    role: 'Senior Software Engineer',
    status: 'applied',
    applied_date: '2024-02-15',
    job_posting_link: 'https://techcorp.com/jobs/senior-engineer',
    application_method: 'direct',
    resume_version_used: 'v2.1'
  };
  
  const createResult = await apiRequest('POST', '/api/applications', {
    ...appData,
    client_id: testClient.email // This would normally be the client ID
  }, adminToken);
  
  if (createResult.success) {
    const applicationId = createResult.data.id;
    console.log('✅ Test application created');
    
    // Update status to trigger interview notification
    const updateResult = await apiRequest('PATCH', `/api/applications/${applicationId}`, {
      status: 'interview_requested',
      interview_date: '2024-02-25',
      admin_notes: 'Interview scheduled with hiring manager'
    }, adminToken);
    
    if (updateResult.success) {
      console.log('✅ Application updated to interview_requested');
      console.log(`   Interview Notification Sent: ${updateResult.data.interview_notification_sent}`);
      return true;
    } else {
      console.log('❌ Application update failed');
      return false;
    }
  } else {
    console.log('❌ Test application creation failed');
    return false;
  }
}

// Main test runner
async function runNewClientFlowTest() {
  console.log('🚀 Starting New Client Flow Comprehensive Test');
  console.log('===============================================\n');
  
  const tests = [
    { name: 'Step 1: Consultation Booking', fn: testStep1ConsultationBooking },
    { name: 'Admin: Consultation Confirmation', fn: testAdminConsultationConfirmation },
    { name: 'Admin: Payment & Registration', fn: testPaymentConfirmationAndRegistration },
    { name: 'Client: Registration', fn: testClientRegistration },
    { name: 'Client: Dashboard Status', fn: testClientDashboardStatus },
    { name: 'Client: Strategy Call Booking', fn: testStrategyCallBooking },
    { name: 'Admin: Strategy Call Confirmation', fn: testAdminStrategyCallConfirmation },
    { name: 'Client: File Uploads', fn: testFileUploads },
    { name: 'Client: Onboarding Questionnaire', fn: testOnboardingQuestionnaire },
    { name: 'Admin: Onboarding Approval', fn: testAdminOnboardingApproval },
    { name: 'Admin: Confirmation Email Trigger', fn: testAdminOnboardingConfirmationTrigger },
    { name: 'Client: Final Dashboard View', fn: testFinalDashboardView },
    { name: 'Admin: Application Tracker & Interview Notification', fn: testApplicationTrackerWithInterviewNotification }
  ];
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  for (const test of tests) {
    try {
      const success = await test.fn();
      if (success) {
        passed++;
        results.push({ name: test.name, status: 'PASSED' });
      } else {
        failed++;
        results.push({ name: test.name, status: 'FAILED' });
      }
    } catch (error) {
      console.log(`❌ ${test.name} threw an exception:`, error.message);
      failed++;
      results.push({ name: test.name, status: 'ERROR', error: error.message });
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏁 NEW CLIENT FLOW TEST SUMMARY');
  console.log('================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${tests.length}`);
  console.log(`📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);
  
  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    const icon = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('\n🎯 New Client Flow Features Tested:');
  console.log('- ✅ Consultation booking with message field');
  console.log('- ✅ Admin gatekeeper consultation confirmation');
  console.log('- ✅ Payment-gated registration system');
  console.log('- ✅ Client dashboard with status tracking');
  console.log('- ✅ Strategy call booking system');
  console.log('- ✅ File upload system (LinkedIn, portfolio)');
  console.log('- ✅ 20-question onboarding questionnaire');
  console.log('- ✅ Admin onboarding approval workflow');
  console.log('- ✅ Admin-triggered confirmation emails');
  console.log('- ✅ Enhanced application tracker');
  console.log('- ✅ Automated interview notifications');
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The new client flow is fully functional.');
    console.log('🚀 Ready for frontend integration and production deployment.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
  
  return failed === 0;
}

// Run the tests
if (require.main === module) {
  runNewClientFlowTest().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runNewClientFlowTest };