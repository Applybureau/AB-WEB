require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

const SUPER_ADMIN_EMAIL = 'admin@applybureau.com';

async function isSuperAdmin(userId) {
  // Check if user is the super admin by email in admins table first
  const { data: adminFromAdminsTable } = await supabaseAdmin
    .from('admins')
    .select('email, role')
    .eq('id', userId)
    .eq('email', SUPER_ADMIN_EMAIL)
    .eq('role', 'admin')
    .single();

  if (adminFromAdminsTable) {
    return true;
  }

  // Fallback: Check clients table for legacy admin accounts
  const { data: adminFromClientsTable } = await supabaseAdmin
    .from('clients')
    .select('email, role')
    .eq('id', userId)
    .eq('email', SUPER_ADMIN_EMAIL)
    .eq('role', 'admin')
    .single();

  return !!adminFromClientsTable;
}

async function testSuperAdminCheck() {
  console.log('\n🧪 TESTING FIXED SUPER ADMIN CHECK\n');
  console.log('=' .repeat(60));

  try {
    // Test with admin from admins table
    const adminTableId = '688b3986-0398-4c00-8aa9-0f14a411b378';
    console.log('\n📋 Test 1: Admin from admins table');
    console.log('ID:', adminTableId);
    const result1 = await isSuperAdmin(adminTableId);
    console.log('Result:', result1 ? '✅ IS SUPER ADMIN' : '❌ NOT SUPER ADMIN');

    // Test with admin from clients table
    const clientsTableId = '8397d53a-daea-40fd-b3b8-721fc266da6c';
    console.log('\n📋 Test 2: Admin from clients table');
    console.log('ID:', clientsTableId);
    const result2 = await isSuperAdmin(clientsTableId);
    console.log('Result:', result2 ? '✅ IS SUPER ADMIN' : '❌ NOT SUPER ADMIN');

    // Test with random ID
    const randomId = '00000000-0000-0000-0000-000000000000';
    console.log('\n📋 Test 3: Random non-admin ID');
    console.log('ID:', randomId);
    const result3 = await isSuperAdmin(randomId);
    console.log('Result:', result3 ? '✅ IS SUPER ADMIN' : '❌ NOT SUPER ADMIN');

    console.log('\n🎉 TESTS COMPLETE!');
    if (result1 && result2 && !result3) {
      console.log('✅ All tests passed! The fix works correctly.');
    } else {
      console.log('❌ Some tests failed. Check the results above.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
}

// Run
testSuperAdminCheck()
  .then(() => {
    console.log('Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
