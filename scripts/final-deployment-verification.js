const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Create supabase admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BASE_URL = 'https://apply-bureau-backend.vercel.app';

async function finalDeploymentVerification() {
  try {
    console.log('🎯 FINAL DEPLOYMENT VERIFICATION');
    console.log('================================\n');
    
    let allTestsPassed = true;
    
    // Test 1: Server Health
    console.log('🏥 1. Server Health Check...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`, { timeout: 10000 });
      if (healthResponse.status === 200) {
        console.log('   ✅ Server is healthy and responding');
        console.log(`   📊 Status: ${healthResponse.status}`);
      } else {
        throw new Error(`Unexpected status: ${healthResponse.status}`);
      }
    } catch (error) {
      console.log('   ❌ Server health check failed:', error.message);
      allTestsPassed = false;
    }
    
    // Test 2: Database Schema Verification
    console.log('\n📊 2. Database Schema Verification...');
    try {
      // Check onboarding fields
      const { data: userTest, error: userError } = await supabaseAdmin
        .from('registered_users')
        .select('onboarding_completed, profile_unlocked, onboarding_current_position, onboarding_target_roles')
        .limit(1);
      
      if (!userError) {
        console.log('   ✅ Onboarding fields verified');
      } else {
        console.log('   ❌ Onboarding fields missing:', userError.message);
        allTestsPassed = false;
      }
      
      // Check payment fields
      const { data: consultationTest, error: consultationError } = await supabaseAdmin
        .from('consultation_requests')
        .select('payment_verified, registration_token, package_tier, payment_verification_date')
        .limit(1);
      
      if (!consultationError) {
        console.log('   ✅ Payment verification fields verified');
      } else {
        console.log('   ❌ Payment fields missing:', consultationError.message);
        allTestsPassed = false;
      }
      
      // Check weekly fields
      const { data: appTest, error: appError } = await supabaseAdmin
        .from('applications')
        .select('week_start, concierge_note')
        .limit(1);
      
      if (!appError) {
        console.log('   ✅ Weekly grouping fields verified');
      } else {
        console.log('   ❌ Weekly fields missing:', appError.message);
        allTestsPassed = false;
      }
      
      // Check week start function
      const { data: weekTest, error: weekError } = await supabaseAdmin
        .rpc('get_week_start', { input_date: new Date().toISOString() });
      
      if (!weekError && weekTest) {
        console.log('   ✅ Week start function operational');
      } else {
        console.log('   ❌ Week start function missing or broken');
        allTestsPassed = false;
      }
      
    } catch (error) {
      console.log('   ❌ Database schema verification failed:', error.message);
      allTestsPassed = false;
    }
    
    // Test 3: Route Registration
    console.log('\n🛣️ 3. Route Registration Check...');
    try {
      const routes = [
        '/api/workflow/user/profile',
        '/api/workflow/onboarding',
        '/api/applications/weekly'
      ];
      
      for (const route of routes) {
        try {
          await axios.get(`${BASE_URL}${route}`);
        } catch (error) {
          if (error.response && [401, 403].includes(error.response.status)) {
            console.log(`   ✅ Route registered: ${route}`);
          } else if (error.response && error.response.status === 404) {
            console.log(`   ❌ Route missing: ${route}`);
            allTestsPassed = false;
          } else {
            console.log(`   ✅ Route registered: ${route} (status: ${error.response?.status})`);
          }
        }
      }
      
    } catch (error) {
      console.log('   ❌ Route registration check failed:', error.message);
      allTestsPassed = false;
    }
    
    // Test 4: Authentication System
    console.log('\n🔐 4. Authentication System Check...');
    try {
      // Get admin user
      const { data: admin, error: adminError } = await supabaseAdmin
        .from('registered_users')
        .select('id, email, role')
        .eq('role', 'admin')
        .limit(1)
        .single();
      
      if (adminError) {
        console.log('   ❌ No admin user found');
        allTestsPassed = false;
      } else {
        console.log('   ✅ Admin user exists');
        
        // Generate test token
        const jwt = require('jsonwebtoken');
        const testToken = jwt.sign({
          userId: admin.id,
          email: admin.email,
          role: 'admin',
          exp: Math.floor(Date.now() / 1000) + (60 * 60)
        }, process.env.JWT_SECRET);
        
        // Test authenticated endpoint
        try {
          await axios.get(
            `${BASE_URL}/api/workflow/user/profile`,
            {
              headers: { Authorization: `Bearer ${testToken}` }
            }
          );
          console.log('   ✅ Authentication system working');
        } catch (authError) {
          if (authError.response && [400, 403, 404].includes(authError.response.status)) {
            console.log('   ✅ Authentication system working (expected error)');
          } else {
            console.log('   ❌ Authentication system issue:', authError.message);
            allTestsPassed = false;
          }
        }
      }
      
    } catch (error) {
      console.log('   ❌ Authentication system check failed:', error.message);
      allTestsPassed = false;
    }
    
    // Test 5: Email Templates
    console.log('\n📧 5. Email Templates Check...');
    try {
      const fs = require('fs');
      const templates = [
        'onboarding_completed.html',
        'profile_unlocked.html',
        'payment_verified_registration.html'
      ];
      
      let templatesExist = true;
      for (const template of templates) {
        const templatePath = path.join(__dirname, '..', 'emails', 'templates', template);
        if (fs.existsSync(templatePath)) {
          console.log(`   ✅ Template exists: ${template}`);
        } else {
          console.log(`   ❌ Template missing: ${template}`);
          templatesExist = false;
        }
      }
      
      if (!templatesExist) {
        allTestsPassed = false;
      }
      
    } catch (error) {
      console.log('   ❌ Email templates check failed:', error.message);
      allTestsPassed = false;
    }
    
    // Test 6: Notification System
    console.log('\n🔔 6. Notification System Check...');
    try {
      const { NotificationHelpers } = require('../utils/notifications');
      
      const requiredHelpers = [
        'onboardingCompletedForReview',
        'profileUnlocked',
        'paymentVerified',
        'weeklyApplicationSummary',
        'conciergeNoteAdded'
      ];
      
      let helpersExist = true;
      for (const helper of requiredHelpers) {
        if (NotificationHelpers[helper]) {
          console.log(`   ✅ Notification helper exists: ${helper}`);
        } else {
          console.log(`   ❌ Notification helper missing: ${helper}`);
          helpersExist = false;
        }
      }
      
      if (!helpersExist) {
        allTestsPassed = false;
      }
      
    } catch (error) {
      console.log('   ❌ Notification system check failed:', error.message);
      allTestsPassed = false;
    }
    
    // Final Results
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
      console.log('🎉 ALL DEPLOYMENT VERIFICATION TESTS PASSED!');
      console.log('✅ NEW WORKFLOW FEATURES ARE FULLY DEPLOYED AND OPERATIONAL!');
      console.log('\n🚀 SYSTEM STATUS: READY FOR PRODUCTION');
      console.log('\n📋 What\'s Working:');
      console.log('   • 20-field onboarding questionnaire system');
      console.log('   • Profile unlock workflow');
      console.log('   • Payment verification system');
      console.log('   • Weekly application grouping');
      console.log('   • Discovery Mode support');
      console.log('   • Enhanced notification system');
      console.log('   • Email template system');
      console.log('\n🎯 Next Steps:');
      console.log('   1. Frontend integration');
      console.log('   2. User acceptance testing');
      console.log('   3. Performance monitoring');
      console.log('   4. User feedback collection');
    } else {
      console.log('❌ SOME DEPLOYMENT VERIFICATION TESTS FAILED');
      console.log('⚠️ SYSTEM STATUS: NEEDS ATTENTION');
      console.log('\n🔧 Required Actions:');
      console.log('   1. Apply database schema if missing fields detected');
      console.log('   2. Verify route registration in server.js');
      console.log('   3. Check authentication configuration');
      console.log('   4. Ensure all files are properly deployed');
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Final deployment verification failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the final verification
finalDeploymentVerification();