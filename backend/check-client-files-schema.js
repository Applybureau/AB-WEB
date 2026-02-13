// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { supabaseAdmin } = require('./utils/supabase');

console.log('🔍 CHECKING client_files TABLE SCHEMA');
console.log('='.repeat(70));
console.log('');

async function checkSchema() {
  try {
    // Try to get table structure by querying with all possible columns
    console.log('1️⃣ Checking table columns...');
    
    const { data, error } = await supabaseAdmin
      .from('client_files')
      .select('*')
      .limit(1);

    if (error) {
      console.log('   ❌ Error:', error.message);
      console.log('   Details:', error);
    } else {
      console.log('   ✅ Query successful');
      if (data && data.length > 0) {
        console.log('   📋 Sample record columns:');
        Object.keys(data[0]).forEach(col => {
          console.log(`      - ${col}: ${typeof data[0][col]}`);
        });
      } else {
        console.log('   ℹ️  Table is empty, checking with insert test...');
      }
    }

    // Test insert with url column
    console.log('');
    console.log('2️⃣ Testing insert with url column...');
    const testInsert = {
      client_id: '00000000-0000-0000-0000-000000000000',
      file_type: 'test',
      url: 'https://test.com',
      is_active: true,
      uploaded_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('client_files')
      .insert(testInsert)
      .select();

    if (insertError) {
      console.log('   ❌ Insert failed:', insertError.message);
      console.log('   Details:', insertError);
      
      if (insertError.message.includes('column') || insertError.message.includes('does not exist')) {
        console.log('');
        console.log('   🔧 ISSUE FOUND: url column does not exist in client_files table');
        console.log('');
        console.log('   SQL to fix:');
        console.log('   ALTER TABLE client_files ADD COLUMN IF NOT EXISTS url TEXT;');
      }
    } else {
      console.log('   ✅ Insert successful');
      console.log('   Inserted record:', insertData);
      
      // Clean up test record
      await supabaseAdmin
        .from('client_files')
        .delete()
        .eq('client_id', '00000000-0000-0000-0000-000000000000');
      console.log('   🧹 Test record cleaned up');
    }

    console.log('');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error('');
  }
}

checkSchema();
