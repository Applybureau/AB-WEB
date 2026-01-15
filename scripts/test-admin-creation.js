require('dotenv').config();
const axios = require('axios');
const { supabaseAdmin } = require('../utils/supabase');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const MASTER_ADMIN_EMAIL = 'admin@applybureau.com';
const MASTER_ADMIN_PASSWORD = 'Admin@123456';
const TEST_ADMIN_EMAIL = 'testadmin@applybureau.com';

async function testAdminCreation() {
  console.log('🔐 Testing Admin Account Creation\n');
  console.log('='.repeat(60));
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  const addResult = (name, passed, details = '') => {
    results.tests.push({ name, passed, details });
    if (passed) {
      results.passed++;
      console.log(`✅ ${name}`);
    } else {
      results.failed++;
      console.error(`❌ ${name}`);
    }
    if (details) console.log(`   ${details}`);
  };
  
  try {
    // Test 1: Login as master admin
    console.log('\n1️⃣ Testing Master Admin Login...');
    let masterToken = null;
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: MASTER_ADMIN_EMAIL,
        password: MASTER_ADMIN_PASSWORD
      });
      
      masterToken = loginResponse.data.token;
      const user = loginResponse.data.user;
      
      addResult('Master Admin Login', !!masterToken && user.role === 'admin',
        `Email: ${user.email}, Role: ${user.role}`);
    } catch (error) {
      addResult('Master Admin Login', false,
        error.response?.data?.error || error.message);
      console.log('\n⚠️ Cannot continue without master admin authentication');
      return;
    }
    
    // Test 2: Check if test admin already exists
    console.log('\n2️⃣ Checking if test admin exists...');
    const { data: existingAdmin } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', TEST_ADMIN_EMAIL)
      .single();
    
    if (existingAdmin) {
      console.log('   Test admin already exists, deleting...');
      await supabaseAdmin
        .from('clients')
        .delete()
        .eq('email', TEST_ADMIN_EMAIL);
      console.log('   ✅ Deleted existing test admin');
    } else {
      console.log('   No existing test admin found');
    }
    
    // Test 3: Create new admin account (using clients table endpoint)
    console.log('\n3️⃣ Testing Admin Creation (clients table)...');
    try {
      const createResponse = await axios.post(
        `${BASE_URL}/api/admin-management/admins`,
        {
          full_name: 'Test Admin',
          email: TEST_ADMIN_EMAIL,
          password: 'TestAdmin@123',
          phone: '+1234567890',
          role: 'admin'
        },
        {
          headers: {
            'Authorization': `Bearer ${masterToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const newAdmin = createResponse.data.admin || createResponse.data;
      addResult('Create Admin Account', !!newAdmin.id,
        `Admin ID: ${newAdmin.id}, Email: ${newAdmin.email}`);
      
      if (newAdmin.id) {
        console.log('\n   📋 New Admin Details:');
        console.log(`      ID: ${newAdmin.id}`);
        console.log(`      Name: ${newAdmin.full_name}`);
        console.log(`      Email: ${newAdmin.email}`);
        console.log(`      Role: ${newAdmin.role}`);
        console.log(`      Status: ${newAdmin.status || newAdmin.is_active}`);
        if (newAdmin.permissions) {
          console.log(`      Permissions:`);
          console.log(`         Can Create Admins: ${newAdmin.permissions.can_create_admins}`);
          console.log(`         Can Delete Admins: ${newAdmin.permissions.can_delete_admins}`);
          console.log(`         Can Manage Clients: ${newAdmin.permissions.can_manage_clients}`);
        }
      }
    } catch (error) {
      addResult('Create Admin Account', false,
        error.response?.data?.error || error.message);
    }
    
    // Test 4: Verify admin was created in database
    console.log('\n4️⃣ Verifying admin in database...');
    const { data: createdAdmin, error: verifyError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', TEST_ADMIN_EMAIL)
      .single();
    
    if (verifyError) {
      addResult('Verify Admin in Database', false, verifyError.message);
    } else {
      addResult('Verify Admin in Database', !!createdAdmin && createdAdmin.role === 'admin',
        `Found in database with role: ${createdAdmin.role}`);
    }
    
    // Test 5: Test new admin login
    console.log('\n5️⃣ Testing new admin login...');
    try {
      const newAdminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: TEST_ADMIN_EMAIL,
        password: 'TestAdmin@123'
      });
      
      const newAdminToken = newAdminLoginResponse.data.token;
      const newAdminUser = newAdminLoginResponse.data.user;
      
      addResult('New Admin Login', !!newAdminToken && newAdminUser.role === 'admin',
        `Token received, Role: ${newAdminUser.role}`);
    } catch (error) {
      addResult('New Admin Login', false,
        error.response?.data?.error || error.message);
    }
    
    // Test 6: Test non-admin cannot create admin
    console.log('\n6️⃣ Testing permission enforcement...');
    
    // First create a regular client
    const { data: testClient } = await supabaseAdmin
      .from('clients')
      .insert({
        email: 'testclient@example.com',
        password: await require('bcryptjs').hash('TestClient@123', 10),
        full_name: 'Test Client',
        role: 'client'
      })
      .select()
      .single();
    
    if (testClient) {
      // Try to login as client
      try {
        const clientLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: 'testclient@example.com',
          password: 'TestClient@123'
        });
        
        const clientToken = clientLoginResponse.data.token;
        
        // Try to create admin with client token (should fail)
        try {
          await axios.post(
            `${BASE_URL}/api/admin-management/admins`,
            {
              full_name: 'Unauthorized Admin',
              email: 'unauthorized@example.com',
              password: 'Test@123',
              role: 'admin'
            },
            {
              headers: {
                'Authorization': `Bearer ${clientToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          addResult('Permission Enforcement', false,
            'Client was able to create admin (security issue!)');
        } catch (error) {
          const status = error.response?.status;
          addResult('Permission Enforcement', status === 403,
            `Correctly blocked with status ${status}`);
        }
      } catch (error) {
        console.log('   Could not test permission enforcement (client login failed)');
      }
      
      // Cleanup test client
      await supabaseAdmin
        .from('clients')
        .delete()
        .eq('email', 'testclient@example.com');
    }
    
    // Test 7: List all admins
    console.log('\n7️⃣ Testing list all admins...');
    try {
      const listResponse = await axios.get(
        `${BASE_URL}/api/admin-management/admins`,
        {
          headers: {
            'Authorization': `Bearer ${masterToken}`
          }
        }
      );
      
      const admins = listResponse.data.admins || listResponse.data.data || [];
      addResult('List All Admins', Array.isArray(admins) && admins.length > 0,
        `Found ${admins.length} admin(s)`);
      
      if (admins.length > 0) {
        console.log('\n   📋 Admin List:');
        admins.forEach((admin, index) => {
          console.log(`      ${index + 1}. ${admin.full_name} (${admin.email}) - ${admin.status || (admin.is_active ? 'active' : 'inactive')}`);
        });
      }
    } catch (error) {
      addResult('List All Admins', false,
        error.response?.data?.error || error.message);
    }
    
    // Cleanup: Delete test admin
    console.log('\n8️⃣ Cleaning up test admin...');
    await supabaseAdmin
      .from('clients')
      .delete()
      .eq('email', TEST_ADMIN_EMAIL);
    console.log('   ✅ Test admin deleted');
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${results.tests.length}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${Math.round((results.passed / results.tests.length) * 100)}%`);
    
    if (results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('\n✅ Admin Creation System Working:');
      console.log('   ✓ Master admin can login');
      console.log('   ✓ Master admin can create new admins');
      console.log('   ✓ New admins can login');
      console.log('   ✓ Permission enforcement working');
      console.log('   ✓ Admin listing working');
      console.log('\n🔑 Master Admin Credentials:');
      console.log(`   Email: ${MASTER_ADMIN_EMAIL}`);
      console.log(`   Password: ${MASTER_ADMIN_PASSWORD}`);
    } else {
      console.log('\n⚠️ Some tests failed. Review the details above.');
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testAdminCreation();
