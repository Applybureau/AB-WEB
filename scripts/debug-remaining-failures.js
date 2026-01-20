const axios = require('axios');

async function debugRemainingFailures() {
  console.log('🔍 DEBUGGING REMAINING 8% FAILURES');
  console.log('===================================\n');

  try {
    // Get admin token first
    console.log('1. Getting admin token...');
    const loginRes = await axios.post('https://apply-bureau-backend.vercel.app/api/auth/login', {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    console.log('✅ Admin token obtained\n');

    // Test 1: Email Action Token Validation - Debug the exact behavior
    console.log('2. Testing Email Action Token Validation...');
    try {
      const emailActionRes = await axios.get('https://apply-bureau-backend.vercel.app/api/email-actions/consultation/test-id/confirm/invalid-token');
      console.log('❌ Unexpected success:', emailActionRes.status, emailActionRes.data);
    } catch (error) {
      console.log('Status:', error.response?.status);
      console.log('Response type:', typeof error.response?.data);
      console.log('Response preview:', error.response?.data?.substring ? error.response.data.substring(0, 200) + '...' : error.response?.data);
      
      if (error.response?.status === 404) {
        console.log('✅ Email action correctly returns 404 for non-existent consultation');
      } else if (error.response?.status === 403) {
        console.log('✅ Email action correctly returns 403 for invalid token');
      } else {
        console.log('❌ Unexpected status:', error.response?.status);
      }
    }
    console.log('');

    // Test 2: Applications Workflow - Debug the exact error
    console.log('3. Testing Applications Workflow...');
    try {
      const appsRes = await axios.get('https://apply-bureau-backend.vercel.app/api/applications-workflow', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Applications workflow success:', {
        applications: appsRes.data.applications?.length || 0,
        total: appsRes.data.total,
        structure: Object.keys(appsRes.data)
      });
    } catch (error) {
      console.log('❌ Applications workflow error:');
      console.log('Status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      console.log('Error message:', error.message);
      
      if (error.response?.status === 429) {
        console.log('⚠️ Rate limited - this is expected during heavy testing');
      }
    }
    console.log('');

    // Test 3: Check if applications table exists
    console.log('4. Checking applications table structure...');
    try {
      // Try to get applications with a simple query
      const simpleAppsRes = await axios.get('https://apply-bureau-backend.vercel.app/api/applications-workflow?limit=1', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Applications table accessible:', simpleAppsRes.data);
    } catch (error) {
      console.log('❌ Applications table issue:', error.response?.data || error.message);
    }

  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

debugRemainingFailures();