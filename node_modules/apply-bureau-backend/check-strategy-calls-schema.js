require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function checkSchema() {
  console.log('🔍 Checking strategy_calls table schema...\n');
  
  try {
    // Get one record to see the structure
    const { data, error } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ strategy_calls table exists');
      console.log('\n📋 Current columns:');
      Object.keys(data[0]).forEach(col => {
        console.log(`   • ${col}: ${typeof data[0][col]}`);
      });
      console.log('\n📄 Sample record:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️  strategy_calls table exists but is empty');
      console.log('Creating a test query to see column structure...');
      
      // Try to insert and immediately delete to see structure
      const { error: insertError } = await supabaseAdmin
        .from('strategy_calls')
        .insert({
          client_id: '00000000-0000-0000-0000-000000000000',
          client_name: 'Test',
          client_email: 'test@test.com'
        });
      
      if (insertError) {
        console.log('\n❌ Insert error (this helps us see required columns):');
        console.log(insertError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
