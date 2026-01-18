#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';

async function testContactsFocused() {
  console.log('🔍 Focused Contacts Fetching Test\n');
  
  try {
    // Use a longer delay between requests to avoid rate limiting
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Step 1: Admin Login
    console.log('1. Admin Authentication...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    await delay(2000); // Wait 2 seconds
    
    // Step 2: Test Main Consultation Requests Endpoint
    console.log('\n2. Testing Consultation Requests...');
    const consultationResponse = await axios.get(`${BACKEND_URL}/api/consultation-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ Status: ${consultationResponse.status}`);
    console.log(`✅ Total Records: ${consultationResponse.data.data?.length || 0}`);
    
    // Log detailed response structure
    console.log('\n📋 Response Structure:');
    console.log('- Root Keys:', Object.keys(consultationResponse.data));
    
    if (consultationResponse.data.data && consultationResponse.data.data.length > 0) {
      const sample = consultationResponse.data.data[0];
      console.log('- Sample Record Keys:', Object.keys(sample));
      console.log('- Sample Data:', JSON.stringify({
        id: sample.id,
        name: sample.name,
        email: sample.email,
        phone: sample.phone,
        company: sample.company,
        status: sample.status,
        created_at: sample.created_at,
        consultation_type: sample.consultation_type,
        business_stage: sample.business_stage
      }, null, 2));
    }
    
    await delay(2000); // Wait 2 seconds
    
    // Step 3: Test with Pagination
    console.log('\n3. Testing Pagination...');
    const paginatedResponse = await axios.get(`${BACKEND_URL}/api/consultation-requests?page=1&limit=3`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ Paginated Status: ${paginatedResponse.status}`);
    console.log('✅ Pagination Info:', {
      page: paginatedResponse.data.page,
      limit: paginatedResponse.data.limit,
      total: paginatedResponse.data.total,
      totalPages: paginatedResponse.data.totalPages,
      recordsReturned: paginatedResponse.data.data?.length
    });
    
    await delay(2000); // Wait 2 seconds
    
    // Step 4: Test Dashboard Endpoint
    console.log('\n4. Testing Dashboard Contacts...');
    try {
      const dashboardResponse = await axios.get(`${BACKEND_URL}/api/dashboard/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`✅ Dashboard Status: ${dashboardResponse.status}`);
      console.log(`✅ Dashboard Records: ${dashboardResponse.data.data?.length || 0}`);
      
      if (dashboardResponse.data.data && dashboardResponse.data.data.length > 0) {
        const sample = dashboardResponse.data.data[0];
        console.log('- Dashboard Sample:', {
          id: sample.id,
          name: sample.name || sample.fullName,
          email: sample.email,
          type: sample.type
        });
      }
      
    } catch (dashError) {
      console.log(`❌ Dashboard Error: ${dashError.response?.status} - ${dashError.response?.statusText}`);
    }
    
    console.log('\n🎉 FOCUSED TEST COMPLETE');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      if (error.response.status === 429) {
        console.log('Rate limit hit. Please wait before retrying.');
      }
    }
  }
}

testContactsFocused().catch(console.error);