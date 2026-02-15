require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function fixRegistrationTokenUsed() {
  console.log('\n🔧 FIXING REGISTRATION TOKEN_USED FLAG\n');
  console.log('=' .repeat(60));

  try {
    const email = 'israelloko65@gmail.com';

    // Get user
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

    if (user.token_used) {
      console.log('\n✅ Token already marked as used. No fix needed.');
      return;
    }

    // Update token_used to true
    console.log('\n🔄 Updating token_used to true...');
    
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

    console.log('\n✅ USER UPDATED SUCCESSFULLY:');
    console.log('-'.repeat(60));
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Token Used: ${updatedUser.token_used}`);
    console.log(`Active: ${updatedUser.is_active}`);

    console.log('\n\n💡 NEXT STEPS:');
    console.log('-'.repeat(60));
    console.log('1. Try logging in with this email and password');
    console.log('2. Login endpoint: POST /api/auth/login');
    console.log('3. Body: { "email": "' + email + '", "password": "your_password" }');

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ FIX COMPLETE\n');

  } catch (error) {
    console.error('\n❌ FIX ERROR:', error);
  }
}

fixRegistrationTokenUsed();
