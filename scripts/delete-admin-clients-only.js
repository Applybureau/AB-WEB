require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function deleteAdminClientsOnly() {
  console.log('🗑️  Deleting Admin Clients from Clients Table\n');
  console.log('='.repeat(70));
  console.log('⚠️  This will delete admin accounts from the clients table');
  console.log('⚠️  Admin accounts in the admins table will be kept');
  console.log('='.repeat(70));

  try {
    // First, show what will be deleted
    console.log('\n📋 Admin accounts in clients table:');
    const { data: adminClients, error: fetchError } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, role')
      .eq('role', 'admin');

    if (fetchError) {
      console.error('❌ Error fetching admin clients:', fetchError);
      return;
    }

    if (!adminClients || adminClients.length === 0) {
      console.log('✅ No admin clients found in clients table');
      return;
    }

    console.log(`\nFound ${adminClients.length} admin accounts in clients table:`);
    adminClients.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.email} (${admin.full_name})`);
    });

    console.log('\n⏳ Deleting in 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete admin accounts from clients table
    const { data: deleted, error: deleteError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('role', 'admin')
      .select();

    if (deleteError) {
      console.error('❌ Error deleting admin clients:', deleteError);
      return;
    }

    console.log(`✅ Deleted ${deleted?.length || 0} admin accounts from clients table`);

    // Verify deletion
    const { data: remaining, error: verifyError } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, role')
      .eq('role', 'admin');

    if (verifyError) {
      console.error('⚠️  Error verifying deletion:', verifyError);
    } else {
      console.log(`\n✅ Remaining admin accounts in clients table: ${remaining?.length || 0}`);
    }

    // Show admins table is still intact
    console.log('\n✅ Checking admins table (should still have accounts):');
    const { data: adminsTable, error: adminsError } = await supabaseAdmin
      .from('admins')
      .select('id, email, full_name, is_active');

    if (!adminsError && adminsTable) {
      console.log(`   Found ${adminsTable.length} accounts in admins table:`);
      adminsTable.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (${admin.full_name}) - ${admin.is_active ? 'Active' : 'Inactive'}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ CLEANUP COMPLETE!');
    console.log('\n💡 Admin login still works:');
    console.log('   Email: admin@applybureau.com');
    console.log('   Password: Admin@123456');
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Details:', error.message);
  }
}

deleteAdminClientsOnly();
