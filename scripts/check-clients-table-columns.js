require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function checkClientsTable() {
  console.log('🔍 Checking clients table structure...\n');

  try {
    // Get one record to see all columns
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Clients table columns:');
      const columns = Object.keys(data[0]);
      columns.forEach((col, index) => {
        console.log(`  ${index + 1}. ${col}`);
      });
      
      console.log('\n📋 Sample data:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️  No data in clients table');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkClientsTable();
