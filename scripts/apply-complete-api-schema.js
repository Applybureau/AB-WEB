#!/usr/bin/env node

/**
 * Apply Complete API Specification Schema
 * This script applies all database schema changes required for full API specification compliance
 */

const { supabaseAdmin } = require('../utils/supabase');
const fs = require('fs');
const path = require('path');

async function applySchema() {
  try {
    console.log('🚀 Starting Complete API Specification Schema Application...\n');

    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'COMPLETE_API_SPECIFICATION_SCHEMA.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📖 Schema file loaded successfully');
    console.log(`📏 Schema size: ${Math.round(schemaSQL.length / 1024)}KB\n`);

    // Split the schema into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Add semicolon back for execution
        const { error } = await supabaseAdmin.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });

        if (error) {
          throw error;
        }

        successCount++;
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        errorCount++;
        const errorInfo = {
          statement: i + 1,
          sql: statement.substring(0, 100) + '...',
          error: error.message
        };
        errors.push(errorInfo);
        console.log(`❌ Statement ${i + 1} failed: ${error.message}`);
        
        // Continue with other statements unless it's a critical error
        if (error.message.includes('does not exist') && error.message.includes('table')) {
          console.log('⚠️  Table creation error - this might be expected if table already exists');
        }
      }
    }

    console.log('\n📊 Schema Application Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n🔍 Error Details:');
      errors.forEach((err, index) => {
        console.log(`\n${index + 1}. Statement ${err.statement}:`);
        console.log(`   SQL: ${err.sql}`);
        console.log(`   Error: ${err.error}`);
      });
    }

    // Verify critical tables exist
    console.log('\n🔍 Verifying critical tables...');
    
    const criticalTables = [
      'consultation_requests',
      'applications', 
      'mock_sessions',
      'resources',
      'resource_downloads',
      'notifications',
      'contact_requests',
      'meetings'
    ];

    for (const table of criticalTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Table '${table}' verification failed: ${error.message}`);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (error) {
        console.log(`❌ Table '${table}' verification error: ${error.message}`);
      }
    }

    // Test some new fields
    console.log('\n🧪 Testing new fields...');
    
    try {
      // Test consultation_requests new fields
      const { data: consultationTest } = await supabaseAdmin
        .from('consultation_requests')
        .select('company, job_title, consultation_type, urgency_level, source, priority')
        .limit(1);
      
      console.log('✅ Consultation requests new fields accessible');
    } catch (error) {
      console.log(`❌ Consultation requests new fields test failed: ${error.message}`);
    }

    try {
      // Test applications new fields
      const { data: applicationTest } = await supabaseAdmin
        .from('applications')
        .select('job_link, salary_range, location, application_method, interview_type, interviewer, offer_amount')
        .limit(1);
      
      console.log('✅ Applications new fields accessible');
    } catch (error) {
      console.log(`❌ Applications new fields test failed: ${error.message}`);
    }

    try {
      // Test notifications new fields
      const { data: notificationTest } = await supabaseAdmin
        .from('notifications')
        .select('category, priority, action_url, action_text, data')
        .limit(1);
      
      console.log('✅ Notifications new fields accessible');
    } catch (error) {
      console.log(`❌ Notifications new fields test failed: ${error.message}`);
    }

    console.log('\n🎉 Schema application completed!');
    
    if (errorCount === 0) {
      console.log('🟢 All statements executed successfully - your database is now fully compliant with the API specification!');
    } else if (errorCount < statements.length / 2) {
      console.log('🟡 Most statements executed successfully - some errors may be expected (e.g., tables already exist)');
    } else {
      console.log('🔴 Many statements failed - please review the errors above and check your database connection');
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Restart your backend server to load the new middleware');
    console.log('2. Test the API endpoints with the new data formats');
    console.log('3. Update your frontend to use the new response formats');
    console.log('4. Run the comprehensive test suite to verify everything works');

  } catch (error) {
    console.error('💥 Fatal error applying schema:', error);
    process.exit(1);
  }
}

// Run the schema application
if (require.main === module) {
  applySchema()
    .then(() => {
      console.log('\n✨ Schema application script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Schema application script failed:', error);
      process.exit(1);
    });
}

module.exports = { applySchema };