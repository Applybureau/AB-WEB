require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function checkSchema() {
  console.log('🔍 Checking admin_users table schema...\n');
  
  try {
    // Try to get any existing admin user to see the structure
    const { data: admins, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (admins && admins.length > 0) {
      console.log('✅ Found admin user. Schema:');
      console.log(JSON.stringify(admins[0], null, 2));
      console.log('\nColumns:', Object.keys(admins[0]));
    } else {
      console.log('No admin users found. Trying to insert with minimal fields...');
      
      // Try with minimal fields
      const { data: newAdmin, error: insertError } = await supabaseAdmin
        .from('admin_users')
        .insert({
          email: 'test@test.com',
          password: 'test123'
        })
        .select();
      
      if (insertError) {
        console.error('❌ Insert error:', insertError);
        console.log('\nLet me try to query the table structure directly...');
        
        // Query information schema
        const { data: columns, error: schemaError } = await supabaseAdmin
          .rpc('get_table_columns', { table_name: 'admin_users' })
          .catch(() => null);
        
        if (columns) {
          console.log('Table columns:', columns);
        }
      } else {
        console.log('✅ Test admin created:', newAdmin);
        
        // Delete test admin
        await supabaseAdmin
          .from('admin_users')
          .delete()
          .eq('email', 'test@test.com');
        
        console.log('Test admin deleted');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
