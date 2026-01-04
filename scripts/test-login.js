#!/usr/bin/env node

/**
 * Test Login Script
 * Tests admin login functionality
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3002';
const API_URL = `${BASE_URL}/api`;

async function testLogin() {
  console.log('🔐 Testing admin login...');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    console.log('Token:', response.data.token);
    
  } catch (error) {
    console.log('❌ Login failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    
    // Let's also check what users exist
    console.log('\n🔍 Checking database for admin user...');
    const { supabaseAdmin } = require('../utils/supabase');
    
    const { data: users, error: dbError } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name')
      .eq('email', 'admin@applybureau.com');
    
    if (dbError) {
      console.log('❌ Database error:', dbError);
    } else {
      console.log('👤 Found users:', users);
    }
  }
}

testLogin();