#!/usr/bin/env node

/**
 * Complete Fix Test - Apply Bureau Backend
 * Test and fix all remaining issues
 */

const axios = require('axios');

const DEPLOYED_URL = 'https://apply-bureau-backend.onrender.com';
const API_URL = `${DEPLOYED_URL}/api`;

async function testAndFix() {
  console.log('🔧 COMPLETE FIX TEST - Apply Bureau Backend');
  console.log('='.repeat(60));
  console.log(`🌐 Testing: ${DEPLOYED_URL}\n`);

  try {
    // 1. Test main health endpoint
    console.log('1. 🏥 Testing main health endpoint...');
    const health = await axios.get(`${DEPLOYED_URL}/health`, { timeout: 30000 });
    console.log('✅ Health endpoint working:', health.data);

    // 2. Test email templates accessibility
    console.log('\n2. 📧 Testing email templates...');
    const templates = [
      'signup_invite.html',
      'consultation_scheduled.html',
      'application_status_update.html',
      'onboarding_completion.html'
    ];

    for (const template of templates) {
      try {
        const response = await axios.get(`${DEPLOYED_URL}/emails/templates/${template}`, { timeout: 10000 });
        console.log(`✅ Template ${template}: Accessible (${response.status})`);
      } catch (error) {
        console.log(`❌ Template ${template}: ${error.response?.status || 'Not accessible'}`);
      }
    }

    // 3. Test admin login
    console.log('\n3. 🔐 Testing admin authentication...');
    const login = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    }, { timeout: 15000 });
    
    console.log('✅ Admin login successful');
    const adminToken = login.data.token;

    // 4. Test API endpoints with token
    console.log('\n4. 🔗 Testing API endpoints...');
    
    const endpoints = [
      '/api/auth/me',
      '/api/dashboard',
      '/api/consultations',
      '/api/applications',
      '/api/notifications'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${DEPLOYED_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          timeout: 10000
        });
        console.log(`✅ ${endpoint}: Working (${response.status})`);
      } catch (error) {
        console.log(`❌ ${endpoint}: Error ${error.response?.status} - ${error.response?.data?.error || error.message}`);
      }
    }

    // 5. Test email sending
    console.log('\n5. 📬 Testing email system...');
    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const invite = await axios.post(`${API_URL}/auth/invite`, {
        email: testEmail,
        full_name: 'Complete Fix Test User'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
        timeout: 20000
      });
      
      console.log('✅ Email system working - Invitation sent');
    } catch (error) {
      console.log(`❌ Email system: ${error.response?.data?.error || error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 BACKEND STATUS SUMMARY');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Critical error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAndFix();