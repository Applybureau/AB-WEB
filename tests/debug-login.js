#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';

const testLogin = async () => {
  console.log('Testing login with different credentials...');
  
  const credentials = [
    { email: 'admin@applybureau.com', password: 'Admin123@#' },
    { email: 'admin@example.com', password: 'AdminPassword123!' },
    { email: 'admin@applybureau.com', password: 'AdminPassword123!' }
  ];
  
  for (const cred of credentials) {
    try {
      console.log(`\nTrying: ${cred.email} / ${cred.password}`);
      
      const response = await axios.post(`${BASE_URL}/api/auth/login`, cred, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      console.log('✅ SUCCESS:', response.data);
      return;
    } catch (error) {
      console.log('❌ FAILED:', error.response?.status, error.response?.data || error.message);
    }
  }
  
  console.log('\n🔍 All login attempts failed. Checking server health...');
  
  try {
    const healthResponse = await axios.get(`${BASE_URL}/api/health`, { timeout: 10000 });
    console.log('✅ Server is responding:', healthResponse.status);
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
  }
};

testLogin().catch(console.error);