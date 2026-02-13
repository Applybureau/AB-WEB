require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function checkAllTables() {
  console.log('🔍 Checking all dashboard-related tables...\n');
  
  const tables = [
    'clients',
    'strategy_calls',
    'client_onboarding',
    'client_files',
    'subscription_plans',
    'client_subscriptions'
  ];
  
  for (const table of tables) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 TABLE: ${table}`);
    console.log('='.repeat(60));
    
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table does NOT exist or error: ${error.message}`);
        continue;
      }
      
      console.log(`✅ Table EXISTS`);
      
      if (data && data.length > 0) {
        console.log(`\n📊 Columns (${Object.keys(data[0]).length}):`);
        Object.keys(data[0]).forEach(col => {
          const value = data[0][col];
          const type = value === null ? 'null' : typeof value;
          console.log(`   • ${col}: ${type}`);
        });
      } else {
        console.log(`\n⚠️  Table is empty - trying to see structure...`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Check clients table for specific columns
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 Checking clients table for new columns...`);
  console.log('='.repeat(60));
  
  try {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('id, email, onboarding_completed, onboarding_approved, profile_unlocked, payment_confirmed')
      .limit(1);
    
    if (error) {
      console.log(`❌ Error checking clients columns: ${error.message}`);
      console.log(`\n💡 These columns need to be added to clients table:`);
      console.log(`   • onboarding_completed (BOOLEAN)`);
      console.log(`   • onboarding_approved (BOOLEAN)`);
      console.log(`   • profile_unlocked (BOOLEAN)`);
      console.log(`   • payment_confirmed (BOOLEAN)`);
    } else {
      console.log(`✅ All required columns exist in clients table`);
      if (data && data.length > 0) {
        console.log(`\n📄 Sample:`, data[0]);
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Schema check complete');
  console.log('='.repeat(60) + '\n');
}

checkAllTables()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
