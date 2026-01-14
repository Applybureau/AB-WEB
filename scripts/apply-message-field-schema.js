require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const fs = require('fs');
const path = require('path');

async function applyMessageFieldSchema() {
  try {
    console.log('📊 Applying message field schema update...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../ADD_MESSAGE_FIELD_TO_CONSULTATIONS.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL content loaded');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          console.error(`❌ Statement ${i + 1} failed:`, error);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    // Verify the column was added
    console.log('🔍 Verifying message column exists...');
    const { data: columns, error: columnError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'consultation_requests')
      .eq('column_name', 'message');
    
    if (columnError) {
      console.error('❌ Error checking column:', columnError);
    } else if (columns && columns.length > 0) {
      console.log('✅ Message column verified:', columns[0]);
    } else {
      console.log('⚠️  Message column not found - may need manual addition');
    }
    
    console.log('📋 Message field schema update completed');
    return true;
  } catch (error) {
    console.error('❌ Error applying message field schema:', error.message);
    return false;
  }
}

// Run the schema update
if (require.main === module) {
  applyMessageFieldSchema().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { applyMessageFieldSchema };