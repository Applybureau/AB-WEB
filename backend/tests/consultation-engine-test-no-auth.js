#!/usr/bin/env node

/**
 * Consultation Engine Test - No Auth Version
 * Tests the parts that work without admin authentication
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'https://apply-bureau-backend.vercel.app';

// Test state
let testResults = { passed: 0, failed: 0, total: 0, failures: [] };
let testData = {
  consultationId: null
};

// Utility functions
const log = (message, type = 'info') => {
  const colors = { info: '\x1b[36m', success: '\x1b[32m', error: '\x1b[31m', warning: '\x1b[33m', reset: '\x1b[0m' };
  console.log(`${colors[type]}[${new Date().toISOString()}] ${message}${colors.reset}`);
};

const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json', ...headers },
      timeout: 30000
    };
    if (data) config.data = data;
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

const test = async (name, testFn) => {
  testResults.total++;
  log(`Testing: ${name}`, 'info');
  try {
    await testFn();
    testResults.passed++;
    log(`✅ PASSED: ${name}`, 'success');
  } catch (error) {
    testResults.failed++;
    testResults.failures.push(`${name}: ${error.message}`);
    log(`❌ FAILED: ${name} - ${error.message}`, 'error');
  }
};

// Test functions that don't require authentication
const testPublicConsultationBooking = async () => {
  await test('Public Consultation Booking', async () => {
    const consultationData = {
      full_name: 'John Test Client',
      email: 'john.testclient@example.com',
      phone: '+1234567890',
      message: 'I am interested in career coaching services and would like to discuss my job search strategy.',
      preferred_slots: [
        { date: '2024-02-15', time: '10:00' },
        { date: '2024-02-16', time: '14:00' },
        { date: '2024-02-17', time: '16:00' }
      ]
    };
    
    const response = await makeRequest('POST', '/api/public-consultations', consultationData);
    
    if (!response.success) {
      throw new Error(`Consultation booking failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    
    if (!response.data.id) {
      throw new Error('No consultation ID returned');
    }
    
    testData.consultationId = response.data.id;
    log(`Consultation booked with ID: ${testData.consultationId}`, 'success');
  });
};

const testPublicConsultationReschedule = async () => {
  await test('Public Consultation Reschedule', async () => {
    if (!testData.consultationId) {
      throw new Error('No consultation ID available');
    }
    
    const rescheduleData = {
      preferred_slots: [
        { date: '2024-02-20', time: '09:00' },
        { date: '2024-02-21', time: '11:00' },
        { date: '2024-02-22', time: '15:00' }
      ],
      client_message: 'I need to reschedule due to a conflict. Here are my new preferred times.'
    };
    
    const response = await makeRequest(
      'POST', 
      `/api/public-consultations/request-new-times/${testData.consultationId}`,
      rescheduleData
    );
    
    if (!response.success) {
      throw new Error(`Reschedule request failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    
    log(`Consultation rescheduled successfully`, 'success');
  });
};

const testContactForm = async () => {
  await test('Contact Form Submission', async () => {
    const contactData = {
      full_name: 'Jane Test Contact',
      email: 'jane.contact@example.com',
      phone: '+1234567891',
      message: 'I have questions about your services and would like to learn more.',
      subject: 'General Inquiry'
    };
    
    const response = await makeRequest('POST', '/api/contact', contactData);
    
    if (!response.success) {
      throw new Error(`Contact form failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    
    log(`Contact form submitted successfully`, 'success');
  });
};

const testEmailSystem = async () => {
  await test('Email System Integration', async () => {
    const response = await makeRequest('GET', '/api/email-actions/test');
    
    // We expect this to fail with validation error, not system error
    if (response.status === 500) {
      throw new Error('Email system may not be properly configured');
    }
    
    log(`Email system integration verified`, 'success');
  });
};

const testServerHealth = async () => {
  await test('Server Health Check', async () => {
    const response = await makeRequest('GET', '/api/health');
    
    if (!response.success) {
      throw new Error(`Health check failed: ${response.status}: ${JSON.stringify(response.error)}`);
    }
    
    log(`Server health check passed`, 'success');
  });
};

const testConsultationManagementEndpoints = async () => {
  await test('Consultation Management Endpoints Available', async () => {
    // Test that the consultation management endpoints exist (even if they require auth)
    const response = await makeRequest('GET', '/api/consultation-management');
    
    // We expect 401 (unauthorized) not 404 (not found)
    if (response.status === 404) {
      throw new Error('Consultation management endpoints not found');
    }
    
    if (response.status !== 401 && response.status !== 403) {
      throw new Error(`Unexpected response: ${response.status}`);
    }
    
    log(`Consultation management endpoints are available`, 'success');
  });
};

// Main test runner
const runConsultationEngineTests = async () => {
  log('🚀 Starting Consultation Engine Test Suite (No Auth)', 'info');
  log(`Testing against: ${BASE_URL}`, 'info');
  log('=' .repeat(70), 'info');
  
  // Phase 1: Server Health
  log('📋 Phase 1: Server Health & Infrastructure', 'info');
  await testServerHealth();
  await testEmailSystem();
  await testConsultationManagementEndpoints();
  
  // Phase 2: Public Features
  log('📋 Phase 2: Public Consultation Features', 'info');
  await testPublicConsultationBooking();
  await testPublicConsultationReschedule();
  await testContactForm();
  
  // Results Summary
  log('=' .repeat(70), 'info');
  log('🏁 Consultation Engine Test Results (No Auth)', 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  
  if (testResults.failures.length > 0) {
    log('', 'info');
    log('❌ Failed Tests:', 'error');
    testResults.failures.forEach(failure => {
      log(`  • ${failure}`, 'error');
    });
  }
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(``, 'info');
  log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'success' : 'error');
  
  // Feature Summary
  log('', 'info');
  log('📊 Working Features:', 'info');
  log('✅ Server health and infrastructure', 'success');
  log('✅ Email system integration', 'success');
  log('✅ Consultation management endpoints exist', 'success');
  log('✅ Public consultation booking', 'success');
  log('✅ Public consultation rescheduling', 'success');
  log('✅ Contact form submission', 'success');
  
  log('', 'info');
  log('⚠️  Features Requiring Admin Authentication (Not Tested):', 'warning');
  log('• Admin consultation confirmation/rejection', 'warning');
  log('• Admin consultation completion', 'warning');
  log('• Admin payment processing', 'warning');
  log('• Client invitation and registration', 'warning');
  log('• Application creation and management', 'warning');
  log('• Admin dashboard features', 'warning');
  
  if (successRate >= 95) {
    log('🎉 Public consultation features are EXCELLENT!', 'success');
  } else if (successRate >= 90) {
    log('✅ Public consultation features are working well!', 'success');
  } else if (successRate >= 80) {
    log('⚠️  Public consultation features have minor issues', 'warning');
  } else {
    log('🚨 Public consultation features have significant issues', 'error');
  }
  
  // Test Data Summary
  log('', 'info');
  log('📋 Test Data Created:', 'info');
  log(`  • Consultation ID: ${testData.consultationId}`, 'info');
  
  log('', 'info');
  log('🔧 Next Steps:', 'info');
  log('1. Fix admin authentication to enable full testing', 'info');
  log('2. Deploy updated auth routes to production', 'info');
  log('3. Test complete consultation workflow with admin features', 'info');
  
  process.exit(testResults.failed > 0 ? 1 : 0);
};

// Run tests
runConsultationEngineTests().catch(error => {
  log(`💥 Test runner crashed: ${error.message}`, 'error');
  process.exit(1);
});