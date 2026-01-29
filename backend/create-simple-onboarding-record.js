#!/usr/bin/env node

/**
 * Create Simple Onboarding Record
 * Create onboarding record with only existing columns
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');

const TEST_EMAIL = 'israelloko65@gmail.com';
const CLIENT_ID = '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b';

async function createSimpleOnboardingRecord() {
  console.log('🎯 CREATING SIMPLE ONBOARDING RECORD\n');

  try {
    // Delete existing onboarding records
    await supabaseAdmin
      .from('client_onboarding_20q')
      .delete()
      .eq('user_id', CLIENT_ID);

    console.log('✅ Cleared existing onboarding records');

    // Create minimal onboarding record with only basic fields
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .insert({
        user_id: CLIENT_ID,
        execution_status: 'active',
        completed_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (onboardingError) {
      console.log('❌ Minimal onboarding failed:', onboardingError.message);
      
      // Try ultra minimal - just user_id and status
      const { data: ultraMinimal, error: ultraError } = await supabaseAdmin
        .from('client_onboarding_20q')
        .insert({
          user_id: CLIENT_ID,
          execution_status: 'active'
        })
        .select()
        .single();

      if (ultraError) {
        console.log('❌ Ultra minimal also failed:', ultraError.message);
        return { success: false, error: ultraError.message };
      } else {
        console.log('✅ Ultra minimal onboarding created');
        return { success: true, onboarding: ultraMinimal };
      }
    } else {
      console.log('✅ Minimal onboarding record created');
      return { success: true, onboarding };
    }

  } catch (error) {
    console.error('❌ Create onboarding failed:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  createSimpleOnboardingRecord()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 ONBOARDING RECORD CREATED SUCCESSFULLY!');
        process.exit(0);
      } else {
        console.error('\n💥 Failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { createSimpleOnboardingRecord };