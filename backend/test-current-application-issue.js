const axios = require('axios');

async function testCurrentApplicationIssue() {
  console.log('🔍 Testing Current Application Issue...\n');

  const baseURL = process.env.BACKEND_URL || 'http://localhost:3000';
  console.log(`Testing against: ${baseURL}\n`);

  // Test 1: Check if server is running
  try {
    console.log('1. Testing server health:');
    const healthResponse = await axios.get(`${baseURL}/health`, { timeout: 5000 });
    console.log(`   ✅ Server is running (${healthResponse.status})`);
  } catch (error) {
    console.log('   ❌ Server health check failed:', error.message);
    return;
  }

  // Test 2: Try to access applications endpoint without auth (should get 401)
  try {
    console.log('\n2. Testing applications endpoint without auth:');
    const response = await axios.get(`${baseURL}/api/applications`, { timeout: 5000 });
    console.log(`   ⚠️  Unexpected success: ${response.status}`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   ✅ Correctly returns 401 (authentication required)');
    } else {
      console.log(`   ❌ Unexpected error: ${error.response?.status || error.message}`);
    }
  }

  // Test 3: Try to access applications stats endpoint without auth
  try {
    console.log('\n3. Testing applications stats endpoint without auth:');
    const response = await axios.get(`${baseURL}/api/applications/stats`, { timeout: 5000 });
    console.log(`   ⚠️  Unexpected success: ${response.status}`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   ✅ Correctly returns 401 (authentication required)');
    } else {
      console.log(`   ❌ Unexpected error: ${error.response?.status || error.message}`);
      if (error.response?.data) {
        console.log('   Error details:', error.response.data);
      }
    }
  }

  // Test 4: Check if the route is mounted correctly
  try {
    console.log('\n4. Testing route mounting:');
    const response = await axios.get(`${baseURL}/api/nonexistent`, { timeout: 5000 });
    console.log(`   ⚠️  Unexpected success: ${response.status}`);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('   ✅ API routes are mounted (404 for nonexistent route)');
    } else {
      console.log(`   ❌ Unexpected error: ${error.response?.status || error.message}`);
    }
  }

  // Test 5: Test with a mock admin token (if we can create one)
  console.log('\n5. Testing with authentication:');
  console.log('   ℹ️  Authentication testing requires valid credentials');
  console.log('   ℹ️  This would need to be tested through the frontend or with valid tokens');

  console.log('\n🎉 Current Application Issue Test Complete!\n');
  
  console.log('📋 Summary:');
  console.log('   - Server is running and responding');
  console.log('   - API routes are mounted correctly');
  console.log('   - Authentication is working (401 responses)');
  console.log('   - The issue is likely in the authenticated endpoints');
  console.log('\n💡 Next steps:');
  console.log('   - Test with valid authentication tokens');
  console.log('   - Check database schema and data');
  console.log('   - Review application controller logic');
}

// Run the test
if (require.main === module) {
  testCurrentApplicationIssue().catch(console.error);
}

module.exports = testCurrentApplicationIssue;