const { supabaseAdmin } = require('../utils/supabase');
const fs = require('fs');
const path = require('path');

async function applyCorrectedSchema() {
  try {
    console.log('🔧 Applying Corrected Missing Columns Schema...');
    console.log('This schema is based on the actual table structure found in your database');
    
    // Read the corrected SQL file
    const sqlPath = path.join(__dirname, '../CORRECTED_MISSING_COLUMNS_SCHEMA.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Corrected SQL schema loaded');
    console.log('📊 This schema will add:');
    console.log('   - admin_status column to consultation_requests');
    console.log('   - preferred_slots column to consultation_requests');
    console.log('   - confirmed_time column to consultation_requests');
    console.log('   - week_number column to applications');
    console.log('   - interview_update_sent column to applications');
    console.log('   - Missing tables: contact_requests, leads, meetings');
    console.log('   - Indexes and triggers for performance');
    
    console.log('\n⚠️  IMPORTANT: Apply this schema in Supabase SQL Editor');
    console.log('   This corrected schema uses the actual column names from your database');
    console.log('   (consultation_requests uses "name" not "full_name")');
    
    console.log('\n📝 To apply this corrected schema:');
    console.log('1. Open Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the content from CORRECTED_MISSING_COLUMNS_SCHEMA.sql');
    console.log('4. Run the SQL script');
    console.log('5. Verify all columns are added successfully');
    
    // Test current state before applying
    console.log('\n🔍 Testing current database state...');
    
    // Test consultation_requests for missing columns
    try {
      const { data: consultationTest, error: consultationError } = await supabaseAdmin
        .from('consultation_requests')
        .select('admin_status, preferred_slots, confirmed_time')
        .limit(1);
      
      if (consultationError) {
        console.log('❌ Missing columns in consultation_requests:', consultationError.message);
      } else {
        console.log('✅ consultation_requests new columns accessible');
      }
    } catch (error) {
      console.log('❌ consultation_requests issues:', error.message);
    }
    
    // Test applications for missing columns
    try {
      const { data: appTest, error: appError } = await supabaseAdmin
        .from('applications')
        .select('week_number, interview_update_sent')
        .limit(1);
      
      if (appError) {
        console.log('❌ Missing columns in applications:', appError.message);
      } else {
        console.log('✅ applications new columns accessible');
      }
    } catch (error) {
      console.log('❌ applications issues:', error.message);
    }
    
    // Save the corrected SQL to a file for easy copying
    const outputPath = path.join(__dirname, '../APPLY_THIS_CORRECTED_SCHEMA.sql');
    fs.writeFileSync(outputPath, sql);
    console.log(`\n📄 Corrected schema saved to: ${outputPath}`);
    console.log('   Copy this file content to Supabase SQL Editor');
    
    console.log('\n🎯 After applying the schema:');
    console.log('1. All missing columns will be added');
    console.log('2. Sample data will be inserted for testing');
    console.log('3. Backend routes will work with correct column names');
    console.log('4. Comprehensive test should pass');
    
    return true;
  } catch (error) {
    console.error('❌ Error preparing corrected schema:', error.message);
    return false;
  }
}

// Run the corrected schema preparation
if (require.main === module) {
  applyCorrectedSchema().then(success => {
    if (success) {
      console.log('\n✅ Corrected schema preparation completed');
      console.log('📋 Apply the corrected schema in Supabase SQL Editor');
      console.log('🚀 Then test the backend to verify all fixes work');
    } else {
      console.log('\n❌ Corrected schema preparation failed');
    }
    process.exit(0);
  });
}

module.exports = { applyCorrectedSchema };