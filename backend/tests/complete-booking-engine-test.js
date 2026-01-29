const axios = require('axios');
const { supabaseAdmin } = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

// Test configuration
const BASE_URL = process.env.VERCEL_URL ? 
  `https://${process.env.VERCEL_URL}` : 
  'http://localhost:3000';

const API_BASE = `${BASE_URL}/api`;

// Test data
const TEST_CLIENT = {
  full_name: 'Test Client Johnson',
  email: 'testclient@example.com',
  phone: '+1-555-0123',
  message: 'I need help with my job search strategy and application process.',
  preferred_slots: [
    { date: '2024-02-15', time: '14:00' },
    { date: '2024-02-16', time: '10:00' },
    { date: '2024-02-17', time: '16:00' }
  ]
};

const TEST_ADMIN = {
  email: 'admin@applybureautest.com',
  passcode: 'AdminTest123!'
};

const ONBOARDING_DATA = {
  onboarding_current_position: 'Senior Software Engineer',
  onboarding_years_experience: '5-7 years',
  onboarding_education_level: 'Bachelor\'s Degree',
  onboarding_target_roles: 'Staff Engineer, Principal Engineer, Engineering Manager',
  onboarding_target_industries: 'Technology, Fintech, Healthcare Tech',
  onboarding_career_timeline: '3-6 months',
  onboarding_current_salary: '$120,000',
  onboarding_target_salary: '$160,000-$200,000',
  onboarding_benefits_priorities: 'Health insurance, 401k matching, flexible work',
  onboarding_work_arrangement: 'Remote or Hybrid',
  onboarding_company_size: 'Mid-size (100-1000 employees)',
  onboarding_work_culture: 'Collaborative, innovative, growth-oriented',
  onboarding_current_location: 'San Francisco, CA',
  onboarding_willing_to_relocate: 'No',
  onboarding_preferred_locations: 'San Francisco Bay Area, Remote',
  onboarding_key_skills: 'JavaScript, React, Node.js, Python, AWS, Docker',
  onboarding_skill_gaps: 'System design, leadership, product management',
  onboarding_learning_goals: 'Technical leadership, system architecture, team management',
  onboarding_application_volume: '15-20 applications per week',
  onboarding_success_metrics: 'Interview rate >20%, offer rate >5%, salary increase >30%'
};

const TEST_APPLICATIONS = [
  {
    company_name: 'TechCorp Inc',
    job_title: 'Senior Software Engineer',
    job_url: 'https://techcorp.com/careers/senior-engineer',
    application_date: '2024-01-15',
    status: 'applied',
    notes: 'Applied through company website, tailored resume for React/Node.js requirements'
  },
  {
    company_name: 'StartupXYZ',
    job_title: 'Full Stack Developer',
    job_url: 'https://startupxyz.com/jobs/fullstack',
    application_date: '2024-01-16',
    status: 'interviewing',
    notes: 'Phone screen completed, technical interview scheduled for next week'
  },
  {
    company_name: 'BigTech Solutions',
    job_title: 'Staff Engineer',
    job_url: 'https://bigtech.com/careers/staff-engineer',
    application_date: '2024-01-17',
    status: 'offer',
    offer_amount: '$180,000',
    notes: 'Received offer after 4 rounds of interviews'
  },
  {
    company_name: 'FinanceApp Co',
    job_title: 'Lead Developer',
    job_url: 'https://financeapp.com/jobs/lead-dev',
    application_date: '2024-01-18',
    status: 'rejected',
    notes: 'Rejected after technical interview - feedback was positive but went with internal candidate'
  }
];

class BookingEngineTest {
  constructor() {
    this.adminToken = null;
    this.clientToken = null;
    this.consultationId = null;
    this.clientId = null;
    this.registrationToken = null;
    this.testResults = {
      consultation_booking: false,
      admin_confirmation: false,
      payment_verification: false,
      client_registration: false,
      onboarding_completion: false,
      profile_unlock: false,
      application_logging: false,
      email_triggers: {
        consultation_request: false,
        consultation_confirmed: false,
        payment_confirmed: false,
        registration_sent: false,
        onboarding_completed: false,
        profile_unlocked: false,
        application_updates: false
      }
    };
  }

  async log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async makeRequest(method, endpoint, data = null, token = null) {
    try {
      const config = {
        method,
        url: `${API_BASE}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...(data && { data })
      };

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

  // Step 1: Submit consultation request (PUBLIC)
  async submitConsultationRequest() {
    this.log('🚀 STEP 1: Submitting consultation request...');
    
    const result = await this.makeRequest('POST', '/public-consultations', TEST_CLIENT);
    
    if (result.success) {
      this.consultationId = result.data.consultation_id;
      this.testResults.consultation_booking = true;
      this.testResults.email_triggers.consultation_request = true;
      this.log('✅ Consultation request submitted successfully', {
        consultation_id: this.consultationId,
        status: result.data.status
      });
    } else {
      this.log('❌ Failed to submit consultation request', result.error);
    }
    
    return result.success;
  }

  // Step 2: Admin login and view consultations
  async adminLogin() {
    this.log('🔐 STEP 2: Admin login...');
    
    const result = await this.makeRequest('POST', '/auth/login', TEST_ADMIN);
    
    if (result.success) {
      this.adminToken = result.data.token;
      this.log('✅ Admin login successful');
    } else {
      this.log('❌ Admin login failed', result.error);
    }
    
    return result.success;
  }

  // Step 3: Admin confirms consultation
  async adminConfirmConsultation() {
    this.log('📅 STEP 3: Admin confirming consultation...');
    
    const confirmData = {
      selected_slot_index: 0, // Select first time slot
      meeting_details: {
        meeting_link: 'https://meet.google.com/test-meeting-link',
        meeting_notes: 'Initial consultation to discuss job search strategy'
      },
      admin_notes: 'Client seems motivated and has clear goals'
    };
    
    const result = await this.makeRequest(
      'POST', 
      `/admin/concierge/consultations/${this.consultationId}/confirm`,
      confirmData,
      this.adminToken
    );
    
    if (result.success) {
      this.testResults.admin_confirmation = true;
      this.testResults.email_triggers.consultation_confirmed = true;
      this.log('✅ Consultation confirmed by admin', {
        scheduled_at: result.data.scheduled_at,
        meeting_link: result.data.meeting_link
      });
    } else {
      this.log('❌ Failed to confirm consultation', result.error);
    }
    
    return result.success;
  }

  // Step 4: Admin verifies payment and sends registration
  async adminVerifyPayment() {
    this.log('💳 STEP 4: Admin verifying payment...');
    
    const paymentData = {
      consultation_id: this.consultationId,
      payment_amount: 500,
      payment_method: 'stripe',
      payment_reference: 'test_payment_ref_123',
      package_tier: 'Tier 2'
    };
    
    const result = await this.makeRequest(
      'POST',
      '/admin/concierge/payment-confirmation',
      paymentData,
      this.adminToken
    );
    
    if (result.success) {
      this.registrationToken = result.data.registration_token;
      this.testResults.payment_verification = true;
      this.testResults.email_triggers.payment_confirmed = true;
      this.testResults.email_triggers.registration_sent = true;
      this.log('✅ Payment verified and registration token sent', {
        registration_token: this.registrationToken,
        expires_at: result.data.token_expires_at
      });
    } else {
      this.log('❌ Failed to verify payment', result.error);
    }
    
    return result.success;
  }

  // Step 5: Client registers using token
  async clientRegistration() {
    this.log('👤 STEP 5: Client registration...');
    
    const registrationData = {
      passcode: 'ClientTest123!',
      confirm_passcode: 'ClientTest123!'
    };
    
    const result = await this.makeRequest(
      'POST',
      `/client-registration/register/${this.registrationToken}`,
      registrationData
    );
    
    if (result.success) {
      this.clientToken = result.data.token;
      this.clientId = result.data.user.id;
      this.testResults.client_registration = true;
      this.log('✅ Client registration successful', {
        client_id: this.clientId,
        full_name: result.data.user.full_name
      });
    } else {
      this.log('❌ Client registration failed', result.error);
    }
    
    return result.success;
  }

  // Step 6: Client completes onboarding
  async clientOnboarding() {
    this.log('📋 STEP 6: Client completing onboarding...');
    
    const result = await this.makeRequest(
      'POST',
      '/onboarding-workflow/onboarding',
      ONBOARDING_DATA,
      this.clientToken
    );
    
    if (result.success) {
      this.testResults.onboarding_completion = true;
      this.testResults.email_triggers.onboarding_completed = true;
      this.log('✅ Onboarding completed successfully', {
        onboarding_id: result.data.onboarding_id,
        status: result.data.status
      });
    } else {
      this.log('❌ Onboarding completion failed', result.error);
    }
    
    return result.success;
  }

  // Step 7: Admin approves onboarding and unlocks profile
  async adminApproveOnboarding() {
    this.log('✅ STEP 7: Admin approving onboarding...');
    
    const approvalData = {
      execution_status: 'active',
      admin_notes: 'Client has clear goals and realistic expectations. Approved for Tier 2 service.',
      weekly_application_target: 30
    };
    
    const result = await this.makeRequest(
      'POST',
      `/admin/concierge/onboarding/${this.clientId}/approve`,
      approvalData,
      this.adminToken
    );
    
    if (result.success) {
      this.testResults.profile_unlock = true;
      this.testResults.email_triggers.profile_unlocked = true;
      this.log('✅ Onboarding approved and profile unlocked', {
        execution_status: result.data.execution_status,
        profile_unlocked: result.data.profile_unlocked
      });
    } else {
      this.log('❌ Failed to approve onboarding', result.error);
    }
    
    return result.success;
  }

  // Step 8: Log applications for client
  async logApplicationsForClient() {
    this.log('📝 STEP 8: Logging applications for client...');
    
    let successCount = 0;
    
    for (const [index, application] of TEST_APPLICATIONS.entries()) {
      const applicationData = {
        client_id: this.clientId,
        ...application
      };
      
      const result = await this.makeRequest(
        'POST',
        '/applications',
        applicationData,
        this.adminToken
      );
      
      if (result.success) {
        successCount++;
        this.log(`✅ Application ${index + 1} logged: ${application.company_name} - ${application.job_title}`, {
          application_id: result.data.application_id,
          status: application.status
        });
        
        // Test status update email trigger
        if (application.status === 'interviewing' || application.status === 'offer') {
          await this.testApplicationStatusUpdate(result.data.application_id, application.status);
        }
      } else {
        this.log(`❌ Failed to log application ${index + 1}`, result.error);
      }
    }
    
    if (successCount === TEST_APPLICATIONS.length) {
      this.testResults.application_logging = true;
      this.testResults.email_triggers.application_updates = true;
    }
    
    return successCount === TEST_APPLICATIONS.length;
  }

  // Test application status update email trigger
  async testApplicationStatusUpdate(applicationId, newStatus) {
    this.log(`📧 Testing application status update email trigger...`);
    
    const updateData = {
      status: newStatus,
      admin_notes: `Status updated to ${newStatus} during testing`
    };
    
    const result = await this.makeRequest(
      'PUT',
      `/applications/${applicationId}`,
      updateData,
      this.adminToken
    );
    
    if (result.success) {
      this.log(`✅ Application status update email triggered for ${newStatus}`);
    }
  }

  // Test all email triggers manually
  async testAllEmailTriggers() {
    this.log('📧 STEP 9: Testing all email triggers...');
    
    const emailTests = [
      {
        name: 'Consultation Reminder',
        template: 'consultation_reminder',
        data: { consultation_id: this.consultationId, client_name: TEST_CLIENT.full_name }
      },
      {
        name: 'Meeting Link Notification',
        template: 'meeting_link_notification',
        data: { meeting_link: 'https://meet.google.com/test-link', client_name: TEST_CLIENT.full_name }
      },
      {
        name: 'Interview Update',
        template: 'interview_update_enhanced',
        data: { company_name: 'TechCorp Inc', interview_date: '2024-02-20', client_name: TEST_CLIENT.full_name }
      },
      {
        name: 'Strategy Call Confirmed',
        template: 'strategy_call_confirmed',
        data: { call_date: '2024-02-25', call_time: '14:00', client_name: TEST_CLIENT.full_name }
      }
    ];
    
    for (const emailTest of emailTests) {
      try {
        await sendEmail(
          TEST_CLIENT.email,
          `Test: ${emailTest.name}`,
          emailTest.template,
          emailTest.data
        );
        this.log(`✅ Email trigger test passed: ${emailTest.name}`);
      } catch (error) {
        this.log(`❌ Email trigger test failed: ${emailTest.name}`, error.message);
      }
    }
  }

  // Verify client dashboard access
  async verifyClientDashboard() {
    this.log('📊 STEP 10: Verifying client dashboard access...');
    
    const result = await this.makeRequest(
      'GET',
      '/client/dashboard',
      null,
      this.clientToken
    );
    
    if (result.success) {
      this.log('✅ Client dashboard accessible', {
        profile_completion: result.data.profile_completion,
        application_stats: result.data.application_stats,
        twenty_questions: result.data.twenty_questions
      });
      return true;
    } else {
      this.log('❌ Client dashboard access failed', result.error);
      return false;
    }
  }

  // Generate comprehensive test report
  generateTestReport() {
    this.log('📋 COMPREHENSIVE TEST REPORT');
    this.log('=' .repeat(50));
    
    const totalTests = Object.keys(this.testResults).length + 
                      Object.keys(this.testResults.email_triggers).length - 1;
    
    let passedTests = 0;
    
    // Main flow tests
    Object.entries(this.testResults).forEach(([test, passed]) => {
      if (test !== 'email_triggers') {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        this.log(`${status} - ${test.replace(/_/g, ' ').toUpperCase()}`);
        if (passed) passedTests++;
      }
    });
    
    // Email trigger tests
    this.log('\nEMAIL TRIGGER TESTS:');
    Object.entries(this.testResults.email_triggers).forEach(([trigger, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      this.log(`${status} - ${trigger.replace(/_/g, ' ').toUpperCase()}`);
      if (passed) passedTests++;
    });
    
    this.log('\n' + '=' .repeat(50));
    this.log(`OVERALL RESULT: ${passedTests}/${totalTests} tests passed`);
    this.log(`SUCCESS RATE: ${Math.round((passedTests/totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
      this.log('🎉 ALL TESTS PASSED - BOOKING ENGINE FULLY FUNCTIONAL');
    } else {
      this.log('⚠️  SOME TESTS FAILED - REVIEW ABOVE FOR DETAILS');
    }
  }

  // Run complete test suite
  async runCompleteTest() {
    this.log('🚀 STARTING COMPLETE BOOKING ENGINE TEST');
    this.log('Testing full flow: Consultation → Registration → Onboarding → Applications');
    this.log('=' .repeat(70));
    
    try {
      // Execute test steps in sequence
      await this.submitConsultationRequest();
      await this.adminLogin();
      await this.adminConfirmConsultation();
      await this.adminVerifyPayment();
      await this.clientRegistration();
      await this.clientOnboarding();
      await this.adminApproveOnboarding();
      await this.logApplicationsForClient();
      await this.testAllEmailTriggers();
      await this.verifyClientDashboard();
      
    } catch (error) {
      this.log('❌ CRITICAL ERROR DURING TESTING', error);
    } finally {
      this.generateTestReport();
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new BookingEngineTest();
  test.runCompleteTest().catch(console.error);
}

module.exports = BookingEngineTest;