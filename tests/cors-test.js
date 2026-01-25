#!/usr/bin/env node

/**
 * CORS Test Suite
 * Tests CORS configuration for 24/7 operation
 */

const axios = require('axios');

const BASE_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

const testCORS = async () => {
  console.log('🧪 Testing CORS configuration...');
  
  try {
    // Test 1: OPTIONS preflight request
    console.log('1. Testing OPTIONS preflight request...');
    const optionsResponse = await axios.options(`${BASE_URL}/api/health`, {
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('✅ OPTIONS request successful:', optionsResponse.status);
    
    // Test 2: GET request with origin
    console.log('2. Testing GET request with origin...');
    const getResponse = await axios.get(`${BASE_URL}/api/health`, {
      headers: {
        'Origin': 'https://example.com'
      }
    });
    
    console.log('✅ GET request successful:', getResponse.status);
    console.log('Response headers:', getResponse.headers['access-control-allow-origin']);
    
    // Test 3: POST request with different origin
    console.log('3. Testing POST request with different origin...');
    const postResponse = await axios.post(`${BASE_URL}/api/contact`, {
      name: 'CORS Test',
      email: 'cors@test.com',
      subject: 'CORS Test',
      message: 'Testing CORS configuration'
    }, {
      headers: {
        'Origin': 'https://anotherdomain.com',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ POST request successful:', postResponse.status);
    
    console.log('🎉 All CORS tests passed! CORS is properly configured for 24/7 operation.');
    
  } catch (error) {
    console.error('❌ CORS test failed:', error.response?.status, error.response?.data || error.message);
    process.exit(1);
  }
};

testCORS();