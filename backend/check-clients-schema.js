#!/usr/bin/env node

/**
 * Check the clients table schema
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');

async function checkClientsSchema() {
  console.log('🔍 Checking clients table schema...\n');

  try {
    // Get a sample client to see the actual columns
    const { data: clients, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error fetching clients:', error);
      return;
    }

    if (clients.length > 0) {
      console.log('📋 Available columns in clients table:');
      Object.keys(clients[0]).forEach((column, index) => {
        console.log(`${index + 1}. ${column}`);
      });
      
      console.log('\n📄 Sample client data structure:');
      console.log(JSON.stringify(clients[0], null, 2));
    } else {
      console.log('⚠️ No clients found in the table');
      
      // Try to get table structure from information_schema
      console.log('\n🔍 Attempting to get table structure...');
      
      const { data: tableInfo, error: tableError } = await supabaseAdmin
        .rpc('get_table_columns', { table_name: 'clients' });
      
      if (tableError) {
        console.log('⚠️ Could not get table structure:', tableError.message);
      } else {
        console.log('📋 Table structure:', tableInfo);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkClientsSchema()
  .then(() => {
    console.log('\n✅ Schema check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script error:', error);
    process.exit(1);
  });