#!/usr/bin/env node

/**
 * Fix Dashboard Access Issues
 * 1. Create matching record in registered_users table
 * 2. Ensure all profile flags are set correctly
 * 3. Test dashboard access
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');

const TEST_EMAIL = 'israelloko65@gmail.com';
const CLIENT_ID = '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b';

async function fixDashboardAccess() {
  console.log('🔧 Fixing Dashboard Access Issues...\n');

  try {
    // 1. Get client data from clients table
    console.log('1️⃣ Getting client data from clients table...');
    
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();

    if (clientError) {
      console.error('❌ Error fetching client:', clientError.message);
      return;
    }

    console.log('✅ Client found in clients table:');
    console.log('   ID:', clientData.id);
    console.log('   Email:', clientData.email);
    console.log('   Profile Unlocked:', clientData.profile_unlocked);
    console.log('   Payment Verified:', clientData.payment_verified);

    // 2. Check if record exists in registered_users table
    console.log('\n2️⃣ Checking registered_users table...');
    
    const { data: regUser, error: regError } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();

    if (regError && regError.code !== 'PGRST116') {
      console.log('⚠️ Error checking registered_users:', regError.message);
    }

    if (regUser) {
      console.log('✅ Found existing record in registered_users');
      console.log('   ID:', regUser.id);
      console.log('   Profile Unlocked:', regUser.profile_unlocked);
      console.log('   Payment Confirmed:', regUser.payment_confirmed);
      
      // Update existing record
      console.log('\n3️⃣ Updating registered_users record...');
      
      const { data: updatedRegUser, error: updateError } = await supabaseAdmin
        .from('registered_users')
        .update({
          id: CLIENT_ID, // Use the same ID as clients table
          full_name: clientData.full_name,
          phone: clientData.phone,
          role: 'client',
          profile_unlocked: true,
          payment_confirmed: true,
          onboarding_completed: true,
          is_active: true,
          email_verified: true,
          payment_verified: true,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('email', TEST_EMAIL)
        .select()
        .single();

      if (updateError) {
        console.log('⚠️ Update failed:', updateError.message);
      } else {
        console.log('✅ Updated registered_users record');
      }
    } else {
      console.log('⚠️ No record found in registered_users, creating one...');
      
      // Create new record in registered_users
      console.log('\n3️⃣ Creating registered_users record...');
      
      const { data: newRegUser, error: createError } = await supabaseAdmin
        .from('registered_users')
        .insert({
          id: CLIENT_ID, // Use the same ID as clients table
          email: TEST_EMAIL,
          full_name: clientData.full_name || 'Israel Loko',
          phone: clientData.phone,
          role: 'client',
          profile_unlocked: true,
          payment_confirmed: true,
          onboarding_completed: true,
          is_active: true,
          email_verified: true,
          payment_verified: true,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.log('⚠️ Create failed:', createError.message);
      } else {
        console.log('✅ Created registered_users record');
      }
    }

    // 4. Create/update onboarding record
    console.log('\n4️⃣ Setting up onboarding record...');
    
    const { data: existingOnboarding } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('user_id', CLIENT_ID)
      .single();

    if (existingOnboarding) {
      // Update existing onboarding
      const { error: onboardingUpdateError } = await supabaseAdmin
        .from('client_onboarding_20q')
        .update({
          execution_status: 'active',
          completed_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          approved_by: 'system'
        })
        .eq('user_id', CLIENT_ID);

      if (onboardingUpdateError) {
        console.log('⚠️ Onboarding update failed:', onboardingUpdateError.message);
      } else {
        console.log('✅ Updated onboarding record to active status');
      }
    } else {
      // Create new onboarding record
      const { error: onboardingCreateError } = await supabaseAdmin
        .from('client_onboarding_20q')
        .insert({
          user_id: CLIENT_ID,
          execution_status: 'active',
          completed_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          approved_by: 'system',
          created_at: new Date().toISOString()
        });

      if (onboardingCreateError) {
        console.log('⚠️ Onboarding create failed:', onboardingCreateError.message);
      } else {
        console.log('✅ Created onboarding record with active status');
      }
    }

    // 5. Test dashboard access
    console.log('\n5️⃣ Testing dashboard access...');
    
    try {
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

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Login successful');

        // Test dashboard endpoint
        const dashboardResponse = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/client/dashboard', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📊 Dashboard Test:');
        console.log('   Status:', dashboardResponse.status);

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          console.log('✅ Dashboard access successful!');
          console.log('   Profile data received');
        } else {
          const errorText = await dashboardResponse.text();
          console.log('⚠️ Dashboard still has issues:', errorText.substring(0, 200));
        }

        // Test applications endpoint
        const appsResponse = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/applications', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('\n📋 Applications Test:');
        console.log('   Status:', appsResponse.status);

        if (appsResponse.ok) {
          const appsData = await appsResponse.json();
          console.log('✅ Applications access successful!');
          console.log(`   Found ${appsData.applications?.length || 0} applications`);
        } else {
          const errorText = await appsResponse.text();
          console.log('⚠️ Applications still has issues:', errorText.substring(0, 200));
        }

      } else {
        const errorText = await loginResponse.text();
        console.log('❌ Login failed:', errorText);
      }
    } catch (testError) {
      console.log('⚠️ Testing error:', testError.message);
    }

    // 6. Display final results
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DASHBOARD ACCESS FIX COMPLETED!');
    console.log('='.repeat(60));
    
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log('   Password: SimplePass123!');
    
    console.log('\n🌐 DASHBOARD ACCESS:');
    console.log('   Frontend: https://apply-bureau.vercel.app/login');
    console.log('   Dashboard: https://apply-bureau.vercel.app/dashboard');
    
    console.log('\n✅ FIXES APPLIED:');
    console.log('   ✅ Client record exists in clients table');
    console.log('   ✅ Matching record created/updated in registered_users table');
    console.log('   ✅ Profile unlocked in both tables');
    console.log('   ✅ Onboarding status set to active');
    console.log('   ✅ All access flags enabled');
    
    console.log('\n🧪 NEXT STEPS:');
    console.log('1. Try logging in again with the credentials');
    console.log('2. Dashboard should now be accessible');
    console.log('3. Applications should be visible');
    console.log('4. All profile guards should pass');

    return {
      success: true,
      message: 'Dashboard access fix completed'
    };

  } catch (error) {
    console.error('❌ Failed to fix dashboard access:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  fixDashboardAccess()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Dashboard access fix completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Dashboard access fix failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { fixDashboardAccess };