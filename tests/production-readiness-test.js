#!/usr/bin/env node

/**
 * Production Readiness Test Suite
 * Comprehensive testing for production deployment
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Import test suites
const VercelDeploymentTester = require('./vercel-deployment-test');
const AuthSystemTester = require('./auth-system-test');
const FileUploadTester = require('./file-upload-test');
const EmailSystemTester = require('./email-system-test');

const VERCEL_URL = 'https://apply-bureau-backend.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

class ProductionReadinessTester {
  constructor() {
    this.results = {
      vercel_deployment: null,
      local_server: null,
      auth_system: null,
      file_upload: null,
      email_system: null,
      overall_score: 0,
      production_ready: false
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
    console.log(`${colors[type]}[PROD-TEST] ${message}${colors.reset}`);
  }

  async checkServerAvailability(url, name) {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 10000 });
      if (response.status === 200 && response.data.healthy) {
        this.log(`✅ ${name} server is available and healthy`, 'success');
        return true;
      } else {
        this.log(`❌ ${name} server is not healthy`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ ${name} server is not accessible: ${error.message}`, 'error');
      return false;
    }
  }

  async runVercelDeploymentTests() {
    this.log('\n🌐 Testing Vercel Deployment', 'header');
    
    try {
      const tester = new VercelDeploymentTester();
      const results = await tester.runAllTests();
      this.results.vercel_deployment = results;
      return results;
    } catch (error) {
      this.log(`Vercel deployment tests failed: ${error.message}`, 'error');
      this.results.vercel_deployment = { error: error.message };
      return null;
    }
  }

  async runAuthSystemTests(baseUrl) {
    this.log('\n🔐 Testing Authentication System', 'header');
    
    try {
      // Set the base URL for auth tests
      process.env.TEST_BASE_URL = baseUrl;
      
      const tester = new AuthSystemTester();
      const results = await tester.runAllTests();
      this.results.auth_system = results;
      return results;
    } catch (error) {
      this.log(`Auth system tests failed: ${error.message}`, 'error');
      this.results.auth_system = { error: error.message };
      return null;
    }
  }

  async runFileUploadTests(baseUrl) {
    this.log('\n📁 Testing File Upload System', 'header');
    
    try {
      // Set the base URL for file upload tests
      process.env.TEST_BASE_URL = baseUrl;
      
      const tester = new FileUploadTester();
      const results = await tester.runAllTests();
      this.results.file_upload = results;
      return results;
    } catch (error) {
      this.log(`File upload tests failed: ${error.message}`, 'error');
      this.results.file_upload = { error: error.message };
      return null;
    }
  }

  async runEmailSystemTests(baseUrl) {
    this.log('\n📧 Testing Email System', 'header');
    
    try {
      // Set the base URL for email tests
      process.env.TEST_BASE_URL = baseUrl;
      
      const tester = new EmailSystemTester();
      const results = await tester.runAllTests();
      this.results.email_system = results;
      return results;
    } catch (error) {
      this.log(`Email system tests failed: ${error.message}`, 'error');
      this.results.email_system = { error: error.message };
      return null;
    }
  }

  calculateOverallScore() {
    let totalScore = 0;
    let testCount = 0;

    // Vercel deployment score (40% weight)
    if (this.results.vercel_deployment && this.results.vercel_deployment.summary) {
      totalScore += this.results.vercel_deployment.summary.vercel_success_rate * 0.4;
      testCount++;
    }

    // Auth system score (25% weight)
    if (this.results.auth_system && this.results.auth_system.passed !== undefined) {
      const authScore = (this.results.auth_system.passed / (this.results.auth_system.passed + this.results.auth_system.failed)) * 100;
      totalScore += authScore * 0.25;
      testCount++;
    }

    // File upload score (20% weight)
    if (this.results.file_upload && this.results.file_upload.passed !== undefined) {
      const fileScore = (this.results.file_upload.passed / (this.results.file_upload.passed + this.results.file_upload.failed)) * 100;
      totalScore += fileScore * 0.2;
      testCount++;
    }

    // Email system score (15% weight)
    if (this.results.email_system && this.results.email_system.passed !== undefined) {
      const emailScore = (this.results.email_system.passed / (this.results.email_system.passed + this.results.email_system.failed)) * 100;
      totalScore += emailScore * 0.15;
      testCount++;
    }

    this.results.overall_score = testCount > 0 ? totalScore : 0;
    this.results.production_ready = this.results.overall_score >= 85;

    return this.results.overall_score;
  }

  generateProductionReport() {
    const report = {
      timestamp: new Date().toISOString(),
      test_environment: {
        vercel_url: VERCEL_URL,
        local_url: LOCAL_URL,
        node_version: process.version
      },
      results: this.results,
      recommendations: this.generateRecommendations(),
      deployment_checklist: this.generateDeploymentChecklist()
    };

    const reportPath = path.join(__dirname, 'production-readiness-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`\n📄 Production report saved to: ${reportPath}`, 'info');
    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.overall_score < 85) {
      recommendations.push('Overall score below production threshold (85%)');
    }

    if (this.results.vercel_deployment && this.results.vercel_deployment.summary) {
      if (this.results.vercel_deployment.summary.vercel_success_rate < 90) {
        recommendations.push('Vercel deployment has issues - review failed tests');
      }
    }

    if (this.results.auth_system && this.results.auth_system.failed > 0) {
      recommendations.push('Authentication system has failures - security risk');
    }

    if (this.results.file_upload && this.results.file_upload.failed > 0) {
      recommendations.push('File upload system has issues - may affect user experience');
    }

    if (this.results.email_system && this.results.email_system.failed > 0) {
      recommendations.push('Email system has issues - notifications may not work');
    }

    if (recommendations.length === 0) {
      recommendations.push('All systems are functioning well - ready for production!');
    }

    return recommendations;
  }

  generateDeploymentChecklist() {
    return {
      '✅ Server Health': this.results.vercel_deployment ? 'Tested' : 'Not Tested',
      '✅ Authentication': this.results.auth_system ? 'Tested' : 'Not Tested',
      '✅ File Uploads': this.results.file_upload ? 'Tested' : 'Not Tested',
      '✅ Email System': this.results.email_system ? 'Tested' : 'Not Tested',
      '✅ CORS Configuration': this.results.vercel_deployment ? 'Tested' : 'Not Tested',
      '✅ Rate Limiting': this.results.vercel_deployment ? 'Tested' : 'Not Tested',
      '✅ Security Headers': this.results.vercel_deployment ? 'Tested' : 'Not Tested',
      '✅ Database Connectivity': this.results.vercel_deployment ? 'Tested' : 'Not Tested',
      '✅ Performance': this.results.vercel_deployment ? 'Tested' : 'Not Tested'
    };
  }

  async runAllTests() {
    this.log('🚀 Starting Production Readiness Tests', 'header');
    this.log('=' .repeat(70), 'header');

    // Check server availability
    const vercelAvailable = await this.checkServerAvailability(VERCEL_URL, 'Vercel');
    const localAvailable = await this.checkServerAvailability(LOCAL_URL, 'Local');

    if (!vercelAvailable && !localAvailable) {
      this.log('❌ No servers available for testing', 'error');
      return this.generateProductionReport();
    }

    // Run Vercel deployment tests
    if (vercelAvailable) {
      await this.runVercelDeploymentTests();
    }

    // Choose the best available server for detailed tests
    const testUrl = vercelAvailable ? VERCEL_URL : LOCAL_URL;
    const testEnv = vercelAvailable ? 'Vercel' : 'Local';
    
    this.log(`\n🎯 Running detailed tests against ${testEnv} environment`, 'info');

    // Run comprehensive test suites
    await this.runAuthSystemTests(testUrl);
    await this.runFileUploadTests(testUrl);
    await this.runEmailSystemTests(testUrl);

    // Calculate overall score
    const overallScore = this.calculateOverallScore();

    // Generate final report
    const report = this.generateProductionReport();

    // Display results
    this.log('\n' + '='.repeat(70), 'header');
    this.log('🏁 PRODUCTION READINESS RESULTS', 'header');
    this.log('='.repeat(70), 'header');

    this.log(`Overall Score: ${overallScore.toFixed(1)}%`, 
             overallScore >= 90 ? 'success' : overallScore >= 70 ? 'warning' : 'error');

    this.log(`Production Ready: ${this.results.production_ready ? 'YES' : 'NO'}`, 
             this.results.production_ready ? 'success' : 'error');

    if (this.results.vercel_deployment && this.results.vercel_deployment.summary) {
      this.log(`Vercel Deployment: ${this.results.vercel_deployment.summary.vercel_success_rate.toFixed(1)}%`, 
               this.results.vercel_deployment.summary.vercel_success_rate >= 80 ? 'success' : 'warning');
    }

    // Show recommendations
    this.log('\n💡 RECOMMENDATIONS:', 'header');
    report.recommendations.forEach(rec => {
      this.log(`• ${rec}`, rec.includes('ready') ? 'success' : 'warning');
    });

    // Show deployment checklist
    this.log('\n📋 DEPLOYMENT CHECKLIST:', 'header');
    Object.entries(report.deployment_checklist).forEach(([item, status]) => {
      this.log(`${item}: ${status}`, status === 'Tested' ? 'success' : 'warning');
    });

    if (this.results.production_ready) {
      this.log('\n🎉 CONGRATULATIONS! Your backend is production-ready!', 'success');
    } else {
      this.log('\n⚠️  Please address the issues above before production deployment.', 'warning');
    }

    return report;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ProductionReadinessTester();
  tester.runAllTests().catch(error => {
    console.error('Production readiness test error:', error);
    process.exit(1);
  });
}

module.exports = ProductionReadinessTester;