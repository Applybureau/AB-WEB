#!/usr/bin/env node

/**
 * COMPREHENSIVE TEST FOR ALL THREE FIXES
 * 
 * Tests:
 * 1. Application Stats Endpoint - /api/applications/stats
 * 2. Database Schema - client_id vs user_id consistency
 * 3. Password Reset - Admin password reset functionality
 */

const axios = require('axios');
const { supabaseAdmin } = require('./utils/supabase');

// Configuration
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@applybureautest.com';
const ADMIN_PASSWORD = 'AdminTest123!';

console.log('🧪 COMPREHENSIVE TEST FOR ALL THREE FIXES');
console.log('==========================================');
console.log(`Testing against: ${BASE_URL}`);

let adminToken = null;

async function loginAsAdmin() {
  console.log('\n🔐 Logging in as admin...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (response.data.token) {
      adminToken = response.data.token;
      console.log('✅ Admin login successful');
      console.log(`   User: ${response.data.user.full_name} (${response.data.user.role})`);
      return true;
    } else {
      console.log('❌ Admin login failed - no token received');
      return false;
    }
  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testApplicationStatsEndpoint() {
  console.log('\n1️⃣ TESTING APPLICATION STATS ENDPOINT');
  console.log('-------------------------------------');
  
  if (!adminToken) {
    console.log('❌ No admin token available');
    return false;
  }

  try {
    // Test the stats endpoint
    const response = await axios.get(`${BASE_URL}/api/applications/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (response.status === 200 && response.data) {
      console.log('✅ Application stats endpoint working');
      console.log('📊 Stats received:');
      console.log(`   Total applications: ${response.data.total_applications || 0}`);
      console.log(`   Weekly target: ${response.data.weekly_target || 0}`);
      console.log(`   Weekly progress: ${response.data.weekly_progress || 0}%`);
      console.log(`   User type: ${response.data.user_type || 'unknown'}`);
      
      if (response.data.status_breakdown) {
        console.log('   Status breakdown:');
        Object.entries(response.data.status_breakdown).forEach(([status, count]) => {
          console.log(`     ${status}: ${count}`);
        });
      }

      // Check if it's using fallback data
      if (response.data.error_fallback) {
        console.log('⚠️  Using fallback data due to database issues');
        return 'partial';
      }

      return true;
    } else {
      console.log('❌ Invalid response from stats endpoint');
      return false;
    }
  } catch (error) {
    console.log('❌ Application stats endpoint failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testDatabaseSchema() {
  console.log('\n2️⃣ TESTING DATABASE SCHEMA CONSISTENCY');
  console.log('--------------------------------------');
  
  try {
    // Test applications table structure
    const { data: columns, error: columnError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'applications')
      .in('column_name', ['id', 'client_id', 'user_id', 'status', 'created_at']);

    if (columnError) {
      console.log('❌ Error checking table structure:', columnError.message);
      return false;
    }

    const columnNames = columns.map(col => col.column_name);
    console.log('📋 Applications table columns found:', columnNames);

    const hasClientId = columnNames.includes('client_id');
    const hasUserId = columnNames.includes('user_id');
    const hasStatus = columnNames.includes('status');
    const hasCreatedAt = columnNames.includes('created_at');

    console.log(`   client_id column: ${hasClientId ? '✅' : '❌'}`);
    console.log(`   user_id column: ${hasUserId ? '✅' : '❌'}`);
    console.log(`   status column: ${hasStatus ? '✅' : '❌'}`);
    console.log(`   created_at column: ${hasCreatedAt ? '✅' : '❌'}`);

    // Test data consistency if both columns exist
    if (hasClientId && hasUserId) {
      const { data: applications, error: dataError } = await supabaseAdmin
        .from('applications')
        .select('id, client_id, user_id')
        .not('client_id', 'is', null)
        .limit(10);

      if (dataError) {
        console.log('❌ Error checking data consistency:', dataError.message);
        return false;
      }

      const inconsistentRecords = (applications || []).filter(app => 
        app.client_id !== app.user_id
      );

      if (inconsistentRecords.length === 0) {
        console.log('✅ Data consistency check passed');
        console.log(`   Checked ${applications?.length || 0} records`);
      } else {
        console.log(`⚠️  Found ${inconsistentRecords.length} inconsistent records`);
        console.log('   First inconsistent record:', inconsistentRecords[0]);
        return 'partial';
      }
    }

    // Test if we can query applications
    const { data: testApps, error: queryError } = await supabaseAdmin
      .from('applications')
      .select('id, status')
      .limit(5);

    if (queryError) {
      console.log('❌ Error querying applications:', queryError.message);
      return false;
    }

    console.log('✅ Database schema test passed');
    console.log(`   Found ${testApps?.length || 0} sample applications`);
    
    return true;
  } catch (error) {
    console.log('❌ Database schema test failed:', error.message);
    return false;
  }
}

async function testPasswordReset() {
  console.log('\n3️⃣ TESTING PASSWORD RESET FUNCTIONALITY');
  console.log('---------------------------------------');
  
  if (!adminToken) {
    console.log('❌ No admin token available');
    return false;
  }

  try {
    // Check if we have super admin privileges
    const { data: currentUser } = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log(`👤 Current user: ${currentUser.user.full_name} (${currentUser.user.role})`);
    console.log(`   Super admin: ${currentUser.user.is_super_admin ? 'Yes' : 'No'}`);

    // Test password reset endpoint availability (without actually resetting)
    try {
      const response = await axios.post(`${BASE_URL}/api/admin-management/reset-password`, {
        admin_email: 'nonexistent@example.com',
        new_password: 'TestPassword123!'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      // This should fail because the admin doesn't exist
      console.log('⚠️  Unexpected success - admin should not exist');
      return false;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      
      if (errorMessage.includes('Admin not found')) {
        console.log('✅ Password reset endpoint working (correctly rejected non-existent admin)');
        return true;
      } else if (errorMessage.includes('Only super admin can reset passwords')) {
        console.log('⚠️  Current user is not super admin - password reset requires super admin');
        return 'partial';
      } else if (errorMessage.includes('Admin email and new password are required')) {
        console.log('✅ Password reset endpoint working (validation working)');
        return true;
      } else {
        console.log('❌ Unexpected error from password reset endpoint:', errorMessage);
        return false;
      }
    }
  } catch (error) {
    console.log('❌ Password reset test failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testApplicationsEndpoint() {
  console.log('\n🔍 TESTING APPLICATIONS ENDPOINT');
  console.log('--------------------------------');
  
  if (!adminToken) {
    console.log('❌ No admin token available');
    return false;
  }

  try {
    // Test GET /api/applications
    const response = await axios.get(`${BASE_URL}/api/applications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (response.status === 200) {
      console.log('✅ Applications endpoint working');
      console.log(`   Found ${response.data.applications?.length || 0} applications`);
      console.log(`   User role: ${response.data.user_role}`);
      
      // Test weekly endpoint
      try {
        const weeklyResponse = await axios.get(`${BASE_URL}/api/applications/weekly`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (weeklyResponse.status === 200) {
          console.log('✅ Weekly applications endpoint working');
          console.log(`   Found ${weeklyResponse.data.weekly_applications?.length || 0} weekly groups`);
        } else {
          console.log('⚠️  Weekly applications endpoint returned non-200 status');
        }
      } catch (weeklyError) {
        console.log('⚠️  Weekly applications endpoint failed:', weeklyError.response?.data?.error || weeklyError.message);
      }

      return true;
    } else {
      console.log('❌ Applications endpoint returned non-200 status');
      return false;
    }
  } catch (error) {
    console.log('❌ Applications endpoint failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting comprehensive test suite...\n');
  
  // Step 1: Login
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without admin login');
    return;
  }

  // Step 2: Run all tests
  const results = {
    applicationStats: await testApplicationStatsEndpoint(),
    databaseSchema: await testDatabaseSchema(),
    passwordReset: await testPasswordReset(),
    applicationsEndpoint: await testApplicationsEndpoint()
  };

  // Step 3: Summary
  console.log('\n📋 TEST RESULTS SUMMARY');
  console.log('=======================');
  
  const getStatusIcon = (result) => {
    if (result === true) return '✅ PASS';
    if (result === 'partial') return '⚠️  PARTIAL';
    return '❌ FAIL';
  };

  console.log(`1️⃣ Application Stats: ${getStatusIcon(results.applicationStats)}`);
  console.log(`2️⃣ Database Schema: ${getStatusIcon(results.databaseSchema)}`);
  console.log(`3️⃣ Password Reset: ${getStatusIcon(results.passwordReset)}`);
  console.log(`🔍 Applications Endpoint: ${getStatusIcon(results.applicationsEndpoint)}`);

  // Calculate success rate
  const scores = Object.values(results).map(result => {
    if (result === true) return 1;
    if (result === 'partial') return 0.5;
    return 0;
  });
  
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const maxScore = scores.length;
  const successRate = Math.round((totalScore / maxScore) * 100);

  console.log(`\n🎯 OVERALL SUCCESS RATE: ${successRate}% (${totalScore}/${maxScore})`);

  if (successRate >= 90) {
    console.log('\n🎉 EXCELLENT! All critical issues are resolved');
  } else if (successRate >= 75) {
    console.log('\n✅ GOOD! Most issues are resolved, minor issues remain');
  } else if (successRate >= 50) {
    console.log('\n⚠️  PARTIAL SUCCESS - Some critical issues remain');
  } else {
    console.log('\n❌ NEEDS ATTENTION - Multiple critical issues detected');
  }

  console.log('\n🔄 Next Steps:');
  if (results.applicationStats !== true) {
    console.log('- Fix application stats endpoint database queries');
  }
  if (results.databaseSchema !== true) {
    console.log('- Run database schema fix script');
  }
  if (results.passwordReset !== true) {
    console.log('- Verify super admin setup and password reset functionality');
  }
  if (results.applicationsEndpoint !== true) {
    console.log('- Check applications endpoint and route configuration');
  }

  console.log('\n✨ Test completed!');
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testApplicationStatsEndpoint,
  testDatabaseSchema,
  testPasswordReset,
  testApplicationsEndpoint,
  runAllTests
};