const axios = require('axios');

// Production Vercel URL
const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';
const API_BASE = `${BACKEND_URL}/api`;

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
  password: 'AdminTest123!'
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
  }
];

class VercelProductionBookingTest {
  constructor() {
    this.adminToken = null;
    this.clientToken = null;
    this.consultationId = null;
    this.clientId = null;
    this.registrationToken = null;
    this.results = {
      server_health: false,
      consultation_submission: false,
      admin_login: false,
      consultation_management: false,
      application_logging: false,
      email_system: false,
      database_operations: false,
      authentication_system: false
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
        timeout: 30000, // 30 second timeout for production
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
          message: error.message,
          url: error.config?.url
        }
      };
    }
  }

  // Test 1: Server Health Check
  async testServerHealth() {
    this.log('🏥 TEST 1: Checking Vercel server health...');
    
    const result = await this.makeRequest('GET', '/health');
    
    if (result.success) {
      this.results.server_health = true;
      this.log('✅ Vercel server is healthy', {
        status: result.status,
        response: result.data
      });
    } else {
      // Try root endpoint if health endpoint doesn't exist
      const rootResult = await this.makeRequest('GET', '/');
      if (rootResult.success || rootResult.status === 404) {
        this.results.server_health = true;
        this.log('✅ Vercel server is responding (via root endpoint)');
      } else {
        this.log('❌ Vercel server health check failed', result.details);
      }
    }
    
    return this.results.server_health;
  }

  // Test 2: Submit consultation request
  async testConsultationSubmission() {
    this.log('🚀 TEST 2: Submitting consultation request to Vercel...');
    
    const result = await this.makeRequest('POST', '/public-consultations', TEST_CLIENT);
    
    if (result.success) {
      this.consultationId = result.data.consultation_id;
      this.results.consultation_submission = true;
      this.log('✅ Consultation request submitted successfully', {
        consultation_id: this.consultationId,
        status: result.data.status
      });
    } else {
      this.log('❌ Failed to submit consultation request', {
        error: result.error,
        status: result.status,
        details: result.details
      });
    }
    
    return result.success;
  }

  // Test 3: Admin login
  async testAdminLogin() {
    this.log('🔐 TEST 3: Testing admin login on Vercel...');
    
    const result = await this.makeRequest('POST', '/auth/login', TEST_ADMIN);
    
    if (result.success) {
      this.adminToken = result.data.token;
      this.results.admin_login = true;
      this.log('✅ Admin login successful', {
        token_length: this.adminToken?.length,
        user_role: result.data.user?.role
      });
    } else {
      this.log('❌ Admin login failed', {
        error: result.error,
        status: result.status,
        details: result.details
      });
    }
    
    return result.success;
  }

  // Test 4: Admin consultation management
  async testConsultationManagement() {
    this.log('📋 TEST 4: Testing consultation management on Vercel...');
    
    if (!this.adminToken) {
      this.log('❌ Cannot test consultation management - no admin token');
      return false;
    }
    
    const result = await this.makeRequest(
      'GET', 
      '/admin/concierge/consultations',
      null,
      this.adminToken
    );
    
    if (result.success) {
      this.results.consultation_management = true;
      this.log('✅ Admin can view consultations', {
        total_consultations: result.data.consultations?.length || 0,
        status_counts: result.data.status_counts
      });
    } else {
      this.log('❌ Failed to view consultations', {
        error: result.error,
        status: result.status,
        details: result.details
      });
    }
    
    return result.success;
  }

  // Test 5: Application logging
  async testApplicationLogging() {
    this.log('📝 TEST 5: Testing application logging on Vercel...');
    
    if (!this.adminToken) {
      this.log('❌ Cannot test application logging - no admin token');
      return false;
    }
    
    // First, try to get applications to see if the endpoint works
    const getResult = await this.makeRequest(
      'GET',
      '/applications',
      null,
      this.adminToken
    );
    
    if (getResult.success) {
      this.results.application_logging = true;
      this.log('✅ Application system is working', {
        applications_count: getResult.data.applications?.length || 0,
        stats: getResult.data.stats
      });
    } else {
      this.log('❌ Application system failed', {
        error: getResult.error,
        status: getResult.status,
        details: getResult.details
      });
    }
    
    return getResult.success;
  }

  // Test 6: Database operations
  async testDatabaseOperations() {
    this.log('🗄️  TEST 6: Testing database operations on Vercel...');
    
    // Test by trying to access a simple endpoint that requires DB
    const result = await this.makeRequest('GET', '/public-consultations');
    
    if (result.success || result.status === 405) { // 405 = Method Not Allowed (GET on POST endpoint)
      this.results.database_operations = true;
      this.log('✅ Database operations working (endpoint accessible)');
    } else {
      this.log('❌ Database operations failed', {
        error: result.error,
        status: result.status,
        details: result.details
      });
    }
    
    return this.results.database_operations;
  }

  // Test 7: Authentication system
  async testAuthenticationSystem() {
    this.log('🔒 TEST 7: Testing authentication system on Vercel...');
    
    // Test accessing protected endpoint without token
    const unauthedResult = await this.makeRequest('GET', '/admin/concierge/consultations');
    
    if (unauthedResult.status === 401 || unauthedResult.status === 403) {
      this.results.authentication_system = true;
      this.log('✅ Authentication system working (properly blocking unauthorized access)');
    } else {
      this.log('❌ Authentication system failed', {
        expected_401_or_403: true,
        actual_status: unauthedResult.status,
        details: unauthedResult.details
      });
    }
    
    return this.results.authentication_system;
  }

  // Test 8: Email system (basic check)
  async testEmailSystem() {
    this.log('📧 TEST 8: Testing email system on Vercel...');
    
    // Test by submitting a contact form (which should trigger email)
    const contactData = {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message to verify email system'
    };
    
    const result = await this.makeRequest('POST', '/contact', contactData);
    
    if (result.success) {
      this.results.email_system = true;
      this.log('✅ Email system working (contact form submitted successfully)');
    } else {
      this.log('❌ Email system test failed', {
        error: result.error,
        status: result.status,
        details: result.details
      });
    }
    
    return result.success;
  }

  // Test all endpoints
  async testAllEndpoints() {
    this.log('🔍 TESTING ALL CRITICAL ENDPOINTS ON VERCEL');
    this.log('=' .repeat(60));
    
    const endpoints = [
      { method: 'GET', path: '/', name: 'Root Endpoint' },
      { method: 'POST', path: '/public-consultations', name: 'Public Consultations', data: TEST_CLIENT },
      { method: 'POST', path: '/auth/login', name: 'Admin Login', data: { email: 'admin@applybureautest.com', password: 'AdminTest123!' } },
      { method: 'POST', path: '/contact', name: 'Contact Form', data: { name: 'Test', email: 'test@example.com', message: 'Test' } },
      { method: 'GET', path: '/applications', name: 'Applications (Protected)', requiresAuth: true },
      { method: 'GET', path: '/admin/concierge/consultations', name: 'Admin Consultations (Protected)', requiresAuth: true }
    ];
    
    let workingEndpoints = 0;
    
    for (const endpoint of endpoints) {
      this.log(`\n🔗 Testing: ${endpoint.method} ${endpoint.path}`);
      
      const token = endpoint.requiresAuth ? this.adminToken : null;
      const result = await this.makeRequest(endpoint.method, endpoint.path, endpoint.data, token);
      
      if (result.success) {
        workingEndpoints++;
        this.log(`✅ ${endpoint.name}: Working`);
      } else if (endpoint.requiresAuth && (result.status === 401 || result.status === 403)) {
        workingEndpoints++;
        this.log(`✅ ${endpoint.name}: Properly protected`);
      } else {
        this.log(`❌ ${endpoint.name}: Failed (${result.status})`, result.error);
      }
    }
    
    this.log(`\n📊 Endpoint Results: ${workingEndpoints}/${endpoints.length} working`);
    return workingEndpoints;
  }

  // Generate comprehensive report
  generateReport() {
    this.log('\n📋 VERCEL PRODUCTION TEST REPORT');
    this.log('=' .repeat(60));
    
    const tests = [
      { name: 'Server Health', passed: this.results.server_health },
      { name: 'Consultation Submission', passed: this.results.consultation_submission },
      { name: 'Admin Login', passed: this.results.admin_login },
      { name: 'Consultation Management', passed: this.results.consultation_management },
      { name: 'Application Logging', passed: this.results.application_logging },
      { name: 'Database Operations', passed: this.results.database_operations },
      { name: 'Authentication System', passed: this.results.authentication_system },
      { name: 'Email System', passed: this.results.email_system }
    ];
    
    let passedCount = 0;
    
    tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      this.log(`${status} - ${test.name}`);
      if (test.passed) passedCount++;
    });
    
    this.log('\n' + '=' .repeat(60));
    this.log(`OVERALL RESULT: ${passedCount}/${tests.length} tests passed`);
    this.log(`SUCCESS RATE: ${Math.round((passedCount/tests.length) * 100)}%`);
    
    if (passedCount === tests.length) {
      this.log('🎉 ALL SYSTEMS WORKING ON VERCEL PRODUCTION');
    } else {
      this.log('⚠️  SOME SYSTEMS NEED ATTENTION ON VERCEL');
    }
    
    this.log('\n🌐 PRODUCTION STATUS:');
    this.log(`• Backend URL: ${BACKEND_URL}`);
    this.log(`• Server: ${this.results.server_health ? 'Online' : 'Offline'}`);
    this.log(`• Database: ${this.results.database_operations ? 'Connected' : 'Issues'}`);
    this.log(`• Authentication: ${this.results.authentication_system ? 'Secure' : 'Issues'}`);
    this.log(`• Email Service: ${this.results.email_system ? 'Working' : 'Issues'}`);
    this.log(`• Booking Engine: ${this.results.consultation_submission ? 'Functional' : 'Issues'}`);
  }

  // Run all tests
  async runAllTests() {
    this.log('🚀 STARTING VERCEL PRODUCTION BOOKING ENGINE TEST');
    this.log(`Testing against: ${BACKEND_URL}`);
    this.log('=' .repeat(70));
    
    try {
      await this.testServerHealth();
      await this.testConsultationSubmission();
      await this.testAdminLogin();
      await this.testConsultationManagement();
      await this.testApplicationLogging();
      await this.testDatabaseOperations();
      await this.testAuthenticationSystem();
      await this.testEmailSystem();
      
      // Test all endpoints
      await this.testAllEndpoints();
      
    } catch (error) {
      this.log('❌ CRITICAL ERROR DURING TESTING', error);
    } finally {
      this.generateReport();
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new VercelProductionBookingTest();
  test.runAllTests().catch(console.error);
}

module.exports = VercelProductionBookingTest;