require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const fs = require('fs');
const path = require('path');

async function applyCorrectedSchema() {
  try {
    console.log('🔧 APPLYING CORRECTED NEW FLOW SCHEMA');
    console.log('====================================');
    
    // Read the corrected schema file
    const schemaPath = path.join(__dirname, '../NEW_FLOW_SCHEMA_UPDATES_CORRECTED.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Schema file loaded successfully');
    console.log(`📏 Schema size: ${Math.round(schemaSQL.length / 1024)}KB`);
    
    // Split the schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }
      
      console.log(`\n📝 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          console.log(`❌ Error in statement ${i + 1}:`);
          console.log(`   SQL: ${statement.substring(0, 100)}...`);
          console.log(`   Error: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Exception in statement ${i + 1}:`);
        console.log(`   SQL: ${statement.substring(0, 100)}...`);
        console.log(`   Error: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 SCHEMA APPLICATION SUMMARY');
    console.log('==============================');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📈 Success rate: ${Math.round((successCount / (successCount + errorCount)) * 100)}%`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All schema updates applied successfully!');
      
      // Test the new functionality
      console.log('\n🧪 Testing new functionality...');
      
      // Test strategy calls table
      const { data: strategyTest, error: strategyError } = await supabaseAdmin
        .from('strategy_calls')
        .select('id, admin_status, message')
        .limit(1);
      
      if (!strategyError) {
        console.log('✅ strategy_calls table is working');
      } else {
        console.log('❌ strategy_calls table test failed:', strategyError.message);
      }
      
      // Test application_status_history table
      const { data: historyTest, error: historyError } = await supabaseAdmin
        .from('application_status_history')
        .select('id')
        .limit(1);
      
      if (!historyError) {
        console.log('✅ application_status_history table is working');
      } else {
        console.log('❌ application_status_history table test failed:', historyError.message);
      }
      
      // Test client_dashboard_settings table
      const { data: dashboardTest, error: dashboardError } = await supabaseAdmin
        .from('client_dashboard_settings')
        .select('id')
        .limit(1);
      
      if (!dashboardError) {
        console.log('✅ client_dashboard_settings table is working');
      } else {
        console.log('❌ client_dashboard_settings table test failed:', dashboardError.message);
      }
      
      console.log('\n🚀 New flow schema is ready for use!');
      return true;
    } else {
      console.log('\n⚠️  Some schema updates failed. Please review the errors above.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Schema application failed:', error.message);
    return false;
  }
}

applyCorrectedSchema().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});