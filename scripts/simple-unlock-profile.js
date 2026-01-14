require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function simpleUnlockProfile() {
  try {
    console.log('🔧 SIMPLE PROFILE UNLOCK');
    console.log('========================');
    
    const testEmail = 'john.concierge@test.com';
    
    // Just update the profile_unlocked field
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update({
        profile_unlocked: true
      })
      .eq('email', testEmail)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Failed to update profile:', updateError.message);
      console.log('   Error details:', JSON.stringify(updateError, null, 2));
      return;
    }
    
    console.log('✅ Profile unlocked successfully');
    console.log(`   User: ${updatedUser.full_name}`);
    console.log(`   Profile Unlocked: ${updatedUser.profile_unlocked}`);
    
  } catch (error) {
    console.error('❌ Simple unlock failed:', error.message);
  }
}

simpleUnlockProfile().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});