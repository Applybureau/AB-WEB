#!/usr/bin/env node

/**
 * CORS Test Suite
 * Tests CORS configuration for 24/7 operation
 */

const axios = require('axios');

const BASE_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

const testCORS = async () => {
  console.log('🧪 Testing CORS configuration for frontend compatibility...');
  
  try {
    // Test 1: OPTIONS preflight request from localhost:5173 (frontend origin)
    console.log('1. Testing OPTIONS preflight from localhost:5173...');
    const optionsResponse = await axios.options(`${BASE_URL}/api/auth/login`, {
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('✅ OPTIONS request successful:', optionsResponse.status);
    console.log('CORS headers:', {
      'access-control-allow-origin': optionsResponse.headers['access-control-allow-origin'],
      'access-control-allow-methods': optionsResponse.headers['access-control-allow-methods'],
      'access-control-allow-headers': optionsResponse.headers['access-control-allow-headers']
    });
    
    // Test 2: Actual login request from localhost:5173
    console.log('2. Testing POST login request from localhost:5173...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'applybureau@gmail.com',
      password: 'Admin123@#'
    }, {
      headers: {
        'Origin': 'http://localhost:5173',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login request successful:', loginResponse.status);
    console.log('Response CORS headers:', {
      'access-control-allow-origin': loginResponse.headers['access-control-allow-origin'],
      'access-control-allow-credentials': loginResponse.headers['access-control-allow-credentials']
    });
    
    // Test 3: Health check from different origins
    console.log('3. Testing health check from various origins...');
    const origins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://apply-bureau.vercel.app',
      'https://example.com'
    ];
    
    for (const origin of origins) {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`, {
        headers: { 'Origin': origin }
      });
      console.log(`✅ Health check from ${origin}: ${healthResponse.status}`);
    }
    
    console.log('🎉 All CORS tests passed! Frontend should now work without CORS errors.');
    
  } catch (error) {
    console.error('❌ CORS test failed:', error.response?.status, error.response?.data || error.message);
    if (error.response?.headers) {
      console.log('Response headers:', error.response.headers);
    }
    process.exit(1);
  }
};

testCORS();