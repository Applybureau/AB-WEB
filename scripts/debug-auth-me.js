#!/usr/bin/env node

/**
 * Debug /api/auth/me endpoint
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const DEPLOYED_URL = 'https://apply-bureau-backend.onrender.com';
const API_URL = `${DEPLOYED_URL}/api`;

async function debugAuthMe() {
  try {
    console.log('🔍 Debugging /api/auth/me endpoint...\n');
    
    // 1. Login first
    console.log('1. Logging in...');
    const login = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful');
    console.log('Token:', login.data.token.substring(0, 50) + '...');
    console.log('User from login:', login.data.user);
    
    // 2. Decode token to see structure
    const decoded = jwt.decode(login.data.token);
    console.log('\n2. Token payload:', decoded);
    
    // 3. Try /api/auth/me
    console.log('\n3. Testing /api/auth/me...');
    try {
      const me = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${login.data.token}` }
      });
      console.log('✅ /api/auth/me successful:', me.data);
    } catch (error) {
      console.log('❌ /api/auth/me failed:', error.response?.data);
      console.log('Status:', error.response?.status);
    }
    
  } catch (error) {
    console.error('Debug failed:', error.message);
  }
}

debugAuthMe();