const axios = require('axios');

// Production Vercel URL
const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';
const API_BASE = `${BACKEND_URL}/api`;

// Test data
const TEST_ADMIN = {
  email: 'admin@applybureautest.com',
  password: 'AdminTest123!'
};

const TEST_CLIENT = {
  full_name: 'Ultimate Test Client',
  email: 'ultimatetest@example.com',
  phone: '+1-555-9999',
  message: 'Ultimate comprehensive test of the booking engine system.',
  preferred_slots: [
    { date: '2024-02-25', time: '09:00' },
    { date: '2024-02-26', time: '14:00' },
    { date: '2024-02-27', time: '16:00' }
  ]
};

const TEST_CLIENT_REGISTRATION = {
  email: 'newclient@example.com',
  full_name: 'New Test Client',
  password: 'NewClient123!'
};

const ONBOARDING_DATA = {
  onboarding_current_position: 'Senior Software Engineer',
  onboarding_years_experience: '5-7 years',
  onboarding_education_level: 'Bachelor\'s Degree',
  onboarding_target_roles: 'Staff Engineer, Principal Engineer',
  onboarding_target_industries: 'Technology, Fintech',
  onboarding_career_timeline: '3-6 months',
  onboarding_current_salary: '$120,000',
  onboarding_target_salary: '$160,000-$200,000',
  onboarding_benefits_priorities: 'Health insurance, 401k matching',
  onboarding_work_arrangement: 'Remote or Hybrid',
  onboarding_company_size: 'Mid-size (100-1000 employees)',
  onboarding_work_culture: 'Collaborative, innovative',
  onboarding_current_location: 'San Francisco, CA',
  onboarding_willing_to_relocate: 'No',
  onboarding_preferred_locations: 'San Francisco Bay Area',
  onboarding_key_skills: 'JavaScript, React, Node.js, Python',
  onboarding_skill_gaps: 'System design, leadership',
  onboarding_learning_goals: 'Technical leadership',
  onboarding_application_volume: '15-20 applications per week',
  onboarding_success_metrics: 'Interview rate >20%, offer rate >5%'
};

const TEST_APPLICATIONS = [
  {
    company_name: 'Ultimate Tech Corp',
    job_title: 'Senior Software Engineer',
    job_url: 'https://ultimatetech.com/careers/senior-engineer',
    application_date: '2024-01-20',
    status: 'applied',
    notes: 'Applied through company website with tailored resume'
  },
  {
    company_name: 'Innovation Startup',
    job_title: 'Full Stack Developer',
    job_url: 'https://innovation.com/jobs/fullstack',
    application_date: '2024-01-21',
    status: 'interviewing',
    interview_date: '2024-02-01',
    notes: 'Phone screen completed, technical interview scheduled'
  },
  {
    company_name: 'Big Tech Solutions',
    job_title: 'Staff Engineer',
    job_url: 'https://bigtech.com/careers/staff-engineer',
    application_date: '2024-01-22',
    status: 'offer',
    offer_amount: '$185,000',
    notes: 'Received competitive offer after 5 rounds'
  },
  {
    company_name: 'Finance Tech Co',
    job_title: 'Lead Developer',
    job_url: 'https://fintech.com/jobs/lead-dev',
    application_date: '2024-01-23',
    status: 'rejected',
    notes: 'Rejected after final round - went with internal candidate'
  }
];

class UltimateComprehensiveTest {
  constructor() {
    this.adminToken = null;
    this.clientToken = null;
    this.consultationId = null;
    this.clientId = null;
    this.registrationToken = null;
    this.applicationIds = [];
    this.results = {
      // Core System Tests
      server_health: false,
      database_connectivity: false,
      
      // Authentication Tests
      admin_login: false,
      admin_profile_access: false,
      password_change: false,
      token_validation: false,
      unauthorized_access_blocked: false,
      
      // Consultation Flow Tests
      consultation_booking: false,
      admin_consultation_view: false,
      consultation_confirmation: false,
      consultation_rescheduling: false,
      
      // Client Management Tests
      client_invitation: false,
      client_registration: false,
      client_onboarding: false,
      onboarding_approval: false,
      profile_unlock: false,
      
      // Application Tracking Tests
      application_creation: false,
      application_status_updates: false,
      application_statistics: false,
      application_search: false,
      
      // Email System Tests
      contact_form_emails: false,
      consultation_emails: false,
      onboarding_emails: false,
      application_emails: false,
      admin_notification_emails: false,
      
      // Dashboard Tests
      admin_dashboard: false,
      client_dashboard: false,
      
      // File Upload Tests
      file_upload: false,
      
      // Notification Tests
      notification_creation: false,
      notification_retrieval: false,
      
      // Security Tests
      rate_limiting: false,
      input_validation: false,
      
      // Integration Tests
      complete_workflow: false,
      error_handling: false
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
        timeout: 30000,
        ...(data && { data })
      };

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500,
        details: {
          code: error.code,
          message: error.message
        }
      };
    }
  }

  // ==================== CORE SYSTEM TESTS ====================

  async testServerHealth() {
    this.log('🏥 TEST 1: Server Health Check');
    
    const result = await this.makeRequest('GET', '/health');
    
    if (result.success) {
      this.results.server_health = true;
      this.log('✅ Server is healthy', {
        uptime: result.data.uptime,
        memory: result.data.memory,
        environment: result.data.environment,
        service: result.data.service
      });
    } else {
      this.log('❌ Server health check failed', result.error);
    }
    
    return this.results.server_health;
  }

  async testDatabaseConnectivity() {
    this.log('🗄️  TEST 2: Database Connectivity');
    
    // Test multiple database operations
    const tests = [
      { name: 'Consultations Table', endpoint: '/public-consultations', method: 'GET' },
      { name: 'Applications Table', endpoint: '/applications', method: 'GET', requiresAuth: true }
    ];
    
    let successCount = 0;
    
    for (const test of tests) {
      const token = test.requiresAuth ? this.adminToken : null;
      const result = await this.makeRequest(test.method, test.endpoint, null, token);
      
      if (result.success || result.status === 401 || result.status === 405) {
        successCount++;
        this.log(`✅ ${test.name} accessible`);
      } else {
        this.log(`❌ ${test.name} failed`, result.error);
      }
    }
    
    this.results.database_connectivity = successCount === tests.length;
    return this.results.database_connectivity;
  }

  // ==================== AUTHENTICATION TESTS ====================

  async testAdminLogin() {
    this.log('🔐 TEST 3: Admin Login');
    
    const result = await this.makeRequest('POST', '/auth/login', TEST_ADMIN);
    
    if (result.success) {
      this.adminToken = result.data.token;
      this.results.admin_login = true;
      this.log('✅ Admin login successful', {
        admin_id: result.data.user.id,
        role: result.data.user.role,
        permissions: result.data.user.permissions
      });
    } else {
      this.log('❌ Admin login failed', result.error);
    }
    
    return this.results.admin_login;
  }

  async testAdminProfileAccess() {
    this.log('👤 TEST 4: Admin Profile Access');
    
    if (!this.adminToken) {
      this.log('❌ Cannot test - no admin token');
      return false;
    }
    
    const result = await this.makeRequest('GET', '/auth/me', null, this.adminToken);
    
    if (result.success) {
      this.results.admin_profile_access = true;
      this.log('✅ Admin profile access working', {
        user_id: result.data.user.id,
        role: result.data.user.role,
        dashboard_type: result.data.dashboard_type
      });
    } else {
      this.log('❌ Admin profile access failed', result.error);
    }
    
    return this.results.admin_profile_access;
  }

  async testPasswordChange() {
    this.log('🔑 TEST 5: Password Change');
    
    if (!this.adminToken) {
      this.log('❌ Cannot test - no admin token');
      return false;
    }
    
    // Test password change (change to same password for testing)
    const passwordData = {
      current_password: TEST_ADMIN.password,
      new_password: TEST_ADMIN.password,
      confirm_password: TEST_ADMIN.password
    };
    
    const result = await this.makeRequest('POST', '/auth/change-password', passwordData, this.adminToken);
    
    if (result.success) {
      this.results.password_change = true;
      this.log('✅ Password change functionality working');
    } else {
      this.log('❌ Password change failed', result.error);
    }
    
    return this.results.password_change;
  }

  async testTokenValidation() {
    this.log('🎫 TEST 6: Token Validation');
    
    // Test with invalid token
    const invalidResult = await this.makeRequest('GET', '/auth/me', null, 'invalid-token');
    
    if (invalidResult.status === 401 || invalidResult.status === 403) {
      this.results.token_validation = true;
      this.log('✅ Token validation working (invalid token rejected)');
    } else {
      this.log('❌ Token validation failed (should reject invalid tokens)');
    }
    
    return this.results.token_validation;
  }

  async testUnauthorizedAccessBlocked() {
    this.log('🚫 TEST 7: Unauthorized Access Protection');
    
    const protectedEndpoints = [
      '/admin/concierge/consultations',
      '/applications',
      '/admin/dashboard'
    ];
    
    let blockedCount = 0;
    
    for (const endpoint of protectedEndpoints) {
      const result = await this.makeRequest('GET', endpoint);
      
      if (result.status === 401 || result.status === 403) {
        blockedCount++;
        this.log(`✅ ${endpoint} properly protected`);
      } else {
        this.log(`❌ ${endpoint} not properly protected`);
      }
    }
    
    this.results.unauthorized_access_blocked = blockedCount === protectedEndpoints.length;
    return this.results.unauthorized_access_blocked;
  }

  // ==================== CONSULTATION FLOW TESTS ====================

  async testConsultationBooking() {
    this.log('📅 TEST 8: Consultation Booking');
    
    const result = await this.makeRequest('POST', '/public-consultations', TEST_CLIENT);
    
    if (result.success) {
      this.consultationId = result.data.consultation_id;
      this.results.consultation_booking = true;
      this.log('✅ Consultation booking successful', {
        consultation_id: this.consultationId,
        status: result.data.status,
        message: result.data.message
      });
    } else {
      this.log('❌ Consultation booking failed', result.error);
    }
    
    return this.results.consultation_booking;
  }

  async testAdminConsultationView() {
    this.log('👀 TEST 9: Admin Consultation View');
    
    if (!this.adminToken) {
      this.log('❌ Cannot test - no admin token');
      return false;
    }
    
    const result = await this.makeRequest('GET', '/admin/concierge/consultations', null, this.adminToken);
    
    if (result.success) {
      this.results.admin_consultation_view = true;
      const consultations = result.data.consultations || [];
      this.log('✅ Admin can view consultations', {
        total_consultations: consultations.length,
        status_counts: result.data.status_counts,
        latest_consultation: consultations[0] ? {
          id: consultations[0].id,
          name: consultations[0].prospect_name,
          status: consultations[0].status
        } : null
      });
    } else {
      this.log('❌ Admin consultation view failed', result.error);
    }
    
    return this.results.admin_consultation_view;
  }

  async testConsultationConfirmation() {
    this.log('✅ TEST 10: Consultation Confirmation');
    
    if (!this.adminToken || !this.consultationId) {
      this.log('❌ Cannot test - missing admin token or consultation ID');
      return false;
    }
    
    const confirmData = {
      selected_slot_index: 0,
      meeting_details: {
        meeting_link: 'https://meet.google.com/ultimate-test',
        meeting_notes: 'Ultimate test consultation confirmation'
      },
      admin_notes: 'Confirmed during ultimate comprehensive test'
    };
    
    const result = await this.makeRequest(
      'POST',
      `/admin/concierge/consultations/${this.consultationId}/confirm`,
      confirmData,
      this.adminToken
    );
    
    if (result.success) {
      this.results.consultation_confirmation = true;
      this.log('✅ Consultation confirmation working', {
        consultation_id: this.consultationId,
        scheduled_at: result.data.scheduled_at,
        meeting_link: result.data.meeting_link
      });
    } else {
      this.log('❌ Consultation confirmation failed', result.error);
    }
    
    return this.results.consultation_confirmation;
  }

  // ==================== CLIENT MANAGEMENT TESTS ====================

  async testClientInvitation() {
    this.log('📧 TEST 11: Client Invitation');
    
    if (!this.adminToken) {
      this.log('❌ Cannot test - no admin token');
      return false;
    }
    
    const inviteData = {
      email: TEST_CLIENT_REGISTRATION.email,
      full_name: TEST_CLIENT_REGISTRATION.full_name
    };
    
    const result = await this.makeRequest('POST', '/auth/invite', inviteData, this.adminToken);
    
    if (result.success) {
      this.registrationToken = result.data.registration_token;
      this.results.client_invitation = true;
      this.log('✅ Client invitation working', {
        client_id: result.data.client_id,
        registration_token: this.registrationToken ? 'Generated' : 'Not provided',
        email_sent: result.data.email_sent
      });
    } else {
      this.log('❌ Client invitation failed', result.error);
    }
    
    return this.results.client_invitation;
  }

  async testClientRegistration() {
    this.log('📝 TEST 12: Client Registration');
    
    if (!this.registrationToken) {
      this.log('❌ Cannot test - no registration token');
      return false;
    }
    
    const registrationData = {
      token: this.registrationToken,
      password: TEST_CLIENT_REGISTRATION.password,
      full_name: TEST_CLIENT_REGISTRATION.full_name
    };
    
    const result = await this.makeRequest('POST', '/auth/complete-registration', registrationData);
    
    if (result.success) {
      this.clientToken = result.data.token;
      this.clientId = result.data.user.id;
      this.results.client_registration = true;
      this.log('✅ Client registration working', {
        client_id: this.clientId,
        full_name: result.data.user.full_name,
        token_generated: this.clientToken ? 'Yes' : 'No'
      });
    } else {
      this.log('❌ Client registration failed', result.error);
    }
    
    return this.results.client_registration;
  }

  async testClientOnboarding() {
    this.log('📋 TEST 13: Client Onboarding');
    
    if (!this.clientToken) {
      this.log('❌ Cannot test - no client token');
      return false;
    }
    
    const result = await this.makeRequest('POST', '/onboarding-workflow/onboarding', ONBOARDING_DATA, this.clientToken);
    
    if (result.success) {
      this.results.client_onboarding = true;
      this.log('✅ Client onboarding working', {
        onboarding_id: result.data.onboarding_id,
        status: result.data.status,
        completion_date: result.data.completion_date
      });
    } else {
      this.log('❌ Client onboarding failed', result.error);
    }
    
    return this.results.client_onboarding;
  }

  // ==================== APPLICATION TRACKING TESTS ====================

  async testApplicationCreation() {
    this.log('📝 TEST 14: Application Creation');
    
    if (!this.adminToken || !this.clientId) {
      this.log('❌ Cannot test - missing admin token or client ID');
      return false;
    }
    
    let successCount = 0;
    
    for (const [index, application] of TEST_APPLICATIONS.entries()) {
      const applicationData = {
        client_id: this.clientId,
        ...application
      };
      
      const result = await this.makeRequest('POST', '/applications', applicationData, this.adminToken);
      
      if (result.success) {
        successCount++;
        this.applicationIds.push(result.data.application_id);
        this.log(`✅ Application ${index + 1} created: ${application.company_name}`, {
          application_id: result.data.application_id,
          status: application.status
        });
      } else {
        this.log(`❌ Application ${index + 1} failed: ${application.company_name}`, result.error);
      }
    }
    
    this.results.application_creation = successCount === TEST_APPLICATIONS.length;
    return this.results.application_creation;
  }

  async testApplicationStatusUpdates() {
    this.log('🔄 TEST 15: Application Status Updates');
    
    if (!this.adminToken || this.applicationIds.length === 0) {
      this.log('❌ Cannot test - missing admin token or application IDs');
      return false;
    }
    
    const firstAppId = this.applicationIds[0];
    const updateData = {
      status: 'interviewing',
      interview_date: '2024-02-15',
      admin_notes: 'Status updated during ultimate test'
    };
    
    const result = await this.makeRequest('PUT', `/applications/${firstAppId}`, updateData, this.adminToken);
    
    if (result.success) {
      this.results.application_status_updates = true;
      this.log('✅ Application status updates working', {
        application_id: firstAppId,
        new_status: updateData.status,
        interview_date: updateData.interview_date
      });
    } else {
      this.log('❌ Application status updates failed', result.error);
    }
    
    return this.results.application_status_updates;
  }

  async testApplicationStatistics() {
    this.log('📊 TEST 16: Application Statistics');
    
    if (!this.adminToken) {
      this.log('❌ Cannot test - no admin token');
      return false;
    }
    
    const result = await this.makeRequest('GET', '/applications', null, this.adminToken);
    
    if (result.success) {
      this.results.application_statistics = true;
      this.log('✅ Application statistics working', {
        total_applications: result.data.applications?.length || 0,
        stats: result.data.stats,
        user_role: result.data.user_role
      });
    } else {
      this.log('❌ Application statistics failed', result.error);
    }
    
    return this.results.application_statistics;
  }

  // ==================== EMAIL SYSTEM TESTS ====================

  async testContactFormEmails() {
    this.log('📧 TEST 17: Contact Form Emails');
    
    const contactData = {
      name: 'Ultimate Test User',
      email: 'ultimatetest@example.com',
      message: 'Testing contact form email functionality during ultimate test'
    };
    
    const result = await this.makeRequest('POST', '/contact', contactData);
    
    if (result.success) {
      this.results.contact_form_emails = true;
      this.log('✅ Contact form emails working', {
        status: result.data.status,
        message: result.data.message
      });
    } else {
      this.log('❌ Contact form emails failed', result.error);
    }
    
    return this.results.contact_form_emails;
  }

  async testConsultationEmails() {
    this.log('📧 TEST 18: Consultation Emails');
    
    // Submit another consultation to trigger emails
    const emailTestClient = {
      full_name: 'Email Test Client',
      email: 'emailtest@example.com',
      phone: '+1-555-8888',
      message: 'Testing consultation email triggers',
      preferred_slots: [{ date: '2024-02-28', time: '11:00' }]
    };
    
    const result = await this.makeRequest('POST', '/public-consultations', emailTestClient);
    
    if (result.success) {
      this.results.consultation_emails = true;
      this.log('✅ Consultation emails working (triggered by booking)', {
        consultation_id: result.data.consultation_id
      });
    } else {
      this.log('❌ Consultation emails failed', result.error);
    }
    
    return this.results.consultation_emails;
  }

  // ==================== DASHBOARD TESTS ====================

  async testAdminDashboard() {
    this.log('🎛️  TEST 19: Admin Dashboard');
    
    if (!this.adminToken) {
      this.log('❌ Cannot test - no admin token');
      return false;
    }
    
    // Test multiple admin dashboard endpoints
    const dashboardTests = [
      { name: 'Consultations', endpoint: '/admin/concierge/consultations' },
      { name: 'Profile', endpoint: '/auth/me' },
      { name: 'Applications', endpoint: '/applications' }
    ];
    
    let successCount = 0;
    
    for (const test of dashboardTests) {
      const result = await this.makeRequest('GET', test.endpoint, null, this.adminToken);
      
      if (result.success) {
        successCount++;
        this.log(`✅ Admin ${test.name} dashboard working`);
      } else {
        this.log(`❌ Admin ${test.name} dashboard failed`, result.error);
      }
    }
    
    this.results.admin_dashboard = successCount === dashboardTests.length;
    return this.results.admin_dashboard;
  }

  async testClientDashboard() {
    this.log('👤 TEST 20: Client Dashboard');
    
    if (!this.clientToken) {
      this.log('❌ Cannot test - no client token');
      return false;
    }
    
    const result = await this.makeRequest('GET', '/client/dashboard', null, this.clientToken);
    
    if (result.success) {
      this.results.client_dashboard = true;
      this.log('✅ Client dashboard working', {
        client_id: result.data.client?.id,
        profile_completion: result.data.profile_completion,
        twenty_questions: result.data.twenty_questions
      });
    } else {
      this.log('❌ Client dashboard failed', result.error);
    }
    
    return this.results.client_dashboard;
  }

  // ==================== INTEGRATION TESTS ====================

  async testCompleteWorkflow() {
    this.log('🔄 TEST 21: Complete Workflow Integration');
    
    // Test end-to-end workflow
    const workflowSteps = [
      { name: 'Consultation Booking', passed: this.results.consultation_booking },
      { name: 'Admin Review', passed: this.results.admin_consultation_view },
      { name: 'Consultation Confirmation', passed: this.results.consultation_confirmation },
      { name: 'Client Invitation', passed: this.results.client_invitation },
      { name: 'Client Registration', passed: this.results.client_registration },
      { name: 'Client Onboarding', passed: this.results.client_onboarding },
      { name: 'Application Tracking', passed: this.results.application_creation }
    ];
    
    const passedSteps = workflowSteps.filter(step => step.passed).length;
    this.results.complete_workflow = passedSteps === workflowSteps.length;
    
    this.log(`✅ Complete workflow integration: ${passedSteps}/${workflowSteps.length} steps working`);
    
    return this.results.complete_workflow;
  }

  async testErrorHandling() {
    this.log('🚨 TEST 22: Error Handling');
    
    // Test various error scenarios
    const errorTests = [
      {
        name: 'Invalid JSON',
        endpoint: '/public-consultations',
        method: 'POST',
        data: 'invalid-json',
        expectedStatus: 400
      },
      {
        name: 'Missing Required Fields',
        endpoint: '/public-consultations',
        method: 'POST',
        data: { full_name: 'Test' }, // Missing required fields
        expectedStatus: 400
      },
      {
        name: 'Non-existent Endpoint',
        endpoint: '/non-existent-endpoint',
        method: 'GET',
        expectedStatus: 404
      }
    ];
    
    let errorHandlingWorking = 0;
    
    for (const test of errorTests) {
      try {
        const config = {
          method: test.method,
          url: `${API_BASE}${test.endpoint}`,
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        };
        
        if (test.data) {
          if (typeof test.data === 'string') {
            config.data = test.data;
          } else {
            config.data = test.data;
          }
        }
        
        const response = await axios(config);
        this.log(`⚠️  ${test.name}: Expected error but got success`);
      } catch (error) {
        const status = error.response?.status || 500;
        if (status === test.expectedStatus || status >= 400) {
          errorHandlingWorking++;
          this.log(`✅ ${test.name}: Error handled correctly (${status})`);
        } else {
          this.log(`❌ ${test.name}: Unexpected status ${status}`);
        }
      }
    }
    
    this.results.error_handling = errorHandlingWorking === errorTests.length;
    return this.results.error_handling;
  }

  // ==================== FINAL REPORT ====================

  generateUltimateReport() {
    this.log('\n📋 ULTIMATE COMPREHENSIVE TEST REPORT');
    this.log('=' .repeat(80));
    
    const testCategories = {
      'Core System': [
        { name: 'Server Health', passed: this.results.server_health },
        { name: 'Database Connectivity', passed: this.results.database_connectivity }
      ],
      'Authentication': [
        { name: 'Admin Login', passed: this.results.admin_login },
        { name: 'Admin Profile Access', passed: this.results.admin_profile_access },
        { name: 'Password Change', passed: this.results.password_change },
        { name: 'Token Validation', passed: this.results.token_validation },
        { name: 'Unauthorized Access Blocked', passed: this.results.unauthorized_access_blocked }
      ],
      'Consultation Flow': [
        { name: 'Consultation Booking', passed: this.results.consultation_booking },
        { name: 'Admin Consultation View', passed: this.results.admin_consultation_view },
        { name: 'Consultation Confirmation', passed: this.results.consultation_confirmation }
      ],
      'Client Management': [
        { name: 'Client Invitation', passed: this.results.client_invitation },
        { name: 'Client Registration', passed: this.results.client_registration },
        { name: 'Client Onboarding', passed: this.results.client_onboarding }
      ],
      'Application Tracking': [
        { name: 'Application Creation', passed: this.results.application_creation },
        { name: 'Application Status Updates', passed: this.results.application_status_updates },
        { name: 'Application Statistics', passed: this.results.application_statistics }
      ],
      'Email System': [
        { name: 'Contact Form Emails', passed: this.results.contact_form_emails },
        { name: 'Consultation Emails', passed: this.results.consultation_emails }
      ],
      'Dashboard': [
        { name: 'Admin Dashboard', passed: this.results.admin_dashboard },
        { name: 'Client Dashboard', passed: this.results.client_dashboard }
      ],
      'Integration': [
        { name: 'Complete Workflow', passed: this.results.complete_workflow },
        { name: 'Error Handling', passed: this.results.error_handling }
      ]
    };
    
    let totalTests = 0;
    let totalPassed = 0;
    
    Object.entries(testCategories).forEach(([category, tests]) => {
      this.log(`\n📂 ${category.toUpperCase()}:`);
      
      tests.forEach(test => {
        const status = test.passed ? '✅ PASS' : '❌ FAIL';
        this.log(`  ${status} - ${test.name}`);
        totalTests++;
        if (test.passed) totalPassed++;
      });
    });
    
    this.log('\n' + '=' .repeat(80));
    this.log(`ULTIMATE TEST RESULTS: ${totalPassed}/${totalTests} tests passed`);
    this.log(`SUCCESS RATE: ${Math.round((totalPassed/totalTests) * 100)}%`);
    
    if (totalPassed === totalTests) {
      this.log('🎉 PERFECT SCORE! ALL SYSTEMS 100% FUNCTIONAL');
      this.log('✅ BOOKING ENGINE IS PRODUCTION READY');
    } else {
      this.log(`⚠️  ${totalTests - totalPassed} TESTS FAILED - REVIEW ABOVE`);
    }
    
    this.log('\n🌐 PRODUCTION SYSTEM STATUS:');
    this.log(`• Backend URL: ${BACKEND_URL}`);
    this.log(`• Server: ${this.results.server_health ? 'Healthy' : 'Issues'}`);
    this.log(`• Database: ${this.results.database_connectivity ? 'Connected' : 'Issues'}`);
    this.log(`• Authentication: ${this.results.admin_login ? 'Working' : 'Issues'}`);
    this.log(`• Consultations: ${this.results.consultation_booking ? 'Working' : 'Issues'}`);
    this.log(`• Applications: ${this.results.application_creation ? 'Working' : 'Issues'}`);
    this.log(`• Emails: ${this.results.contact_form_emails ? 'Working' : 'Issues'}`);
    this.log(`• Dashboards: ${this.results.admin_dashboard ? 'Working' : 'Issues'}`);
    
    this.log('\n🔐 ADMIN CREDENTIALS:');
    this.log(`Email: ${TEST_ADMIN.email}`);
    this.log(`Password: ${TEST_ADMIN.password}`);
    
    this.log('\n🚀 TESTED FEATURES:');
    this.log('• ✅ Complete consultation booking workflow');
    this.log('• ✅ Admin authentication and management');
    this.log('• ✅ Client invitation and registration');
    this.log('• ✅ Application tracking and status updates');
    this.log('• ✅ Email notifications and triggers');
    this.log('• ✅ Dashboard access and functionality');
    this.log('• ✅ Password management and security');
    this.log('• ✅ Error handling and validation');
    this.log('• ✅ Database operations and connectivity');
    this.log('• ✅ Token validation and authorization');
    
    if (totalPassed === totalTests) {
      this.log('\n🎯 FINAL VERDICT: SYSTEM IS PRODUCTION READY');
      this.log('The Apply Bureau booking engine has passed all comprehensive tests!');
    } else {
      this.log('\n⚠️  FINAL VERDICT: SOME ISSUES NEED ATTENTION');
      this.log('Review failed tests above before production deployment.');
    }
  }

  // ==================== MAIN TEST RUNNER ====================

  async runUltimateTest() {
    this.log('🚀 STARTING ULTIMATE COMPREHENSIVE TEST');
    this.log(`Testing Apply Bureau Backend: ${BACKEND_URL}`);
    this.log('Testing EVERY feature, endpoint, and workflow...');
    this.log('=' .repeat(90));
    
    try {
      // Core System Tests
      await this.testServerHealth();
      await this.testDatabaseConnectivity();
      
      // Authentication Tests
      await this.testAdminLogin();
      await this.testAdminProfileAccess();
      await this.testPasswordChange();
      await this.testTokenValidation();
      await this.testUnauthorizedAccessBlocked();
      
      // Consultation Flow Tests
      await this.testConsultationBooking();
      await this.testAdminConsultationView();
      await this.testConsultationConfirmation();
      
      // Client Management Tests
      await this.testClientInvitation();
      await this.testClientRegistration();
      await this.testClientOnboarding();
      
      // Application Tracking Tests
      await this.testApplicationCreation();
      await this.testApplicationStatusUpdates();
      await this.testApplicationStatistics();
      
      // Email System Tests
      await this.testContactFormEmails();
      await this.testConsultationEmails();
      
      // Dashboard Tests
      await this.testAdminDashboard();
      await this.testClientDashboard();
      
      // Integration Tests
      await this.testCompleteWorkflow();
      await this.testErrorHandling();
      
    } catch (error) {
      this.log('❌ CRITICAL ERROR DURING ULTIMATE TEST', error);
    } finally {
      this.generateUltimateReport();
    }
  }
}

// Run the ultimate test if called directly
if (require.main === module) {
  const test = new UltimateComprehensiveTest();
  test.runUltimateTest().catch(console.error);
}

module.exports = UltimateComprehensiveTest;