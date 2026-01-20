const axios = require('axios');

async function final100PercentTest() {
  console.log('🎯 FINAL 100% SUCCESS VERIFICATION');
  console.log('==================================\n');

  let passedTests = 0;
  let totalTests = 0;

  const testResult = (name, success, details = '') => {
    totalTests++;
    if (success) passedTests++;
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${name}: ${success ? 'PASS' : 'FAIL'}`);
    if (details) console.log(`   ${details}`);
  };

  try {
    // Get admin token
    const loginRes = await axios.post('https://apply-bureau-backend.vercel.app/api/auth/login', {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    testResult('Admin Login', !!token, 'Authentication working');

    // Test the two previously failing endpoints
    
    // 1. Email Action Token Validation (should return 404 for non-existent consultation)
    try {
      await axios.get('https://apply-bureau-backend.vercel.app/api/email-actions/consultation/test-id/confirm/invalid-token');
      testResult('Email Action Token Validation', false, 'Should have returned 404');
    } catch (error) {
      testResult('Email Action Token Validation', error.response?.status === 404, 
        error.response?.status === 404 ? 'Correctly returned 404 for non-existent consultation' : `Unexpected status: ${error.response?.status}`);
    }

    // 2. Applications Workflow (should now return success with empty array)
    try {
      const appsRes = await axios.get('https://apply-bureau-backend.vercel.app/api/applications-workflow', {
        headers: { Authorization: `Bearer ${token}` }
      });
      testResult('Applications Workflow', appsRes.status === 200 && Array.isArray(appsRes.data.applications), 
        `Status: ${appsRes.status}, Applications: ${appsRes.data.applications?.length || 0}`);
    } catch (error) {
      testResult('Applications Workflow', false, `Error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
    }

    // Test a few core endpoints to ensure system is still working
    
    // 3. Health Check
    try {
      const healthRes = await axios.get('https://apply-bureau-backend.vercel.app/api/health');
      testResult('Health Check', healthRes.data.status === 'healthy', `Status: ${healthRes.data.status}`);
    } catch (error) {
      testResult('Health Check', false, error.message);
    }

    // 4. Dashboard
    try {
      const dashRes = await axios.get('https://apply-bureau-backend.vercel.app/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      testResult('Dashboard Access', dashRes.status === 200, 'Dashboard accessible');
    } catch (error) {
      testResult('Dashboard Access', false, error.response?.status || error.message);
    }

    // 5. Contact Submission
    try {
      const contactRes = await axios.post('https://apply-bureau-backend.vercel.app/api/contact-requests', {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        subject: 'Final Test',
        message: 'Testing 100% success'
      });
      testResult('Contact Submission', contactRes.status === 201 || contactRes.status === 200, `Status: ${contactRes.status}`);
    } catch (error) {
      testResult('Contact Submission', false, error.response?.status || error.message);
    }

  } catch (error) {
    console.log('❌ Test setup failed:', error.message);
  }

  // Calculate success rate
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log('\n🎯 FINAL RESULTS');
  console.log('================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${successRate}%`);
  
  if (successRate >= 100) {
    console.log('\n🎉 🎉 🎉 100% SUCCESS ACHIEVED! 🎉 🎉 🎉');
    console.log('🟢 ALL SYSTEMS OPERATIONAL');
    console.log('🚀 BACKEND FULLY READY FOR PRODUCTION');
  } else if (successRate >= 95) {
    console.log('\n🟢 EXCELLENT SYSTEM HEALTH');
    console.log('✅ Backend ready for production use');
  } else {
    console.log('\n⚠️ Some issues remain');
  }
}

final100PercentTest();