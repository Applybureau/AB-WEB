#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';

async function testContactsFetchingVercel() {
  console.log('🔍 Testing Contacts Fetching on Vercel Deployment\n');
  
  try {
    // Step 1: Admin Login
    console.log('1. Admin Authentication...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    
    // Step 2: Test Consultation Requests Endpoint
    console.log('\n2. Testing Consultation Requests Endpoint...');
    try {
      const consultationResponse = await axios.get(`${BACKEND_URL}/api/consultation-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`✅ Consultation Requests - Status: ${consultationResponse.status}`);
      console.log(`   Total Records: ${consultationResponse.data.data?.length || 0}`);
      console.log(`   Response Structure:`, Object.keys(consultationResponse.data));
      
      if (consultationResponse.data.data && consultationResponse.data.data.length > 0) {
        const sample = consultationResponse.data.data[0];
        console.log(`   Sample Record Keys:`, Object.keys(sample));
        console.log(`   Sample Record:`, {
          id: sample.id,
          name: sample.name || sample.fullName,
          email: sample.email,
          status: sample.status,
          created_at: sample.created_at
        });
      }
      
    } catch (error) {
      console.log(`❌ Consultation Requests - Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log(`   Details:`, error.response.data);
      }
    }
    
    // Step 3: Test Contact Requests Endpoint
    console.log('\n3. Testing Contact Requests Endpoint...');
    try {
      const contactResponse = await axios.get(`${BACKEND_URL}/api/contact-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`✅ Contact Requests - Status: ${contactResponse.status}`);
      console.log(`   Total Records: ${contactResponse.data.data?.length || 0}`);
      console.log(`   Response Structure:`, Object.keys(contactResponse.data));
      
      if (contactResponse.data.data && contactResponse.data.data.length > 0) {
        const sample = contactResponse.data.data[0];
        console.log(`   Sample Record Keys:`, Object.keys(sample));
        console.log(`   Sample Record:`, {
          id: sample.id,
          name: sample.name || sample.full_name,
          email: sample.email,
          subject: sample.subject,
          created_at: sample.created_at
        });
      }
      
    } catch (error) {
      console.log(`❌ Contact Requests - Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log(`   Details:`, error.response.data);
      }
    }
    
    // Step 4: Test Dashboard Contacts Endpoint
    console.log('\n4. Testing Dashboard Contacts Endpoint...');
    try {
      const dashboardResponse = await axios.get(`${BACKEND_URL}/api/dashboard/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`✅ Dashboard Contacts - Status: ${dashboardResponse.status}`);
      console.log(`   Total Records: ${dashboardResponse.data.data?.length || 0}`);
      console.log(`   Response Structure:`, Object.keys(dashboardResponse.data));
      
      if (dashboardResponse.data.data && dashboardResponse.data.data.length > 0) {
        const sample = dashboardResponse.data.data[0];
        console.log(`   Sample Record Keys:`, Object.keys(sample));
        console.log(`   Sample Record:`, {
          id: sample.id,
          name: sample.name || sample.fullName,
          email: sample.email,
          type: sample.type,
          created_at: sample.created_at
        });
      }
      
    } catch (error) {
      console.log(`❌ Dashboard Contacts - Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log(`   Details:`, error.response.data);
      }
    }
    
    // Step 5: Test Admin Dashboard Contacts
    console.log('\n5. Testing Admin Dashboard Contacts...');
    try {
      const adminDashboardResponse = await axios.get(`${BACKEND_URL}/api/admin-dashboard/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`✅ Admin Dashboard Contacts - Status: ${adminDashboardResponse.status}`);
      console.log(`   Total Records: ${adminDashboardResponse.data.data?.length || 0}`);
      console.log(`   Response Structure:`, Object.keys(adminDashboardResponse.data));
      
      if (adminDashboardResponse.data.data && adminDashboardResponse.data.data.length > 0) {
        const sample = adminDashboardResponse.data.data[0];
        console.log(`   Sample Record Keys:`, Object.keys(sample));
        console.log(`   Sample Record:`, {
          id: sample.id,
          name: sample.name || sample.fullName,
          email: sample.email,
          type: sample.type,
          status: sample.status,
          created_at: sample.created_at
        });
      }
      
    } catch (error) {
      console.log(`❌ Admin Dashboard Contacts - Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log(`   Details:`, error.response.data);
      }
    }
    
    // Step 6: Test with Pagination
    console.log('\n6. Testing Pagination Parameters...');
    try {
      const paginatedResponse = await axios.get(`${BACKEND_URL}/api/consultation-requests?page=1&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`✅ Paginated Request - Status: ${paginatedResponse.status}`);
      console.log(`   Records Returned: ${paginatedResponse.data.data?.length || 0}`);
      console.log(`   Pagination Info:`, {
        page: paginatedResponse.data.page,
        limit: paginatedResponse.data.limit,
        total: paginatedResponse.data.total,
        totalPages: paginatedResponse.data.totalPages
      });
      
    } catch (error) {
      console.log(`❌ Paginated Request - Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.statusText}`);
    }
    
    // Step 7: Test Filtering
    console.log('\n7. Testing Filtering Parameters...');
    try {
      const filteredResponse = await axios.get(`${BACKEND_URL}/api/consultation-requests?status=pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`✅ Filtered Request - Status: ${filteredResponse.status}`);
      console.log(`   Filtered Records: ${filteredResponse.data.data?.length || 0}`);
      
      if (filteredResponse.data.data && filteredResponse.data.data.length > 0) {
        const statuses = [...new Set(filteredResponse.data.data.map(item => item.status))];
        console.log(`   Status Values Found:`, statuses);
      }
      
    } catch (error) {
      console.log(`❌ Filtered Request - Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.statusText}`);
    }
    
    // Step 8: Test Search
    console.log('\n8. Testing Search Parameters...');
    try {
      const searchResponse = await axios.get(`${BACKEND_URL}/api/consultation-requests?search=gmail`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`✅ Search Request - Status: ${searchResponse.status}`);
      console.log(`   Search Results: ${searchResponse.data.data?.length || 0}`);
      
      if (searchResponse.data.data && searchResponse.data.data.length > 0) {
        const sample = searchResponse.data.data[0];
        console.log(`   Sample Search Result:`, {
          name: sample.name || sample.fullName,
          email: sample.email
        });
      }
      
    } catch (error) {
      console.log(`❌ Search Request - Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.statusText}`);
    }
    
    // Step 9: Test Individual Contact Fetch
    console.log('\n9. Testing Individual Contact Fetch...');
    try {
      // First get a consultation ID
      const consultationsResponse = await axios.get(`${BACKEND_URL}/api/consultation-requests?limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (consultationsResponse.data.data && consultationsResponse.data.data.length > 0) {
        const consultationId = consultationsResponse.data.data[0].id;
        
        const individualResponse = await axios.get(`${BACKEND_URL}/api/consultation-requests/${consultationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`✅ Individual Contact - Status: ${individualResponse.status}`);
        console.log(`   Record ID: ${individualResponse.data.id}`);
        console.log(`   Record Keys:`, Object.keys(individualResponse.data));
        
      } else {
        console.log('⚠️ No consultations available for individual fetch test');
      }
      
    } catch (error) {
      console.log(`❌ Individual Contact - Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.statusText}`);
    }
    
    // Step 10: Performance Test
    console.log('\n10. Performance Testing...');
    const startTime = Date.now();
    
    try {
      const performanceResponse = await axios.get(`${BACKEND_URL}/api/consultation-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✅ Performance Test - Status: ${performanceResponse.status}`);
      console.log(`   Response Time: ${responseTime}ms`);
      console.log(`   Records Fetched: ${performanceResponse.data.data?.length || 0}`);
      console.log(`   Performance Rating: ${responseTime < 1000 ? 'Excellent' : responseTime < 2000 ? 'Good' : 'Needs Improvement'}`);
      
    } catch (error) {
      console.log(`❌ Performance Test Failed - Status: ${error.response?.status}`);
    }
    
    console.log('\n🎉 CONTACTS FETCHING TEST COMPLETE');
    console.log('=====================================');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testContactsFetchingVercel().catch(console.error);