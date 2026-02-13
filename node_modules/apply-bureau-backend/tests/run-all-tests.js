#!/usr/bin/env node

/**
 * Master Test Runner
 * Runs all comprehensive backend tests and generates detailed report
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Import test suites
const AuthSystemTester = require('./auth-system-test');
const FileUploadTester = require('./file-upload-test');
const EmailSystemTester = require('./email-system-test');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

class MasterTestRunner {
  constructor() {
    this.results = {
      overall: { passed: 0, failed: 0, total: 0 },
      suites: {},
      startTime: new Date(),
      endTime: null,
      serverRunning: false
    };
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
    console.log(`${colors[type]}[MASTER-TEST] ${message}${colors.reset}`);
  }

  async checkServerHealth() {
    this.log('🔍 Checking server health...', 'info');
    
    try {
      const axios = require('axios');
      const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      
      if (response.status === 200 && response.data.healthy) {
        this.results.serverRunning = true;
        this.log('✅ Server is running and healthy', 'success');
        return true;
      } else {
        this.log('❌ Server is running but not healthy', 'error');
        return false;
      }
    } catch (error) {
      this.log('❌ Server is not running or not accessible', 'error');
      this.log(`   Error: ${error.message}`, 'error');
      return false;
    }
  }

  async startServerIfNeeded() {
    if (this.results.serverRunning) {
      return true;
    }

    this.log('🚀 Attempting to start server...', 'info');
    
    return new Promise((resolve) => {
      const serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
        detached: false
      });

      let serverStarted = false;
      const timeout = setTimeout(() => {
        if (!serverStarted) {
          this.log('⏰ Server start timeout - continuing with tests', 'warning');
          resolve(false);
        }
      }, 30000); // 30 second timeout

      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('started successfully') || output.includes('listening')) {
          if (!serverStarted) {
            serverStarted = true;
            clearTimeout(timeout);
            this.log('✅ Server started successfully', 'success');
            this.results.serverRunning = true;
            
            // Give server a moment to fully initialize
            setTimeout(() => resolve(true), 2000);
          }
        }
      });

      serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('EADDRINUSE')) {
          this.log('ℹ️  Server already running on port', 'info');
          if (!serverStarted) {
            serverStarted = true;
            clearTimeout(timeout);
            this.results.serverRunning = true;
            resolve(true);
          }
        }
      });

      serverProcess.on('error', (error) => {
        this.log(`❌ Failed to start server: ${error.message}`, 'error');
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }

  async runTestSuite(name, TesterClass) {
    this.log(`\n${'='.repeat(60)}`, 'header');
    this.log(`🧪 Running ${name} Test Suite`, 'header');
    this.log(`${'='.repeat(60)}`, 'header');

    try {
      const tester = new TesterClass();
      const results = await tester.runAllTests();
      
      this.results.suites[name] = {
        passed: results.passed,
        failed: results.failed,
        total: results.passed + results.failed,
        tests: results.tests || [],
        successRate: ((results.passed / (results.passed + results.failed)) * 100).toFixed(1)
      };

      this.results.overall.passed += results.passed;
      this.results.overall.failed += results.failed;
      this.results.overall.total += results.passed + results.failed;

      this.log(`✅ ${name} completed: ${results.passed}/${results.passed + results.failed} passed`, 'success');
      
    } catch (error) {
      this.log(`❌ ${name} failed to run: ${error.message}`, 'error');
      this.results.suites[name] = {
        passed: 0,
        failed: 1,
        total: 1,
        tests: [{ name: 'Suite Execution', status: 'FAILED', error: error.message }],
        successRate: '0.0'
      };
      this.results.overall.failed += 1;
      this.results.overall.total += 1;
    }
  }

  async runComprehensiveTest() {
    this.log('🔧 Running comprehensive backend test...', 'info');
    
    try {
      // Import and run the comprehensive test
      const { runAllTests } = require('./comprehensive-backend-test');
      await runAllTests();
      
      this.log('✅ Comprehensive test completed', 'success');
    } catch (error) {
      this.log(`❌ Comprehensive test failed: ${error.message}`, 'error');
    }
  }

  generateReport() {
    this.results.endTime = new Date();
    const duration = ((this.results.endTime - this.results.startTime) / 1000).toFixed(1);
    
    this.log('\n' + '='.repeat(80), 'header');
    this.log('📊 COMPREHENSIVE BACKEND TEST REPORT', 'header');
    this.log('='.repeat(80), 'header');
    
    this.log(`🕒 Test Duration: ${duration} seconds`, 'info');
    this.log(`🌐 Server URL: ${BASE_URL}`, 'info');
    this.log(`🖥️  Server Status: ${this.results.serverRunning ? 'Running' : 'Not Running'}`, 
             this.results.serverRunning ? 'success' : 'error');
    
    this.log('\n📈 OVERALL RESULTS:', 'header');
    this.log(`Total Tests: ${this.results.overall.total}`, 'info');
    this.log(`Passed: ${this.results.overall.passed}`, 'success');
    this.log(`Failed: ${this.results.overall.failed}`, this.results.overall.failed > 0 ? 'error' : 'success');
    
    const overallSuccessRate = this.results.overall.total > 0 
      ? ((this.results.overall.passed / this.results.overall.total) * 100).toFixed(1)
      : '0.0';
    
    this.log(`Success Rate: ${overallSuccessRate}%`, 
             overallSuccessRate >= 90 ? 'success' : overallSuccessRate >= 70 ? 'warning' : 'error');

    this.log('\n📋 TEST SUITE BREAKDOWN:', 'header');
    Object.entries(this.results.suites).forEach(([suiteName, results]) => {
      const status = results.successRate >= 80 ? 'success' : 'warning';
      this.log(`${suiteName}:`, 'info');
      this.log(`  ✓ Passed: ${results.passed}`, 'success');
      this.log(`  ✗ Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'success');
      this.log(`  📊 Success Rate: ${results.successRate}%`, status);
    });

    // Show failed tests
    const allFailedTests = [];
    Object.entries(this.results.suites).forEach(([suiteName, results]) => {
      const failedTests = results.tests.filter(t => t.status === 'FAILED');
      failedTests.forEach(test => {
        allFailedTests.push({ suite: suiteName, ...test });
      });
    });

    if (allFailedTests.length > 0) {
      this.log('\n❌ FAILED TESTS DETAILS:', 'error');
      allFailedTests.forEach(test => {
        this.log(`[${test.suite}] ${test.name}:`, 'error');
        this.log(`  Error: ${test.error}`, 'error');
      });
    }

    // Generate recommendations
    this.log('\n💡 RECOMMENDATIONS:', 'header');
    
    if (overallSuccessRate >= 95) {
      this.log('🎉 Excellent! Your backend is production-ready!', 'success');
    } else if (overallSuccessRate >= 85) {
      this.log('👍 Good job! Minor issues to address before production.', 'success');
    } else if (overallSuccessRate >= 70) {
      this.log('⚠️  Several issues detected. Review failed tests before deployment.', 'warning');
    } else {
      this.log('🚨 Critical issues detected. Backend needs significant work.', 'error');
    }

    if (!this.results.serverRunning) {
      this.log('• Ensure the server is running before testing', 'warning');
    }

    if (this.results.overall.failed > 0) {
      this.log('• Review and fix failed tests', 'warning');
      this.log('• Check environment configuration', 'warning');
      this.log('• Verify database connectivity', 'warning');
    }

    // Save report to file
    this.saveReportToFile();
  }

  saveReportToFile() {
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: ((this.results.endTime - this.results.startTime) / 1000).toFixed(1),
      serverUrl: BASE_URL,
      serverRunning: this.results.serverRunning,
      overall: this.results.overall,
      suites: this.results.suites,
      overallSuccessRate: this.results.overall.total > 0 
        ? ((this.results.overall.passed / this.results.overall.total) * 100).toFixed(1)
        : '0.0'
    };

    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    this.log(`\n📄 Detailed report saved to: ${reportPath}`, 'info');
  }

  async runAllTests() {
    this.log('🚀 Starting Master Test Runner', 'header');
    this.log(`Testing backend at: ${BASE_URL}`, 'info');
    
    // Check if server is running
    const serverHealthy = await this.checkServerHealth();
    
    if (!serverHealthy) {
      const serverStarted = await this.startServerIfNeeded();
      if (!serverStarted) {
        this.log('⚠️  Continuing tests without server (some tests will fail)', 'warning');
      }
    }

    // Run all test suites
    await this.runTestSuite('Authentication System', AuthSystemTester);
    await this.runTestSuite('File Upload System', FileUploadTester);
    await this.runTestSuite('Email System', EmailSystemTester);
    
    // Run comprehensive test
    await this.runComprehensiveTest();

    // Generate final report
    this.generateReport();

    // Exit with appropriate code
    const exitCode = this.results.overall.failed > 0 ? 1 : 0;
    process.exit(exitCode);
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new MasterTestRunner();
  runner.runAllTests().catch(error => {
    console.error('Master test runner error:', error);
    process.exit(1);
  });
}

module.exports = MasterTestRunner;