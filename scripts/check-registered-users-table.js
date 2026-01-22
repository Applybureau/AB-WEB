#!/usr/bin/env node

/**
 * Check the structure of the registered_users table
 */

require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function checkRegisteredUsersTable() {
  console.log('🔍 CHECKING REGISTERED_USERS TABLE STRUCTURE');
  console.log('=============================================');
  
  try {
    // Try to get a sample record to see the structure
    const { data, error } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying table:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Sample record structure:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('ℹ️  No records found, trying to insert a minimal record to see required fields...');
      
      // Try minimal insert to see what fields are required/available
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('registered_users')
        .insert({
          email: 'test@example.com',
          full_name: 'Test User'
        })
        .select();
      
      if (insertError) {
        console.log('❌ Insert error (shows available fields):', insertError);
      } else {
        console.log('✅ Minimal insert successful:', insertData);
        
        // Clean up
        await supabaseAdmin
          .from('registered_users')
          .delete()
          .eq('email', 'test@example.com');
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to check table:', error);
  }
}

checkRegisteredUsersTable();