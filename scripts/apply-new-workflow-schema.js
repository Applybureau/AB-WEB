const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('Environment check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Set' : 'Not set');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Create supabase admin client directly
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function applyNewWorkflowSchema() {
  try {
    console.log('📊 Applying NEW WORKFLOW FEATURES schema...');
    
    const schemaPath = path.join(__dirname, '..', 'NEW_WORKFLOW_SCHEMA.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📝 Executing ${statements.length} schema statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabaseAdmin.rpc('exec_sql', { 
            sql: statement + ';' 
          });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error);
            console.error('Statement:', statement);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (stmtError) {
          console.error(`❌ Exception in statement ${i + 1}:`, stmtError);
          console.error('Statement:', statement);
        }
      }
    }
    
    console.log('\n✅ NEW WORKFLOW FEATURES schema application completed!');
    console.log('🎯 Features now available:');
    console.log('- 20-field onboarding questionnaire');
    console.log('- Profile unlock workflow');
    console.log('- Payment verification system');
    console.log('- Weekly application grouping');
    console.log('- Discovery Mode support');
    console.log('- Enhanced consultation status flow');
    
    // Test the new schema by checking if columns exist
    console.log('\n🔍 Verifying schema changes...');
    
    // Check registered_users table for onboarding fields
    const { data: userColumns, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('onboarding_completed, profile_unlocked, onboarding_current_position')
      .limit(1);
    
    if (!userError) {
      console.log('✅ Onboarding fields added to registered_users table');
    } else {
      console.log('⚠️ Could not verify onboarding fields:', userError.message);
    }
    
    // Check consultation_requests table for payment fields
    const { data: consultationColumns, error: consultationError } = await supabaseAdmin
      .from('consultation_requests')
      .select('payment_verified, registration_token, package_tier')
      .limit(1);
    
    if (!consultationError) {
      console.log('✅ Payment verification fields added to consultation_requests table');
    } else {
      console.log('⚠️ Could not verify payment fields:', consultationError.message);
    }
    
    // Check applications table for weekly grouping
    const { data: appColumns, error: appError } = await supabaseAdmin
      .from('applications')
      .select('week_start, concierge_note')
      .limit(1);
    
    if (!appError) {
      console.log('✅ Weekly grouping fields added to applications table');
    } else {
      console.log('⚠️ Could not verify weekly grouping fields:', appError.message);
    }
    
    console.log('\n🚀 Schema verification completed!');
    
  } catch (error) {
    console.error('❌ Error applying NEW WORKFLOW FEATURES schema:', error);
    process.exit(1);
  }
}

// Run the schema application
applyNewWorkflowSchema();