require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function showAllClientLogins() {
  console.log('\n📋 ALL CLIENT LOGIN CREDENTIALS\n');
  console.log('=' .repeat(70));

  try {
    // Get all clients from registered_users
    const { data: users, error } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name, role, is_active, payment_confirmed, token_used, passcode_hash, created_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('\n⚠️  No client users found in database');
      return;
    }

    console.log(`\nFound ${users.length} client user(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name || 'No Name'}`);
      console.log('   ' + '-'.repeat(66));
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: [Set during registration - you must remember it]`);
      console.log(`   Has Password: ${user.passcode_hash ? '✅ YES' : '❌ NO'}`);
      console.log(`   Active: ${user.is_active ? '✅' : '❌'}`);
      console.log(`   Payment Confirmed: ${user.payment_confirmed ? '✅' : '❌'}`);
      console.log(`   Registration Complete: ${user.token_used ? '✅' : '❌'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   Login URL: https://applybureau.com/login`);
      console.log('');
    });

    console.log('\n💡 IMPORTANT NOTES:');
    console.log('=' .repeat(70));
    console.log('1. You must use the password you set during registration');
    console.log('2. If you forgot your password, run: node reset-client-password.js');
    console.log('3. Registration should automatically log you in');
    console.log('4. If auto-login fails, manually login at https://applybureau.com/login');

    console.log('\n\n🔧 TROUBLESHOOTING:');
    console.log('=' .repeat(70));
    console.log('If login fails:');
    console.log('1. Check "Has Password" is ✅');
    console.log('2. Check "Active" is ✅');
    console.log('3. Check "Payment Confirmed" is ✅');
    console.log('4. Check "Registration Complete" is ✅');
    console.log('5. Try resetting password with: node reset-client-password.js');

    console.log('\n\n' + '='.repeat(70));
    console.log('✅ COMPLETE\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
  }
}

showAllClientLogins();
