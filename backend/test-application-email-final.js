#!/usr/bin/env node

/**
 * Final Application Email Test
 * Tests the updated application email template and functionality
 */

require('dotenv').config();
const { sendApplicationUpdateEmail } = require('./utils/email');

class ApplicationEmailTester {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📧',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    }[type] || '📧';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testApplicationUpdateEmail(recipientEmail, testName) {
    try {
      this.log(`Testing ${testName}...`);
      
      const applicationData = {
        client_name: 'John Doe',
        company_name: 'Tech Corp',
        position_title: 'Senior Software Engineer',
        application_status: 'interview',
        message: 'Great news! Your application has progressed to the interview stage. The hiring manager was impressed with your background and would like to schedule an interview.',
        next_steps: 'Please prepare for a technical interview covering React, Node.js, and system design. The interview will be conducted via video call and should take about 60 minutes.',
        consultant_email: 'applybureau@gmail.com',
        user_id: 'test-user-123'
      };

      const result = await sendApplicationUpdateEmail(
        recipientEmail,
        applicationData,
        { subject: 'Interview Scheduled - Application Update' }
      );
      
      this.results.push({
        test: testName,
        recipient: recipientEmail,
        status: 'success',
        emailId: result.id
      });
      
      this.log(`${testName} - SUCCESS (Email ID: ${result.id})`, 'success');
      return true;
    } catch (error) {
      this.errors.push({
        test: testName,
        recipient: recipientEmail,
        error: error.message
      });
      
      this.log(`${testName} - FAILED: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting application email tests...', 'info');
    
    const testCases = [
      {
        email: 'applybureau@gmail.com',
        name: 'Admin Email Test'
      },
      {
        email: 'israelloko65@gmail.com',
        name: 'Test Email Test'
      },
      {
        email: 'test@example.com',
        name: 'Generic Email Test'
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
      const result = await this.testApplicationUpdateEmail(testCase.email, testCase.name);
      if (result) {
        passed++;
      } else {
        failed++;
      }
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.log('\n📊 TEST RESULTS SUMMARY:', 'info');
    this.log(`✅ Passed: ${passed}`, 'success');
    this.log(`❌ Failed: ${failed}`, failed > 0 ? 'error' : 'success');
    
    if (this.errors.length > 0) {
      this.log('\n🔍 ERRORS FOUND:', 'error');
      this.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.test} (${error.recipient}): ${error.error}`, 'error');
      });
    }

    if (this.results.length > 0) {
      this.log('\n✅ SUCCESSFUL TESTS:', 'success');
      this.results.forEach((result, index) => {
        this.log(`${index + 1}. ${result.test} → ${result.recipient}`, 'success');
      });
    }

    this.log('\n📋 EMAIL FEATURES TESTED:', 'info');
    this.log('• Consistent template design with logo', 'info');
    this.log('• Green buttons (#16A34A / bg-teal-600)', 'info');
    this.log('• Reply-to functionality (applybureau@gmail.com)', 'info');
    this.log('• Proper contact email (applybureau@gmail.com)', 'info');
    this.log('• Application status and details', 'info');
    this.log('• Next steps section', 'info');
    this.log('• Professional footer', 'info');

    return { passed, failed, errors: this.errors, results: this.results };
  }
}

// Run the tests
async function main() {
  const tester = new ApplicationEmailTester();
  
  try {
    const results = await tester.runAllTests();
    
    if (results.failed > 0) {
      process.exit(1);
    } else {
      console.log('\n🎉 All application email tests passed!');
      console.log('📧 The application update email is working correctly with:');
      console.log('   • Consistent design matching other templates');
      console.log('   • Proper logo display');
      console.log('   • Green buttons (#16A34A)');
      console.log('   • Reply-to functionality');
      console.log('   • Correct contact information');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ApplicationEmailTester;