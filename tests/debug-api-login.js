#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';

const testApiLogin = async () => {
  console.log('Testing API login with detailed debugging...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'Admin123@#'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
      validateStatus: () => true // Don't throw on error status
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data:', response.data);
    
    if (response.status === 200 && response.data.token) {
      console.log('✅ SUCCESS: Login successful');
      return true;
    } else {
      console.log('❌ FAILED: Login failed');
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error data:', error.response.data);
    }
    return false;
  }
};

testApiLogin().catch(console.error);