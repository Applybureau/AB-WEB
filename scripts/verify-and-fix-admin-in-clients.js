require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function verifyAndFixAdmin() {
  console.log('\n🔍 VERIFYING ADMIN IN CLIENTS TABLE\n');
  console.log('=' .repeat(60));

  try {
    // Find admin@applybureau.com in clients table
    console.log('\n📋 Checking admin@applybureau.com in clients table...');
    const { data: admin, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', 'admin@applybureau.com')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ No admin found in clients table - this is correct!');
        console.log('   Admins should only be in the admins table.');
        return;
      }
      console.log('❌ Error:', error.message);
      return;
    }

    console.log('⚠️  Admin found in clients table!');
    console.log('\nAdmin details:');
    console.log('  ID:', admin.id);
    console.log('  Email:', admin.email);
    console.log('  Full Name:', admin.full_name);
    console.log('  Role:', admin.role);
    console.log('  Status:', admin.status);

    if (admin.role === 'admin') {
      console.log('\n✅ Role is correctly set to "admin"');
      console.log('   This admin should be filtered out from clients list');
      console.log('   If you still see it, try refreshing the frontend');
    } else {
      console.log('\n⚠️  Role is NOT set to "admin"!');
      console.log('   Current role:', admin.role);
      console.log('   This is why it appears in the clients list');
      
      console.log('\n🔧 Fixing role...');
      const { error: updateError } = await supabaseAdmin
        .from('clients')
        .update({ role: 'admin' })
        .eq('id', admin.id);

      if (updateError) {
        console.log('❌ Failed to update:', updateError.message);
      } else {
        console.log('✅ Role updated to "admin"');
        console.log('   Admin will now be filtered from clients list');
      }
    }

    // Recommendation
    console.log('\n💡 RECOMMENDATION:');
    console.log('   The admin account exists in BOTH tables:');
    console.log('   - admins table (ID: 688b3986-0398-4c00-8aa9-0f14a411b378)');
    console.log('   - clients table (ID: ' + admin.id + ')');
    console.log('');
    console.log('   This is causing confusion. You should:');
    console.log('   1. Keep the admin in the admins table (for login)');
    console.log('   2. Delete the admin from the clients table');
    console.log('');
    console.log('   Run: node scripts/delete-admin-from-clients.js');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
}

verifyAndFixAdmin()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
