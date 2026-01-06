#!/usr/bin/env node

const axios = require('axios');

const DEPLOYED_URL = 'https://apply-bureau-backend.onrender.com';
const API_URL = `${DEPLOYED_URL}/api`;

async function quickTest() {
  try {
    console.log('🚀 QUICK TEST - Apply Bureau Backend\n');
    
    // 1. Login
    console.log('1. Testing login...');
    const login = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    console.log('✅ Login successful');
    
    const token = login.data.token;
    
    // 2. Test /api/auth/me
    console.log('2. Testing /api/auth/me...');
    try {
      const me = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ /api/auth/me working:', me.data.user.full_name);
    } catch (error) {
      console.log('❌ /api/auth/me failed:', error.response?.data);
    }
    
    // 3. Test dashboard
    console.log('3. Testing dashboard...');
    try {
      const dashboard = await axios.get(`${API_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Dashboard working:', dashboard.data.client.full_name);
    } catch (error) {
      console.log('❌ Dashboard failed:', error.response?.data);
    }
    
    // 4. Test notifications
    console.log('4. Testing notifications...');
    try {
      const notifications = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Notifications working:', notifications.data.notifications.length, 'notifications');
    } catch (error) {
      console.log('❌ Notifications failed:', error.response?.data);
    }
    
    console.log('\n🎯 QUICK TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

quickTest();