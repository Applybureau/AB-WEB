require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function verifyMigration() {
  console.log('🔍 Verifying Client Dashboard Migration...\n');
  
  let allGood = true;
  
  // Check all required tables
  const tables = [
    'clients',
    'strategy_calls',
    'client_onboarding',
    'client_files',
    'subscription_plans',
    'client_subscriptions'
  ];
  
  console.log('📋 Checking Tables...\n');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: MISSING or ERROR`);
        console.log(`   Error: ${error.message}\n`);
        allGood = false;
      } else {
        console.log(`✅ ${table}: EXISTS`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ERROR - ${error.message}\n`);
      allGood = false;
    }
  }
  
  // Check clients table columns
  console.log('\n📊 Checking Clients Table Columns...\n');
  
  const requiredColumns = [
    'onboarding_completed',
    'onboarding_approved',
    'profile_unlocked',
    'payment_confirmed'
  ];
  
  try {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select(requiredColumns.join(', '))
      .limit(1);
    
    if (error) {
      console.log(`❌ Missing columns in clients table:`);
      console.log(`   ${error.message}\n`);
      allGood = false;
    } else {
      requiredColumns.forEach(col => {
        console.log(`✅ clients.${col}: EXISTS`);
      });
    }
  } catch (error) {
    console.log(`❌ Error checking clients columns: ${error.message}\n`);
    allGood = false;
  }
  
  // Check subscription plans
  console.log('\n💰 Checking Subscription Plans...\n');
  
  try {
    const { data: plans, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('tier', { ascending: true });
    
    if (error) {
      console.log(`❌ Error fetching subscription plans: ${error.message}\n`);
      allGood = false;
    } else if (!plans || plans.length === 0) {
      console.log(`❌ No subscription plans found!`);
      console.log(`   Expected: 3 plans (Tier 1, 2, 3)\n`);
      allGood = false;
    } else {
      console.log(`✅ Found ${plans.length} subscription plans:`);
      plans.forEach(plan => {
        console.log(`   • Tier ${plan.tier}: ${plan.plan_name}`);
        console.log(`     Price: $${plan.price_cad} CAD`);
        console.log(`     Duration: ${plan.duration_weeks} weeks`);
        console.log(`     Applications: ${plan.applications_per_week}\n`);
      });
      
      if (plans.length !== 3) {
        console.log(`⚠️  Warning: Expected 3 plans, found ${plans.length}\n`);
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    allGood = false;
  }
  
  // Final summary
  console.log('='.repeat(60));
  if (allGood) {
    console.log('✅ MIGRATION SUCCESSFUL!');
    console.log('='.repeat(60));
    console.log('\n🎉 All tables and columns are in place!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test client dashboard endpoint');
    console.log('   2. Test 20Q submission');
    console.log('   3. Test strategy call booking');
    console.log('   4. Test file uploads');
    console.log('   5. Update frontend\n');
  } else {
    console.log('❌ MIGRATION INCOMPLETE');
    console.log('='.repeat(60));
    console.log('\n⚠️  Some tables or columns are missing.');
    console.log('\n💡 Action required:');
    console.log('   1. Open Supabase SQL Editor');
    console.log('   2. Run: backend/sql/client_dashboard_schema_fixed.sql');
    console.log('   3. Run this verification script again\n');
  }
}

verifyMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  });
