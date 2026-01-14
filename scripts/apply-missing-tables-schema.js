const { supabaseAdmin } = require('../utils/supabase');
const fs = require('fs');
const path = require('path');

async function applyMissingTablesSchema() {
  try {
    console.log('🔧 Applying Complete Missing Tables Schema...');
    console.log('This will add all missing columns and tables for the concierge backend');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../COMPLETE_MISSING_TABLES_SCHEMA.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL schema loaded');
    console.log('📊 Schema includes:');
    console.log('   - Missing columns for consultation_requests (admin_status, message, etc.)');
    console.log('   - Missing columns for applications (week_number, interview_update_sent)');
    console.log('   - Missing tables (contact_requests, leads, meetings)');
    console.log('   - Indexes and triggers for performance');
    console.log('   - Sample data for testing');
    
    console.log('\n⚠️  IMPORTANT: This schema should be applied in Supabase SQL Editor');
    console.log('   Reason: Complex schema changes require direct SQL execution');
    
    console.log('\n📝 To apply this schema:');
    console.log('1. Open Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the content from COMPLETE_MISSING_TABLES_SCHEMA.sql');
    console.log('4. Run the SQL script');
    console.log('5. Verify all tables and columns are created');
    
    // Test current database state
    console.log('\n🔍 Testing current database state...');
    
    // Test consultation_requests
    try {
      const { data: consultationTest, error: consultationError } = await supabaseAdmin
        .from('consultation_requests')
        .select('admin_status, message')
        .limit(1);
      
      if (consultationError) {
        if (consultationError.message.includes('admin_status')) {
          console.log('❌ admin_status column missing in consultation_requests');
        }
        if (consultationError.message.includes('message')) {
          console.log('❌ message column missing in consultation_requests');
        }
      } else {
        console.log('✅ consultation_requests columns accessible');
      }
    } catch (error) {
      console.log('❌ consultation_requests table issues:', error.message);
    }
    
    // Test applications
    try {
      const { data: appTest, error: appError } = await supabaseAdmin
        .from('applications')
        .select('week_number, interview_update_sent')
        .limit(1);
      
      if (appError) {
        if (appError.message.includes('week_number')) {
          console.log('❌ week_number column missing in applications');
        }
        if (appError.message.includes('interview_update_sent')) {
          console.log('❌ interview_update_sent column missing in applications');
        }
      } else {
        console.log('✅ applications columns accessible');
      }
    } catch (error) {
      console.log('❌ applications table issues:', error.message);
    }
    
    // Test new tables
    const newTables = ['contact_requests', 'leads', 'meetings'];
    for (const table of newTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table} table missing or inaccessible`);
        } else {
          console.log(`✅ ${table} table accessible`);
        }
      } catch (error) {
        console.log(`❌ ${table} table error:`, error.message);
      }
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Apply the schema in Supabase SQL Editor');
    console.log('2. Run the table check script again to verify');
    console.log('3. Test the backend with the comprehensive test');
    
    // Save the SQL to a file for easy copying
    const outputPath = path.join(__dirname, '../APPLY_THIS_SCHEMA_IN_SUPABASE.sql');
    fs.writeFileSync(outputPath, sql);
    console.log(`\n📄 Schema saved to: ${outputPath}`);
    console.log('   Copy this file content to Supabase SQL Editor');
    
    return true;
  } catch (error) {
    console.error('❌ Error preparing schema application:', error.message);
    return false;
  }
}

// Run the schema preparation
if (require.main === module) {
  applyMissingTablesSchema().then(success => {
    if (success) {
      console.log('\n✅ Schema preparation completed');
      console.log('📋 Apply the schema in Supabase SQL Editor to fix all database issues');
    } else {
      console.log('\n❌ Schema preparation failed');
    }
    process.exit(0);
  });
}

module.exports = { applyMissingTablesSchema };