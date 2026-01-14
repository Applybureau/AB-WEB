require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function checkDatabaseStructure() {
  try {
    console.log('🔍 CHECKING CURRENT DATABASE STRUCTURE');
    console.log('=====================================');
    
    // Check what tables exist
    console.log('📋 Checking existing tables...');
    const { data: tables, error: tablesError } = await supabaseAdmin
      .rpc('get_table_names');
    
    if (tablesError) {
      console.log('Using alternative method to check tables...');
      
      // Try to query each table we expect
      const expectedTables = [
        'profiles',
        'registered_users', 
        'applications',
        'consultations',
        'consultation_requests',
        'strategy_calls',
        'client_onboarding_20q',
        'admin_users',
        'notifications'
      ];
      
      for (const tableName of expectedTables) {
        try {
          const { data, error } = await supabaseAdmin
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (error) {
            console.log(`❌ Table '${tableName}' does not exist or is not accessible`);
            console.log(`   Error: ${error.message}`);
          } else {
            console.log(`✅ Table '${tableName}' exists`);
            
            // Try to get column info by attempting to select specific columns
            if (tableName === 'applications') {
              console.log('   🔍 Checking applications table columns...');
              
              // Check for client_id vs user_id
              try {
                await supabaseAdmin.from('applications').select('client_id').limit(1);
                console.log('   ✅ applications.client_id exists');
              } catch (e) {
                console.log('   ❌ applications.client_id does not exist');
              }
              
              try {
                await supabaseAdmin.from('applications').select('user_id').limit(1);
                console.log('   ✅ applications.user_id exists');
              } catch (e) {
                console.log('   ❌ applications.user_id does not exist');
              }
            }
            
            if (tableName === 'strategy_calls') {
              console.log('   🔍 Checking strategy_calls table columns...');
              
              try {
                await supabaseAdmin.from('strategy_calls').select('admin_status').limit(1);
                console.log('   ✅ strategy_calls.admin_status exists');
              } catch (e) {
                console.log('   ❌ strategy_calls.admin_status does not exist');
                console.log(`   Error: ${e.message}`);
              }
            }
          }
        } catch (err) {
          console.log(`❌ Error checking table '${tableName}': ${err.message}`);
        }
      }
    }
    
    // Check if we have registered_users or profiles table
    console.log('\n🔍 Checking user tables...');
    
    try {
      const { data: registeredUsers, error: regError } = await supabaseAdmin
        .from('registered_users')
        .select('id, email, full_name')
        .limit(1);
      
      if (!regError) {
        console.log('✅ registered_users table exists and is accessible');
      }
    } catch (e) {
      console.log('❌ registered_users table does not exist or is not accessible');
    }
    
    try {
      const { data: profiles, error: profError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name')
        .limit(1);
      
      if (!profError) {
        console.log('✅ profiles table exists and is accessible');
      }
    } catch (e) {
      console.log('❌ profiles table does not exist or is not accessible');
    }
    
    console.log('\n📊 Database structure check completed');
    
  } catch (error) {
    console.error('❌ Error checking database structure:', error.message);
  }
}

checkDatabaseStructure().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});