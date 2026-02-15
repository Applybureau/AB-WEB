require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');
const bcrypt = require('bcryptjs');

async function diagnoseAllLoginIssues() {
  console.log('\n🔍 DIAGNOSING ALL LOGIN ISSUES\n');
  console.log('=' .repeat(60));

  try {
    // Check admins table
    console.log('\n📋 ADMINS TABLE:');
    console.log('-'.repeat(60));
    const { data: admins, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, email, full_name, password, role, is_active, is_super_admin, created_at')
      .order('created_at', { ascending: false });

    if (adminError) {
      console.error('❌ Error fetching admins:', adminError);
    } else if (admins && admins.length > 0) {
      console.log(`Found ${admins.length} admin(s):\n`);
      admins.forEach(admin => {
        console.log(`Email: ${admin.email}`);
        console.log(`Name: ${admin.full_name}`);
        console.log(`Has Password: ${!!admin.password}`);
        console.log(`Password Length: ${admin.password?.length || 0}`);
        console.log(`Role: ${admin.role}`);
        console.log(`Active: ${admin.is_active}`);
        console.log(`Super Admin: ${admin.is_super_admin || false}`);
        console.log(`Created: ${admin.created_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No admins found in admins table');
    }

    // Check registered_users table
    console.log('\n📋 REGISTERED_USERS TABLE:');
    console.log('-'.repeat(60));
    const { data: registeredUsers, error: regError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name, passcode_hash, role, is_active, payment_confirmed, token_used, created_at')
      .order('created_at', { ascending: false });

    if (regError) {
      console.error('❌ Error fetching registered_users:', regError);
    } else if (registeredUsers && registeredUsers.length > 0) {
      console.log(`Found ${registeredUsers.length} registered user(s):\n`);
      registeredUsers.forEach(user => {
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.full_name}`);
        console.log(`Has Password: ${!!user.passcode_hash}`);
        console.log(`Password Length: ${user.passcode_hash?.length || 0}`);
        console.log(`Role: ${user.role}`);
        console.log(`Active: ${user.is_active}`);
        console.log(`Payment Confirmed: ${user.payment_confirmed}`);
        console.log(`Token Used: ${user.token_used}`);
        console.log(`Created: ${user.created_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No users found in registered_users table');
    }

    // Check clients table
    console.log('\n📋 CLIENTS TABLE:');
    console.log('-'.repeat(60));
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, password, role, created_at')
      .order('created_at', { ascending: false });

    if (clientError) {
      console.error('❌ Error fetching clients:', clientError);
    } else if (clients && clients.length > 0) {
      console.log(`Found ${clients.length} client(s):\n`);
      clients.forEach(client => {
        console.log(`Email: ${client.email}`);
        console.log(`Name: ${client.full_name}`);
        console.log(`Has Password: ${!!client.password}`);
        console.log(`Password Length: ${client.password?.length || 0}`);
        console.log(`Role: ${client.role}`);
        console.log(`Created: ${client.created_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No clients found in clients table');
    }

    // Test password hashing
    console.log('\n🔐 PASSWORD HASH VERIFICATION:');
    console.log('-'.repeat(60));
    const testPassword = 'TestPassword123';
    const testHash = await bcrypt.hash(testPassword, 12);
    const isValid = await bcrypt.compare(testPassword, testHash);
    console.log(`Test Password: ${testPassword}`);
    console.log(`Hash Valid: ${isValid ? '✅ YES' : '❌ NO'}`);
    console.log(`Hash Length: ${testHash.length}`);

    // Summary
    console.log('\n\n📊 SUMMARY:');
    console.log('-'.repeat(60));
    console.log(`Total Admins: ${admins?.length || 0}`);
    console.log(`Total Registered Users: ${registeredUsers?.length || 0}`);
    console.log(`Total Clients: ${clients?.length || 0}`);
    
    const adminsWithPassword = admins?.filter(a => a.password).length || 0;
    const regUsersWithPassword = registeredUsers?.filter(u => u.passcode_hash).length || 0;
    const clientsWithPassword = clients?.filter(c => c.password).length || 0;
    
    console.log(`\nAdmins with password: ${adminsWithPassword}/${admins?.length || 0}`);
    console.log(`Registered users with password: ${regUsersWithPassword}/${registeredUsers?.length || 0}`);
    console.log(`Clients with password: ${clientsWithPassword}/${clients?.length || 0}`);

    // Check if super admin exists
    const superAdmin = admins?.find(a => a.email === 'applybureau@gmail.com');
    if (superAdmin) {
      console.log('\n✅ Super admin found: applybureau@gmail.com');
      console.log(`   Has password: ${!!superAdmin.password}`);
      console.log(`   Is active: ${superAdmin.is_active}`);
    } else {
      console.log('\n⚠️  Super admin NOT FOUND (applybureau@gmail.com)');
    }

    console.log('\n\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(60));
    console.log('1. Verify all users have passwords in their respective tables');
    console.log('2. Check that admin accounts have is_active = true');
    console.log('3. Check that registered_users have is_active = true');
    console.log('4. Ensure password hashes are 60 characters (bcrypt format)');
    console.log('5. Test login with known credentials');

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ DIAGNOSIS COMPLETE\n');

  } catch (error) {
    console.error('\n❌ DIAGNOSIS ERROR:', error);
  }
}

diagnoseAllLoginIssues();
