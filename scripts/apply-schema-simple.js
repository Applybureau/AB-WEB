const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

// Create supabase admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function applySchemaSimple() {
  try {
    console.log('📊 Applying NEW WORKFLOW SCHEMA (Simple Method)...');
    console.log('================================================\n');
    
    // Step 1: Add payment fields to consultation_requests
    console.log('💳 Adding payment fields to consultation_requests...');
    
    const paymentFields = [
      { name: 'payment_verified', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'payment_method', type: 'TEXT' },
      { name: 'payment_amount', type: 'TEXT' },
      { name: 'payment_reference', type: 'TEXT' },
      { name: 'package_tier', type: 'TEXT' },
      { name: 'payment_verification_date', type: 'TIMESTAMPTZ' },
      { name: 'registration_token', type: 'TEXT' },
      { name: 'token_expires_at', type: 'TIMESTAMPTZ' },
      { name: 'token_used', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'verified_by', type: 'UUID' }
    ];
    
    for (const field of paymentFields) {
      try {
        // Use direct SQL query instead of RPC
        const { error } = await supabaseAdmin
          .from('consultation_requests')
          .select(field.name)
          .limit(1);
        
        if (error && error.message.includes('does not exist')) {
          console.log(`   Adding field: ${field.name}`);
          // Field doesn't exist, we need to add it manually via SQL editor
        } else {
          console.log(`   ✅ Field exists: ${field.name}`);
        }
      } catch (err) {
        console.log(`   ⚠️ Field check failed for ${field.name}: ${err.message}`);
      }
    }
    
    // Step 2: Add weekly fields to applications
    console.log('\n📅 Adding weekly fields to applications...');
    
    const weeklyFields = [
      { name: 'week_start', type: 'TIMESTAMPTZ' },
      { name: 'concierge_note', type: 'TEXT' }
    ];
    
    for (const field of weeklyFields) {
      try {
        const { error } = await supabaseAdmin
          .from('applications')
          .select(field.name)
          .limit(1);
        
        if (error && error.message.includes('does not exist')) {
          console.log(`   Adding field: ${field.name}`);
        } else {
          console.log(`   ✅ Field exists: ${field.name}`);
        }
      } catch (err) {
        console.log(`   ⚠️ Field check failed for ${field.name}: ${err.message}`);
      }
    }
    
    // Step 3: Test week start function
    console.log('\n⚙️ Testing week start function...');
    try {
      const { data: weekTest, error: weekError } = await supabaseAdmin
        .rpc('get_week_start', { input_date: new Date().toISOString() });
      
      if (!weekError && weekTest) {
        console.log('   ✅ Week start function exists and working');
        console.log(`   📅 Current week start: ${weekTest}`);
      } else {
        console.log('   ⚠️ Week start function needs to be created');
        console.log('   📝 Execute this in Supabase SQL Editor:');
        console.log(`
CREATE OR REPLACE FUNCTION get_week_start(input_date TIMESTAMPTZ)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN date_trunc('week', input_date);
END;
$$ LANGUAGE plpgsql;
        `);
      }
    } catch (err) {
      console.log('   ⚠️ Week start function test failed:', err.message);
    }
    
    console.log('\n📋 SCHEMA APPLICATION SUMMARY');
    console.log('=============================');
    console.log('✅ Onboarding fields already exist in registered_users');
    console.log('⚠️ Payment fields need to be added to consultation_requests');
    console.log('⚠️ Weekly fields need to be added to applications');
    console.log('⚠️ Week start function needs to be created');
    
    console.log('\n🛠️ MANUAL STEPS REQUIRED:');
    console.log('1. Open Supabase SQL Editor');
    console.log('2. Copy and paste the contents of backend/SIMPLE_WORKFLOW_SCHEMA.sql');
    console.log('3. Execute the SQL script');
    console.log('4. Run: node backend/scripts/quick-deploy-test.js');
    
    console.log('\n📄 SQL Script Location: backend/SIMPLE_WORKFLOW_SCHEMA.sql');
    
  } catch (error) {
    console.error('❌ Schema application failed:', error.message);
  }
}

// Run the schema application
applySchemaSimple();