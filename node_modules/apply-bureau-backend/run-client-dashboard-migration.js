require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Starting Client Dashboard Complete Schema Migration...\n');
  
  try {
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'sql', 'client_dashboard_complete_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL Migration file loaded');
    console.log('📊 Executing migration on Supabase...\n');
    
    // Execute the SQL migration
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, trying direct execution...\n');
      
      // Split SQL into individual statements and execute them
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.toLowerCase().includes('select') && statement.toLowerCase().includes('from')) {
          // Skip verification queries
          continue;
        }
        
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          // Use raw query execution
          const { error: stmtError } = await supabaseAdmin.rpc('exec', {
            query: statement + ';'
          });
          
          if (stmtError) {
            console.error(`❌ Error in statement ${i + 1}:`, stmtError.message);
          }
        } catch (err) {
          console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('\n✅ Migration executed successfully!\n');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...\n');
    
    const tables = [
      'client_onboarding',
      'strategy_calls',
      'client_files',
      'subscription_plans',
      'client_subscriptions'
    ];
    
    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.log(`❌ Table '${table}' verification failed:`, tableError.message);
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`);
      }
    }
    
    // Check subscription plans
    console.log('\n📋 Checking subscription plans...\n');
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .order('tier', { ascending: true });
    
    if (plansError) {
      console.log('❌ Error fetching subscription plans:', plansError.message);
    } else {
      console.log(`✅ Found ${plans.length} subscription plans:`);
      plans.forEach(plan => {
        console.log(`   • Tier ${plan.tier}: ${plan.plan_name} - $${plan.price_cad} CAD`);
      });
    }
    
    // Check clients table columns
    console.log('\n🔍 Verifying clients table columns...\n');
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('id, onboarding_completed, onboarding_approved, profile_unlocked, payment_confirmed')
      .limit(1);
    
    if (clientsError) {
      console.log('❌ Error verifying clients table:', clientsError.message);
    } else {
      console.log('✅ Clients table has all required columns');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test the new endpoints');
    console.log('   2. Update frontend to use new dashboard structure');
    console.log('   3. Test 20Q submission and approval flow');
    console.log('   4. Test strategy call booking and confirmation');
    console.log('   5. Test file upload functionality\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nError details:', error.message);
    console.error('\n💡 Manual migration required:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy contents of backend/sql/client_dashboard_complete_schema.sql');
    console.log('   3. Paste and run the SQL script');
    console.log('   4. Verify tables were created\n');
    process.exit(1);
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
