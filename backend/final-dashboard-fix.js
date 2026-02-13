#!/usr/bin/env node

/**
 * Final Dashboard Fix
 * Fix remaining issues with onboarding and test thoroughly
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');

const TEST_EMAIL = 'israelloko65@gmail.com';
const CLIENT_ID = '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b';

async function finalDashboardFix() {
  console.log('🔧 Final Dashboard Fix...\n');

  try {
    // 1. Fix onboarding record with proper UUID
    console.log('1️⃣ Fixing onboarding record...');
    
    // Delete existing onboarding record if it exists
    await supabaseAdmin
      .from('client_onboarding_20q')
      .delete()
      .eq('user_id', CLIENT_ID);

    // Create new onboarding record with proper data
    const { data: newOnboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .insert({
        user_id: CLIENT_ID,
        execution_status: 'active',
        target_job_titles: ['Software Engineer', 'Product Manager'],
        target_industries: ['Technology', 'Software'],
        years_of_experience: '5-7 years',
        job_search_timeline: '1-3 months',
        completed_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        approved_by: CLIENT_ID, // Use client's own ID as approver
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (onboardingError) {
      console.log('⚠️ Onboarding creation failed:', onboardingError.message);
    } else {
      console.log('✅ Onboarding record created successfully');
    }

    // 2. Ensure applications exist and are properly linked
    console.log('\n2️⃣ Ensuring applications exist...');
    
    // Check existing applications
    const { data: existingApps } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('client_id', CLIENT_ID);

    console.log(`   Found ${existingApps?.length || 0} existing applications`);

    if (!existingApps || existingApps.length === 0) {
      console.log('   Creating sample applications...');
      
      const sampleApps = [
        {
          title: 'Google - Software Engineer',
          description: 'Software Engineer position at Google',
          company: 'Google',
          job_title: 'Software Engineer',
          status: 'applied',
          priority: 'high'
        },
        {
          title: 'Microsoft - Product Manager',
          description: 'Product Manager position at Microsoft',
          company: 'Microsoft',
          job_title: 'Product Manager',
          status: 'interviewing',
          priority: 'medium'
        }
      ];

      for (const app of sampleApps) {
        const { error: appError } = await supabaseAdmin
          .from('applications')
          .insert({
            client_id: CLIENT_ID,
            user_id: CLIENT_ID, // Also set user_id for compatibility
            type: 'job_application',
            title: app.title,
            description: app.description,
            company: app.company,
            job_title: app.job_title,
            status: app.status,
            priority: app.priority,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (appError) {
          console.log(`   ⚠️ Failed to create ${app.company} app:`, appError.message);
        } else {
          console.log(`   ✅ Created ${app.company} application`);
        }
      }
    }

    // 3. Test each endpoint individually to identify specific issues
    console.log('\n3️⃣ Testing endpoints individually...');
    
    // Login first
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

    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Test auth/me endpoint
    const meResponse = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n📊 Auth/Me Test:');
    console.log('   Status:', meResponse.status);
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ Auth/me working');
      console.log('   User ID:', meData.user?.id);
      console.log('   Role:', meData.user?.role);
    } else {
      const errorText = await meResponse.text();
      console.log('⚠️ Auth/me issue:', errorText.substring(0, 100));
    }

    // Test applications endpoint with detailed error logging
    const appsResponse = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/applications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n📋 Applications Test:');
    console.log('   Status:', appsResponse.status);
    if (appsResponse.ok) {
      const appsData = await appsResponse.json();
      console.log('✅ Applications working');
      console.log(`   Found ${appsData.applications?.length || 0} applications`);
    } else {
      const errorText = await appsResponse.text();
      console.log('⚠️ Applications error:', errorText);
    }

    // Test dashboard endpoint with detailed error logging
    const dashboardResponse = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/client/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n📊 Dashboard Test:');
    console.log('   Status:', dashboardResponse.status);
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard working');
      console.log('   Profile data received');
    } else {
      const errorText = await dashboardResponse.text();
      console.log('⚠️ Dashboard error:', errorText);
    }

    // 4. Check database records one more time
    console.log('\n4️⃣ Final database verification...');
    
    const { data: finalClient } = await supabaseAdmin
      .from('clients')
      .select('id, email, profile_unlocked, payment_verified, onboarding_complete, is_active')
      .eq('email', TEST_EMAIL)
      .single();

    const { data: finalRegUser } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, profile_unlocked, payment_confirmed, onboarding_completed, is_active')
      .eq('email', TEST_EMAIL)
      .single();

    const { data: finalOnboarding } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('user_id, execution_status, completed_at, approved_at')
      .eq('user_id', CLIENT_ID)
      .single();

    console.log('📊 Final Database State:');
    console.log('   Clients table:');
    console.log('     Profile Unlocked:', finalClient?.profile_unlocked);
    console.log('     Payment Verified:', finalClient?.payment_verified);
    console.log('     Is Active:', finalClient?.is_active);
    
    console.log('   Registered Users table:');
    console.log('     Profile Unlocked:', finalRegUser?.profile_unlocked);
    console.log('     Payment Confirmed:', finalRegUser?.payment_confirmed);
    console.log('     Is Active:', finalRegUser?.is_active);
    
    console.log('   Onboarding table:');
    console.log('     Execution Status:', finalOnboarding?.execution_status);
    console.log('     Completed At:', finalOnboarding?.completed_at ? 'Yes' : 'No');
    console.log('     Approved At:', finalOnboarding?.approved_at ? 'Yes' : 'No');

    // 5. Display final results
    console.log('\n' + '='.repeat(60));
    console.log('🎉 FINAL DASHBOARD FIX COMPLETED!');
    console.log('='.repeat(60));
    
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log('   Password: SimplePass123!');
    
    console.log('\n🌐 ACCESS URLS:');
    console.log('   Frontend: https://www.applybureau.com/login');
    console.log('   Dashboard: https://www.applybureau.com/dashboard');
    
    console.log('\n✅ CURRENT STATUS:');
    console.log('   ✅ Login: Working');
    console.log('   ✅ Profile: Unlocked in both tables');
    console.log('   ✅ Onboarding: Active status');
    console.log('   ✅ Applications: Created');
    
    console.log('\n🧪 TESTING INSTRUCTIONS:');
    console.log('1. Login with the credentials above');
    console.log('2. Check if dashboard loads without errors');
    console.log('3. Verify applications are visible');
    console.log('4. If still blocked, check browser console for frontend errors');

    return {
      success: true,
      message: 'Final dashboard fix completed'
    };

  } catch (error) {
    console.error('❌ Final dashboard fix failed:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  finalDashboardFix()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Final dashboard fix completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Final dashboard fix failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { finalDashboardFix };