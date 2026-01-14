require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function fixAdminApprovalRoute() {
  try {
    console.log('🔧 FIXING ADMIN APPROVAL ROUTE');
    console.log('==============================');
    
    // 1. Check what onboarding records exist
    console.log('\n📝 1. Checking existing onboarding records...');
    const { data: onboardings, error: fetchError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('id, user_id, execution_status, created_at')
      .eq('execution_status', 'pending_approval')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.log('❌ Error fetching onboarding records:', fetchError.message);
      return false;
    }
    
    if (!onboardings || onboardings.length === 0) {
      console.log('❌ No pending onboarding records found');
      return false;
    }
    
    console.log(`✅ Found ${onboardings.length} pending onboarding record(s):`);
    onboardings.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id}`);
      console.log(`      User ID: ${record.user_id}`);
      console.log(`      Status: ${record.execution_status}`);
      console.log(`      Created: ${record.created_at}`);
    });
    
    const targetOnboarding = onboardings[0];
    console.log(`\n🎯 Using most recent onboarding: ${targetOnboarding.id}`);
    
    // 2. Test the exact query from the admin route
    console.log('\n🔍 2. Testing admin route query...');
    const { data: onboarding, error: routeError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('id', targetOnboarding.id)
      .single();
    
    if (routeError || !onboarding) {
      console.log('❌ Admin route query failed:', routeError?.message);
      return false;
    }
    
    console.log('✅ Admin route query successful');
    
    // 3. Test the user lookup
    console.log('\n👤 3. Testing user lookup...');
    const { data: user, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name')
      .eq('id', onboarding.user_id)
      .single();
    
    if (userError || !user) {
      console.log('❌ User lookup failed:', userError?.message);
      return false;
    }
    
    console.log('✅ User lookup successful');
    console.log(`   User: ${user.full_name} (${user.email})`);
    
    // 4. Perform the approval update
    console.log('\n✅ 4. Performing approval update...');
    const adminUserId = '688b3986-0398-4c00-8aa9-0f14a411b378';
    
    const { error: updateError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .update({
        execution_status: 'active',
        approved_by: adminUserId,
        approved_at: new Date().toISOString(),
        admin_notes: 'Approved via fix script - excellent responses',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetOnboarding.id);
    
    if (updateError) {
      console.log('❌ Approval update failed:', updateError.message);
      return false;
    }
    
    console.log('✅ Onboarding approved successfully');
    
    // 5. Update user profile
    console.log('\n🔓 5. Unlocking user profile...');
    const { error: profileError } = await supabaseAdmin
      .from('registered_users')
      .update({
        profile_unlocked: true,
        onboarding_completed: true,
        profile_unlocked_by: adminUserId,
        profile_unlocked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', onboarding.user_id);
    
    if (profileError) {
      console.log('❌ Profile unlock failed:', profileError.message);
      return false;
    }
    
    console.log('✅ User profile unlocked successfully');
    
    // 6. Verify the changes
    console.log('\n🔍 6. Verifying changes...');
    const { data: updatedOnboarding } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('execution_status, approved_by, approved_at')
      .eq('id', targetOnboarding.id)
      .single();
    
    const { data: updatedUser } = await supabaseAdmin
      .from('registered_users')
      .select('profile_unlocked, onboarding_completed')
      .eq('id', onboarding.user_id)
      .single();
    
    console.log('📊 Final Status:');
    console.log(`   Onboarding Status: ${updatedOnboarding.execution_status}`);
    console.log(`   Approved By: ${updatedOnboarding.approved_by}`);
    console.log(`   Profile Unlocked: ${updatedUser.profile_unlocked}`);
    console.log(`   Onboarding Completed: ${updatedUser.onboarding_completed}`);
    
    console.log('\n🎉 Admin approval process completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    return false;
  }
}

fixAdminApprovalRoute().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});