#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'https://apply-bureau-backend.vercel.app';

async function testDashboardContactsAuth() {
  console.log('🔍 Testing Dashboard Contacts 401 Error Issue\n');
  console.log(`Backend URL: ${BACKEND_URL}\n`);

  let adminToken = null;

  // Step 1: Test admin login
  console.log('1. Testing Admin Login:');
  try {
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'Admin123!'
    });
    
    adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    console.log(`   Token: ${adminToken.substring(0, 20)}...`);
    console.log(`   User: ${loginResponse.data.user.full_name} (${loginResponse.data.user.role})`);
  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.status, error.response?.data?.error);
    console.log('   Trying alternative admin credentials...');
    
    // Try alternative credentials
    try {
      const altLoginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: 'admin@applybureau.com',
        password: 'admin123'
      });
      
      adminToken = altLoginResponse.data.token;
      console.log('✅ Admin login successful (alternative credentials)');
    } catch (altError) {
      console.log('❌ Alternative admin login also failed:', altError.response?.status);
    }
  }

  // Step 2: Test /api/auth/me endpoint
  console.log('\n2. Testing Auth Me Endpoint:');
  if (adminToken) {
    try {
      const meResponse = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Auth me endpoint working');
      console.log(`   User ID: ${meResponse.data.user.id}`);
      console.log(`   Role: ${meResponse.data.user.role}`);
      console.log(`   Dashboard Type: ${meResponse.data.user.dashboard_type}`);
    } catch (error) {
      console.log('❌ Auth me endpoint failed:', error.response?.status, error.response?.data?.error);
    }
  } else {
    console.log('⚠️ Skipping auth me test (no token)');
  }

  // Step 3: Test contact endpoints
  console.log('\n3. Testing Contact Endpoints:');
  
  // Test GET /api/contact (admin only)
  if (adminToken) {
    try {
      const contactsResponse = await axios.get(`${BACKEND_URL}/api/contact`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ GET /api/contact working');
      console.log(`   Total contacts: ${contactsResponse.data.contacts?.length || 0}`);
      console.log(`   Pagination: ${JSON.stringify(contactsResponse.data.pagination || {})}`);
    } catch (error) {
      console.log('❌ GET /api/contact failed:', error.response?.status, error.response?.data?.error);
      
      if (error.response?.status === 401) {
        console.log('   🔍 401 Error Details:');
        console.log(`      - Token present: ${!!adminToken}`);
        console.log(`      - Token format: Bearer ${adminToken ? adminToken.substring(0, 10) + '...' : 'none'}`);
        console.log(`      - Response: ${JSON.stringify(error.response.data)}`);
      }
    }
  }

  // Step 4: Test consultation request endpoints
  console.log('\n4. Testing Consultation Request Endpoints:');
  
  if (adminToken) {
    try {
      const consultationsResponse = await axios.get(`${BACKEND_URL}/api/consultation-requests`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ GET /api/consultation-requests working');
      console.log(`   Total consultations: ${consultationsResponse.data.data?.length || 0}`);
    } catch (error) {
      console.log('❌ GET /api/consultation-requests failed:', error.response?.status, error.response?.data?.error);
    }
  }

  // Step 5: Test admin dashboard endpoint
  console.log('\n5. Testing Admin Dashboard Endpoint:');
  
  if (adminToken) {
    try {
      const dashboardResponse = await axios.get(`${BACKEND_URL}/api/admin-dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ GET /api/admin-dashboard working');
      console.log(`   Admin: ${dashboardResponse.data.admin?.full_name}`);
      console.log(`   Total clients: ${dashboardResponse.data.stats?.clients?.total_clients || 0}`);
    } catch (error) {
      console.log('❌ GET /api/admin-dashboard failed:', error.response?.status, error.response?.data?.error);
    }
  }

  // Step 6: Test admin dashboard clients endpoint
  console.log('\n6. Testing Admin Dashboard Clients Endpoint:');
  
  if (adminToken) {
    try {
      const clientsResponse = await axios.get(`${BACKEND_URL}/api/admin-dashboard/clients`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ GET /api/admin-dashboard/clients working');
      console.log(`   Total clients: ${clientsResponse.data.total || 0}`);
    } catch (error) {
      console.log('❌ GET /api/admin-dashboard/clients failed:', error.response?.status, error.response?.data?.error);
    }
  }

  // Step 7: Test token validation
  console.log('\n7. Token Validation Analysis:');
  if (adminToken) {
    try {
      // Decode JWT token (without verification for analysis)
      const tokenParts = adminToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('✅ Token structure valid');
        console.log(`   User ID: ${payload.userId || payload.id}`);
        console.log(`   Email: ${payload.email}`);
        console.log(`   Role: ${payload.role}`);
        console.log(`   Expires: ${new Date(payload.exp * 1000).toISOString()}`);
        console.log(`   Issued: ${new Date(payload.iat * 1000).toISOString()}`);
        
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          console.log('❌ Token is EXPIRED');
        } else {
          console.log('✅ Token is valid (not expired)');
        }
      }
    } catch (error) {
      console.log('❌ Token analysis failed:', error.message);
    }
  }

  // Step 8: Summary and recommendations
  console.log('\n📋 Summary and Recommendations:');
  
  if (!adminToken) {
    console.log('❌ CRITICAL: Cannot obtain admin token');
    console.log('   - Check admin credentials in database');
    console.log('   - Verify password hash is correct');
    console.log('   - Ensure admin account is active');
  } else {
    console.log('✅ Admin authentication working');
    console.log('   - Token generation successful');
    console.log('   - Check individual endpoint auth middleware');
  }

  console.log('\n🔧 Frontend Integration Checklist:');
  console.log('   1. Ensure frontend stores token correctly');
  console.log('   2. Check Authorization header format: "Bearer <token>"');
  console.log('   3. Verify token is not expired before requests');
  console.log('   4. Handle 401 responses with token refresh');
  console.log('   5. Check CORS configuration for credentials');

  console.log('\n🌐 Test URLs for Frontend:');
  console.log(`   Login: POST ${BACKEND_URL}/api/auth/login`);
  console.log(`   Auth Me: GET ${BACKEND_URL}/api/auth/me`);
  console.log(`   Contacts: GET ${BACKEND_URL}/api/contact`);
  console.log(`   Consultations: GET ${BACKEND_URL}/api/consultation-requests`);
  console.log(`   Admin Dashboard: GET ${BACKEND_URL}/api/admin-dashboard`);
}

testDashboardContactsAuth().catch(console.error);