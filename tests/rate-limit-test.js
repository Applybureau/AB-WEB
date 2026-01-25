#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';

const testRateLimit = async () => {
  console.log('Testing if rate limiting has cleared...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'applybureau@gmail.com',
      password: 'Admin123@#'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ SUCCESS: Rate limiting cleared, login successful');
    console.log('Token received:', !!response.data.token);
    return true;
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('❌ Rate limiting still active:', error.response.data);
      return false;
    } else if (error.response?.status === 401) {
      console.log('⚠️ Rate limiting cleared but login failed (credentials issue)');
      return true; // Rate limiting is cleared
    } else {
      console.log('❌ Other error:', error.response?.status, error.response?.data || error.message);
      return false;
    }
  }
};

testRateLimit().then(cleared => {
  process.exit(cleared ? 0 : 1);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});