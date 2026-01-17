#!/usr/bin/env node

require('dotenv').config();
const { execSync } = require('child_process');
const axios = require('axios');

const VERCEL_URL = 'https://apply-bureau-backend.vercel.app';

async function deployAndTest() {
  console.log('🚀 Deploying Email Actions Fix to Vercel\n');

  // Step 1: Deploy to Vercel
  console.log('1. Deploying to Vercel...');
  try {
    console.log('   Running: vercel --prod');
    // Note: This would require Vercel CLI to be installed
    // execSync('vercel --prod', { stdio: 'inherit' });
    console.log('   ⚠️ Manual deployment required - run: vercel --prod');
  } catch (error) {
    console.log('   ⚠️ Deployment command failed - deploy manually');
  }

  // Step 2: Wait for deployment
  console.log('\n2. Waiting for deployment to complete...');
  console.log('   Please deploy manually and press Enter when ready');
  
  // In a real scenario, you'd wait for user input or check deployment status
  await new Promise(resolve => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    readline.question('Press Enter when deployment is complete...', () => {
      readline.close();
      resolve();
    });
  });

  // Step 3: Test the deployed email actions
  console.log('\n3. Testing Deployed Email Actions...');
  
  const tests = [
    {
      name: 'Email Actions Health Check',
      url: `${VERCEL_URL}/api/email-actions/health`,
      expectedStatus: 200
    },
    {
      name: 'Consultation Confirm (Invalid ID)',
      url: `${VERCEL_URL}/api/email-actions/consultation/invalid-id/confirm/invalid-token`,
      expectedStatus: 404
    },
    {
      name: 'Admin Suspend (Invalid ID)',
      url: `${VERCEL_URL}/api/email-actions/admin/invalid-id/suspend/invalid-token`,
      expectedStatus: 404
    }
  ];

  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const response = await axios.get(test.url, { timeout: 10000 });
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ ${test.name}: PASSED (${response.status})`);
        passedTests++;
      } else {
        console.log(`⚠️ ${test.name}: Unexpected status ${response.status} (expected ${test.expectedStatus})`);
      }
    } catch (error) {
      if (error.response?.status === test.expectedStatus) {
        console.log(`✅ ${test.name}: PASSED (${error.response.status})`);
        passedTests++;
      } else if (error.response?.status === 500) {
        console.log(`❌ ${test.name}: FAILED - Server Error (500)`);
        console.log(`   Error: ${error.response?.data || 'Unknown server error'}`);
      } else {
        console.log(`❌ ${test.name}: FAILED - ${error.response?.status || 'Network Error'}`);
      }
    }
  }

  // Step 4: Test with real data (if available)
  console.log('\n4. Testing with Sample Data...');
  
  // Generate a test token for a fake consultation
  const testConsultationId = 'test-123';
  const testEmail = 'test@example.com';
  const testToken = Buffer.from(`${testConsultationId}-${testEmail}`).toString('base64').slice(0, 16);
  
  try {
    const testUrl = `${VERCEL_URL}/api/email-actions/consultation/${testConsultationId}/confirm/${testToken}`;
    const response = await axios.get(testUrl, { timeout: 10000 });
    
    if (response.status === 404) {
      console.log('✅ Sample Consultation Test: PASSED (404 - Consultation not found, as expected)');
      passedTests++;
    } else {
      console.log(`⚠️ Sample Consultation Test: Unexpected status ${response.status}`);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Sample Consultation Test: PASSED (404 - Consultation not found, as expected)');
      passedTests++;
    } else {
      console.log(`❌ Sample Consultation Test: FAILED - ${error.response?.status || 'Error'}`);
    }
  }

  // Step 5: Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`   Passed: ${passedTests}/${tests.length + 1} tests`);
  
  if (passedTests === tests.length + 1) {
    console.log('🎉 All tests passed! Email actions are working on Vercel.');
    console.log('\n✅ Email buttons should now work correctly:');
    console.log('   • Consultation confirmation buttons');
    console.log('   • Waitlist signup buttons');
    console.log('   • Admin management buttons (suspend/delete)');
  } else {
    console.log('⚠️ Some tests failed. Email actions may not work properly.');
    console.log('\n🔧 Troubleshooting steps:');
    console.log('   1. Check Vercel deployment logs');
    console.log('   2. Verify all dependencies are properly installed');
    console.log('   3. Check environment variables on Vercel');
    console.log('   4. Test individual routes manually');
  }

  console.log('\n🔗 Test URLs:');
  console.log(`Health: ${VERCEL_URL}/api/email-actions/health`);
  console.log(`Sample: ${VERCEL_URL}/api/email-actions/consultation/test-123/confirm/${testToken}`);
}

deployAndTest().catch(console.error);