#!/usr/bin/env node

/**
 * Property-Based Test Runner for Consultation-to-Client Pipeline
 * 
 * This script runs all property-based tests for the consultation-to-client pipeline
 * and provides detailed reporting on test results and coverage.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Running Property-Based Tests for Consultation-to-Client Pipeline\n');

// Test configuration
const testFiles = [
  'tests/consultation-lifecycle-property.test.js',
  'tests/email-notification-property.test.js', 
  'tests/registration-token-security-property.test.js'
];

const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Ensure environment is set up for testing
process.env.NODE_ENV = 'test';
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-for-property-testing';
}

console.log('📋 Test Configuration:');
console.log(`- Environment: ${process.env.NODE_ENV}`);
console.log(`- Test files: ${testFiles.length}`);
console.log(`- JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
console.log('');

// Run each test file individually for better reporting
for (const testFile of testFiles) {
  const testName = path.basename(testFile, '.test.js');
  console.log(`🔍 Running ${testName}...`);
  
  try {
    const startTime = Date.now();
    
    // Run the specific test file
    const result = execSync(
      `npx jest ${testFile} --verbose --no-cache --forceExit`,
      { 
        encoding: 'utf8',
        cwd: __dirname + '/..',
        timeout: 120000 // 2 minutes timeout per test file
      }
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ ${testName} passed (${duration}ms)`);
    testResults.passed++;
    testResults.details.push({
      name: testName,
      status: 'passed',
      duration,
      output: result
    });
    
  } catch (error) {
    console.log(`❌ ${testName} failed`);
    console.log(`Error: ${error.message}`);
    
    testResults.failed++;
    testResults.details.push({
      name: testName,
      status: 'failed',
      error: error.message,
      output: error.stdout || error.stderr
    });
  }
  
  testResults.total++;
  console.log('');
}

// Generate test report
console.log('📊 Property-Based Test Results Summary');
console.log('=====================================');
console.log(`Total Tests: ${testResults.total}`);
console.log(`Passed: ${testResults.passed}`);
console.log(`Failed: ${testResults.failed}`);
console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
console.log('');

// Detailed results
console.log('📝 Detailed Results:');
console.log('===================');

for (const result of testResults.details) {
  console.log(`\n${result.status === 'passed' ? '✅' : '❌'} ${result.name}`);
  
  if (result.status === 'passed') {
    console.log(`   Duration: ${result.duration}ms`);
    
    // Extract property test statistics from Jest output
    const output = result.output;
    const propertyMatches = output.match(/Property \d+:/g);
    if (propertyMatches) {
      console.log(`   Properties tested: ${propertyMatches.length}`);
    }
    
    // Extract test run counts
    const runMatches = output.match(/numRuns: (\d+)/g);
    if (runMatches) {
      const totalRuns = runMatches.reduce((sum, match) => {
        const num = parseInt(match.match(/\d+/)[0]);
        return sum + num;
      }, 0);
      console.log(`   Total property test runs: ${totalRuns}`);
    }
    
  } else {
    console.log(`   Error: ${result.error}`);
    
    // Show relevant error details
    if (result.output) {
      const lines = result.output.split('\n');
      const errorLines = lines.filter(line => 
        line.includes('FAIL') || 
        line.includes('Error:') || 
        line.includes('Expected:') ||
        line.includes('Received:')
      ).slice(0, 5); // Show first 5 relevant error lines
      
      if (errorLines.length > 0) {
        console.log('   Details:');
        errorLines.forEach(line => console.log(`     ${line.trim()}`));
      }
    }
  }
}

// Property coverage report
console.log('\n🎯 Property Coverage Report:');
console.log('============================');

const propertyMappings = [
  {
    property: 'Property 1: Consultation lifecycle integrity',
    requirements: ['1.1', '1.4', '1.5', '2.3', '3.5'],
    testFile: 'consultation-lifecycle-property',
    description: 'Data integrity throughout consultation lifecycle'
  },
  {
    property: 'Property 2: Email notification consistency', 
    requirements: ['1.2', '1.3', '2.5', '2.6', '11.1', '11.2', '11.3', '11.4'],
    testFile: 'email-notification-property',
    description: 'Consistent email notifications for status changes'
  },
  {
    property: 'Property 3: Registration token security',
    requirements: ['2.4', '3.1', '3.2'],
    testFile: 'registration-token-security-property', 
    description: 'Secure token generation and validation'
  }
];

for (const mapping of propertyMappings) {
  const testResult = testResults.details.find(r => r.name === mapping.testFile);
  const status = testResult ? testResult.status : 'not run';
  const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏸️';
  
  console.log(`\n${icon} ${mapping.property}`);
  console.log(`   Requirements: ${mapping.requirements.join(', ')}`);
  console.log(`   Description: ${mapping.description}`);
  console.log(`   Status: ${status}`);
}

// Recommendations
console.log('\n💡 Recommendations:');
console.log('==================');

if (testResults.failed === 0) {
  console.log('🎉 All property-based tests passed! Your consultation-to-client pipeline');
  console.log('   maintains correctness properties across all tested scenarios.');
  console.log('');
  console.log('✨ Next steps:');
  console.log('   - Run integration tests to verify end-to-end functionality');
  console.log('   - Deploy to staging environment for user acceptance testing');
  console.log('   - Monitor property test performance in CI/CD pipeline');
} else {
  console.log('⚠️  Some property-based tests failed. This indicates potential issues');
  console.log('   with system correctness that should be addressed before deployment.');
  console.log('');
  console.log('🔧 Recommended actions:');
  console.log('   1. Review failed test details above');
  console.log('   2. Fix underlying implementation issues');
  console.log('   3. Re-run property tests to verify fixes');
  console.log('   4. Consider adding additional edge case handling');
}

// Save detailed report to file
const reportPath = path.join(__dirname, '..', 'test-reports', 'property-test-report.json');
const reportDir = path.dirname(reportPath);

if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total: testResults.total,
    passed: testResults.passed,
    failed: testResults.failed,
    successRate: Math.round((testResults.passed / testResults.total) * 100)
  },
  properties: propertyMappings.map(mapping => ({
    ...mapping,
    status: testResults.details.find(r => r.name === mapping.testFile)?.status || 'not run'
  })),
  details: testResults.details,
  environment: {
    nodeVersion: process.version,
    nodeEnv: process.env.NODE_ENV,
    jwtSecretSet: !!process.env.JWT_SECRET
  }
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Detailed report saved to: ${reportPath}`);

// Exit with appropriate code
process.exit(testResults.failed > 0 ? 1 : 0);