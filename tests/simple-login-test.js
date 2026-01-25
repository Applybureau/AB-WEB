#!/usr/bin/env node

/**
 * Simple Login Test
 * Tests login functionality with the correct admin credentials
 */

const axios = require('axios');

// Production configuration
const BASE_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';
const ADMIN_EMAIL = 'admin@applybureau.com';
const ADMIN_PASSWORD = 'Admin123@#';

const testLogin = async () => {
  console.log('🔐 Testing login functionality...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log('');

  try {
    // Test login
    console.log('Making login request...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Login successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    // Test protected endpoint with token
    if (response.data.token) {
      console.log('\n🔒 Testing protected endpoint...');
      const protectedResponse = await axios.get(`${BASE_URL}/api/admin-dashboard`, {
        headers: {
          'Authorization': `Bearer ${response.data.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log('✅ Protected endpoint access successful!');
      console.log('Dashboard response status:', protectedResponse.status);
      console.log('Dashboard data keys:', Object.keys(protectedResponse.data));
    }

  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Error status:', error.response?.status);
    console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🚨 Connection refused - server might be down');
    }
  }
};

testLogin();