require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function checkUserAccountStatus() {
  try {
    console.log('🔍 CHECKING USER ACCOUNT STATUS');
    console.log('===============================');
    
    const testEmail = 'john.concierge@test.com';
    
    const { data: user, error } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (error || !user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Full Name: ${user.full_name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Is Active: ${user.is_active}`);
    console.log(`   Profile Unlocked: ${user.profile_unlocked}`);
    console.log(`   Onboarding Completed: ${user.onboarding_completed}`);
    console.log(`   Payment Confirmed: ${user.payment_confirmed}`);
    console.log(`   Token Used: ${user.token_used}`);
    console.log(`   Has Password: ${user.passcode_hash ? 'Yes' : 'No'}`);
    console.log(`   Last Login: ${user.last_login || 'Never'}`);
    
    if (!user.passcode_hash) {
      console.log('\n⚠️  User has no password set!');
      console.log('This explains why login is failing.');
      console.log('The registration process may not have completed properly.');
    }
    
    if (!user.is_active) {
      console.log('\n⚠️  User account is not active!');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkUserAccountStatus().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});