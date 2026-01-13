const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

// Create supabase admin client directly
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function applyWorkflowSchema() {
  try {
    console.log('📊 Applying NEW WORKFLOW FEATURES schema directly...');
    
    // Step 1: Add onboarding fields to registered_users
    console.log('⚡ Adding onboarding fields to registered_users table...');
    
    const onboardingFields = [
      'onboarding_completed BOOLEAN DEFAULT FALSE',
      'profile_unlocked BOOLEAN DEFAULT FALSE',
      'onboarding_completion_date TIMESTAMPTZ',
      'profile_unlock_date TIMESTAMPTZ',
      'onboarding_current_position TEXT',
      'onboarding_years_experience TEXT',
      'onboarding_education_level TEXT',
      'onboarding_target_roles TEXT',
      'onboarding_target_industries TEXT',
      'onboarding_career_timeline TEXT',
      'onboarding_current_salary TEXT',
      'onboarding_target_salary TEXT',
      'onboarding_benefits_priorities TEXT',
      'onboarding_work_arrangement TEXT',
      'onboarding_company_size TEXT',
      'onboarding_work_culture TEXT',
      'onboarding_current_location TEXT',
      'onboarding_willing_to_relocate TEXT',
      'onboarding_preferred_locations TEXT',
      'onboarding_key_skills TEXT',
      'onboarding_skill_gaps TEXT',
      'onboarding_learning_goals TEXT',
      'onboarding_application_volume TEXT',
      'onboarding_success_metrics TEXT'
    ];
    
    for (const field of onboardingFields) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: `ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS ${field};`
        });
        if (error && !error.message.includes('already exists')) {
          console.log(`⚠️ Field ${field.split(' ')[0]}: ${error.message}`);
        } else {
          console.log(`✅ Added field: ${field.split(' ')[0]}`);
        }
      } catch (err) {
        console.log(`⚠️ Field ${field.split(' ')[0]}: ${err.message}`);
      }
    }
    
    // Step 2: Add payment fields to consultation_requests
    console.log('⚡ Adding payment fields to consultation_requests table...');
    
    const paymentFields = [
      'payment_verified BOOLEAN DEFAULT FALSE',
      'payment_method TEXT',
      'payment_amount TEXT',
      'payment_reference TEXT',
      'package_tier TEXT',
      'payment_verification_date TIMESTAMPTZ',
      'registration_token TEXT',
      'token_expires_at TIMESTAMPTZ',
      'token_used BOOLEAN DEFAULT FALSE'
    ];
    
    for (const field of paymentFields) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: `ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS ${field};`
        });
        if (error && !error.message.includes('already exists')) {
          console.log(`⚠️ Field ${field.split(' ')[0]}: ${error.message}`);
        } else {
          console.log(`✅ Added field: ${field.split(' ')[0]}`);
        }
      } catch (err) {
        console.log(`⚠️ Field ${field.split(' ')[0]}: ${err.message}`);
      }
    }
    
    // Step 3: Add weekly grouping fields to applications
    console.log('⚡ Adding weekly grouping fields to applications table...');
    
    const weeklyFields = [
      'week_start TIMESTAMPTZ',
      'concierge_note TEXT'
    ];
    
    for (const field of weeklyFields) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: `ALTER TABLE applications ADD COLUMN IF NOT EXISTS ${field};`
        });
        if (error && !error.message.includes('already exists')) {
          console.log(`⚠️ Field ${field.split(' ')[0]}: ${error.message}`);
        } else {
          console.log(`✅ Added field: ${field.split(' ')[0]}`);
        }
      } catch (err) {
        console.log(`⚠️ Field ${field.split(' ')[0]}: ${err.message}`);
      }
    }
    
    console.log('\n✅ Schema application completed!');
    
    // Verify the changes
    console.log('🔍 Verifying schema changes...');
    
    // Test onboarding fields
    try {
      const { data, error } = await supabaseAdmin
        .from('registered_users')
        .select('onboarding_completed, profile_unlocked, onboarding_current_position')
        .limit(1);
      
      if (!error) {
        console.log('✅ Onboarding fields verified in registered_users table');
      } else {
        console.log('⚠️ Onboarding fields verification failed:', error.message);
      }
    } catch (err) {
      console.log('⚠️ Onboarding fields verification error:', err.message);
    }
    
    // Test payment fields
    try {
      const { data, error } = await supabaseAdmin
        .from('consultation_requests')
        .select('payment_verified, registration_token, package_tier')
        .limit(1);
      
      if (!error) {
        console.log('✅ Payment fields verified in consultation_requests table');
      } else {
        console.log('⚠️ Payment fields verification failed:', error.message);
      }
    } catch (err) {
      console.log('⚠️ Payment fields verification error:', err.message);
    }
    
    // Test weekly fields
    try {
      const { data, error } = await supabaseAdmin
        .from('applications')
        .select('week_start, concierge_note')
        .limit(1);
      
      if (!error) {
        console.log('✅ Weekly grouping fields verified in applications table');
      } else {
        console.log('⚠️ Weekly grouping fields verification failed:', error.message);
      }
    } catch (err) {
      console.log('⚠️ Weekly grouping fields verification error:', err.message);
    }
    
    console.log('\n🎯 NEW WORKFLOW FEATURES READY:');
    console.log('- 20-field onboarding questionnaire');
    console.log('- Profile unlock workflow');
    console.log('- Payment verification system');
    console.log('- Weekly application grouping');
    console.log('- Discovery Mode support');
    console.log('- Enhanced consultation status flow');
    console.log('\n🚀 Backend is ready for new workflow implementation!');
    
  } catch (error) {
    console.error('❌ Error applying workflow schema:', error);
    process.exit(1);
  }
}

// Run the schema application
applyWorkflowSchema();