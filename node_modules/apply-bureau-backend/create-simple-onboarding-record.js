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

    // Create comprehensive onboarding record with all likely required fields
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .insert({
        user_id: CLIENT_ID,
        execution_status: 'active',
        
        // Basic career info (likely required)
        target_job_titles: ['Software Engineer', 'Product Manager'],
        target_industries: ['Technology', 'Software Development'],
        target_locations: ['Remote', 'San Francisco', 'New York'],
        target_salary_range: '$100,000 - $150,000',
        years_of_experience: 5,
        job_search_timeline: '1-3 months',
        
        // Technical skills (likely required)
        key_technical_skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        
        // Additional fields that might be required
        current_employment_status: 'employed',
        education_level: 'bachelors',
        preferred_work_arrangement: 'remote',
        career_goals: 'Advance to senior engineering role',
        biggest_career_challenges: 'Finding the right company culture',
        
        // Timestamps
        completed_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (onboardingError) {
      console.log('❌ Onboarding creation failed:', onboardingError.message);
      return { success: false, error: onboardingError.message };
    } else {
      console.log('✅ Onboarding record created successfully');
      console.log('   Status:', onboarding.execution_status);
      console.log('   Target Job Titles:', onboarding.target_job_titles);
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