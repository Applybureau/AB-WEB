require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function deleteAdminFromClients() {
  console.log('\n🗑️  DELETING ADMIN FROM CLIENTS TABLE\n');
  console.log('=' .repeat(60));

  try {
    const targetEmail = 'admin@applybureau.com';

    // Check if admin exists in clients table
    console.log('\n📋 Checking for admin in clients table...');
    const { data: admin, error: findError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', targetEmail)
      .single();

    if (findError) {
      if (findError.code === 'PGRST116') {
        console.log('✅ Admin not found in clients table - already clean!');
        return;
      }
      console.log('❌ Error:', findError.message);
      return;
    }

    console.log('⚠️  Admin found in clients table:');
    console.log('  ID:', admin.id);
    console.log('  Email:', admin.email);
    console.log('  Full Name:', admin.full_name);

    // Verify admin exists in admins table
    console.log('\n📋 Verifying admin exists in admins table...');
    const { data: adminInAdminsTable, error: adminsError } = await supabaseAdmin
      .from('admins')
      .select('id, email')
      .eq('email', targetEmail)
      .single();

    if (adminsError || !adminInAdminsTable) {
      console.log('❌ Admin NOT found in admins table!');
      console.log('   Cannot delete from clients table - admin would be lost!');
      return;
    }

    console.log('✅ Admin exists in admins table (ID:', adminInAdminsTable.id + ')');

    // Delete from clients table
    console.log('\n🗑️  Deleting admin from clients table...');
    const { error: deleteError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', admin.id);

    if (deleteError) {
      console.log('❌ Failed to delete:', deleteError.message);
      return;
    }

    console.log('✅ Admin deleted from clients table!');
    console.log('\n🎉 SUCCESS!');
    console.log('   Admin now only exists in admins table');
    console.log('   Will no longer appear in clients list');
    console.log('   Login still works with admin@applybureau.com / admin123');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
}

deleteAdminFromClients()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
