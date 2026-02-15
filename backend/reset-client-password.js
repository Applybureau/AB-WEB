require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');
const bcrypt = require('bcryptjs');

async function resetClientPassword() {
  console.log('\n🔐 RESETTING CLIENT PASSWORD\n');
  console.log('=' .repeat(60));

  try {
    const email = 'israelloko65@gmail.com';
    const newPassword = 'TempPassword123!'; // CHANGE THIS AFTER LOGIN

    console.log('\n📋 New Credentials:');
    console.log('-'.repeat(60));
    console.log(`Email: ${email}`);
    console.log(`New Password: ${newPassword}`);
    console.log('\n⚠️  IMPORTANT: Change this password after logging in!\n');

    // Hash the new password
    console.log('🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log(`✅ Password hashed (length: ${hashedPassword.length})`);

    // Update password in registered_users table
    console.log('\n🔄 Updating password in registered_users table...');
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update({
        passcode_hash: hashedPassword,
        token_used: true,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating registered_users:', updateError);
      return;
    }

    console.log('✅ Password updated in registered_users');

    // Also update password in clients table
    console.log('\n🔄 Updating password in clients table...');
    const { data: updatedClient, error: clientError } = await supabaseAdmin
      .from('clients')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (clientError) {
      console.log('⚠️  Note: Could not update clients table (may not exist)');
    } else {
      console.log('✅ Password updated in clients table');
    }

    console.log('\n\n📝 LOGIN CREDENTIALS:');
    console.log('=' .repeat(60));
    console.log(`Email: ${email}`);
    console.log(`Password: ${newPassword}`);
    console.log(`Login URL: https://applybureau.com/login`);
    console.log('\n⚠️  CHANGE PASSWORD IMMEDIATELY AFTER LOGIN!');

    console.log('\n\n💡 TEST LOGIN NOW:');
    console.log('-'.repeat(60));
    console.log('Run this command to test:');
    console.log(`
curl -X POST https://jellyfish-app-t4m35.ondigitalocean.app/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "${email}",
    "password": "${newPassword}"
  }'
    `);

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ PASSWORD RESET COMPLETE\n');

  } catch (error) {
    console.error('\n❌ RESET ERROR:', error);
  }
}

resetClientPassword();
