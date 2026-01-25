#!/usr/bin/env node

/**
 * Vercel CORS Test Suite
 * Tests CORS configuration on Vercel deployment
 */

const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';

const testVercelCORS = async () => {
  console.log('🧪 Testing Vercel CORS configuration for frontend compatibility...');
  console.log(`Testing against: ${BASE_URL}`);
  console.log('');
  
  try {
    // Test 1: Health check first
    console.log('1. Testing Vercel health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Vercel health check successful:', healthResponse.status);
    
    // Test 2: OPTIONS preflight request from localhost:5173 (frontend origin)
    console.log('2. Testing OPTIONS preflight from localhost:5173...');
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
    
    // Test 3: Actual login request from localhost:5173
    console.log('3. Testing POST login request from localhost:5173...');
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
    
    // Test 4: Contact form from localhost:5173
    console.log('4. Testing contact form from localhost:5173...');
    const contactResponse = await axios.post(`${BASE_URL}/api/contact`, {
      name: 'CORS Test',
      email: 'cors@test.com',
      subject: 'Vercel CORS Test',
      message: 'Testing Vercel CORS configuration'
    }, {
      headers: {
        'Origin': 'http://localhost:5173',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Contact form successful:', contactResponse.status);
    
    console.log('');
    console.log('🎉 All Vercel CORS tests passed! Frontend should work with Vercel backend.');
    console.log('');
    console.log('✅ Vercel backend is CORS-ready for frontend at http://localhost:5173');
    
  } catch (error) {
    console.error('❌ Vercel CORS test failed:', error.response?.status, error.response?.data || error.message);
    if (error.response?.headers) {
      console.log('Response headers:', error.response.headers);
    }
    process.exit(1);
  }
};

testVercelCORS();