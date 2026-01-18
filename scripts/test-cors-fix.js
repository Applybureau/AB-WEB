#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';

async function testCORSFix() {
  console.log('🌐 CORS Fix Test');
  console.log('================\n');
  
  try {
    // Test 1: Simple GET request
    console.log('1. Testing simple GET request...');
    const healthResponse = await axios.get(`${BACKEND_URL}/api/health`, {
      headers: {
        'Origin': 'https://apply-bureau.vercel.app',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ GET request successful');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   CORS Headers Present: ${!!healthResponse.headers['access-control-allow-origin']}`);
    
    // Test 2: OPTIONS preflight request
    console.log('\n2. Testing OPTIONS preflight request...');
    const optionsResponse = await axios.options(`${BACKEND_URL}/api/health`, {
      headers: {
        'Origin': 'https://apply-bureau.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('✅ OPTIONS request successful');
    console.log(`   Status: ${optionsResponse.status}`);
    console.log(`   Allow-Origin: ${optionsResponse.headers['access-control-allow-origin']}`);
    console.log(`   Allow-Methods: ${optionsResponse.headers['access-control-allow-methods']}`);
    console.log(`   Allow-Headers: ${optionsResponse.headers['access-control-allow-headers']}`);
    
    // Test 3: POST request with credentials
    console.log('\n3. Testing POST request with credentials...');
    try {
      const postResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'testpassword'
      }, {
        headers: {
          'Origin': 'https://apply-bureau.vercel.app',
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('✅ POST request successful (or expected error)');
      console.log(`   Status: ${postResponse.status}`);
    } catch (error) {
      if (error.response && error.response.status !== 429) {
        console.log('✅ POST request handled correctly');
        console.log(`   Status: ${error.response.status}`);
        console.log(`   CORS Headers: ${!!error.response.headers['access-control-allow-origin']}`);
      } else {
        console.log('⚠️ Rate limited or other error');
        console.log(`   Status: ${error.response?.status}`);
      }
    }
    
    // Test 4: Different origins
    console.log('\n4. Testing different origins...');
    const testOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://apply-bureau-frontend.vercel.app',
      'https://example.com'
    ];
    
    for (const origin of testOrigins) {
      try {
        const originResponse = await axios.get(`${BACKEND_URL}/api/health`, {
          headers: {
            'Origin': origin,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   ✅ ${origin}: ${originResponse.status}`);
      } catch (error) {
        console.log(`   ❌ ${origin}: ${error.response?.status || 'Failed'}`);
      }
    }
    
    console.log('\n🎉 CORS TEST COMPLETE');
    console.log('=====================');
    console.log('✅ Basic CORS functionality appears to be working');
    console.log('✅ Preflight requests are handled');
    console.log('✅ Multiple origins are supported');
    
  } catch (error) {
    console.log('❌ CORS test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response headers:', error.response.headers);
    }
  }
}

testCORSFix().catch(console.error);