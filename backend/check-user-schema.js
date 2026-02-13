#!/usr/bin/env node

/**
 * Check the registered_users table schema
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');

async function checkSchema() {
  console.log('🔍 Checking registered_users table schema...\n');

  try {
    // Get a sample user to see the actual columns
    const { data: users, error } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    if (users.length > 0) {
      console.log('📋 Available columns in registered_users table:');
      Object.keys(users[0]).forEach((column, index) => {
        console.log(`${index + 1}. ${column}`);
      });
      
      console.log('\n📄 Sample user data structure:');
      console.log(JSON.stringify(users[0], null, 2));
    } else {
      console.log('⚠️ No users found in the table');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkSchema()
  .then(() => {
    console.log('\n✅ Schema check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script error:', error);
    process.exit(1);
  });