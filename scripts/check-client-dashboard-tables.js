require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function checkClientDashboardTables() {
  console.log('🔍 CHECKING CLIENT DASHBOARD TABLES');
  console.log('===================================\n');

  const tablesToCheck = [
    'client_onboarding_20q',
    'strategy_calls',
    'applications',
    'notifications'
  ];

  for (const tableName of tablesToCheck) {
    console.log(`Checking table: ${tableName}`);
    
    try {
      // Try to select from the table to see if it exists
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Table ${tableName}: ${error.message}`);
        
        // Check if it's a "relation does not exist" error
        if (error.message.includes('does not exist')) {
          console.log(`   Table ${tableName} does not exist - needs to be created`);
        }
      } else {
        console.log(`✅ Table ${tableName}: EXISTS (${data?.length || 0} sample records)`);
      }
    } catch (err) {
      console.log(`❌ Table ${tableName}: Error - ${err.message}`);
    }
    
    console.log('');
  }

  // Check specific columns in existing tables
  console.log('Checking specific table structures...\n');

  // Check clients table structure
  try {
    const { data: clientSample } = await supabaseAdmin
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientSample && clientSample.length > 0) {
      console.log('✅ Clients table structure:');
      console.log('   Columns:', Object.keys(clientSample[0]).join(', '));
    }
  } catch (err) {
    console.log('❌ Error checking clients table:', err.message);
  }
}

checkClientDashboardTables();