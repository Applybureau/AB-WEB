#!/usr/bin/env node

/**
 * Unlock Client Profile for Dashboard Access
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');

const TEST_EMAIL = 'israelloko65@gmail.com';

async function unlockClientProfile() {
  console.log('🔓 Unlocking Client Profile for Dashboard Access...\n');

  try {
    // 1. Check current client status
    console.log('1️⃣ Checking current client status...');
    
    const { data: currentClient, error: fetchError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching client:', fetchError.message);
      return;
    }

    console.log('📊 Current Status:');
    console.log('   Email:', currentClient.email);
    console.log('   Profile Unlocked:', currentClient.profile_unlocked);
    console.log('   Payment Verified:', currentClient.payment_verified);
    console.log('   Onboarding Complete:', currentClient.onboarding_complete);
    console.log('   Is Active:', currentClient.is_active);

    // 2. Unlock the profile and set all necessary flags
    console.log('\n2️⃣ Unlocking profile and setting access flags...');
    
    const { data: updatedClient, error: updateError } = await supabaseAdmin
      .from('clients')
      .update({
        profile_unlocked: true,
        payment_verified: true,
        onboarding_complete: true,
        is_active: true,
        status: 'active',
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('email', TEST_EMAIL)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating client:', updateError.message);
      return;
    }

    console.log('✅ Profile unlocked successfully!');
    console.log('📊 Updated Status:');
    console.log('   Profile Unlocked:', updatedClient.profile_unlocked);
    console.log('   Payment Verified:', updatedClient.payment_verified);
    console.log('   Onboarding Complete:', updatedClient.onboarding_complete);
    console.log('   Is Active:', updatedClient.is_active);
    console.log('   Status:', updatedClient.status);

    // 3. Test login and dashboard access
    console.log('\n3️⃣ Testing login and dashboard access...');
    
    try {
      // Test login
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
        console.log('   User ID:', loginData.user.id);
        console.log('   Role:', loginData.user.role);
        console.log('   Onboarding Complete:', loginData.user.onboarding_complete);

        // Test client dashboard endpoint
        const dashboardResponse = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/client/dashboard', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('\n📊 Dashboard Access Test:');
        console.log('   Status:', dashboardResponse.status);

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          console.log('✅ Dashboard access successful!');
          console.log('   Dashboard data received');
        } else {
          const errorText = await dashboardResponse.text();
          console.log('⚠️ Dashboard access issue:', errorText.substring(0, 200));
        }

        // Test applications endpoint
        const appsResponse = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/applications', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('\n📋 Applications Access Test:');
        console.log('   Status:', appsResponse.status);

        if (appsResponse.ok) {
          const appsData = await appsResponse.json();
          console.log('✅ Applications access successful!');
          console.log(`   Found ${appsData.applications?.length || 0} applications`);
        } else {
          const errorText = await appsResponse.text();
          console.log('⚠️ Applications access issue:', errorText.substring(0, 200));
        }

      } else {
        const errorText = await loginResponse.text();
        console.log('❌ Login failed:', errorText);
      }
    } catch (testError) {
      console.log('⚠️ Testing error:', testError.message);
    }

    // 4. Check if there are any middleware or guards blocking access
    console.log('\n4️⃣ Checking for potential access blocks...');
    
    // Check if there's a profileGuard middleware that might be blocking
    const profileGuardPath = './middleware/profileGuard.js';
    try {
      const fs = require('fs');
      if (fs.existsSync(profileGuardPath)) {
        console.log('⚠️ Found profileGuard middleware - this might be blocking access');
        console.log('   Check if profileGuard is properly configured for unlocked profiles');
      } else {
        console.log('✅ No profileGuard middleware found');
      }
    } catch (fsError) {
      console.log('⚠️ Could not check for profileGuard:', fsError.message);
    }

    // 5. Display final results
    console.log('\n' + '='.repeat(60));
    console.log('🎉 CLIENT PROFILE UNLOCKED!');
    console.log('='.repeat(60));
    
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log('   Password: SimplePass123!');
    
    console.log('\n🌐 DASHBOARD ACCESS:');
    console.log('   Frontend: https://apply-bureau.vercel.app/login');
    console.log('   Dashboard: https://apply-bureau.vercel.app/dashboard');
    
    console.log('\n✅ PROFILE STATUS:');
    console.log('   ✅ Profile Unlocked: YES');
    console.log('   ✅ Payment Verified: YES');
    console.log('   ✅ Onboarding Complete: YES');
    console.log('   ✅ Account Active: YES');
    console.log('   ✅ Email Verified: YES');
    
    console.log('\n🧪 TESTING STEPS:');
    console.log('1. Login with the credentials above');
    console.log('2. You should now be able to access the dashboard');
    console.log('3. Check if applications are visible');
    console.log('4. Verify all dashboard features work');
    
    console.log('\n💡 IF STILL BLOCKED:');
    console.log('- Check browser console for errors');
    console.log('- Verify frontend is checking the correct profile flags');
    console.log('- Check if there are additional middleware guards');

    return {
      success: true,
      client: updatedClient
    };

  } catch (error) {
    console.error('❌ Failed to unlock profile:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  unlockClientProfile()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Profile unlock completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Profile unlock failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { unlockClientProfile };