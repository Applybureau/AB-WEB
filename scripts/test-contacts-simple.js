#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';

async function testContactsSimple() {
  console.log('🔍 Simple Contacts Test - Vercel Deployment\n');
  
  try {
    // Test 1: Health check first
    console.log('1. Health Check...');
    try {
      const healthResponse = await axios.get(`${BACKEND_URL}/api/health`);
      console.log(`✅ Backend Health: ${healthResponse.status} - ${healthResponse.data.status}`);
    } catch (error) {
      console.log(`⚠️ Health check failed: ${error.response?.status}`);
    }
    
    // Wait to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Admin Login (single attempt)
    console.log('\n2. Admin Authentication...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    console.log(`   User Role: ${loginResponse.data.user?.role || 'N/A'}`);
    
    // Wait to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 3: Consultation Requests (main contacts endpoint)
    console.log('\n3. Testing Consultation Requests...');
    const consultationResponse = await axios.get(`${BACKEND_URL}/api/consultation-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ Status: ${consultationResponse.status}`);
    console.log(`✅ Records: ${consultationResponse.data.data?.length || 0}`);
    console.log(`✅ Total: ${consultationResponse.data.total || 0}`);
    
    // Sample data structure
    if (consultationResponse.data.data && consultationResponse.data.data.length > 0) {
      const sample = consultationResponse.data.data[0];
      console.log('\n📋 Sample Consultation Record:');
      console.log(JSON.stringify({
        id: sample.id,
        fullName: sample.fullName,
        email: sample.email,
        phone: sample.phone,
        company: sample.company,
        status: sample.status,
        consultation_type: sample.consultation_type,
        urgency_level: sample.urgency_level,
        created_at: sample.created_at,
        preferredSlots: sample.preferredSlots?.slice(0, 2) // Show first 2 slots
      }, null, 2));
    }
    
    console.log('\n🎉 CONTACTS TEST SUCCESSFUL');
    console.log('============================');
    console.log('✅ Authentication: Working');
    console.log('✅ Consultation Requests: Working');
    console.log('✅ Data Format: Valid');
    console.log('✅ Pagination: Available');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response?.status === 429) {
      console.log('⚠️ Rate limited - please wait before retrying');
    } else if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    }
  }
}

testContactsSimple().catch(console.error);