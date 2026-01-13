const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

// Create supabase admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkApplicationsTable() {
  try {
    console.log('🔍 Checking applications table structure...\n');
    
    // Try to query the applications table to see what columns exist
    console.log('📊 Attempting to query applications table...');
    
    try {
      const { data, error } = await supabaseAdmin
        .from('applications')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('❌ Error querying applications table:', error.message);
        console.log('Error details:', error);
        
        // Check if table exists at all
        console.log('\n🔍 Checking if applications table exists...');
        
        const { data: tables, error: tableError } = await supabaseAdmin
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'applications');
        
        if (tableError) {
          console.log('❌ Error checking table existence:', tableError.message);
        } else if (tables && tables.length > 0) {
          console.log('✅ Applications table exists');
          
          // Get column information
          console.log('\n📋 Getting column information...');
          const { data: columns, error: columnError } = await supabaseAdmin
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_schema', 'public')
            .eq('table_name', 'applications')
            .order('ordinal_position');
          
          if (columnError) {
            console.log('❌ Error getting column info:', columnError.message);
          } else {
            console.log('📋 Applications table columns:');
            columns.forEach(col => {
              console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });
          }
        } else {
          console.log('❌ Applications table does not exist');
        }
      } else {
        console.log('✅ Applications table query successful');
        if (data && data.length > 0) {
          console.log('📋 Sample record columns:', Object.keys(data[0]));
        } else {
          console.log('📋 Table exists but is empty');
        }
      }
    } catch (queryError) {
      console.log('❌ Exception querying applications table:', queryError.message);
    }
    
    // Check other related tables
    console.log('\n🔍 Checking related tables...');
    
    const tablesToCheck = ['registered_users', 'consultation_requests'];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: exists and accessible`);
          if (data && data.length > 0) {
            console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking applications table:', error);
  }
}

// Run the check
checkApplicationsTable();