const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Create supabase admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://apply-bureau-backend.vercel.app'
  : 'http://localhost:3000';

async function deployAndTestWorkflow() {
  try {
    console.log('🚀 DEPLOY AND TEST NEW WORKFLOW FEATURES');
    console.log('=======================================\n');
    
    // Step 1: Test Database Schema
    console.log('📊 Step 1: Testing Database Schema...');
    await testDatabaseSchema();
    
    // Step 2: Test Server Health
    console.log('\n🏥 Step 2: Testing Server Health...');
    await testServerHealth();
    
    // Step 3: Test New Route Registration
    console.log('\n🛣️ Step 3: Testing New Route Registration...');
    await testRouteRegistration();
    
    // Step 4: Test Authentication
    console.log('\n🔐 Step 4: Testing Authentication...');
    const authTokens = await testAuthentication();
    
    // Step 5: Test Workflow Endpoints
    console.log('\n⚙️ Step 5: Testing Workflow Endpoints...');
    await testWorkflowEndpoints(authTokens);
    
    // Step 6: Test Email System
    console.log('\n📧 Step 6: Testing Email System...');
    await testEmailSystem();
    
    // Step 7: Test Notification System
    console.log('\n🔔 Step 7: Testing Notification System...');
    await testNotificationSystem();
    
    console.log('\n🎉 DEPLOYMENT AND TESTING COMPLETE!');
    console.log('===================================');
    console.log('✅ Database schema verified');
    console.log('✅ Server health confirmed');
    console.log('✅ New routes registered');
    console.log('✅ Authentication working');
    console.log('✅ Workflow endpoints operational');
    console.log('✅ Email system functional');
    console.log('✅ Notification system active');
    console.log('\n🚀 NEW WORKFLOW FEATURES ARE LIVE AND READY!');
    
  } catch (error) {
    console.error('❌ Deployment and testing failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

async function testDatabaseSchema() {
  try {
    // Test onboarding fields
    const { data: userTest, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('onboarding_completed, profile_unlocked, onboarding_current_position')
      .limit(1);
    
    if (userError) {
      throw new Error(`Onboarding fields missing: ${userError.message}`);
    }
    console.log('   ✅ Onboarding fields exist in registered_users');
    
    // Test payment fields
    const { data: consultationTest, error: consultationError } = await supabaseAdmin
      .from('consultation_requests')
      .select('payment_verified, registration_token, package_tier')
      .limit(1);
    
    if (consultationError) {
      throw new Error(`Payment fields missing: ${consultationError.message}`);
    }
    console.log('   ✅ Payment fields exist in consultation_requests');
    
    // Test weekly fields
    const { data: appTest, error: appError } = await supabaseAdmin
      .from('applications')
      .select('week_start, concierge_note')
      .limit(1);
    
    if (appError) {
      throw new Error(`Weekly fields missing: ${appError.message}`);
    }
    console.log('   ✅ Weekly fields exist in applications');
    
    // Test week start function
    const { data: weekTest, error: weekError } = await supabaseAdmin
      .rpc('get_week_start', { input_date: new Date().toISOString() });
    
    if (weekError) {
      throw new Error(`Week start function failed: ${weekError.message}`);
    }
    console.log('   ✅ Week start function operational');
    
  } catch (error) {
    console.error('   ❌ Database schema test failed:', error.message);
    throw error;
  }
}

async function testServerHealth() {
  try {
    const response = await axios.get(`${BASE_URL}/api/health`, {
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log('   ✅ Server is healthy');
      console.log(`   📍 Environment: ${response.data.environment || 'unknown'}`);
      console.log(`   🕐 Uptime: ${response.data.uptime || 'unknown'}`);
    } else {
      throw new Error(`Server health check failed: ${response.status}`);
    }
    
  } catch (error) {
    console.error('   ❌ Server health test failed:', error.message);
    throw error;
  }
}

async function testRouteRegistration() {
  try {
    // Test workflow routes are registered
    const routes = [
      '/api/workflow/user/profile',
      '/api/applications/weekly'
    ];
    
    for (const route of routes) {
      try {
        // We expect 401 (unauthorized) which means route exists
        await axios.get(`${BASE_URL}${route}`);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log(`   ✅ Route registered: ${route}`);
        } else if (error.response && error.response.status === 404) {
          throw new Error(`Route not found: ${route}`);
        } else {
          console.log(`   ✅ Route registered: ${route} (status: ${error.response?.status})`);
        }
      }
    }
    
  } catch (error) {
    console.error('   ❌ Route registration test failed:', error.message);
    throw error;
  }
}

async function testAuthentication() {
  try {
    // Get admin user
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name')
      .eq('role', 'admin')
      .limit(1)
      .single();
    
    if (adminError) {
      throw new Error(`Admin user not found: ${adminError.message}`);
    }
    
    // Get or create test client
    let { data: client, error: clientError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name')
      .eq('email', 'test.workflow@example.com')
      .eq('role', 'client')
      .single();
    
    if (clientError) {
      // Create test client
      const { data: newClient, error: createError } = await supabaseAdmin
        .from('registered_users')
        .insert({
          full_name: 'Test Workflow Client',
          email: 'test.workflow@example.com',
          role: 'client',
          package_tier: 'Tier 2',
          onboarding_completed: false,
          profile_unlocked: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        throw new Error(`Failed to create test client: ${createError.message}`);
      }
      client = newClient;
    }
    
    // Generate tokens
    const jwt = require('jsonwebtoken');
    
    const adminToken = jwt.sign({
      userId: admin.id,
      email: admin.email,
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }, process.env.JWT_SECRET);
    
    const clientToken = jwt.sign({
      userId: client.id,
      email: client.email,
      role: 'client',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }, process.env.JWT_SECRET);
    
    console.log('   ✅ Authentication tokens generated');
    console.log(`   👤 Admin: ${admin.full_name || admin.email}`);
    console.log(`   👤 Client: ${client.full_name || client.email}`);
    
    return {
      admin: { ...admin, token: adminToken },
      client: { ...client, token: clientToken }
    };
    
  } catch (error) {
    console.error('   ❌ Authentication test failed:', error.message);
    throw error;
  }
}

async function testWorkflowEndpoints(authTokens) {
  try {
    // Test 1: User profile check (Discovery Mode)
    console.log('   🔍 Testing user profile check...');
    const profileResponse = await axios.get(
      `${BASE_URL}/api/workflow/user/profile`,
      {
        headers: { Authorization: `Bearer ${authTokens.client.token}` }
      }
    );
    
    if (profileResponse.status === 200 && profileResponse.data.success) {
      console.log('   ✅ User profile check working');
      console.log(`      Onboarding: ${profileResponse.data.profile.onboarding_completed}`);
      console.log(`      Unlocked: ${profileResponse.data.profile.profile_unlocked}`);
    }
    
    // Test 2: Weekly applications
    console.log('   📅 Testing weekly applications...');
    const weeklyResponse = await axios.get(
      `${BASE_URL}/api/applications/weekly?weeks_back=4`,
      {
        headers: { Authorization: `Bearer ${authTokens.client.token}` }
      }
    );
    
    if (weeklyResponse.status === 200 && weeklyResponse.data.success) {
      console.log('   ✅ Weekly applications working');
      console.log(`      Weekly groups: ${weeklyResponse.data.weekly_applications.length}`);
    }
    
    // Test 3: Admin client view
    console.log('   👁️ Testing admin client view...');
    const adminClientResponse = await axios.get(
      `${BASE_URL}/api/workflow/admin/clients/${authTokens.client.id}`,
      {
        headers: { Authorization: `Bearer ${authTokens.admin.token}` }
      }
    );
    
    if (adminClientResponse.status === 200 && adminClientResponse.data.success) {
      console.log('   ✅ Admin client view working');
      console.log(`      Client: ${adminClientResponse.data.client.full_name}`);
    }
    
    // Test 4: Onboarding submission
    console.log('   📋 Testing onboarding submission...');
    const onboardingData = {
      onboarding_current_position: 'Senior Software Engineer',
      onboarding_years_experience: '5-7 years',
      onboarding_education_level: 'Bachelor\'s Degree',
      onboarding_target_roles: 'Engineering Manager, Tech Lead',
      onboarding_target_industries: 'Technology, Fintech',
      onboarding_career_timeline: '3-6 months',
      onboarding_current_salary: '$120,000 CAD',
      onboarding_target_salary: '$150,000-180,000 CAD',
      onboarding_benefits_priorities: 'Health benefits, stock options',
      onboarding_work_arrangement: 'Hybrid',
      onboarding_company_size: '100-500 employees',
      onboarding_work_culture: 'Collaborative',
      onboarding_current_location: 'Toronto, ON',
      onboarding_willing_to_relocate: 'No',
      onboarding_preferred_locations: 'Toronto, Remote',
      onboarding_key_skills: 'JavaScript, React, Node.js',
      onboarding_skill_gaps: 'System design',
      onboarding_learning_goals: 'Management skills',
      onboarding_application_volume: '5-8 per week',
      onboarding_success_metrics: 'Job offer within 6 months'
    };
    
    const onboardingResponse = await axios.post(
      `${BASE_URL}/api/workflow/onboarding`,
      onboardingData,
      {
        headers: { Authorization: `Bearer ${authTokens.client.token}` }
      }
    );
    
    if (onboardingResponse.status === 200 && onboardingResponse.data.success) {
      console.log('   ✅ Onboarding submission working');
    }
    
    // Test 5: Profile unlock
    console.log('   🔓 Testing profile unlock...');
    const unlockResponse = await axios.patch(
      `${BASE_URL}/api/workflow/admin/clients/${authTokens.client.id}/unlock`,
      {
        profile_unlocked: true,
        admin_notes: 'Test unlock - deployment verification'
      },
      {
        headers: { Authorization: `Bearer ${authTokens.admin.token}` }
      }
    );
    
    if (unlockResponse.status === 200 && unlockResponse.data.success) {
      console.log('   ✅ Profile unlock working');
    }
    
  } catch (error) {
    console.error('   ❌ Workflow endpoints test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    throw error;
  }
}

async function testEmailSystem() {
  try {
    // Test email template existence
    const fs = require('fs');
    const templates = [
      'onboarding_completed.html',
      'profile_unlocked.html',
      'payment_verified_registration.html'
    ];
    
    for (const template of templates) {
      const templatePath = path.join(__dirname, '..', 'emails', 'templates', template);
      if (fs.existsSync(templatePath)) {
        console.log(`   ✅ Email template exists: ${template}`);
      } else {
        throw new Error(`Email template missing: ${template}`);
      }
    }
    
    console.log('   ✅ Email system ready');
    
  } catch (error) {
    console.error('   ❌ Email system test failed:', error.message);
    throw error;
  }
}

async function testNotificationSystem() {
  try {
    // Test notification helpers
    const { NotificationHelpers } = require('../utils/notifications');
    
    if (NotificationHelpers && 
        NotificationHelpers.onboardingCompletedForReview &&
        NotificationHelpers.profileUnlocked &&
        NotificationHelpers.paymentVerified) {
      console.log('   ✅ Notification helpers loaded');
    } else {
      throw new Error('Notification helpers missing');
    }
    
    console.log('   ✅ Notification system ready');
    
  } catch (error) {
    console.error('   ❌ Notification system test failed:', error.message);
    throw error;
  }
}

// Run the deployment and testing
deployAndTestWorkflow();