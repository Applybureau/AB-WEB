require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function fixClientLoginIssue() {
  console.log('\n🔧 FIXING CLIENT LOGIN ISSUE\n');
  console.log('=' .repeat(60));

  try {
    const email = 'israelloko65@gmail.com';

    // Get user from registered_users
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', email);
      return;
    }

    console.log('\n📋 CURRENT USER STATE:');
    console.log('-'.repeat(60));
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.full_name}`);
    console.log(`Has Password: ${!!user.passcode_hash}`);
    console.log(`Token Used: ${user.token_used}`);
    console.log(`Active: ${user.is_active}`);
    console.log(`Payment Confirmed: ${user.payment_confirmed}`);

    // The issue: token_used is false, which means registration didn't complete
    // But the password IS saved, so we just need to mark token as used

    if (user.token_used) {
      console.log('\n✅ Token already marked as used.');
      console.log('⚠️  If login still fails, the password might be incorrect.');
      console.log('\nTry logging in with the password you set during registration.');
      return;
    }

    console.log('\n🔄 Marking token as used...');
    
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update({
        token_used: true,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      return;
    }

    console.log('\n✅ USER FIXED:');
    console.log('-'.repeat(60));
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Token Used: ${updatedUser.token_used}`);
    console.log(`Active: ${updatedUser.is_active}`);
    console.log(`Has Password: ${!!updatedUser.passcode_hash}`);

    console.log('\n\n📝 LOGIN INSTRUCTIONS:');
    console.log('=' .repeat(60));
    console.log('1. Go to: https://applybureau.com/login');
    console.log(`2. Email: ${email}`);
    console.log('3. Password: [the password you set during registration]');
    console.log('\n⚠️  If you forgot your password, you need to:');
    console.log('   - Request a password reset');
    console.log('   - OR contact admin to reset your account');

    console.log('\n\n💡 TEST LOGIN:');
    console.log('-'.repeat(60));
    console.log('Run this command to test (replace PASSWORD):');
    console.log(`
curl -X POST https://jellyfish-app-t4m35.ondigitalocean.app/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "${email}",
    "password": "YOUR_PASSWORD_HERE"
  }'
    `);

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ FIX COMPLETE\n');

  } catch (error) {
    console.error('\n❌ FIX ERROR:', error);
  }
}

fixClientLoginIssue();
