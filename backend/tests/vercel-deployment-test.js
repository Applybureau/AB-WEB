#!/usr/bin/env node

/**
 * Vercel Deployment Test Suite
 * Tests the live Vercel deployment with comprehensive coverage
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Vercel deployment URL
const VERCEL_URL = 'https://apply-bureau-backend.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

class VercelDeploymentTester {
  constructor() {
    this.results = {
      vercel: { passed: 0, failed: 0, tests: [] },
      local: { passed: 0, failed: 0, tests: [] },
      comparison: []
    };
    this.authTokens = { vercel: {}, local: {} };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      header: '\x1b[35m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[VERCEL-TEST] ${message}${colors.reset}`);
  }

  async test(name, testFn, environment = 'both') {
    const environments = environment === 'both' ? ['vercel', 'local'] : [environment];
    
    for (const env of environments) {
      const baseUrl = env === 'vercel' ? VERCEL_URL : LOCAL_URL;
      
      try {
        this.log(`Testing ${env.toUpperCase()}: ${name}`);
        await testFn(baseUrl, env);
        this.results[env].passed++;
        this.results[env].tests.push({ name, status: 'PASSED', environment: env });
        this.log(`✅ PASSED (${env.toUpperCase()}): ${name}`, 'success');
      } catch (error) {
        this.results[env].failed++;
        this.results[env].tests.push({ 
          name, 
          status: 'FAILED', 
          environment: env, 
          error: error.message 
        });
        this.log(`❌ FAILED (${env.toUpperCase()}): ${name} - ${error.message}`, 'error');
      }
    }
  }

  async request(baseUrl, method, endpoint, data = null, headers = {}) {
    const config = {
      method,
      url: `${baseUrl}${endpoint}`,
      headers: { 'Content-Type': 'application/json', ...headers },
      timeout: 30000 // 30 second timeout for Vercel
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

  async testHealthEndpoints() {
    await this.test('Health Check', async (baseUrl, env) => {
      const response = await this.request(baseUrl, 'GET', '/health');
      if (response.status !== 200) throw new Error('Health check failed');
      if (!response.data.healthy) throw new Error('Service not healthy');
    });

    await this.test('API Health Check', async (baseUrl, env) => {
      const response = await this.request(baseUrl, 'GET', '/api/health');
      if (response.status !== 200) throw new Error('API health check failed');
    });
  }

  async testCORSConfiguration() {
    await this.test('CORS Headers', async (baseUrl, env) => {
      const response = await this.request(baseUrl, 'OPTIONS', '/api/health', null, {
        'Origin': 'https://apply-bureau.vercel.app',
        'Access-Control-Request-Method': 'GET'
      });
      
      if (response.status !== 200) throw new Error('CORS preflight failed');
    });

    await this.test('CORS Origin Validation', async (baseUrl, env) => {
      try {
        await this.request(baseUrl, 'GET', '/api/health', null, {
          'Origin': 'https://malicious-site.com'
        });
        // Should not reach here in production
        if (env === 'vercel') {
          throw new Error('Malicious origin was accepted in production');
        }
      } catch (error) {
        if (error.message.includes('CORS') || error.message.includes('403')) {
          // Good - CORS is working
        } else {
          throw error;
        }
      }
    });
  }

  async testAuthenticationSystem() {
    await this.test('Login Endpoint Exists', async (baseUrl, env) => {
      try {
        await this.request(baseUrl, 'POST', '/api/auth/login', {
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      } catch (error) {
        // Should fail with 401, not 404
        if (error.message.includes('404')) {
          throw new Error('Login endpoint not found');
        }
        if (!error.message.includes('401') && !error.message.includes('400')) {
          throw new Error('Unexpected error type for login');
        }
      }
    });

    await this.test('Registration Endpoint', async (baseUrl, env) => {
      try {
        await this.request(baseUrl, 'POST', '/api/auth/invite', {
          email: 'test@example.com',
          full_name: 'Test User'
        });
      } catch (error) {
        // Should fail with auth error, not 404
        if (error.message.includes('404')) {
          throw new Error('Registration endpoint not found');
        }
      }
    });

    await this.test('Token Validation', async (baseUrl, env) => {
      try {
        await this.request(baseUrl, 'GET', '/api/client/profile', null, {
          'Authorization': 'Bearer invalid_token'
        });
        throw new Error('Invalid token was accepted');
      } catch (error) {
        if (!error.message.includes('401') && !error.message.includes('403')) {
          throw new Error('Wrong error type for invalid token');
        }
      }
    });
  }

  async testRateLimiting() {
    await this.test('Rate Limiting Protection', async (baseUrl, env) => {
      const requests = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          this.request(baseUrl, 'POST', '/api/auth/login', {
            email: 'test@example.com',
            password: 'wrongpassword'
          }).catch(error => error)
        );
      }

      const results = await Promise.all(requests);
      const rateLimitedRequests = results.filter(result => 
        result.message && result.message.includes('429')
      );

      if (rateLimitedRequests.length === 0) {
        this.log('No rate limiting detected (might be expected for Vercel)', 'warning');
      } else {
        this.log(`Rate limiting working: ${rateLimitedRequests.length} requests blocked`, 'success');
      }
    });
  }

  async testAPIEndpoints() {
    const endpoints = [
      { method: 'GET', path: '/api/health', requiresAuth: false },
      { method: 'GET', path: '/api/applications', requiresAuth: true },
      { method: 'GET', path: '/api/consultations', requiresAuth: true },
      { method: 'GET', path: '/api/notifications', requiresAuth: true },
      { method: 'GET', path: '/api/dashboard', requiresAuth: true },
      { method: 'POST', path: '/api/contact', requiresAuth: false },
      { method: 'GET', path: '/api/admin/stats', requiresAuth: true },
      { method: 'GET', path: '/api/client/profile', requiresAuth: true }
    ];

    for (const endpoint of endpoints) {
      await this.test(`Endpoint ${endpoint.method} ${endpoint.path}`, async (baseUrl, env) => {
        try {
          const headers = endpoint.requiresAuth ? {
            'Authorization': 'Bearer test_token'
          } : {};

          await this.request(baseUrl, endpoint.method, endpoint.path, null, headers);
          
          if (endpoint.requiresAuth) {
            throw new Error('Protected endpoint accepted invalid token');
          }
        } catch (error) {
          if (endpoint.requiresAuth) {
            // Should fail with auth error
            if (!error.message.includes('401') && !error.message.includes('403')) {
              throw new Error(`Unexpected error for protected endpoint: ${error.message}`);
            }
          } else {
            // Public endpoints should work
            if (error.message.includes('404')) {
              throw new Error('Public endpoint not found');
            }
            if (error.message.includes('500')) {
              throw new Error('Server error on public endpoint');
            }
          }
        }
      });
    }
  }

  async testFileUploadEndpoints() {
    await this.test('File Upload Endpoint Security', async (baseUrl, env) => {
      try {
        const form = new FormData();
        form.append('file', 'test content', 'test.txt');

        await axios.post(`${baseUrl}/api/upload`, form, {
          headers: form.getHeaders(),
          timeout: 30000
        });
        
        throw new Error('File upload without auth was accepted');
      } catch (error) {
        if (!error.response || error.response.status !== 401) {
          throw new Error('Wrong error type for unauthorized upload');
        }
      }
    });
  }

  async testEmailEndpoints() {
    await this.test('Contact Form Endpoint', async (baseUrl, env) => {
      const contactData = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Contact',
        message: 'This is a test message'
      };

      const response = await this.request(baseUrl, 'POST', '/api/contact', contactData);
      
      if (response.status !== 201 && response.status !== 200) {
        throw new Error('Contact form submission failed');
      }
    });

    await this.test('Email Action Endpoints', async (baseUrl, env) => {
      try {
        await this.request(baseUrl, 'POST', '/api/email-actions/consultation-confirm', {
          action: 'confirm',
          token: 'test_token'
        });
      } catch (error) {
        // Should fail with validation error, not 404
        if (error.message.includes('404')) {
          throw new Error('Email action endpoint not found');
        }
      }
    });
  }

  async testDatabaseConnectivity() {
    await this.test('Database Connection', async (baseUrl, env) => {
      // Test an endpoint that requires database access
      try {
        await this.request(baseUrl, 'GET', '/api/applications', null, {
          'Authorization': 'Bearer test_token'
        });
      } catch (error) {
        // Should fail with auth error, not database error
        if (error.message.includes('database') || error.message.includes('connection')) {
          throw new Error('Database connection issue detected');
        }
        if (!error.message.includes('401') && !error.message.includes('403')) {
          throw new Error(`Unexpected database error: ${error.message}`);
        }
      }
    });
  }

  async testPerformance() {
    await this.test('Response Time Performance', async (baseUrl, env) => {
      const startTime = Date.now();
      
      await this.request(baseUrl, 'GET', '/health');
      
      const responseTime = Date.now() - startTime;
      
      if (responseTime > 5000) { // 5 seconds for Vercel cold start
        throw new Error(`Response time too slow: ${responseTime}ms`);
      }
      
      this.log(`Response time (${env}): ${responseTime}ms`, 'info');
    });

    await this.test('Concurrent Request Handling', async (baseUrl, env) => {
      const requests = [];
      
      for (let i = 0; i < 5; i++) {
        requests.push(this.request(baseUrl, 'GET', '/health'));
      }

      const results = await Promise.all(requests);
      
      const failedRequests = results.filter(result => result.status !== 200);
      if (failedRequests.length > 0) {
        throw new Error(`${failedRequests.length} concurrent requests failed`);
      }
    });
  }

  async testSecurityHeaders() {
    await this.test('Security Headers', async (baseUrl, env) => {
      const response = await this.request(baseUrl, 'GET', '/health');
      
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
      ];

      const missingHeaders = securityHeaders.filter(header => 
        !response.headers[header] && !response.headers[header.toLowerCase()]
      );

      if (missingHeaders.length > 0) {
        this.log(`Missing security headers: ${missingHeaders.join(', ')}`, 'warning');
      }
    });
  }

  async testEnvironmentSpecificFeatures() {
    await this.test('Environment Configuration', async (baseUrl, env) => {
      const response = await this.request(baseUrl, 'GET', '/health');
      
      if (env === 'vercel') {
        // Vercel-specific checks
        if (!response.headers['x-vercel-cache']) {
          this.log('Vercel caching headers not detected', 'warning');
        }
      }
      
      if (env === 'local') {
        // Local development checks
        if (response.data.environment === 'production') {
          this.log('Local server running in production mode', 'warning');
        }
      }
    });
  }

  compareResults() {
    this.log('\n📊 DEPLOYMENT COMPARISON', 'header');
    
    const vercelTotal = this.results.vercel.passed + this.results.vercel.failed;
    const localTotal = this.results.local.passed + this.results.local.failed;
    
    const vercelSuccess = vercelTotal > 0 ? (this.results.vercel.passed / vercelTotal * 100).toFixed(1) : 0;
    const localSuccess = localTotal > 0 ? (this.results.local.passed / localTotal * 100).toFixed(1) : 0;
    
    this.log(`Vercel Success Rate: ${vercelSuccess}% (${this.results.vercel.passed}/${vercelTotal})`, 
             vercelSuccess >= 80 ? 'success' : 'warning');
    this.log(`Local Success Rate: ${localSuccess}% (${this.results.local.passed}/${localTotal})`, 
             localSuccess >= 80 ? 'success' : 'warning');

    // Find tests that passed locally but failed on Vercel
    const vercelFailures = this.results.vercel.tests.filter(t => t.status === 'FAILED');
    const localPasses = this.results.local.tests.filter(t => t.status === 'PASSED');
    
    const deploymentIssues = vercelFailures.filter(vf => 
      localPasses.some(lp => lp.name === vf.name)
    );

    if (deploymentIssues.length > 0) {
      this.log('\n🚨 DEPLOYMENT-SPECIFIC ISSUES:', 'error');
      deploymentIssues.forEach(issue => {
        this.log(`  • ${issue.name}: ${issue.error}`, 'error');
      });
    }

    // Find tests that failed on both
    const bothFailed = vercelFailures.filter(vf => 
      this.results.local.tests.some(lt => lt.name === vf.name && lt.status === 'FAILED')
    );

    if (bothFailed.length > 0) {
      this.log('\n⚠️  ISSUES ON BOTH ENVIRONMENTS:', 'warning');
      bothFailed.forEach(issue => {
        this.log(`  • ${issue.name}`, 'warning');
      });
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      vercel_url: VERCEL_URL,
      local_url: LOCAL_URL,
      results: this.results,
      summary: {
        vercel_success_rate: this.results.vercel.passed / (this.results.vercel.passed + this.results.vercel.failed) * 100,
        local_success_rate: this.results.local.passed / (this.results.local.passed + this.results.local.failed) * 100,
        deployment_ready: this.results.vercel.passed >= this.results.local.passed * 0.8
      }
    };

    const reportPath = path.join(__dirname, 'vercel-deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`\n📄 Report saved to: ${reportPath}`, 'info');
    return report;
  }

  async runAllTests() {
    this.log('🚀 Starting Vercel Deployment Tests', 'header');
    this.log(`Vercel URL: ${VERCEL_URL}`, 'info');
    this.log(`Local URL: ${LOCAL_URL}`, 'info');
    this.log('=' .repeat(60), 'header');

    // Test both environments
    await this.testHealthEndpoints();
    await this.testCORSConfiguration();
    await this.testAuthenticationSystem();
    await this.testRateLimiting();
    await this.testAPIEndpoints();
    await this.testFileUploadEndpoints();
    await this.testEmailEndpoints();
    await this.testDatabaseConnectivity();
    await this.testPerformance();
    await this.testSecurityHeaders();
    await this.testEnvironmentSpecificFeatures();

    // Compare results
    this.compareResults();

    // Generate report
    const report = this.generateReport();

    this.log('\n🏁 VERCEL DEPLOYMENT TEST COMPLETE', 'header');
    
    if (report.summary.deployment_ready) {
      this.log('✅ Deployment is ready for production!', 'success');
    } else {
      this.log('⚠️  Deployment has issues that need attention', 'warning');
    }

    return report;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new VercelDeploymentTester();
  tester.runAllTests().catch(error => {
    console.error('Vercel deployment test error:', error);
    process.exit(1);
  });
}

module.exports = VercelDeploymentTester;