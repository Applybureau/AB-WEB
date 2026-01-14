require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function manuallyApproveOnboarding() {
  try {
    console.log('🔧 MANUALLY APPROVING ONBOARDING');
    console.log('=================================');
    
    const testEmail = 'john.concierge@test.com';
    
    // 1. Get user ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id')
      .eq('email', testEmail)
      .single();
    
    if (userError || !user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ User found: ${user.id}`);
    
    // 2. Get onboarding record
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('id, execution_status')
      .eq('user_id', user.id)
      .single();
    
    if (onboardingError || !onboarding) {
      console.log('❌ Onboarding record not found');
      return;
    }
    
    console.log(`✅ Onboarding found: ${onboarding.id}`);
    console.log(`   Current status: ${onboarding.execution_status}`);
    
    // 3. Update onboarding to approved
    const { error: updateOnboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .update({
        execution_status: 'active',
        approved_by: '688b3986-0398-4c00-8aa9-0f14a411b378', // Admin user ID
        approved_at: new Date().toISOString(),
        admin_notes: 'Manually approved for testing',
        updated_at: new Date().toISOString()
      })
      .eq('id', onboarding.id);
    
    if (updateOnboardingError) {
      console.log('❌ Failed to update onboarding:', updateOnboardingError.message);
      return;
    }
    
    console.log('✅ Onboarding updated to active');
    
    // 4. Update user profile to unlocked
    const { error: updateUserError } = await supabaseAdmin
      .from('registered_users')
      .update({
        profile_unlocked: true,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (updateUserError) {
      console.log('❌ Failed to update user profile:', updateUserError.message);
      return;
    }
    
    console.log('✅ User profile unlocked');
    
    // 5. Verify the changes
    const { data: updatedOnboarding } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('execution_status, approved_by, approved_at')
      .eq('id', onboarding.id)
      .single();
    
    const { data: updatedUser } = await supabaseAdmin
      .from('registered_users')
      .select('profile_unlocked, onboarding_completed')
      .eq('id', user.id)
      .single();
    
    console.log('\n📊 VERIFICATION');
    console.log('================');
    console.log('Onboarding:', JSON.stringify(updatedOnboarding, null, 2));
    console.log('User:', JSON.stringify(updatedUser, null, 2));
    
    console.log('\n🎉 Manual approval completed successfully!');
    console.log('The user should now be able to access the Application Tracker.');
    
  } catch (error) {
    console.error('❌ Manual approval failed:', error.message);
  }
}

manuallyApproveOnboarding().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});