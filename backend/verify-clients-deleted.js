// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { supabaseAdmin } = require('./utils/supabase');

async function verifyClientsDel eted() {
  console.log('🔍 VERIFYING CLIENT DELETION\n');
  console.log('='.repeat(70));
  
  try {
    // Check registered_users
    const { data: regUsers, error: regError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name, role')
      .eq('role', 'client');
    
    console.log('\n📋 registered_users table:');
    if (regError) {
      console.log(`   ❌ Error: ${regError.message}`);
    } else if (!regUsers || regUsers.length === 0) {
      console.log('   ✅ NO CLIENTS FOUND (table is clean)');
    } else {
      console.log(`   ⚠️  Found ${regUsers.length} client(s):`);
      regUsers.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email} (${user.id})`);
      });
    }
    
    // Check clients table
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name');
    
    console.log('\n📋 clients table:');
    if (clientError) {
      console.log(`   ❌ Error: ${clientError.message}`);
    } else if (!clients || clients.length === 0) {
      console.log('   ✅ NO RECORDS FOUND (table is clean)');
    } else {
      console.log(`   ⚠️  Found ${clients.length} record(s):`);
      clients.forEach((client, i) => {
        console.log(`   ${i + 1}. ${client.email || 'No email'} (${client.id})`);
      });
    }
    
    // Check auth users
    console.log('\n🔐 Supabase Auth:');
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      const clientAuthUsers = authData.users.filter(u => 
        u.user_metadata?.role === 'client' || 
        u.email?.includes('test') ||
        u.email?.includes('client')
      );
      
      if (clientAuthUsers.length === 0) {
        console.log('   ✅ NO CLIENT AUTH USERS FOUND');
      } else {
        console.log(`   ⚠️  Found ${clientAuthUsers.length} potential client auth user(s):`);
        clientAuthUsers.forEach((user, i) => {
          console.log(`   ${i + 1}. ${user.email} (${user.id})`);
        });
      }
    } catch (authError) {
      console.log(`   ⚠️  Could not check auth: ${authError.message}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 SUMMARY:\n');
    
    const totalClients = (regUsers?.length || 0) + (clients?.length || 0);
    
    if (totalClients === 0) {
      console.log('🎉 SUCCESS! All clients have been deleted!\n');
    } else {
      console.log(`⚠️  WARNING: ${totalClients} client record(s) still exist!\n`);
      console.log('To delete them, run:');
      console.log('  node backend/nuclear-delete-all-clients.js\n');
      console.log('Or manually delete from Supabase Dashboard.\n');
    }
    
    console.log('='.repeat(70));
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    throw error;
  }
}

if (require.main === module) {
  verifyClientsDel eted()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyClientsDel eted };
