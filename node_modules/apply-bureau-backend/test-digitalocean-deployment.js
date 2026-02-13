#!/usr/bin/env node

// Minimal DigitalOcean Deployment Test
async function testDeployment() {
  console.log('🔍 Testing DigitalOcean Deployment...\n');
  
  const baseUrl = 'https://apply-bureau-backend-production.ondigitalocean.app';
  
  try {
    console.log('Testing health endpoint...');
    const response = await fetch(baseUrl + '/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health check PASSED');
      console.log('   Status:', response.status);
      console.log('   Service:', data.service || 'Unknown');
      console.log('   Timestamp:', data.timestamp || 'Unknown');
    } else {
      console.log('❌ Health check FAILED');
      console.log('   Status:', response.status);
      console.log('   Response:', await response.text());
    }
  } catch (error) {
    console.log('❌ Health check ERROR');
    console.log('   Error:', error.message);
    console.log('\n🚨 This usually means:');
    console.log('   1. App is not deployed or failed to start');
    console.log('   2. Environment variables are missing');
    console.log('   3. Health check endpoint is not responding');
  }
}

testDeployment();
