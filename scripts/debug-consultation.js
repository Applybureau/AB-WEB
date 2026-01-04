#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

async function debugConsultation() {
  console.log('🔍 Debugging Consultation Creation...\n');

  try {
    // Login as admin
    const loginResult = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });

    const adminToken = loginResult.data.token;
    console.log('✅ Admin login successful');

    // Get client ID
    const { supabaseAdmin } = require('../utils/supabase');
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('email', 'israelloko65@gmail.com')
      .single();

    if (!client) {
      console.log('❌ No client found');
      return;
    }

    console.log('✅ Client found:', client.id);

    // Try consultation creation with different field combinations
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    console.log('\n🔧 Testing with admin_notes field...');
    try {
      const result1 = await axios.post(`${API_URL}/consultations`, {
        client_id: client.id,
        scheduled_at: futureDate.toISOString(),
        admin_notes: 'Test consultation with admin_notes field'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Success with admin_notes:', result1.data);
    } catch (error) {
      console.log('❌ Failed with admin_notes:', error.response?.data || error.message);
    }

    console.log('\n🔧 Testing with notes field...');
    try {
      const result2 = await axios.post(`${API_URL}/consultations`, {
        client_id: client.id,
        scheduled_at: futureDate.toISOString(),
        notes: 'Test consultation with notes field'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Success with notes:', result2.data);
    } catch (error) {
      console.log('❌ Failed with notes:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugConsultation();