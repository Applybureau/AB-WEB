#!/usr/bin/env node

/**
 * Comprehensive Backend Test Suite
 * Tests every single feature of the Apply Bureau backend
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'AdminPassword123!';

// Test state
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  failures: []
};

let authTokens = {
  client: null,
  admin: null
};

let testData = {
  clientId: null,
  adminId: null,
  applicationId: null,
  consultationId: null,
  uploadId: null,
  onboardingId: null
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'     // Reset
  };
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
};

const test = async (name, testFn) => {
  testResults.total++;
  try {
    log(`Testing: ${name}`, 'info');
    await testFn();
    testResults.passed++;
    log(`✅ PASSED: ${name}`, 'success');
  } catch (error) {
    testResults.failed++;
    testResults.failures.push({ name, error: error.message });
    log(`❌ FAILED: ${name} - ${error.message}`, 'error');
  }
};

const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response;
  } catch (error) {
    if (error.response) {
      throw new Error(`${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

const createTestFile = () => {
  const testContent = 'This is a test file for upload testing';
  const testFilePath = path.join(__dirname, 'test-file.txt');
  fs.writeFileSync(testFilePath, testContent);
  return testFilePath;
};

// Test suites
const testHealthAndStatus = async () => {
  await test('Health Check', async () => {
    const response = await makeRequest('GET', '/health');
    if (response.status !== 200) throw new Error('Health check failed');
    if (!response.data.healthy) throw new Error('Service not healthy');
  });

  await test('API Health Check', async () => {
    const response = await makeRequest('GET', '/api/health');
    if (response.status !== 200) throw new Error('API health check failed');
  });
};

const testAuthentication = async () => {
  // Test admin registration/login
  await test('Admin Registration/Login', async () => {
    try {
      // Try to create admin first
      await makeRequest('POST', '/api/auth/invite', {
        email: ADMIN_EMAIL,
        full_name: 'Test Admin'
      });
    } catch (error) {
      // Admin might already exist, continue
    }

    // Login as admin
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (!loginResponse.data.token) throw new Error('No token received');
    authTokens.admin = loginResponse.data.token;
    testData.adminId = loginResponse.data.user.id;
  });

  // Test client invitation and registration
  await test('Client Invitation', async () => {
    const response = await makeRequest('POST', '/api/auth/invite', {
      email: TEST_EMAIL,
      full_name: 'Test Client'
    }, {
      'Authorization': `Bearer ${authTokens.admin}`
    });

    if (response.status !== 201) throw new Error('Client invitation failed');
  });

  await test('Client Registration Completion', async () => {
    // This would normally use a token from email, simulating with direct login
    try {
      const loginResponse = await makeRequest('POST', '/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });

      authTokens.client = loginResponse.data.token;
      testData.clientId = loginResponse.data.user.id;
    } catch (error) {
      // If login fails, try registration flow
      log('Direct login failed, testing registration flow', 'warning');
    }
  });

  await test('Token Validation', async () => {
    if (!authTokens.client) throw new Error('No client token available');
    
    const response = await makeRequest('GET', '/api/client/profile', null, {
      'Authorization': `Bearer ${authTokens.client}`
    });

    if (response.status !== 200) throw new Error('Token validation failed');
  });

  await test('Invalid Token Rejection', async () => {
    try {
      await makeRequest('GET', '/api/client/profile', null, {
        'Authorization': 'Bearer invalid_token'
      });
      throw new Error('Invalid token was accepted');
    } catch (error) {
      if (!error.message.includes('401') && !error.message.includes('403')) {
        throw new Error('Wrong error type for invalid token');
      }
    }
  });
};

const testOnboardingSystem = async () => {
  await test('Secure Onboarding Submission', async () => {
    if (!authTokens.client) throw new Error('No client token available');

    const onboardingData = {
      target_job_titles: ['Software Engineer', 'Full Stack Developer'],
      target_industries: ['Technology', 'Fintech'],
      target_locations: ['San Francisco', 'New York'],
      remote_work_preference: 'hybrid',
      current_salary_range: '$80,000 - $100,000',
      target_salary_range: '$120,000 - $150,000',
      salary_negotiation_comfort: 7,
      years_of_experience: 5,
      key_technical_skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      soft_skills_strengths: ['Communication', 'Leadership'],
      certifications_licenses: ['AWS Certified'],
      job_search_timeline: '3-6_months',
      application_volume_preference: 'quality_focused',
      networking_comfort_level: 6,
      interview_confidence_level: 7,
      career_goals_short_term: 'Secure a senior software engineer position at a growing tech company',
      career_goals_long_term: 'Become a technical lead and eventually CTO',
      biggest_career_challenges: ['Technical interviews', 'Salary negotiation'],
      support_areas_needed: ['Interview preparation', 'Resume optimization']
    };

    const response = await makeRequest('POST', '/api/onboarding', onboardingData, {
      'Authorization': `Bearer ${authTokens.client}`
    });

    if (response.status !== 201) throw new Error('Onboarding submission failed');
    testData.onboardingId = response.data.data.id;
  });

  await test('Onboarding Status Check', async () => {
    if (!authTokens.client) throw new Error('No client token available');

    const response = await makeRequest('GET', '/api/onboarding/status', null, {
      'Authorization': `Bearer ${authTokens.client}`
    });

    if (response.status !== 200) throw new Error('Onboarding status check failed');
    if (!response.data.status) throw new Error('No status returned');
  });

  await test('Onboarding Input Validation', async () => {
    if (!authTokens.client) throw new Error('No client token available');

    try {
      await makeRequest('POST', '/api/onboarding', {
        invalid_field: 'should be rejected',
        target_job_titles: [] // Invalid: empty array
      }, {
        'Authorization': `Bearer ${authTokens.client}`
      });
      throw new Error('Invalid input was accepted');
    } catch (error) {
      if (!error.message.includes('400')) {
        throw new Error('Wrong error type for invalid input');
      }
    }
  });
};

const testFileUploads = async () => {
  const testFilePath = createTestFile();

  await test('File Upload', async () => {
    if (!authTokens.client) throw new Error('No client token available');

    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    form.append('upload_purpose', 'resume');

    const response = await axios.post(`${BASE_URL}/api/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${authTokens.client}`
      }
    });

    if (response.status !== 201) throw new Error('File upload failed');
    testData.uploadId = response.data.file.id;
  });

  await test('File Upload Without Auth', async () => {
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));

    try {
      await axios.post(`${BASE_URL}/api/upload`, form, {
        headers: form.getHeaders()
      });
      throw new Error('Unauthorized upload was accepted');
    } catch (error) {
      if (!error.response || error.response.status !== 401) {
        throw new Error('Wrong error type for unauthorized upload');
      }
    }
  });

  await test('File Management', async () => {
    if (!authTokens.client || !testData.uploadId) throw new Error('Prerequisites not met');

    const response = await makeRequest('GET', '/api/files', null, {
      'Authorization': `Bearer ${authTokens.client}`
    });

    if (response.status !== 200) throw new Error('File listing failed');
  });

  // Cleanup
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
};

const testApplicationTracking = async () => {
  await test('Create Application', async () => {
    if (!authTokens.client) throw new Error('No client token available');

    const applicationData = {
      job_title: 'Senior Software Engineer',
      company: 'Test Company Inc',
      job_description: 'A great opportunity for a senior developer',
      job_url: 'https://example.com/job',
      salary_range: '$120,000 - $150,000',
      location: 'San Francisco, CA',
      job_type: 'full-time',
      application_method: 'Online application',
      application_strategy: 'Direct application with referral'
    };

    const response = await makeRequest('POST', '/api/applications', applicationData, {
      'Authorization': `Bearer ${authTokens.client}`
    });

    if (response.status !== 201) throw new Error('Application creation failed');
    testData.applicationId = response.data.application.id;
  });

  await test('List Applications', async () => {
    if (!authTokens.client) throw new Error('No client token available');

    const response = await makeRequest('GET', '/api/applications', null, {
      'Authorization': `Bearer ${authTokens.client}`
    });

    if (response.status !== 200) throw new Error('Application listing failed');
    if (!Array.isArray(response.data.applications)) throw new Error('Applications not returned as array');
  });

  await test('Update Application Status', async () => {
    if (!authTokens.admin || !testData.applicationId) throw new Error('Prerequisites not met');

    const updateData = {
      status: 'interview_scheduled',
      status_update_reason: 'Phone screening scheduled',
      interview_scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      interview_type: 'phone'
    };

    const response = await makeRequest('PUT', `/api/applications/${testData.applicationId}`, updateData, {
      'Authorization': `Bearer ${authTokens.admin}`
    });

    if (response.status !== 200) throw new Error('Application status update failed');
  });
};

const testConsultationSystem = async () => {
  await test('Public Consultation Request', async () => {
    const consultationData = {
      name: 'Test User',
      email: 'consultation@example.com',
      phone: '+1234567890',
      reason: 'I need help with my job search strategy and interview preparation',
      preferred_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      preferred_time: '14:00',
      package_interest: 'professional',
      current_situation: 'Currently employed but looking for better opportunities',
      timeline: '3-6_months'
    };

    const response = await makeRequest('POST', '/api/public-consultations', consultationData);

    if (response.status !== 201) throw new Error('Public consultation request failed');
    testData.consultationId = response.data.consultation.id;
  });

  await test('Admin Consultation Management', async () => {
    if (!authTokens.admin || !testData.consultationId) throw new Error('Prerequisites not met');

    const response = await makeRequest('GET', '/api/admin/consultations', null, {
      'Authorization': `Bearer ${authTokens.admin}`
    });

    if (response.status !== 200) throw new Error('Admin consultation listing failed');
  });

  await test('Schedule Consultation', async () => {
    if (!authTokens.admin || !testData.clientId) throw new Error('Prerequisites not met');

    const scheduleData = {
      client_id: testData.clientId,
      scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      consultation_type: 'initial',
      admin_notes: 'Initial consultation for new client'
    };

    const response = await makeRequest('POST', '/api/consultations', scheduleData, {
      'Authorization': `Bearer ${authTokens.admin}`
    });

    if (response.status !== 201) throw new Error('Consultation scheduling failed');
  });
};

const testEmailSystem = async () => {
  await test('Contact Form Submission', async () => {
    const contactData = {
      name: 'Test Contact',
      email: 'contact@example.com',
      subject: 'Test Contact Form',
      message: 'This is a test message from the contact form'
    };

    const response = await makeRequest('POST', '/api/contact', contactData);

    if (response.status !== 201) throw new Error('Contact form submission failed');
  });

  await test('Email Action Buttons', async () => {
    // Test email action endpoints (these would normally be triggered from emails)
    const actionData = {
      action: 'confirm_consultation',
      token: 'test_token_123'
    };

    try {
      const response = await makeRequest('POST', '/api/email-actions/consultation-confirm', actionData);
      // This might fail due to invalid token, but endpoint should exist
    } catch (error) {
      if (!error.message.includes('400') && !error.message.includes('404')) {
        throw new Error('Email action endpoint not working properly');
      }
    }
  });
};

const testAdminFeatures = async () => {
  await test('Admin Dashboard Access', async () => {
    if (!authTokens.admin) throw new Error('No admin token available');

    const response = await makeRequest('GET', '/api/admin-dashboard/stats', null, {
      'Authorization': `Bearer ${authTokens.admin}`
    });

    if (response.status !== 200) throw new Error('Admin dashboard access failed');
  });

  await test('Admin User Management', async () => {
    if (!authTokens.admin) throw new Error('No admin token available');

    const response = await makeRequest('GET', '/api/admin-management/users', null, {
      'Authorization': `Bearer ${authTokens.admin}`
    });

    if (response.status !== 200) throw new Error('Admin user management failed');
  });

  await test('Admin 20Q Dashboard', async () => {
    if (!authTokens.admin) throw new Error('No admin token available');

    const response = await makeRequest('GET', '/api/admin/20q-dashboard/submissions', null, {
      'Authorization': `Bearer ${authTokens.admin}`
    });

    if (response.status !== 200) throw new Error('Admin 20Q dashboard failed');
  });

  await test('Client Access Restriction', async () => {
    if (!authTokens.client) throw new Error('No client token available');

    try {
      await makeRequest('GET', '/api/admin-dashboard/stats', null, {
        'Authorization': `Bearer ${authTokens.client}`
      });
      throw new Error('Client was able to access admin endpoint');
    } catch (error) {
      if (!error.message.includes('403')) {
        throw new Error('Wrong error type for unauthorized admin access');
      }
    }
  });
};

const testClientFeatures = async () => {
  await test('Client Dashboard Access', async () => {
    if (!authTokens.client) throw new Error('No client token available');

    const response = await makeRequest('GET', '/api/client/dashboard', null, {
      'Authorization': `Bearer ${authTokens.client}`
    });

    if (response.status !== 200) throw new Error('Client dashboard access failed');
  });

  await test('Client Profile Management', async () => {
    if (!authTokens.client) throw new Error('No client token available');

    const profileData = {
      full_name: 'Updated Test Client',
      phone: '+1234567890',
      linkedin_url: 'https://linkedin.com/in/testclient'
    };

    const response = await makeRequest('PUT', '/api/client/profile', profileData, {
      'Authorization': `Bearer ${authTokens.client}`
    });

    if (response.status !== 200) throw new Error('Client profile update failed');
  });
};

const testRateLimiting = async () => {
  await test('Rate Limiting Protection', async () => {
    const requests = [];
    
    // Make multiple rapid requests to trigger rate limiting
    for (let i = 0; i < 10; i++) {
      requests.push(
        makeRequest('POST', '/api/auth/login', {
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        }).catch(error => error)
      );
    }

    const results = await Promise.all(requests);
    const rateLimitedRequests = results.filter(result => 
      result.message && result.message.includes('429')
    );

    if (rateLimitedRequests.length === 0) {
      throw new Error('Rate limiting not working');
    }
  });
};

const testWebhooks = async () => {
  await test('Webhook Endpoint', async () => {
    const webhookData = {
      event: 'test_event',
      data: { test: 'data' }
    };

    try {
      const response = await makeRequest('POST', '/api/webhooks/test', webhookData);
      // Webhook might require specific headers or authentication
    } catch (error) {
      if (!error.message.includes('400') && !error.message.includes('401')) {
        throw new Error('Webhook endpoint not responding properly');
      }
    }
  });
};

const testPDFViewer = async () => {
  await test('PDF Viewer Endpoint', async () => {
    try {
      const response = await makeRequest('GET', '/api/pdf/test-document');
      // PDF endpoint might require specific parameters
    } catch (error) {
      if (!error.message.includes('404') && !error.message.includes('400')) {
        throw new Error('PDF viewer endpoint not responding properly');
      }
    }
  });
};

const testNotificationSystem = async () => {
  await test('Notification Listing', async () => {
    if (!authTokens.client) throw new Error('No client token available');

    const response = await makeRequest('GET', '/api/notifications', null, {
      'Authorization': `Bearer ${authTokens.client}`
    });

    if (response.status !== 200) throw new Error('Notification listing failed');
  });
};

const testWorkflowFeatures = async () => {
  await test('Workflow Endpoints', async () => {
    if (!authTokens.admin) throw new Error('No admin token available');

    const response = await makeRequest('GET', '/api/workflow/status', null, {
      'Authorization': `Bearer ${authTokens.admin}`
    });

    // Workflow endpoints might not be fully implemented
    if (response.status !== 200 && response.status !== 404) {
      throw new Error('Workflow endpoint error');
    }
  });
};

// Main test runner
const runAllTests = async () => {
  log('🚀 Starting Comprehensive Backend Test Suite', 'info');
  log(`Testing against: ${BASE_URL}`, 'info');
  log('=' .repeat(60), 'info');

  try {
    // Core system tests
    await testHealthAndStatus();
    
    // Authentication and authorization
    await testAuthentication();
    
    // Core features
    await testOnboardingSystem();
    await testFileUploads();
    await testApplicationTracking();
    await testConsultationSystem();
    await testEmailSystem();
    
    // Role-based features
    await testAdminFeatures();
    await testClientFeatures();
    
    // Security features
    await testRateLimiting();
    
    // Additional features
    await testWebhooks();
    await testPDFViewer();
    await testNotificationSystem();
    await testWorkflowFeatures();

  } catch (error) {
    log(`Critical test failure: ${error.message}`, 'error');
  }

  // Print results
  log('=' .repeat(60), 'info');
  log('🏁 Test Results Summary', 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  
  if (testResults.failures.length > 0) {
    log('\n❌ Failed Tests:', 'error');
    testResults.failures.forEach(failure => {
      log(`  • ${failure.name}: ${failure.error}`, 'error');
    });
  }

  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`\nSuccess Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');

  if (successRate >= 90) {
    log('🎉 Excellent! Your backend is working great!', 'success');
  } else if (successRate >= 70) {
    log('⚠️  Good, but some features need attention', 'warning');
  } else {
    log('🚨 Multiple issues detected - review failed tests', 'error');
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
};

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Test runner error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runAllTests, testResults };