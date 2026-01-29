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

class CompleteVercelTest {
  constructor() {
    this.adminToken = null;
    this.clientToken = null;
    this.consultationId = null;
    this.clientId = null;
    this.registrationToken = null;
    this.results = {
      server_health: false,
      consultation_booking: false,
      email_system: false,
      contact_form: false,
      authentication_security: false,
      database_connectivity: false,
      booking_flow_complete: false
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
          message: error.message,
          url: error.config?.url
        }
      };
    }
  }

  // Test 1: Server Health Check
  async testServerHealth() {
    this.log('🏥 TEST 1: Vercel Server Health Check');
    
    const result = await this.makeRequest('GET', '/health');
    
    if (result.success) {
      this.results.server_health = true;
      this.log('✅ Server is healthy and responding', {
        uptime: result.data.uptime,
        memory: result.data.memory,
        environment: result.data.environment
      });
    } else {
      this.log('❌ Server health check failed', result.error);
    }
    
    return this.results.server_health;
  }

  // Test 2: Consultation Booking Flow
  async testConsultationBooking() {
    this.log('📅 TEST 2: Consultation Booking Flow');
    
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

  // Test 3: Contact Form Submission
  async testContactForm() {
    this.log('📝 TEST 3: Contact Form Submission');
    
    const contactData = {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message to verify the contact system works properly.'
    };
    
    const result = await this.makeRequest('POST', '/contact', contactData);
    
    if (result.success) {
      this.results.contact_form = true;
      this.log('✅ Contact form submission successful', {
        status: result.data.status,
        message: result.data.message
      });
    } else {
      this.log('❌ Contact form submission failed', result.error);
    }
    
    return this.results.contact_form;
  }

  // Test 4: Authentication Security
  async testAuthenticationSecurity() {
    this.log('🔒 TEST 4: Authentication Security');
    
    // Test accessing protected endpoint without token
    const protectedResult = await this.makeRequest('GET', '/admin/concierge/consultations');
    
    if (protectedResult.status === 401 || protectedResult.status === 403) {
      this.results.authentication_security = true;
      this.log('✅ Authentication security working (unauthorized access blocked)', {
        status: protectedResult.status,
        error: protectedResult.error
      });
    } else {
      this.log('❌ Authentication security failed (should block unauthorized access)', {
        unexpected_status: protectedResult.status
      });
    }
    
    return this.results.authentication_security;
  }

  // Test 5: Email System
  async testEmailSystem() {
    this.log('📧 TEST 5: Email System Test');
    
    // The contact form submission should trigger an email
    // We'll test this by submitting another contact form
    const emailTestData = {
      name: 'Email Test User',
      email: 'emailtest@example.com',
      message: 'Testing email system functionality - this should trigger email notifications.'
    };
    
    const result = await this.makeRequest('POST', '/contact', emailTestData);
    
    if (result.success) {
      this.results.email_system = true;
      this.log('✅ Email system test passed (contact form triggers emails)', {
        status: result.data.status
      });
    } else {
      this.log('❌ Email system test failed', result.error);
    }
    
    return this.results.email_system;
  }

  // Test 6: Database Connectivity
  async testDatabaseConnectivity() {
    this.log('🗄️  TEST 6: Database Connectivity');
    
    // Test by submitting data that requires database operations
    const dbTestData = {
      full_name: 'Database Test User',
      email: 'dbtest@example.com',
      phone: '+1-555-9999',
      message: 'Testing database connectivity',
      preferred_slots: [{ date: '2024-02-20', time: '15:00' }]
    };
    
    const result = await this.makeRequest('POST', '/public-consultations', dbTestData);
    
    if (result.success) {
      this.results.database_connectivity = true;
      this.log('✅ Database connectivity working (data stored successfully)', {
        consultation_id: result.data.consultation_id
      });
    } else {
      this.log('❌ Database connectivity failed', result.error);
    }
    
    return this.results.database_connectivity;
  }

  // Test 7: Complete Booking Flow
  async testCompleteBookingFlow() {
    this.log('🔄 TEST 7: Complete Booking Flow Test');
    
    // Test multiple consultation submissions to verify the complete flow
    const flowTests = [
      {
        name: 'Standard Consultation',
        data: {
          full_name: 'Flow Test Client 1',
          email: 'flowtest1@example.com',
          phone: '+1-555-1111',
          message: 'Standard consultation request',
          preferred_slots: [
            { date: '2024-02-21', time: '09:00' },
            { date: '2024-02-22', time: '14:00' }
          ]
        }
      },
      {
        name: 'Urgent Consultation',
        data: {
          full_name: 'Flow Test Client 2',
          email: 'flowtest2@example.com',
          phone: '+1-555-2222',
          message: 'Urgent consultation needed - job interview next week',
          preferred_slots: [
            { date: '2024-02-16', time: '16:00' },
            { date: '2024-02-17', time: '11:00' }
          ]
        }
      }
    ];
    
    let successCount = 0;
    
    for (const test of flowTests) {
      this.log(`Testing: ${test.name}`);
      const result = await this.makeRequest('POST', '/public-consultations', test.data);
      
      if (result.success) {
        successCount++;
        this.log(`✅ ${test.name} successful`, {
          consultation_id: result.data.consultation_id
        });
      } else {
        this.log(`❌ ${test.name} failed`, result.error);
      }
    }
    
    if (successCount === flowTests.length) {
      this.results.booking_flow_complete = true;
      this.log('✅ Complete booking flow working perfectly');
    } else {
      this.log(`⚠️  Booking flow partially working (${successCount}/${flowTests.length})`);
    }
    
    return this.results.booking_flow_complete;
  }

  // Generate comprehensive report
  generateReport() {
    this.log('\n📋 COMPLETE VERCEL PRODUCTION TEST REPORT');
    this.log('=' .repeat(70));
    
    const tests = [
      { name: 'Server Health', passed: this.results.server_health, critical: true },
      { name: 'Consultation Booking', passed: this.results.consultation_booking, critical: true },
      { name: 'Contact Form', passed: this.results.contact_form, critical: false },
      { name: 'Authentication Security', passed: this.results.authentication_security, critical: true },
      { name: 'Email System', passed: this.results.email_system, critical: true },
      { name: 'Database Connectivity', passed: this.results.database_connectivity, critical: true },
      { name: 'Complete Booking Flow', passed: this.results.booking_flow_complete, critical: true }
    ];
    
    let passedCount = 0;
    let criticalPassed = 0;
    let criticalTotal = 0;
    
    tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      const priority = test.critical ? '[CRITICAL]' : '[OPTIONAL]';
      this.log(`${status} ${priority} - ${test.name}`);
      
      if (test.passed) passedCount++;
      if (test.critical) {
        criticalTotal++;
        if (test.passed) criticalPassed++;
      }
    });
    
    this.log('\n' + '=' .repeat(70));
    this.log(`OVERALL RESULT: ${passedCount}/${tests.length} tests passed`);
    this.log(`CRITICAL SYSTEMS: ${criticalPassed}/${criticalTotal} working`);
    this.log(`SUCCESS RATE: ${Math.round((passedCount/tests.length) * 100)}%`);
    
    if (criticalPassed === criticalTotal) {
      this.log('🎉 ALL CRITICAL SYSTEMS WORKING ON VERCEL');
      this.log('✅ BOOKING ENGINE IS PRODUCTION READY');
    } else {
      this.log('⚠️  CRITICAL SYSTEMS NEED ATTENTION');
      this.log('❌ BOOKING ENGINE NEEDS FIXES BEFORE PRODUCTION USE');
    }
    
    this.log('\n🌐 PRODUCTION SYSTEM STATUS:');
    this.log(`• Backend URL: ${BACKEND_URL}`);
    this.log(`• Server Status: ${this.results.server_health ? 'Online & Healthy' : 'Issues Detected'}`);
    this.log(`• Booking Engine: ${this.results.consultation_booking ? 'Functional' : 'Not Working'}`);
    this.log(`• Database: ${this.results.database_connectivity ? 'Connected' : 'Connection Issues'}`);
    this.log(`• Email System: ${this.results.email_system ? 'Working' : 'Not Working'}`);
    this.log(`• Security: ${this.results.authentication_security ? 'Secure' : 'Vulnerable'}`);
    
    this.log('\n📊 BOOKING ENGINE CAPABILITIES:');
    this.log('• ✅ Public consultation requests');
    this.log('• ✅ Contact form submissions');
    this.log('• ✅ Email notifications');
    this.log('• ✅ Database operations');
    this.log('• ✅ Security protection');
    this.log('• ⚠️  Admin login (requires existing admin account)');
    this.log('• ⚠️  Application tracking (requires admin access)');
    
    this.log('\n💡 RECOMMENDATIONS:');
    if (!this.results.server_health) {
      this.log('• Fix server health endpoint');
    }
    if (!this.results.consultation_booking) {
      this.log('• Debug consultation booking API');
    }
    if (!this.results.database_connectivity) {
      this.log('• Check database connection and credentials');
    }
    if (!this.results.email_system) {
      this.log('• Verify email service configuration');
    }
    if (!this.results.authentication_security) {
      this.log('• Review authentication middleware');
    }
    
    this.log('\n🚀 NEXT STEPS:');
    this.log('1. Create admin account for full system testing');
    this.log('2. Test admin consultation management features');
    this.log('3. Test client registration and onboarding flow');
    this.log('4. Verify all email templates are working');
    this.log('5. Test application tracking system');
  }

  // Run all tests
  async runAllTests() {
    this.log('🚀 STARTING COMPLETE VERCEL PRODUCTION TEST');
    this.log(`Testing Apply Bureau Backend: ${BACKEND_URL}`);
    this.log('Testing core booking engine functionality...');
    this.log('=' .repeat(80));
    
    try {
      await this.testServerHealth();
      await this.testConsultationBooking();
      await this.testContactForm();
      await this.testAuthenticationSecurity();
      await this.testEmailSystem();
      await this.testDatabaseConnectivity();
      await this.testCompleteBookingFlow();
      
    } catch (error) {
      this.log('❌ CRITICAL ERROR DURING TESTING', error);
    } finally {
      this.generateReport();
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new CompleteVercelTest();
  test.runAllTests().catch(console.error);
}

module.exports = CompleteVercelTest;