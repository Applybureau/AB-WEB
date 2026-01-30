#!/usr/bin/env node

/**
 * Debug 500 Errors
 * Test the specific methods that are failing
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');
const ApplicationTrackingController = require('./controllers/applicationTrackingController');
const ClientDashboardController = require('./controllers/clientDashboardController');

const TEST_EMAIL = 'israelloko65@gmail.com';
const CLIENT_ID = '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b';

async function debug500Errors() {
  console.log('🐛 DEBUGGING 500 ERRORS\n');

  try {
    // Test 1: Direct application stats calculation
    console.log('1️⃣ TESTING APPLICATION STATS CALCULATION...');
    
    try {
      const stats = await ApplicationTrackingController.calculateApplicationStats(CLIENT_ID);
      console.log('✅ Application stats calculation successful:');
      console.log(JSON.stringify(stats, null, 2));
    } catch (statsError) {
      console.log('❌ Application stats calculation failed:', statsError.message);
      console.log('Stack:', statsError.stack);
    }

    // Test 2: Check if client exists in clients table
    console.log('\n2️⃣ CHECKING CLIENT DATA...');
    
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', CLIENT_ID)
      .single();

    if (clientError) {
      console.log('❌ Client query failed:', clientError.message);
    } else {
      console.log('✅ Client found:');
      console.log(`   ID: ${client.id}`);
      console.log(`   Email: ${client.email}`);
      console.log(`   Name: ${client.full_name}`);
    }

    // Test 3: Check consultation data
    console.log('\n3️⃣ CHECKING CONSULTATION DATA...');
    
    const { data: consultation, error: consultationError } = await supabaseAdmin
      .from('consultation_requests')
      .select('*')
      .eq('user_id', CLIENT_ID)
      .single();

    if (consultationError) {
      console.log('❌ Consultation query failed:', consultationError.message);
    } else {
      console.log('✅ Consultation found:');
      console.log(`   Package: ${consultation.package_interest}`);
    }

    // Test 4: Check onboarding data
    console.log('\n4️⃣ CHECKING ONBOARDING DATA...');
    
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('user_id', CLIENT_ID)
      .single();

    if (onboardingError) {
      console.log('❌ Onboarding query failed:', onboardingError.message);
    } else {
      console.log('✅ Onboarding found:');
      console.log(`   Status: ${onboarding.execution_status}`);
      console.log(`   Job Titles: ${onboarding.target_job_titles}`);
    }

    // Test 5: Check applications data
    console.log('\n5️⃣ CHECKING APPLICATIONS DATA...');
    
    const { data: applications, error: applicationsError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('client_id', CLIENT_ID);

    if (applicationsError) {
      console.log('❌ Applications query failed:', applicationsError.message);
    } else {
      console.log('✅ Applications found:');
      console.log(`   Count: ${applications.length}`);
      if (applications.length > 0) {
        console.log(`   Sample: ${applications[0].title} - ${applications[0].status}`);
      }
    }

    // Test 6: Test ClientProfileController
    console.log('\n6️⃣ TESTING CLIENT PROFILE CONTROLLER...');
    
    try {
      const ClientProfileController = require('./controllers/clientProfileController');
      const profileData = {
        ...client,
        consultation_data: consultation || {}
      };
      
      const completionStatus = ClientProfileController.calculateProfileCompletion(profileData);
      console.log('✅ Profile completion calculation successful:');
      console.log(`   Percentage: ${completionStatus.percentage}%`);
    } catch (profileError) {
      console.log('❌ Profile completion calculation failed:', profileError.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎯 DEBUG COMPLETED');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  debug500Errors()
    .then(() => {
      console.log('\n🐛 Debug completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Debug error:', error);
      process.exit(1);
    });
}

module.exports = { debug500Errors };