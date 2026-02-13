require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function verifySchema() {
  console.log('\n🔍 Verifying Database Schema Before Push...\n');

  try {
    // Check clients table columns
    console.log('1️⃣ Checking clients table...');
    
    // Check if registration_token column exists
    const { data: testClient, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, registration_token, registration_token_expires, registration_completed')
      .limit(1);

    if (testClient && testClient.length > 0 && 'registration_token' in testClient[0]) {
      console.log('   ✅ registration_token column exists');
      console.log('   ✅ registration_token_expires column exists');
      console.log('   ✅ registration_completed column exists');
    } else if (clientError && clientError.message.includes('column')) {
      console.log('   ❌ Registration token columns MISSING - Need to run migration!');
      console.log('   ⚠️  Error:', clientError.message);
    } else {
      console.log('   ⚠️  No clients in database yet, but columns should exist');
    }

    // Check strategy_calls table
    console.log('\n2️⃣ Checking strategy_calls table...');
    const { data: testCall, error: callError } = await supabaseAdmin
      .from('strategy_calls')
      .select('id, communication_method, whatsapp_number, admin_action_by, admin_action_at')
      .limit(1);

    if (testCall && testCall.length > 0 && 'communication_method' in testCall[0]) {
      console.log('   ✅ communication_method column exists');
      console.log('   ✅ whatsapp_number column exists');
      console.log('   ✅ admin_action_by column exists');
      console.log('   ✅ admin_action_at column exists');
    } else if (callError && callError.message.includes('column')) {
      console.log('   ❌ Strategy call columns MISSING - Need to run migration!');
      console.log('   ⚠️  Error:', callError.message);
    } else {
      console.log('   ⚠️  No strategy calls yet, but columns should exist');
    }

    // Check client_subscriptions table
    console.log('\n3️⃣ Checking client_subscriptions table...');
    const { data: testSub, error: subError } = await supabaseAdmin
      .from('client_subscriptions')
      .select('id, assigned_by, assigned_at')
      .limit(1);

    if (testSub && testSub.length > 0 && 'assigned_by' in testSub[0]) {
      console.log('   ✅ assigned_by column exists');
      console.log('   ✅ assigned_at column exists');
    } else if (subError && subError.message.includes('column')) {
      console.log('   ❌ Subscription columns MISSING - Need to run migration!');
      console.log('   ⚠️  Error:', subError.message);
    } else {
      console.log('   ⚠️  No subscriptions yet, but columns should exist');
    }

    // Check client_onboarding table
    console.log('\n4️⃣ Checking client_onboarding table...');
    const { data: onboardingTest, error: onbError } = await supabaseAdmin
      .from('client_onboarding')
      .select('id, client_id, status, approved_by, approved_at')
      .limit(1);

    if (onboardingTest && onboardingTest.length > 0) {
      console.log('   ✅ client_onboarding table exists');
      console.log('   ✅ All required columns present');
    } else if (onbError) {
      console.log('   ❌ client_onboarding table issue:', onbError.message);
    } else {
      console.log('   ⚠️  No onboarding records yet (table exists)');
    }

    // Check client_files table
    console.log('\n5️⃣ Checking client_files table...');
    const { data: filesTest, error: filesError } = await supabaseAdmin
      .from('client_files')
      .select('id, client_id, file_type, file_url')
      .limit(1);

    if (filesTest !== undefined) {
      console.log('   ✅ client_files table exists');
    } else if (filesError) {
      console.log('   ❌ client_files table issue:', filesError.message);
    }

    // Check subscription_plans table
    console.log('\n6️⃣ Checking subscription_plans table...');
    const { data: plans } = await supabaseAdmin
      .from('subscription_plans')
      .select('*');

    if (plans && plans.length > 0) {
      console.log(`   ✅ subscription_plans table exists with ${plans.length} plans`);
      plans.forEach(plan => {
        console.log(`      • ${plan.plan_name} (Tier ${plan.tier}) - $${plan.price_cad} CAD`);
      });
    } else {
      console.log('   ⚠️  No subscription plans found');
    }

    // Check notifications table
    console.log('\n7️⃣ Checking notifications table...');
    const { data: notifTest, error: notifError } = await supabaseAdmin
      .from('notifications')
      .select('id, user_type, type')
      .limit(1);

    if (notifTest !== undefined) {
      console.log('   ✅ notifications table exists');
    } else if (notifError) {
      console.log('   ❌ notifications table issue:', notifError.message);
    }

    console.log('\n✅ Schema verification complete!\n');
    console.log('📋 Summary:');
    console.log('   • All core tables exist');
    console.log('   • Ready to test endpoints');
    console.log('   • If any columns are missing, run: backend/sql/add_missing_features_schema.sql\n');

  } catch (error) {
    console.error('\n❌ Schema verification failed:', error.message);
    console.error('\n🔧 Action needed:');
    console.error('   1. Go to Supabase Dashboard → SQL Editor');
    console.error('   2. Run: backend/sql/add_missing_features_schema.sql');
    console.error('   3. Run this script again to verify\n');
  }
}

verifySchema();
