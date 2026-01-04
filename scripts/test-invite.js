#!/usr/bin/env node

/**
 * Test Invite Script
 * Tests the client invitation functionality
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3002';
const API_URL = `${BASE_URL}/api`;

async function testInvite() {
  console.log('📧 Testing client invitation...');
  
  try {
    // First login as admin
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Now send invitation
    console.log('📨 Sending invitation...');
    const inviteResponse = await axios.post(`${API_URL}/auth/invite`, {
      email: 'israelloko65@gmail.com',
      full_name: 'Israel Test User'
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Invitation sent successfully!');
    console.log('Response:', inviteResponse.data);
    
  } catch (error) {
    console.log('❌ Invitation failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    console.log('Full error:', error.message);
  }
}

testInvite();