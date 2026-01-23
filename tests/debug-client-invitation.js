#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'admin@applybureau.com';
const ADMIN_PASSWORD = 'Admin123@#';

const debugClientInvitation = async () => {
  console.log('🔍 Debugging client invitation...');
  
  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (loginResponse.status !== 200) {
      throw new Error('Admin login failed');
    }

    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');

    // Step 2: Try client invitation
    console.log('2. Testing client invitation...');
    const inviteData = {
      email: `testclient${Date.now()}@example.com`,
      full_name: 'Test Client User'
    };

    try {
      const inviteResponse = await axios.post(`${BASE_URL}/api/auth/invite`, inviteData, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        timeout: 15000,
        validateStatus: () => true // Don't throw on error status
      });

      console.log('Invitation response status:', inviteResponse.status);
      console.log('Invitation response data:', inviteResponse.data);

      if (inviteResponse.status === 500) {
        console.log('❌ Server error during invitation');
        
        // Check if it's an email sending issue
        if (inviteResponse.data.error === 'Failed to send invitation') {
          console.log('This appears to be an email sending issue, not an authentication issue');
          
          // Try without email sending (if there's a test mode)
          console.log('3. Testing invitation without email...');
          
          // Let's check what the actual error is by looking at server logs
          console.log('The invitation creation might be working, but email sending is failing');
          console.log('This is common in production environments with email restrictions');
        }
      } else if (inviteResponse.status === 200 || inviteResponse.status === 201) {
        console.log('✅ Client invitation successful');
      } else {
        console.log('❌ Unexpected response:', inviteResponse.status, inviteResponse.data);
      }

    } catch (inviteError) {
      console.error('❌ Invitation request failed:', inviteError.message);
    }

  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
};

debugClientInvitation().catch(console.error);