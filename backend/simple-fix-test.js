#!/usr/bin/env node

/**
 * SIMPLE FIX TEST - Tests the three critical issues with proper env loading
 */

// Load environment variables from the correct path
require('dotenv').config({ path: __dirname + '/.env' });

const axios = require('axios');

console.log('🧪 SIMPLE TEST FOR THREE CRITICAL ISSUES');
console.log('=========================================');

// Check if environment variables are loaded
console.log('🔍 Environment Check:');
console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);

const BASE_URL = process.env.BACKEND_URL || 'https://apply-bureau-backend.vercel.app';
console.log(`   Testing against: ${BASE_URL}`);

async function testHealthEndpoint() {
  console.log('\n🏥 Testing Health Endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 10000 });
    
    if (response.status === 200) {
      console.log('✅ Health endpoint working');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Service: ${response.data.service}`);
      return true;
    } else {
      console.log('❌ Health endpoint returned non-200 status');
      return false;
    }
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
    return false;
  }
}

async function testAdminLogin() {
  console.log('\n🔐 Testing Admin Login...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'applybureau@gmail.com',
      password: 'Admin123@#'
    }, { timeout: 10000 });

    if (response.data.token) {
      console.log('✅ Admin login successful');
      console.log(`   User: ${response.data.user.full_name}`);
      console.log(`   Role: ${response.data.user.role}`);
      console.log(`   Super Admin: ${response.data.user.is_super_admin ? 'Yes' : 'No'}`);
      return response.data.token;
    } else {
      console.log('❌ Admin login failed - no token');
      return null;
    }
  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.data?.error || error.message);
    return null;
  }
}

async function testApplicationStats(token) {
  console.log('\n📊 Testing Application Stats Endpoint...');
  
  if (!token) {
    console.log('❌ No token available for testing');
    return false;
  }

  try {
    const response = await axios.get(`${BASE_URL}/api/applications/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });

    if (response.status === 200 && response.data) {
      console.log('✅ Application stats endpoint working');
      console.log(`   Total applications: ${response.data.total_applications || 0}`);
      console.log(`   Weekly target: ${response.data.weekly_target || 0}`);
      console.log(`   User type: ${response.data.user_type || 'unknown'}`);
      
      if (response.data.error_fallback) {
        console.log('⚠️  Using fallback data (database schema issue)');
        return 'partial';
      }
      
      return true;
    } else {
      console.log('❌ Application stats endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Application stats failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testApplicationsEndpoint(token) {
  console.log('\n📋 Testing Applications Endpoint...');
  
  if (!token) {
    console.log('❌ No token available for testing');
    return false;
  }

  try {
    const response = await axios.get(`${BASE_URL}/api/applications`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });

    if (response.status === 200) {
      console.log('✅ Applications endpoint working');
      console.log(`   Found ${response.data.applications?.length || 0} applications`);
      console.log(`   User role: ${response.data.user_role}`);
      return true;
    } else {
      console.log('❌ Applications endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Applications endpoint failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testPasswordResetEndpoint(token) {
  console.log('\n🔑 Testing Password Reset Endpoint...');
  
  if (!token) {
    console.log('❌ No token available for testing');
    return false;
  }

  try {
    // Test with invalid admin email (should fail gracefully)
    const response = await axios.post(`${BASE_URL}/api/admin-management/reset-password`, {
      admin_email: 'nonexistent@example.com',
      new_password: 'TestPassword123!'
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });

    console.log('⚠️  Unexpected success - should have failed');
    return false;
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    
    if (errorMessage.includes('Admin not found')) {
      console.log('✅ Password reset endpoint working (correctly rejected)');
      return true;
    } else if (errorMessage.includes('Only super admin can reset passwords')) {
      console.log('⚠️  Password reset requires super admin privileges');
      return 'partial';
    } else if (errorMessage.includes('Admin email and new password are required')) {
      console.log('✅ Password reset endpoint working (validation working)');
      return true;
    } else {
      console.log('❌ Password reset endpoint error:', errorMessage);
      return false;
    }
  }
}

async function runSimpleTests() {
  console.log('\n🚀 Starting simple test suite...\n');
  
  // Test 1: Health check
  const healthOk = await testHealthEndpoint();
  if (!healthOk) {
    console.log('\n❌ Backend is not responding - cannot continue tests');
    return;
  }

  // Test 2: Admin login
  const token = await testAdminLogin();
  if (!token) {
    console.log('\n❌ Cannot get admin token - authentication issues');
    return;
  }

  // Test 3: Application stats (Issue #1)
  const statsResult = await testApplicationStats(token);
  
  // Test 4: Applications endpoint (Issue #2 - Database Schema)
  const appsResult = await testApplicationsEndpoint(token);
  
  // Test 5: Password reset (Issue #3)
  const passwordResult = await testPasswordResetEndpoint(token);

  // Summary
  console.log('\n📋 SIMPLE TEST RESULTS');
  console.log('======================');
  
  const getStatus = (result) => {
    if (result === true) return '✅ WORKING';
    if (result === 'partial') return '⚠️  PARTIAL';
    return '❌ FAILED';
  };

  console.log(`🏥 Health Check: ✅ WORKING`);
  console.log(`🔐 Admin Login: ✅ WORKING`);
  console.log(`📊 Application Stats: ${getStatus(statsResult)}`);
  console.log(`📋 Applications Endpoint: ${getStatus(appsResult)}`);
  console.log(`🔑 Password Reset: ${getStatus(passwordResult)}`);

  // Calculate success rate
  const results = [statsResult, appsResult, passwordResult];
  const scores = results.map(r => r === true ? 1 : r === 'partial' ? 0.5 : 0);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const successRate = Math.round((totalScore / results.length) * 100);

  console.log(`\n🎯 SUCCESS RATE: ${successRate}% (${totalScore}/${results.length})`);

  if (successRate >= 90) {
    console.log('\n🎉 EXCELLENT! All issues are resolved');
  } else if (successRate >= 70) {
    console.log('\n✅ GOOD! Most issues are working');
  } else {
    console.log('\n⚠️  NEEDS ATTENTION - Some issues remain');
  }

  console.log('\n🔧 ISSUE STATUS:');
  console.log(`1️⃣ Application Stats: ${statsResult === true ? 'FIXED ✅' : 'NEEDS FIX ❌'}`);
  console.log(`2️⃣ Database Schema: ${appsResult === true ? 'FIXED ✅' : 'NEEDS FIX ❌'}`);
  console.log(`3️⃣ Password Reset: ${passwordResult === true ? 'FIXED ✅' : 'NEEDS FIX ❌'}`);
}

// Run the tests
if (require.main === module) {
  runSimpleTests().catch(console.error);
}