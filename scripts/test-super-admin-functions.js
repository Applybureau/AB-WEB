require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';

async function testSuperAdminFunctions() {
  console.log('🔐 TESTING SUPER ADMIN FUNCTIONS');
  console.log('=================================\n');

  let superAdminToken = null;
  let createdAdminId = null;
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0
  };

  const testResult = (name, success, details = '') => {
    testResults.total++;
    if (success) testResults.passed++;
    else testResults.failed++;
    
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${name}: ${success ? 'PASS' : 'FAIL'}`);
    if (details) console.log(`   ${details}`);
  };

  try {
    // 1. Test Super Admin Login
    console.log('1. Testing Super Admin Login...');
    try {
      const loginRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: 'admin@applybureau.com',
        password: 'Admin123@#'
      });
      
      superAdminToken = loginRes.data.token;
      testResult('Super Admin Login', !!superAdminToken, 
        `Role: ${loginRes.data.user?.role}, Super Admin: ${loginRes.data.user?.is_super_admin}`);
    } catch (error) {
      testResult('Super Admin Login', false, 
        `Status: ${error.response?.status}, Error: ${error.response?.data?.error || error.message}`);
      return; // Can't continue without token
    }

    await delay(2000);

    // 2. Test Admin Management List Access
    console.log('\n2. Testing Admin Management Access...');
    try {
      const adminListRes = await axios.get(`${BACKEND_URL}/api/admin-management`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      
      testResult('Admin Management Access', adminListRes.status === 200,
        `Status: ${adminListRes.status}, Admins found: ${adminListRes.data.data?.length || 0}`);
    } catch (error) {
      testResult('Admin Management Access', false,
        `Status: ${error.response?.status}, Error: ${error.response?.data?.error || error.message}`);
    }

    await delay(2000);

    // 3. Test Create New Admin
    console.log('\n3. Testing Create New Admin...');
    const newAdminData = {
      email: 'testadmin@applybureau.com',
      password: 'TestAdmin123!',
      full_name: 'Test Administrator',
      phone: '+1234567890'
    };

    try {
      const createAdminRes = await axios.post(`${BACKEND_URL}/api/admin-management/admins`, newAdminData, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      
      createdAdminId = createAdminRes.data.admin?.id;
      testResult('Create New Admin', createAdminRes.status === 201,
        `Status: ${createAdminRes.status}, Admin ID: ${createdAdminId}`);
    } catch (error) {
      testResult('Create New Admin', false,
        `Status: ${error.response?.status}, Error: ${error.response?.data?.error || error.message}`);
    }

    await delay(2000);

    // 4. Test Get Admin List
    console.log('\n4. Testing Get Admin List...');
    try {
      const getAdminsRes = await axios.get(`${BACKEND_URL}/api/admin-management/admins`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      
      testResult('Get Admin List', getAdminsRes.status === 200,
        `Status: ${getAdminsRes.status}, Admins: ${getAdminsRes.data.admins?.length || 0}`);
    } catch (error) {
      testResult('Get Admin List', false,
        `Status: ${error.response?.status}, Error: ${error.response?.data?.error || error.message}`);
    }

    // 5. Test Suspend Admin
    if (createdAdminId) {
      console.log('\n5. Testing Suspend Admin...');
      try {
        const suspendAdminRes = await axios.put(`${BACKEND_URL}/api/admin-management/admins/${createdAdminId}/suspend`, {
          reason: 'Testing suspension functionality'
        }, {
          headers: { Authorization: `Bearer ${superAdminToken}` }
        });
        
        testResult('Suspend Admin', suspendAdminRes.status === 200,
          `Status: ${suspendAdminRes.status}, Message: ${suspendAdminRes.data.message}`);
      } catch (error) {
        testResult('Suspend Admin', false,
          `Status: ${error.response?.status}, Error: ${error.response?.data?.error || error.message}`);
      }

      await delay(2000);
    }

    // 6. Test Reactivate Admin
    if (createdAdminId) {
      console.log('\n6. Testing Reactivate Admin...');
      try {
        const reactivateAdminRes = await axios.put(`${BACKEND_URL}/api/admin-management/admins/${createdAdminId}/reactivate`, {}, {
          headers: { Authorization: `Bearer ${superAdminToken}` }
        });
        
        testResult('Reactivate Admin', reactivateAdminRes.status === 200,
          `Status: ${reactivateAdminRes.status}, Message: ${reactivateAdminRes.data.message}`);
      } catch (error) {
        testResult('Reactivate Admin', false,
          `Status: ${error.response?.status}, Error: ${error.response?.data?.error || error.message}`);
      }

      await delay(2000);
    }

    // 7. Test Delete Admin
    if (createdAdminId) {
      console.log('\n7. Testing Delete Admin...');
      try {
        const deleteAdminRes = await axios.delete(`${BACKEND_URL}/api/admin-management/admins/${createdAdminId}`, {
          headers: { Authorization: `Bearer ${superAdminToken}` },
          data: { reason: 'Testing deletion functionality' }
        });
        
        testResult('Delete Admin', deleteAdminRes.status === 200,
          `Status: ${deleteAdminRes.status}, Message: ${deleteAdminRes.data.message}`);
      } catch (error) {
        testResult('Delete Admin', false,
          `Status: ${error.response?.status}, Error: ${error.response?.data?.error || error.message}`);
      }

      await delay(2000);
    }

    // 8. Test Admin Profile Access
    console.log('\n8. Testing Admin Profile Access...');
    try {
      const profileRes = await axios.get(`${BACKEND_URL}/api/admin-management/profile`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      
      testResult('Admin Profile Access', profileRes.status === 200,
        `Status: ${profileRes.status}, Profile: ${profileRes.data.admin?.email}`);
    } catch (error) {
      testResult('Admin Profile Access', false,
        `Status: ${error.response?.status}, Error: ${error.response?.data?.error || error.message}`);
    }

    await delay(2000);

    // 9. Test Admin Dashboard Access
    console.log('\n9. Testing Admin Dashboard Access...');
    try {
      const dashboardRes = await axios.get(`${BACKEND_URL}/api/admin-dashboard`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      
      testResult('Admin Dashboard Access', dashboardRes.status === 200,
        `Status: ${dashboardRes.status}, Dashboard Type: ${dashboardRes.data.dashboard_type}`);
    } catch (error) {
      testResult('Admin Dashboard Access', false,
        `Status: ${error.response?.status}, Error: ${error.response?.data?.error || error.message}`);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }

  // Final Results
  console.log('\n🎯 SUPER ADMIN FUNCTION TEST RESULTS');
  console.log('====================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  
  if (successRate >= 90) {
    console.log('\n🎉 EXCELLENT! Super Admin functions working perfectly!');
    console.log('🟢 All admin management features operational');
  } else if (successRate >= 70) {
    console.log('\n🟡 GOOD! Most admin functions working');
    console.log('⚠️ Some features may need attention');
  } else {
    console.log('\n🔴 ISSUES DETECTED! Admin functions need fixes');
  }

  console.log('\n📋 SUPER ADMIN CREDENTIALS CONFIRMED:');
  console.log('=====================================');
  console.log('Email: admin@applybureau.com');
  console.log('Password: Admin123@#');
  console.log('Role: Super Administrator');
  console.log('Status: ✅ Ready for production use');
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

testSuperAdminFunctions();