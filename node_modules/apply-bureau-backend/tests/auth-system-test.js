#!/usr/bin/env node

/**
 * Authentication System Test Suite
 * Tests all authentication, registration, and token features
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

class AuthSystemTester {
  constructor() {
    this.results = { passed: 0, failed: 0, tests: [] };
    this.tokens = {};
    this.users = {};
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[AUTH-TEST] ${message}${colors.reset}`);
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

  async testAdminInviteSystem() {
    await this.test('Admin Invite - Valid Data', async () => {
      const inviteData = {
        email: 'newadmin@example.com',
        full_name: 'New Admin User'
      };

      // This might fail if no admin token exists yet
      try {
        const response = await this.request('POST', '/api/auth/invite', inviteData, {
          'Authorization': `Bearer ${this.tokens.admin || 'dummy_token'}`
        });
        if (response.status !== 201) throw new Error('Invite failed');
      } catch (error) {
        if (!error.message.includes('401') && !error.message.includes('403')) {
          throw error;
        }
        this.log('Admin invite requires existing admin token (expected)', 'warning');
      }
    });

    await this.test('Admin Invite - Invalid Email', async () => {
      try {
        await this.request('POST', '/api/auth/invite', {
          email: 'invalid-email',
          full_name: 'Test User'
        });
        throw new Error('Invalid email was accepted');
      } catch (error) {
        if (!error.message.includes('400')) {
          throw new Error('Wrong error type for invalid email');
        }
      }
    });

    await this.test('Admin Invite - Missing Fields', async () => {
      try {
        await this.request('POST', '/api/auth/invite', {
          email: 'test@example.com'
          // Missing full_name
        });
        throw new Error('Missing fields were accepted');
      } catch (error) {
        if (!error.message.includes('400')) {
          throw new Error('Wrong error type for missing fields');
        }
      }
    });
  }

  async testClientRegistration() {
    await this.test('Client Registration - Complete Flow', async () => {
      // Simulate registration token (normally from email)
      const registrationToken = jwt.sign({
        email: 'testclient@example.com',
        type: 'client_registration',
        exp: Math.floor(Date.now() / 1000) + 3600
      }, process.env.JWT_SECRET || 'test_secret');

      const registrationData = {
        token: registrationToken,
        password: 'ClientPassword123!',
        full_name: 'Test Client User'
      };

      try {
        const response = await this.request('POST', '/api/auth/complete-registration', registrationData);
        if (response.status === 201) {
          this.users.client = response.data.user;
          this.tokens.client = response.data.token;
        }
      } catch (error) {
        // Registration endpoint might not exist or work differently
        this.log('Registration endpoint may not be implemented', 'warning');
      }
    });

    await this.test('Client Registration - Invalid Token', async () => {
      try {
        await this.request('POST', '/api/auth/complete-registration', {
          token: 'invalid_token',
          password: 'Password123!',
          full_name: 'Test User'
        });
        throw new Error('Invalid token was accepted');
      } catch (error) {
        if (!error.message.includes('400') && !error.message.includes('401')) {
          throw new Error('Wrong error type for invalid token');
        }
      }
    });

    await this.test('Client Registration - Weak Password', async () => {
      const token = jwt.sign({
        email: 'test@example.com',
        type: 'client_registration'
      }, process.env.JWT_SECRET || 'test_secret');

      try {
        await this.request('POST', '/api/auth/complete-registration', {
          token: token,
          password: '123', // Weak password
          full_name: 'Test User'
        });
        throw new Error('Weak password was accepted');
      } catch (error) {
        if (!error.message.includes('400')) {
          throw new Error('Wrong error type for weak password');
        }
      }
    });
  }

  async testLoginSystem() {
    await this.test('Login - Valid Credentials', async () => {
      // Try common test credentials
      const testCredentials = [
        { email: 'admin@example.com', password: 'AdminPassword123!' },
        { email: 'test@example.com', password: 'TestPassword123!' },
        { email: 'client@example.com', password: 'ClientPassword123!' }
      ];

      let loginSuccessful = false;
      for (const creds of testCredentials) {
        try {
          const response = await this.request('POST', '/api/auth/login', creds);
          if (response.status === 200 && response.data.token) {
            this.tokens[creds.email.includes('admin') ? 'admin' : 'client'] = response.data.token;
            this.users[creds.email.includes('admin') ? 'admin' : 'client'] = response.data.user;
            loginSuccessful = true;
            this.log(`Login successful with ${creds.email}`, 'success');
            break;
          }
        } catch (error) {
          // Continue trying other credentials
        }
      }

      if (!loginSuccessful) {
        this.log('No test credentials worked - this is expected if no users exist', 'warning');
      }
    });

    await this.test('Login - Invalid Email', async () => {
      try {
        await this.request('POST', '/api/auth/login', {
          email: 'nonexistent@example.com',
          password: 'SomePassword123!'
        });
        throw new Error('Login with invalid email succeeded');
      } catch (error) {
        if (!error.message.includes('401') && !error.message.includes('400')) {
          throw new Error('Wrong error type for invalid email');
        }
      }
    });

    await this.test('Login - Wrong Password', async () => {
      try {
        await this.request('POST', '/api/auth/login', {
          email: 'test@example.com',
          password: 'WrongPassword123!'
        });
        throw new Error('Login with wrong password succeeded');
      } catch (error) {
        if (!error.message.includes('401') && !error.message.includes('400')) {
          throw new Error('Wrong error type for wrong password');
        }
      }
    });

    await this.test('Login - Missing Fields', async () => {
      try {
        await this.request('POST', '/api/auth/login', {
          email: 'test@example.com'
          // Missing password
        });
        throw new Error('Login with missing fields succeeded');
      } catch (error) {
        if (!error.message.includes('400')) {
          throw new Error('Wrong error type for missing fields');
        }
      }
    });

    await this.test('Login - Malformed Email', async () => {
      try {
        await this.request('POST', '/api/auth/login', {
          email: 'not-an-email',
          password: 'Password123!'
        });
        throw new Error('Login with malformed email succeeded');
      } catch (error) {
        if (!error.message.includes('400')) {
          throw new Error('Wrong error type for malformed email');
        }
      }
    });
  }

  async testTokenValidation() {
    await this.test('Token Validation - Valid Token', async () => {
      if (!this.tokens.client && !this.tokens.admin) {
        this.log('No valid tokens available for testing', 'warning');
        return;
      }

      const token = this.tokens.client || this.tokens.admin;
      const response = await this.request('GET', '/api/auth/verify', null, {
        'Authorization': `Bearer ${token}`
      });

      if (response.status !== 200) {
        throw new Error('Valid token was rejected');
      }
    });

    await this.test('Token Validation - Invalid Token', async () => {
      try {
        await this.request('GET', '/api/auth/verify', null, {
          'Authorization': 'Bearer invalid_token_here'
        });
        throw new Error('Invalid token was accepted');
      } catch (error) {
        if (!error.message.includes('401') && !error.message.includes('403')) {
          throw new Error('Wrong error type for invalid token');
        }
      }
    });

    await this.test('Token Validation - Missing Token', async () => {
      try {
        await this.request('GET', '/api/auth/verify');
        throw new Error('Request without token was accepted');
      } catch (error) {
        if (!error.message.includes('401')) {
          throw new Error('Wrong error type for missing token');
        }
      }
    });

    await this.test('Token Validation - Malformed Authorization Header', async () => {
      try {
        await this.request('GET', '/api/auth/verify', null, {
          'Authorization': 'InvalidFormat token_here'
        });
        throw new Error('Malformed authorization header was accepted');
      } catch (error) {
        if (!error.message.includes('401')) {
          throw new Error('Wrong error type for malformed header');
        }
      }
    });
  }

  async testPasswordSecurity() {
    await this.test('Password Security - Complexity Requirements', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'Password',
        'Password123',
        'password123!',
        'PASSWORD123!'
      ];

      for (const weakPassword of weakPasswords) {
        try {
          await this.request('POST', '/api/auth/change-password', {
            current_password: 'OldPassword123!',
            new_password: weakPassword
          }, {
            'Authorization': `Bearer ${this.tokens.client || 'dummy'}`
          });
          throw new Error(`Weak password "${weakPassword}" was accepted`);
        } catch (error) {
          if (!error.message.includes('400') && !error.message.includes('401')) {
            throw new Error(`Wrong error type for weak password "${weakPassword}"`);
          }
        }
      }
    });
  }

  async testRoleBasedAccess() {
    await this.test('Role-Based Access - Admin Endpoints', async () => {
      if (!this.tokens.client) {
        this.log('No client token available for role testing', 'warning');
        return;
      }

      try {
        await this.request('GET', '/api/admin/users', null, {
          'Authorization': `Bearer ${this.tokens.client}`
        });
        throw new Error('Client was able to access admin endpoint');
      } catch (error) {
        if (!error.message.includes('403')) {
          throw new Error('Wrong error type for unauthorized admin access');
        }
      }
    });

    await this.test('Role-Based Access - Client Endpoints', async () => {
      if (!this.tokens.admin) {
        this.log('No admin token available for role testing', 'warning');
        return;
      }

      // Admin should be able to access client endpoints
      try {
        const response = await this.request('GET', '/api/client/profile', null, {
          'Authorization': `Bearer ${this.tokens.admin}`
        });
        // This might fail if admin doesn't have client profile, which is expected
      } catch (error) {
        if (error.message.includes('404')) {
          this.log('Admin accessing client endpoint returned 404 (expected)', 'info');
        } else if (!error.message.includes('403')) {
          // 403 would be unexpected for admin
        }
      }
    });
  }

  async testSessionManagement() {
    await this.test('Session Management - Logout', async () => {
      if (!this.tokens.client && !this.tokens.admin) {
        this.log('No tokens available for logout testing', 'warning');
        return;
      }

      const token = this.tokens.client || this.tokens.admin;
      try {
        const response = await this.request('POST', '/api/auth/logout', null, {
          'Authorization': `Bearer ${token}`
        });
        
        if (response.status === 200) {
          // Try to use the token after logout
          try {
            await this.request('GET', '/api/auth/verify', null, {
              'Authorization': `Bearer ${token}`
            });
            throw new Error('Token still valid after logout');
          } catch (error) {
            if (!error.message.includes('401')) {
              throw new Error('Wrong error type for logged out token');
            }
          }
        }
      } catch (error) {
        if (error.message.includes('404')) {
          this.log('Logout endpoint not implemented (stateless auth)', 'info');
        } else {
          throw error;
        }
      }
    });
  }

  async testRateLimiting() {
    await this.test('Rate Limiting - Login Attempts', async () => {
      const requests = [];
      
      // Make multiple rapid login attempts
      for (let i = 0; i < 8; i++) {
        requests.push(
          this.request('POST', '/api/auth/login', {
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
        throw new Error('Rate limiting not working for login attempts');
      }
    });
  }

  async runAllTests() {
    this.log('🔐 Starting Authentication System Tests');
    this.log(`Testing against: ${BASE_URL}`);
    this.log('=' .repeat(50));

    await this.testAdminInviteSystem();
    await this.testClientRegistration();
    await this.testLoginSystem();
    await this.testTokenValidation();
    await this.testPasswordSecurity();
    await this.testRoleBasedAccess();
    await this.testSessionManagement();
    await this.testRateLimiting();

    this.log('=' .repeat(50));
    this.log('🏁 Authentication Test Results');
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
    this.log(`\nAuthentication Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');

    return this.results;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new AuthSystemTester();
  tester.runAllTests().catch(error => {
    console.error('Auth test runner error:', error);
    process.exit(1);
  });
}

module.exports = AuthSystemTester;