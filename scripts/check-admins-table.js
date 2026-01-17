require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function checkAdminsTable() {
  console.log('\n🔍 CHECKING ADMINS TABLE\n');
  console.log('=' .repeat(60));

  try {
    // Check if admins table exists and has data
    console.log('\n📋 Checking admins table for admin@applybureau.com...');
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', 'admin@applybureau.com')
      .single();

    if (error) {
      if (error.code === '42P01') {
        console.log('ℹ️  Admins table does not exist');
      } else if (error.code === 'PGRST116') {
        console.log('ℹ️  No admin found in admins table');
      } else {
        console.log('❌ Error:', error.message, '(code:', error.code + ')');
      }
      
      console.log('\n📋 Checking all records in admins table...');
      const { data: allAdmins, error: allError } = await supabaseAdmin
        .from('admins')
        .select('*');

      if (allError) {
        console.log('❌ Error fetching all admins:', allError.message);
      } else {
        console.log(`✅ Found ${allAdmins?.length || 0} admin(s) in admins table`);
        if (allAdmins && allAdmins.length > 0) {
          allAdmins.forEach((a, i) => {
            console.log(`\n  Admin ${i + 1}:`);
            console.log('    ID:', a.id);
            console.log('    Email:', a.email);
            console.log('    Full Name:', a.full_name);
            console.log('    Role:', a.role);
            console.log('    Is Active:', a.is_active);
            console.log('    Has Password:', !!a.password);
          });
        }
      }
    } else {
      console.log('✅ Admin found in admins table!');
      console.log('\nAdmin Details:');
      console.log('  ID:', admin.id);
      console.log('  Email:', admin.email);
      console.log('  Full Name:', admin.full_name);
      console.log('  Role:', admin.role);
      console.log('  Is Active:', admin.is_active);
      console.log('  Has Password:', !!admin.password);
      console.log('  Created At:', admin.created_at);

      // Test password
      if (admin.password) {
        const bcrypt = require('bcryptjs');
        const matches = await bcrypt.compare('admin123', admin.password);
        console.log('\n  Password "admin123" matches:', matches ? '✅ YES' : '❌ NO');
      }

      console.log('\n💡 This admin in the admins table is being used for login!');
      console.log('   The isSuperAdmin() function checks the clients table,');
      console.log('   but login returns the ID from the admins table.');
      console.log('   This is why you get 403 error!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
}

// Run
checkAdminsTable()
  .then(() => {
    console.log('Check complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
