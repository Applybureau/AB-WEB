#!/usr/bin/env node

/**
 * Fix Specific Schema Issues
 * Target the exact problems identified
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');

const TEST_EMAIL = 'israelloko65@gmail.com';
const CLIENT_ID = '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b';

async function fixSpecificSchemaIssues() {
  console.log('🎯 FIXING SPECIFIC SCHEMA ISSUES\n');

  try {
    // STEP 1: Check what columns actually exist in onboarding table
    console.log('1️⃣ CHECKING ONBOARDING TABLE SCHEMA...');
    
    const { data: existingOnboarding } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .limit(1);

    if (existingOnboarding && existingOnboarding.length > 0) {
      console.log('📋 Available onboarding columns:');
      Object.keys(existingOnboarding[0]).forEach((col, index) => {
        console.log(`   ${index + 1}. ${col}`);
      });
    }

    // Create minimal onboarding record with only existing columns
    console.log('\n2️⃣ CREATING MINIMAL ONBOARDING RECORD...');
    
    // Delete existing records first
    await supabaseAdmin
      .from('client_onboarding_20q')
      .delete()
      .eq('user_id', CLIENT_ID);

    // Try creating with minimal required fields only
    const { data: newOnboarding, error: onboardingError } = await supabaseAdmin
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
      
      // Try even more minimal
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
      } else {
        console.log('✅ Ultra minimal onboarding created');
      }
    } else {
      console.log('✅ Minimal onboarding record created');
    }

    // STEP 3: Check applications table schema
    console.log('\n3️⃣ CHECKING APPLICATIONS TABLE SCHEMA...');
    
    const { data: existingApps } = await supabaseAdmin
      .from('applications')
      .select('*')
      .limit(1);

    if (existingApps && existingApps.length > 0) {
      console.log('📋 Available application columns:');
      Object.keys(existingApps[0]).forEach((col, index) => {
        console.log(`   ${index + 1}. ${col}`);
      });
    }

    // Create applications without user_id if it doesn't exist
    console.log('\n4️⃣ CREATING APPLICATIONS WITH CORRECT SCHEMA...');
    
    // Clear existing applications
    await supabaseAdmin
      .from('applications')
      .delete()
      .eq('client_id', CLIENT_ID);

    const simpleApp = {
      client_id: CLIENT_ID,
      type: 'job_application',
      title: 'Test Application - Google',
      description: 'Test application for Google',
      company: 'Google',
      job_title: 'Software Engineer',
      status: 'applied',
      priority: 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdApp, error: appError } = await supabaseAdmin
      .from('applications')
      .insert(simpleApp)
      .select()
      .single();

    if (appError) {
      console.log('❌ Application creation failed:', appError.message);
    } else {
      console.log('✅ Test application created successfully');
    }

    // STEP 5: Test endpoints again
    console.log('\n5️⃣ TESTING ENDPOINTS AFTER FIXES...');
    
    const loginResponse = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: 'SimplePass123!'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const token = loginData.token;

      // Test applications
      const appsResponse = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📋 Applications Test:');
      console.log('   Status:', appsResponse.status);
      
      if (appsResponse.ok) {
        const appsData = await appsResponse.json();
        console.log('✅ Applications working!');
        console.log(`   Found ${appsData.applications?.length || 0} applications`);
      } else {
        const errorText = await appsResponse.text();
        console.log('❌ Applications error:', errorText);
      }

      // Test stats
      const statsResponse = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/applications/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('\n📊 Stats Test:');
      console.log('   Status:', statsResponse.status);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ Stats working!');
      } else {
        const errorText = await statsResponse.text();
        console.log('❌ Stats error:', errorText);
      }

      // Test dashboard
      const dashResponse = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/client/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('\n🏠 Dashboard Test:');
      console.log('   Status:', dashResponse.status);
      
      if (dashResponse.ok) {
        const dashData = await dashResponse.json();
        console.log('✅ Dashboard working!');
      } else {
        const errorText = await dashResponse.text();
        console.log('❌ Dashboard error:', errorText);
      }
    }

    // STEP 6: Final verification
    console.log('\n6️⃣ FINAL VERIFICATION...');
    
    const { data: finalOnboarding } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('user_id', CLIENT_ID)
      .single();

    const { data: finalApps } = await supabaseAdmin
      .from('applications')
      .select('id, title, status')
      .eq('client_id', CLIENT_ID);

    console.log('📊 Final State:');
    console.log('   Onboarding Status:', finalOnboarding?.execution_status || 'Not found');
    console.log('   Applications Count:', finalApps?.length || 0);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 SPECIFIC FIXES COMPLETED!');
    console.log('='.repeat(50));
    
    console.log('\n📋 TEST CREDENTIALS:');
    console.log('   📧 Email: israelloko65@gmail.com');
    console.log('   🔑 Password: SimplePass123!');
    console.log('   🌐 Frontend: https://www.applybureau.com/login');

    return { success: true };

  } catch (error) {
    console.error('❌ Fix failed:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  fixSpecificSchemaIssues()
    .then(result => {
      console.log('\n🎯 Specific schema fixes completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { fixSpecificSchemaIssues };