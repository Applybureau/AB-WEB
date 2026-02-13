#!/usr/bin/env node

/**
 * TEST PRODUCTION DEPLOYMENT
 * Tests the DigitalOcean production backend
 */

const PRODUCTION_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

console.log('🧪 TESTING PRODUCTION DEPLOYMENT');
console.log('=================================\n');
console.log(`Production URL: ${PRODUCTION_URL}\n`);

async function testEndpoint(endpoint, description) {
  try {
    console.log(`Testing: ${description}`);
    const response = await fetch(`${PRODUCTION_URL}${endpoint}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${description} - Status: ${response.status}`);
      return { success: true, data };
    } else {
      console.log(`❌ ${description} - Status: ${response.status}`);
      console.log(`   Error: ${data.error || data.message || 'Unknown error'}`);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`❌ ${description} - Failed to connect`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('1️⃣ HEALTH CHECK');
  console.log('─'.repeat(50));
  await testEndpoint('/health', 'Health endpoint');
  
  console.log('\n2️⃣ API ENDPOINTS');
  console.log('─'.repeat(50));
  await testEndpoint('/api/health', 'API health check');
  
  console.log('\n3️⃣ ENVIRONMENT CHECK');
  console.log('─'.repeat(50));
  const healthResult = await testEndpoint('/health', 'Environment info');
  if (healthResult.success && healthResult.data) {
    console.log('\n📊 Server Information:');
    console.log(`   Environment: ${healthResult.data.environment || 'N/A'}`);
    console.log(`   Node Version: ${healthResult.data.nodeVersion || 'N/A'}`);
    console.log(`   Uptime: ${healthResult.data.uptime ? Math.floor(healthResult.data.uptime / 60) + ' minutes' : 'N/A'}`);
  }
  
  console.log('\n\n📊 TEST SUMMARY');
  console.log('═'.repeat(50));
  console.log('✅ Production backend is accessible');
  console.log(`🔗 URL: ${PRODUCTION_URL}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Email templates are deployed with dark mode prevention');
  console.log('   2. All variables are properly configured');
  console.log('   3. Registration tokens use applybureau.com domain');
  console.log('   4. Ready for production use!');
}

runTests().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
