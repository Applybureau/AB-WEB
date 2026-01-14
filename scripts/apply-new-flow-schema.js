require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function applyNewFlowSchema() {
  try {
    console.log('🔧 Applying New Flow Schema Updates');
    console.log('===================================');
    
    // Check if strategy_calls table exists
    console.log('🔍 Checking strategy_calls table...');
    const { data: strategyTest, error: strategyError } = await supabaseAdmin
      .from('strategy_calls')
      .select('id')
      .limit(1);
    
    if (strategyError && strategyError.code === 'PGRST205') {
      console.log('❌ strategy_calls table does not exist');
      console.log('⚠️  Please run NEW_FLOW_SCHEMA_UPDATES.sql in Supabase SQL Editor');
      return false;
    } else if (strategyError) {
      console.log('❌ Error checking strategy_calls table:', strategyError.message);
      return false;
    } else {
      console.log('✅ strategy_calls table exists');
    }
    
    // Test creating a strategy call record
    console.log('🧪 Testing strategy call creation...');
    const testUserId = '688b3986-0398-4c00-8aa9-0f14a411b378'; // Admin user ID
    
    const { data: testCall, error: testError } = await supabaseAdmin
      .from('strategy_calls')
      .insert({
        client_id: testUserId,
        client_name: 'Test Client',
        client_email: 'test@example.com',
        preferred_slots: [{ date: '2024-02-15', time: '14:00' }],
        status: 'pending',
        admin_status: 'pending'
      })
      .select()
      .single();
    
    if (testError) {
      console.log('❌ Error creating test strategy call:', testError.message);
      return false;
    } else {
      console.log('✅ Test strategy call created successfully');
      
      // Clean up test record
      await supabaseAdmin
        .from('strategy_calls')
        .delete()
        .eq('id', testCall.id);
      console.log('🧹 Test record cleaned up');
    }
    
    // Check if new columns exist in registered_users
    console.log('🔍 Checking registered_users new columns...');
    const { data: userTest, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('linkedin_profile_url, portfolio_urls')
      .limit(1);
    
    if (userError) {
      console.log('❌ New columns missing in registered_users:', userError.message);
      console.log('⚠️  Please run NEW_FLOW_SCHEMA_UPDATES.sql in Supabase SQL Editor');
      return false;
    } else {
      console.log('✅ New columns exist in registered_users');
    }
    
    // Check if new columns exist in client_onboarding_20q
    console.log('🔍 Checking client_onboarding_20q new columns...');
    const { data: onboardingTest, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('confirmation_email_sent, confirmation_email_sent_by, confirmation_email_sent_at')
      .limit(1);
    
    if (onboardingError) {
      console.log('❌ New columns missing in client_onboarding_20q:', onboardingError.message);
      console.log('⚠️  Please run NEW_FLOW_SCHEMA_UPDATES.sql in Supabase SQL Editor');
      return false;
    } else {
      console.log('✅ New columns exist in client_onboarding_20q');
    }
    
    console.log('✅ New flow schema appears to be working correctly');
    return true;
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
    return false;
  }
}

applyNewFlowSchema().then(success => {
  if (success) {
    console.log('🎉 New flow schema check completed successfully');
  } else {
    console.log('⚠️  Manual schema application required');
    console.log('📋 Please run NEW_FLOW_SCHEMA_UPDATES.sql in Supabase SQL Editor');
  }
  process.exit(success ? 0 : 1);
});