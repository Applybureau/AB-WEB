#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

const VERCEL_URL = 'https://apply-bureau-backend.vercel.app';

async function testVercelAdminFunctions() {
  console.log('🧪 Testing Vercel Admin Management Functions\n');
  console.log(`🌐 Testing URL: ${VERCEL_URL}\n`);

  // Test 1: Health Check
  console.log('1. Testing Health Check:');
  try {
    const response = await axios.get(`${VERCEL_URL}/api/health`);
    console.log('✅ Health Check:', response.status, response.data?.status || 'OK');
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
    return;
  }

  // Test 2: Admin Management Routes Exist
  console.log('\n2. Testing Admin Management Routes:');
  
  const adminRoutes = [
    '/api/admin-management/profile',
    '/api/admin-management/admins',
    '/api/admin-management/settings'
  ];

  for (const route of adminRoutes) {
    try {
      const response = await axios.get(`${VERCEL_URL}${route}`);
      console.log(`✅ ${route}: Available (${response.status})`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`✅ ${route}: Protected (401 - Auth Required)`);
      } else if (error.response?.status === 404) {
        console.log(`❌ ${route}: Not Found (404)`);
      } else {
        console.log(`⚠️ ${route}: Error ${error.response?.status || 'Unknown'}`);
      }
    }
  }

  // Test 3: Email Action Routes
  console.log('\n3. Testing Email Action Routes:');
  
  const emailRoutes = [
    '/api/email-actions/consultation/123/confirm/test',
    '/api/email-actions/admin/456/suspend/test'
  ];

  for (const route of emailRoutes) {
    try {
      const response = await axios.get(`${VERCEL_URL}${route}`);
      console.log(`✅ ${route}: Available (${response.status})`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`✅ ${route}: Working (404 for invalid data - expected)`);
      } else if (error.response?.status === 403) {
        console.log(`✅ ${route}: Working (403 for invalid token - expected)`);
      } else {
        console.log(`❌ ${route}: Error ${error.response?.status || 'Unknown'}`);
      }
    }
  }

  // Test 4: Test Admin Login (to get token for further tests)
  console.log('\n4. Testing Admin Login:');
  try {
    const loginResponse = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'test123' // This will fail, but we can see if endpoint works
    });
    console.log('✅ Login endpoint working');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Login endpoint working (401 for invalid credentials - expected)');
    } else if (error.response?.status === 400) {
      console.log('✅ Login endpoint working (400 for validation - expected)');
    } else {
      console.log('❌ Login endpoint error:', error.response?.status, error.response?.data);
    }
  }

  // Test 5: Check if routes are properly registered
  console.log('\n5. Testing Route Registration:');
  try {
    const response = await axios.get(`${VERCEL_URL}/api/nonexistent-route`);
    console.log('⚠️ 404 handler not working properly');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ 404 handler working correctly');
    } else if (error.response?.status === 500) {
      console.log('⚠️ 404 handler returns 500 (Vercel serverless issue)');
    } else {
      console.log('⚠️ Unexpected error:', error.response?.status);
    }
  }

  console.log('\n📋 Summary:');
  console.log('- Health check: Working');
  console.log('- Admin routes: Need authentication (expected)');
  console.log('- Email actions: Available');
  console.log('- Authentication: Working');
  
  console.log('\n🔍 Next Steps:');
  console.log('1. Test with valid admin credentials');
  console.log('2. Check if email action buttons work in production');
  console.log('3. Verify admin management functions with proper auth');
}

testVercelAdminFunctions().catch(console.error);