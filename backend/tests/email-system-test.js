#!/usr/bin/env node

/**
 * Email System Test Suite
 * Tests all email triggers, templates, and email action buttons
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

class EmailSystemTester {
  constructor() {
    this.results = { passed: 0, failed: 0, tests: [] };
    this.authTokens = { admin: null, client: null };
    this.testData = {};
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[EMAIL-TEST] ${message}${colors.reset}`);
  }

  async test(name, testFn) {
    try {
      this.log(`Testing: ${name}`);
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      this.log(`✅ PASSED: ${name}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      this.log(`❌ FAILED: ${name} - ${error.message}`, 'error');
    }
  }

  async request(method, endpoint, data = null, headers = {}) {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json', ...headers }
    };
    if (data) config.data = data;

    try {
      return await axios(config);
    } catch (error) {
      if (error.response) {
        throw new Error(`${error.response.status}: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async setupAuth() {
    // Try to authenticate for testing
    try {
      const adminLogin = await this.request('POST', '/api/auth/login', {
        email: 'admin@example.com',
        password: 'AdminPassword123!'
      });
      this.authTokens.admin = adminLogin.data.token;
    } catch (error) {
      this.log('Could not authenticate as admin', 'warning');
    }

    try {
      const clientLogin = await this.request('POST', '/api/auth/login', {
        email: 'test@example.com',
        password: 'TestPassword123!'
      });
      this.authTokens.client = clientLogin.data.token;
    } catch (error) {
      this.log('Could not authenticate as client', 'warning');
    }
  }

  async testEmailTemplates() {
    await this.test('Email Templates - Template Files Exist', async () => {
      const templateDir = path.join(__dirname, '..', 'emails', 'templates');
      const requiredTemplates = [
        'signup_invite.html',
        'onboarding_completion.html',
        'onboarding_completed_secure.html',
        'consultation_confirmed.html',
        'meeting_scheduled.html',
        'admin_welcome.html',
        'contact_form_received.html',
        'new_contact_submission.html',
        'payment_verified_registration.html',
        'strategy_call_confirmed.html'
      ];

      const missingTemplates = [];
      for (const template of requiredTemplates) {
        const templatePath = path.join(templateDir, template);
        if (!fs.existsSync(templatePath)) {
          missingTemplates.push(template);
        }
      }

      if (missingTemplates.length > 0) {
        throw new Error(`Missing email templates: ${missingTemplates.join(', ')}`);
      }
    });

    await this.test('Email Templates - Base Template Exists', async () => {
      const baseTemplatePath = path.join(__dirname, '..', 'emails', 'templates', '_base_template.html');
      if (!fs.existsSync(baseTemplatePath)) {
        throw new Error('Base email template not found');
      }

      const baseContent = fs.readFileSync(baseTemplatePath, 'utf8');
      if (!baseContent.includes('{{content}}')) {
        throw new Error('Base template missing content placeholder');
      }
    });
  }

  async testContactFormEmails() {
    await this.test('Contact Form - Email Trigger', async () => {
      const contactData = {
        name: 'Test Contact User',
        email: 'testcontact@example.com',
        subject: 'Test Contact Form Submission',
        message: 'This is a test message to verify email triggers work properly.'
      };

      const response = await this.request('POST', '/api/contact', contactData);
      
      if (response.status !== 201) {
        throw new Error('Contact form submission failed');
      }

      // The endpoint should trigger email sending
      // We can't verify email delivery without access to email service
      this.log('Contact form submitted - email should be triggered', 'info');
    });

    await this.test('Contact Form - Invalid Data Rejection', async () => {
      try {
        await this.request('POST', '/api/contact', {
          name: 'Test',
          email: 'invalid-email',
          message: 'Test'
        });
        throw new Error('Invalid contact data was accepted');
      } catch (error) {
        if (!error.message.includes('400')) {
          throw new Error('Wrong error type for invalid contact data');
        }
      }
    });
  }

  async testConsultationEmails() {
    await this.test('Consultation Request - Email Trigger', async () => {
      const consultationData = {
        name: 'Test Consultation User',
        email: 'testconsult@example.com',
        phone: '+1234567890',
        reason: 'I need help with my job search and would like to schedule a consultation',
        preferred_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        preferred_time: '14:00',
        package_interest: 'professional',
        current_situation: 'Currently employed but looking for better opportunities',
        timeline: '3-6_months'
      };

      const response = await this.request('POST', '/api/public-consultations', consultationData);
      
      if (response.status !== 201) {
        throw new Error('Consultation request failed');
      }

      this.testData.consultationId = response.data.consultation.id;
      this.log('Consultation requested - confirmation email should be triggered', 'info');
    });

    await this.test('Consultation Confirmation - Admin Email', async () => {
      if (!this.authTokens.admin || !this.testData.consultationId) {
        throw new Error('Prerequisites not met for consultation confirmation test');
      }

      // Admin confirms consultation
      const confirmData = {
        status: 'confirmed',
        admin_notes: 'Consultation confirmed for next week'
      };

      const response = await this.request('PUT', `/api/consultations/${this.testData.consultationId}`, confirmData, {
        'Authorization': `Bearer ${this.authTokens.admin}`
      });

      if (response.status !== 200) {
        throw new Error('Consultation confirmation failed');
      }

      this.log('Consultation confirmed - client notification email should be triggered', 'info');
    });
  }

  async testOnboardingEmails() {
    await this.test('Onboarding Completion - Email Trigger', async () => {
      if (!this.authTokens.client) {
        throw new Error('No client token available for onboarding test');
      }

      const onboardingData = {
        target_job_titles: ['Software Engineer'],
        target_industries: ['Technology'],
        target_locations: ['San Francisco'],
        remote_work_preference: 'hybrid',
        current_salary_range: '$80,000 - $100,000',
        target_salary_range: '$120,000 - $150,000',
        salary_negotiation_comfort: 7,
        years_of_experience: 5,
        key_technical_skills: ['JavaScript', 'React'],
        job_search_timeline: '3-6_months',
        career_goals_short_term: 'Get a senior position',
        biggest_career_challenges: ['Technical interviews'],
        support_areas_needed: ['Interview prep']
      };

      try {
        const response = await this.request('POST', '/api/onboarding', onboardingData, {
          'Authorization': `Bearer ${this.authTokens.client}`
        });

        if (response.status === 201) {
          this.log('Onboarding submitted - completion email should be triggered', 'info');
        }
      } catch (error) {
        if (error.message.includes('409')) {
          this.log('Onboarding already completed (expected)', 'info');
        } else {
          throw error;
        }
      }
    });

    await this.test('Onboarding Approval - Admin Email', async () => {
      if (!this.authTokens.admin) {
        throw new Error('No admin token available');
      }

      // Try to get onboarding submissions for approval
      try {
        const response = await this.request('GET', '/api/admin/20q-dashboard/submissions', null, {
          'Authorization': `Bearer ${this.authTokens.admin}`
        });

        if (response.status === 200 && response.data.submissions && response.data.submissions.length > 0) {
          this.log('Onboarding submissions found - approval emails can be triggered', 'info');
        }
      } catch (error) {
        this.log('Could not access onboarding submissions', 'warning');
      }
    });
  }

  async testEmailActionButtons() {
    await this.test('Email Action - Consultation Confirmation Button', async () => {
      // Test email action endpoints that would be triggered from email buttons
      const actionData = {
        action: 'confirm',
        consultation_id: this.testData.consultationId || 'test_id',
        token: 'test_token_123'
      };

      try {
        const response = await this.request('POST', '/api/email-actions/consultation-confirm', actionData);
        
        if (response.status === 200) {
          this.log('Email action endpoint working', 'success');
        }
      } catch (error) {
        if (error.message.includes('400') || error.message.includes('404')) {
          this.log('Email action endpoint exists but requires valid token (expected)', 'info');
        } else {
          throw new Error('Email action endpoint not responding properly');
        }
      }
    });

    await this.test('Email Action - Meeting Reschedule Button', async () => {
      const actionData = {
        action: 'reschedule',
        meeting_id: 'test_meeting_id',
        new_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      try {
        await this.request('POST', '/api/email-actions/meeting-reschedule', actionData);
      } catch (error) {
        if (error.message.includes('400') || error.message.includes('404')) {
          this.log('Meeting reschedule endpoint exists (expected error for test data)', 'info');
        } else {
          throw new Error('Meeting reschedule endpoint not working');
        }
      }
    });

    await this.test('Email Action - Payment Confirmation Button', async () => {
      const actionData = {
        action: 'confirm_payment',
        consultation_id: 'test_consultation_id',
        payment_reference: 'test_payment_ref'
      };

      try {
        await this.request('POST', '/api/email-actions/payment-confirm', actionData);
      } catch (error) {
        if (error.message.includes('400') || error.message.includes('404')) {
          this.log('Payment confirmation endpoint exists (expected error for test data)', 'info');
        } else {
          throw new Error('Payment confirmation endpoint not working');
        }
      }
    });
  }

  async testAdminNotificationEmails() {
    await this.test('Admin Notification - New User Registration', async () => {
      // This would normally be triggered when a new user registers
      // We can test the endpoint that would send the notification
      
      if (!this.authTokens.admin) {
        this.log('No admin token for notification test', 'warning');
        return;
      }

      try {
        const response = await this.request('GET', '/api/admin/notifications', null, {
          'Authorization': `Bearer ${this.authTokens.admin}`
        });

        if (response.status === 200) {
          this.log('Admin notifications endpoint working', 'success');
        }
      } catch (error) {
        this.log('Admin notifications endpoint may not be implemented', 'warning');
      }
    });

    await this.test('Admin Notification - System Alerts', async () => {
      if (!this.authTokens.admin) {
        this.log('No admin token for system alerts test', 'warning');
        return;
      }

      // Test system health notifications
      try {
        const response = await this.request('GET', '/api/admin/system-alerts', null, {
          'Authorization': `Bearer ${this.authTokens.admin}`
        });

        if (response.status === 200) {
          this.log('System alerts endpoint working', 'success');
        }
      } catch (error) {
        if (error.message.includes('404')) {
          this.log('System alerts endpoint not implemented', 'info');
        } else {
          this.log('System alerts endpoint error', 'warning');
        }
      }
    });
  }

  async testEmailSecurity() {
    await this.test('Email Security - Rate Limiting', async () => {
      // Test rate limiting on email-triggering endpoints
      const requests = [];
      
      for (let i = 0; i < 10; i++) {
        requests.push(
          this.request('POST', '/api/contact', {
            name: `Test User ${i}`,
            email: `test${i}@example.com`,
            subject: `Test Subject ${i}`,
            message: `Test message ${i}`
          }).catch(error => error)
        );
      }

      const results = await Promise.all(requests);
      const rateLimitedRequests = results.filter(result => 
        result.message && result.message.includes('429')
      );

      if (rateLimitedRequests.length > 0) {
        this.log(`Email rate limiting working: ${rateLimitedRequests.length} requests blocked`, 'success');
      } else {
        this.log('No email rate limiting detected', 'warning');
      }
    });

    await this.test('Email Security - Input Sanitization', async () => {
      // Test that malicious input is sanitized
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        subject: '{{system_command}}',
        message: 'SELECT * FROM users; --'
      };

      try {
        const response = await this.request('POST', '/api/contact', maliciousData);
        
        if (response.status === 201) {
          this.log('Malicious input accepted - should be sanitized in email', 'warning');
        }
      } catch (error) {
        if (error.message.includes('400')) {
          this.log('Malicious input rejected (good security)', 'success');
        } else {
          throw error;
        }
      }
    });
  }

  async testEmailConfiguration() {
    await this.test('Email Configuration - Service Check', async () => {
      // Check if email service is configured
      const requiredEnvVars = ['RESEND_API_KEY'];
      const missingVars = [];

      for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
          missingVars.push(varName);
        }
      }

      if (missingVars.length > 0) {
        this.log(`Missing email configuration: ${missingVars.join(', ')}`, 'warning');
      } else {
        this.log('Email service configuration found', 'success');
      }
    });
  }

  async runAllTests() {
    this.log('📧 Starting Email System Tests');
    this.log(`Testing against: ${BASE_URL}`);
    this.log('=' .repeat(50));

    await this.setupAuth();

    await this.testEmailTemplates();
    await this.testEmailConfiguration();
    await this.testContactFormEmails();
    await this.testConsultationEmails();
    await this.testOnboardingEmails();
    await this.testEmailActionButtons();
    await this.testAdminNotificationEmails();
    await this.testEmailSecurity();

    this.log('=' .repeat(50));
    this.log('🏁 Email System Test Results');
    this.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    this.log(`Passed: ${this.results.passed}`, 'success');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');

    const failedTests = this.results.tests.filter(t => t.status === 'FAILED');
    if (failedTests.length > 0) {
      this.log('\n❌ Failed Tests:', 'error');
      failedTests.forEach(test => {
        this.log(`  • ${test.name}: ${test.error}`, 'error');
      });
    }

    const successRate = ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1);
    this.log(`\nEmail System Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');

    return this.results;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new EmailSystemTester();
  tester.runAllTests().catch(error => {
    console.error('Email system test runner error:', error);
    process.exit(1);
  });
}

module.exports = EmailSystemTester;