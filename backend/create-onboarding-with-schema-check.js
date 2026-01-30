#!/usr/bin/env node

/**
 * Create Onboarding Record with Schema Check
 * First check what columns exist, then create record with only existing fields
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');

const TEST_EMAIL = 'israelloko65@gmail.com';
const CLIENT_ID = '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b';

async function createOnboardingWithSchemaCheck() {
  console.log('🔍 CHECKING ONBOARDING TABLE SCHEMA AND CREATING RECORD\n');

  try {
    // STEP 1: Get existing record to see what columns exist
    console.log('1️⃣ CHECKING EXISTING TABLE SCHEMA...');
    
    const { data: existingRecords } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .limit(1);

    let availableColumns = [];
    if (existingRecords && existingRecords.length > 0) {
      availableColumns = Object.keys(existingRecords[0]);
      console.log('📋 Available columns:');
      availableColumns.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col}`);
      });
    } else {
      console.log('⚠️ No existing records found, will try with common fields');
    }

    // STEP 2: Clear existing records for our test client
    console.log('\n2️⃣ CLEARING EXISTING RECORDS...');
    await supabaseAdmin
      .from('client_onboarding_20q')
      .delete()
      .eq('user_id', CLIENT_ID);
    console.log('✅ Cleared existing onboarding records');

    // STEP 3: Try creating with progressively more fields
    console.log('\n3️⃣ CREATING ONBOARDING RECORD...');
    
    // Start with absolute minimum
    let onboardingData = {
      user_id: CLIENT_ID,
      execution_status: 'active'
    };

    // Add fields if they exist in the schema
    const commonFields = {
      target_job_titles: ['Software Engineer', 'Product Manager'],
      target_industries: ['Technology', 'Software Development'],
      target_company_sizes: ['Startup', 'Mid-size', 'Enterprise'],
      target_locations: ['Remote', 'San Francisco', 'New York'],
      remote_work_preference: 'fully_remote',
      current_salary_range: '$80,000 - $120,000',
      target_salary_range: '$100,000 - $150,000',
      salary_negotiation_comfort: 4,
      years_of_experience: 5,
      key_technical_skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      soft_skills_strengths: ['Communication', 'Problem Solving', 'Leadership'],
      certifications_licenses: ['AWS Certified', 'Scrum Master'],
      job_search_timeline: '1-3 months',
      application_volume_preference: 'quality_over_quantity',
      networking_comfort_level: 4,
      interview_confidence_level: 4,
      career_goals_short_term: 'Secure a senior engineering role at a tech company',
      career_goals_long_term: 'Become a technical lead or engineering manager',
      biggest_career_challenges: ['Finding the right company culture', 'Growth opportunities', 'Work-life balance'],
      support_areas_needed: ['Interview preparation', 'Salary negotiation', 'Resume optimization'],
      completed_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Only add fields that exist in the table
    if (availableColumns.length > 0) {
      Object.keys(commonFields).forEach(field => {
        if (availableColumns.includes(field)) {
          onboardingData[field] = commonFields[field];
          console.log(`   ✅ Added field: ${field}`);
        } else {
          console.log(`   ⚠️ Skipped field: ${field} (not in schema)`);
        }
      });
    } else {
      // If we can't check schema, add all common fields
      onboardingData = { ...onboardingData, ...commonFields };
    }

    console.log('\n📝 Final onboarding data:');
    console.log(JSON.stringify(onboardingData, null, 2));

    // STEP 4: Create the record
    console.log('\n4️⃣ INSERTING RECORD...');
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .insert(onboardingData)
      .select()
      .single();

    if (onboardingError) {
      console.log('❌ Onboarding creation failed:', onboardingError.message);
      
      // If it fails, try with just the absolute minimum
      console.log('\n🔄 TRYING WITH MINIMAL DATA...');
      const minimalData = {
        user_id: CLIENT_ID,
        execution_status: 'active'
      };

      const { data: minimalOnboarding, error: minimalError } = await supabaseAdmin
        .from('client_onboarding_20q')
        .insert(minimalData)
        .select()
        .single();

      if (minimalError) {
        console.log('❌ Even minimal creation failed:', minimalError.message);
        return { success: false, error: minimalError.message };
      } else {
        console.log('✅ Minimal onboarding record created');
        return { success: true, onboarding: minimalOnboarding, type: 'minimal' };
      }
    } else {
      console.log('✅ Full onboarding record created successfully');
      console.log('   Status:', onboarding.execution_status);
      console.log('   Target Job Titles:', onboarding.target_job_titles);
      return { success: true, onboarding, type: 'full' };
    }

  } catch (error) {
    console.error('❌ Schema check and creation failed:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  createOnboardingWithSchemaCheck()
    .then(result => {
      if (result.success) {
        console.log(`\n🎯 ONBOARDING RECORD CREATED SUCCESSFULLY! (${result.type})`);
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

module.exports = { createOnboardingWithSchemaCheck };