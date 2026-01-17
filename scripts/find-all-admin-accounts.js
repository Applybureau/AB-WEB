require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function findAllAdminAccounts() {
  console.log('\n🔍 FINDING ALL ADMIN ACCOUNTS\n');
  console.log('=' .repeat(60));

  try {
    // Find ALL records with admin@applybureau.com email
    console.log('\n📋 Searching for ALL admin@applybureau.com accounts...');
    const { data: allAdmins, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', 'admin@applybureau.com');

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    console.log(`✅ Found ${allAdmins.length} account(s) with email admin@applybureau.com\n`);

    allAdmins.forEach((admin, i) => {
      console.log(`Account ${i + 1}:`);
      console.log('  ID:', admin.id);
      console.log('  Email:', admin.email);
      console.log('  Full Name:', admin.full_name);
      console.log('  Role:', admin.role);
      console.log('  Status:', admin.status);
      console.log('  Is Active:', admin.is_active);
      console.log('  Has Password:', !!admin.password);
      console.log('  Created At:', admin.created_at);
      console.log('  Updated At:', admin.updated_at);
      console.log('');
    });

    // Check which one has the correct password
    console.log('📋 Testing which account has password "admin123"...');
    const bcrypt = require('bcryptjs');
    
    for (let i = 0; i < allAdmins.length; i++) {
      const admin = allAdmins[i];
      if (admin.password) {
        const matches = await bcrypt.compare('admin123', admin.password);
        console.log(`  Account ${i + 1} (${admin.id}): ${matches ? '✅ MATCHES' : '❌ NO MATCH'}`);
      } else {
        console.log(`  Account ${i + 1} (${admin.id}): ❌ NO PASSWORD`);
      }
    }

    // Recommendation
    console.log('\n💡 RECOMMENDATION:');
    if (allAdmins.length > 1) {
      console.log('   You have multiple admin accounts with the same email!');
      console.log('   This is causing the 403 error.');
      console.log('   We should delete the duplicate accounts and keep only one.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
}

// Run
findAllAdminAccounts()
  .then(() => {
    console.log('Search complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
