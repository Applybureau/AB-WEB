require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function debugOnboardingApproval() {
  try {
    console.log('🔍 DEBUGGING ONBOARDING APPROVAL');
    console.log('=================================');
    
    const testEmail = 'john.concierge@test.com';
    
    // 1. Check if user exists in registered_users
    console.log('\n👤 1. Checking user in registered_users...');
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name, onboarding_completed, profile_unlocked')
      .eq('email', testEmail)
      .single();
    
    if (userError || !user) {
      console.log('❌ User not found in registered_users');
      return;
    }
    
    console.log('✅ User found:', JSON.stringify(user, null, 2));
    
    // 2. Check if onboarding record exists in client_onboarding_20q
    console.log('\n📝 2. Checking onboarding records...');
    const { data: onboardings, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('user_id', user.id);
    
    if (onboardingError) {
      console.log('❌ Error fetching onboarding records:', onboardingError.message);
      return;
    }
    
    if (!onboardings || onboardings.length === 0) {
      console.log('❌ No onboarding records found for user');
      return;
    }
    
    console.log(`✅ Found ${onboardings.length} onboarding record(s):`);
    onboardings.forEach((onboarding, index) => {
      console.log(`   Record ${index + 1}:`);
      console.log(`   - ID: ${onboarding.id}`);
      console.log(`   - Execution Status: ${onboarding.execution_status}`);
      console.log(`   - Completed At: ${onboarding.completed_at}`);
      console.log(`   - Approved By: ${onboarding.approved_by || 'Not approved'}`);
    });
    
    // 3. Test the approval route with the actual onboarding ID
    if (onboardings.length > 0) {
      const onboardingId = onboardings[0].id;
      console.log(`\n🧪 3. Testing approval lookup for ID: ${onboardingId}`);
      
      // Simulate what the approval route does
      const { data: onboarding, error: fetchError } = await supabaseAdmin
        .from('client_onboarding_20q')
        .select('*, registered_users!inner(id, email, full_name)')
        .eq('id', onboardingId)
        .single();
      
      if (fetchError || !onboarding) {
        console.log('❌ Approval lookup failed:', fetchError?.message || 'No record found');
        
        // Try without the join to see if the record exists
        const { data: simpleOnboarding, error: simpleError } = await supabaseAdmin
          .from('client_onboarding_20q')
          .select('*')
          .eq('id', onboardingId)
          .single();
        
        if (simpleError) {
          console.log('❌ Simple lookup also failed:', simpleError.message);
        } else {
          console.log('✅ Simple lookup worked, issue is with the join');
          console.log('   Record:', JSON.stringify(simpleOnboarding, null, 2));
        }
      } else {
        console.log('✅ Approval lookup successful');
        console.log('   Record with user data:', JSON.stringify(onboarding, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugOnboardingApproval().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});