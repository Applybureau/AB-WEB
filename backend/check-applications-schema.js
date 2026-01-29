#!/usr/bin/env node

/**
 * Check the applications table schema
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');

async function checkApplicationsSchema() {
  console.log('🔍 Checking applications table schema...\n');

  try {
    // Get a sample application to see the actual columns
    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error fetching applications:', error);
      return;
    }

    if (applications.length > 0) {
      console.log('📋 Available columns in applications table:');
      Object.keys(applications[0]).forEach((column, index) => {
        console.log(`${index + 1}. ${column}`);
      });
      
      console.log('\n📄 Sample application data structure:');
      console.log(JSON.stringify(applications[0], null, 2));
    } else {
      console.log('⚠️ No applications found in the table');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkApplicationsSchema()
  .then(() => {
    console.log('\n✅ Schema check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script error:', error);
    process.exit(1);
  });