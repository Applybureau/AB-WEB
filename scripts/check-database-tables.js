require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function checkDatabaseTables() {
  try {
    console.log('🔍 Checking existing database tables...');
    
    // Try to get table information using a simple query
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError);
      
      // Try alternative method - check specific tables
      console.log('🔄 Trying alternative method...');
      const testTables = ['registered_users', 'consultation_requests', 'applications'];
      const existingTables = [];
      
      for (const table of testTables) {
        try {
          const { data, error } = await supabaseAdmin
            .from(table)
            .select('*')
            .limit(1);
          
          if (!error) {
            existingTables.push(table);
            console.log(`   ✅ ${table} - exists`);
          } else {
            console.log(`   ❌ ${table} - missing or inaccessible`);
          }
        } catch (err) {
          console.log(`   ❌ ${table} - error: ${err.message}`);
        }
      }
      
      return existingTables;
    }
    
    console.log('📋 Existing tables:');
    const existingTables = tables?.map(t => t.table_name || t.tablename) || [];
    existingTables.forEach(table => {
      console.log(`   - ${table}`);
    });
    
    // Required tables for concierge backend
    const requiredTables = [
      'registered_users',
      'consultation_requests', 
      'applications',
      'notifications',
      'client_onboarding_20q',
      'contact_requests',
      'meetings',
      'leads'
    ];
    
    console.log('\n🎯 Required tables for concierge backend:');
    const missingTables = [];
    
    requiredTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
      if (!exists) {
        missingTables.push(table);
      }
    });
    
    if (missingTables.length > 0) {
      console.log('\n⚠️  Missing tables:', missingTables.join(', '));
      console.log('📝 A complete schema needs to be applied to create missing tables');
      return false;
    } else {
      console.log('\n✅ All required tables exist');
      
      // Check for required columns in key tables
      console.log('\n🔍 Checking key table structures...');
      
      // Check consultation_requests
      const { data: consultationCols } = await supabaseAdmin
        .from('consultation_requests')
        .select('*')
        .limit(1);
      
      if (consultationCols && consultationCols.length > 0) {
        const cols = Object.keys(consultationCols[0]);
        console.log('📋 consultation_requests columns:', cols.join(', '));
        
        const requiredCols = ['message', 'admin_status', 'preferred_slots'];
        const missingCols = requiredCols.filter(col => !cols.includes(col));
        if (missingCols.length > 0) {
          console.log('⚠️  Missing columns in consultation_requests:', missingCols.join(', '));
        }
      }
      
      // Check registered_users
      const { data: userCols } = await supabaseAdmin
        .from('registered_users')
        .select('*')
        .limit(1);
      
      if (userCols && userCols.length > 0) {
        const cols = Object.keys(userCols[0]);
        console.log('📋 registered_users columns:', cols.join(', '));
        
        const requiredCols = ['payment_confirmed', 'profile_unlocked', 'registration_token'];
        const missingCols = requiredCols.filter(col => !cols.includes(col));
        if (missingCols.length > 0) {
          console.log('⚠️  Missing columns in registered_users:', missingCols.join(', '));
        }
      }
      
      return true;
    }
  } catch (error) {
    console.error('❌ Error checking database tables:', error.message);
    return false;
  }
}

// Run the check
if (require.main === module) {
  checkDatabaseTables().then(success => {
    if (success) {
      console.log('\n✅ Database structure check completed');
    } else {
      console.log('\n⚠️  Database structure needs updates');
    }
    process.exit(0);
  });
}

module.exports = { checkDatabaseTables };