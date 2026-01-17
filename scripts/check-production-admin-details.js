require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function checkProductionAdmin() {
  console.log('\n🔍 CHECKING PRODUCTION ADMIN DETAILS\n');
  console.log('=' .repeat(60));

  try {
    // Check admin in clients table
    console.log('\n📋 Checking admin@applybureau.com in clients table...');
    const { data: admin, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', 'admin@applybureau.com')
      .single();

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    console.log('✅ Admin found!');
    console.log('\nAdmin Details:');
    console.log('  ID:', admin.id);
    console.log('  Email:', admin.email);
    console.log('  Full Name:', admin.full_name);
    console.log('  Role:', admin.role);
    console.log('  Status:', admin.status);
    console.log('  Is Active:', admin.is_active);
    console.log('  Created At:', admin.created_at);

    // Test the isSuperAdmin query
    console.log('\n📋 Testing isSuperAdmin() query...');
    const { data: superAdminCheck, error: checkError } = await supabaseAdmin
      .from('clients')
      .select('email, role')
      .eq('id', admin.id)
      .eq('email', 'admin@applybureau.com')
      .eq('role', 'admin')
      .single();

    if (checkError) {
      console.log('❌ Super admin check failed:', checkError.message);
    } else if (superAdminCheck) {
      console.log('✅ Super admin check PASSED!');
      console.log('   Email:', superAdminCheck.email);
      console.log('   Role:', superAdminCheck.role);
    } else {
      console.log('❌ Super admin check returned null');
    }

    // Check if there are multiple admins
    console.log('\n📋 Checking all admins in database...');
    const { data: allAdmins, error: allError } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, role')
      .eq('role', 'admin');

    if (allError) {
      console.log('❌ Error fetching all admins:', allError.message);
    } else {
      console.log(`✅ Found ${allAdmins.length} admin(s):`);
      allAdmins.forEach((a, i) => {
        console.log(`\n  Admin ${i + 1}:`);
        console.log('    ID:', a.id);
        console.log('    Email:', a.email);
        console.log('    Full Name:', a.full_name);
        console.log('    Role:', a.role);
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
}

// Run
checkProductionAdmin()
  .then(() => {
    console.log('Check complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
