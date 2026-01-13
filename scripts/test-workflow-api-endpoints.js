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

async function testWorkflowAPIEndpoints() {
  try {
    console.log('🧪 TESTING NEW WORKFLOW API ENDPOINTS');
    console.log('====================================\n');
    
    // Setup test data
    console.log('🔧 Setting up test data...');
    const testData = await setupTestData();
    
    // Test 1: Onboarding Workflow Endpoints
    console.log('\n📋 Test 1: Onboarding Workflow Endpoints...');
    await testOnboardingEndpoints(testData);
    
    // Test 2: Weekly Application Endpoints
    console.log('\n📅 Test 2: Weekly Application Endpoints...');
    await testWeeklyApplicationEndpoints(testData);
    
    // Test 3: Payment Verification Endpoints
    console.log('\n💳 Test 3: Payment Verification Endpoints...');
    await testPaymentVerificationEndpoints(testData);
    
    // Test 4: Profile Management Endpoints
    console.log('\n👤 Test 4: Profile Management Endpoints...');
    await testProfileManagementEndpoints(testData);
    
    // Test 5: Discovery Mode Endpoints
    console.log('\n🔍 Test 5: Discovery Mode Endpoints...');
    await testDiscoveryModeEndpoints(testData);
    
    console.log('\n🎉 WORKFLOW API ENDPOINTS TEST SUMMARY');
    console.log('=====================================');
    console.log('✅ Onboarding workflow endpoints working');
    console.log('✅ Weekly application endpoints functional');
    console.log('✅ Payment verification endpoints operational');
    console.log('✅ Profile management endpoints active');
    console.log('✅ Discovery Mode endpoints responsive');
    console.log('\n🚀 ALL NEW WORKFLOW API ENDPOINTS ARE OPERATIONAL!');
    
  } catch (error) {
    console.error('❌ Workflow API endpoints test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

async function setupTestData() {
  try {
    // Create test admin user
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email')
      .eq('role', 'admin')
      .limit(1)
      .single();
    
    if (adminError) {
      throw new Error(`Admin user not found: ${adminError.message}`);
    }
    
    // Create test client user
    const { data: client, error: clientError } = await supabaseAdmin
      .from('registered_users')
      .insert({
        full_name: 'Test Client Workflow',
        email: 'test.client.workflow@example.com',
        role: 'client',
        package_tier: 'Tier 2',
        onboarding_completed: false,
        profile_unlocked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (clientError) {
      throw new Error(`Failed to create test client: ${clientError.message}`);
    }
    
    // Create test consultation request
    const { data: consultation, error: consultationError } = await supabaseAdmin
      .from('consultation_requests')
      .insert({
        full_name: 'Test Client Workflow',
        email: 'test.client.workflow@example.com',
        phone: '+1 (555) 123-4567',
        message: 'Testing workflow API endpoints',
        status: 'lead',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (consultationError) {
      throw new Error(`Failed to create test consultation: ${consultationError.message}`);
    }
    
    // Generate auth tokens
    const jwt = require('jsonwebtoken');
    
    const adminToken = jwt.sign({
      userId: admin.id,
      email: admin.email,
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, process.env.JWT_SECRET);
    
    const clientToken = jwt.sign({
      userId: client.id,
      email: client.email,
      role: 'client',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, process.env.JWT_SECRET);
    
    console.log('✅ Test data setup completed');
    console.log(`   Admin ID: ${admin.id}`);
    console.log(`   Client ID: ${client.id}`);
    console.log(`   Consultation ID: ${consultation.id}`);
    
    return {
      admin: { ...admin, token: adminToken },
      client: { ...client, token: clientToken },
      consultation
    };
    
  } catch (error) {
    console.error('❌ Test data setup failed:', error.message);
    throw error;
  }
}

async function testOnboardingEndpoints(testData) {
  try {
    // Test 1: Submit onboarding questionnaire
    console.log('   📝 Testing onboarding submission...');
    
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
      onboarding_work_culture: 'Collaborative, innovative',
      onboarding_current_location: 'Toronto, ON',
      onboarding_willing_to_relocate: 'No',
      onboarding_preferred_locations: 'Toronto, Remote',
      onboarding_key_skills: 'JavaScript, React, Node.js',
      onboarding_skill_gaps: 'System design, leadership',
      onboarding_learning_goals: 'Management skills, architecture',
      onboarding_application_volume: '5-8 per week',
      onboarding_success_metrics: 'Job offer within 6 months'
    };
    
    const onboardingResponse = await axios.post(
      `${BASE_URL}/api/workflow/onboarding`,
      onboardingData,
      {
        headers: { Authorization: `Bearer ${testData.client.token}` }
      }
    );
    
    if (onboardingResponse.status === 200 && onboardingResponse.data.success) {
      console.log('   ✅ Onboarding submission successful');
    } else {
      throw new Error('Onboarding submission failed');
    }
    
    // Test 2: Admin profile unlock
    console.log('   🔓 Testing admin profile unlock...');
    
    const unlockResponse = await axios.patch(
      `${BASE_URL}/api/workflow/admin/clients/${testData.client.id}/unlock`,
      {
        profile_unlocked: true,
        admin_notes: 'Test profile unlock - API endpoint test'
      },
      {
        headers: { Authorization: `Bearer ${testData.admin.token}` }
      }
    );
    
    if (unlockResponse.status === 200 && unlockResponse.data.success) {
      console.log('   ✅ Profile unlock successful');
    } else {
      throw new Error('Profile unlock failed');
    }
    
    // Test 3: Get client profile (admin view)
    console.log('   👁️ Testing admin client profile view...');
    
    const profileResponse = await axios.get(
      `${BASE_URL}/api/workflow/admin/clients/${testData.client.id}`,
      {
        headers: { Authorization: `Bearer ${testData.admin.token}` }
      }
    );
    
    if (profileResponse.status === 200 && profileResponse.data.success) {
      console.log('   ✅ Admin client profile view successful');
      console.log(`      Profile unlocked: ${profileResponse.data.client.profile_unlocked}`);
    } else {
      throw new Error('Admin client profile view failed');
    }
    
    // Test 4: User profile check (Discovery Mode)
    console.log('   🔍 Testing user profile check...');
    
    const userProfileResponse = await axios.get(
      `${BASE_URL}/api/workflow/user/profile`,
      {
        headers: { Authorization: `Bearer ${testData.client.token}` }
      }
    );
    
    if (userProfileResponse.status === 200 && userProfileResponse.data.success) {
      console.log('   ✅ User profile check successful');
      console.log(`      Onboarding completed: ${userProfileResponse.data.profile.onboarding_completed}`);
      console.log(`      Profile unlocked: ${userProfileResponse.data.profile.profile_unlocked}`);
    } else {
      throw new Error('User profile check failed');
    }
    
  } catch (error) {
    console.error('❌ Onboarding endpoints test failed:', error.message);
    throw error;
  }
}

async function testWeeklyApplicationEndpoints(testData) {
  try {
    // First, create some test applications
    console.log('   📊 Creating test applications...');
    
    const applications = [
      {
        user_id: testData.client.id,
        company: 'TechCorp Inc.',
        role: 'Senior Engineer',
        job_link: 'https://techcorp.com/careers',
        status: 'pending',
        applied_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: testData.client.id,
        company: 'StartupXYZ',
        role: 'Tech Lead',
        job_link: 'https://startupxyz.com/jobs',
        status: 'interview',
        applied_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const { data: createdApps, error: appError } = await supabaseAdmin
      .from('applications')
      .insert(applications)
      .select();
    
    if (appError) {
      throw new Error(`Failed to create test applications: ${appError.message}`);
    }
    
    console.log(`   ✅ Created ${createdApps.length} test applications`);
    
    // Test 1: Get weekly applications (client view)
    console.log('   📅 Testing weekly applications (client view)...');
    
    const weeklyResponse = await axios.get(
      `${BASE_URL}/api/applications/weekly?weeks_back=4`,
      {
        headers: { Authorization: `Bearer ${testData.client.token}` }
      }
    );
    
    if (weeklyResponse.status === 200 && weeklyResponse.data.success) {
      console.log('   ✅ Weekly applications (client view) successful');
      console.log(`      Weekly groups: ${weeklyResponse.data.weekly_applications.length}`);
      console.log(`      Total applications: ${weeklyResponse.data.summary.total_applications}`);
    } else {
      throw new Error('Weekly applications (client view) failed');
    }
    
    // Test 2: Admin view of client weekly applications
    console.log('   👁️ Testing admin weekly applications view...');
    
    const adminWeeklyResponse = await axios.get(
      `${BASE_URL}/api/applications/admin/weekly/${testData.client.id}?weeks_back=4`,
      {
        headers: { Authorization: `Bearer ${testData.admin.token}` }
      }
    );
    
    if (adminWeeklyResponse.status === 200 && adminWeeklyResponse.data.success) {
      console.log('   ✅ Admin weekly applications view successful');
      console.log(`      Client: ${adminWeeklyResponse.data.client.full_name}`);
      console.log(`      Weekly groups: ${adminWeeklyResponse.data.weekly_applications.length}`);
    } else {
      throw new Error('Admin weekly applications view failed');
    }
    
    // Test 3: Update concierge note for week
    if (weeklyResponse.data.weekly_applications.length > 0) {
      const weekStart = weeklyResponse.data.weekly_applications[0].week_start;
      
      console.log('   💬 Testing concierge note update...');
      
      const noteResponse = await axios.patch(
        `${BASE_URL}/api/applications/weekly/${encodeURIComponent(weekStart)}/note`,
        {
          concierge_note: 'Great progress this week! Keep up the momentum with follow-ups.',
          client_id: testData.client.id
        },
        {
          headers: { Authorization: `Bearer ${testData.admin.token}` }
        }
      );
      
      if (noteResponse.status === 200 && noteResponse.data.success) {
        console.log('   ✅ Concierge note update successful');
        console.log(`      Updated applications: ${noteResponse.data.updated_applications}`);
      } else {
        throw new Error('Concierge note update failed');
      }
    }
    
  } catch (error) {
    console.error('❌ Weekly application endpoints test failed:', error.message);
    throw error;
  }
}

async function testPaymentVerificationEndpoints(testData) {
  try {
    // Test payment verification
    console.log('   💳 Testing payment verification...');
    
    const paymentData = {
      payment_verified: true,
      payment_method: 'Interac e-transfer',
      payment_amount: '$2,500 CAD',
      payment_reference: 'TEST-TXN-' + Date.now(),
      package_tier: 'Tier 2',
      admin_notes: 'Test payment verification - API endpoint test'
    };
    
    const paymentResponse = await axios.patch(
      `${BASE_URL}/api/workflow/consultation-requests/${testData.consultation.id}/verify-payment`,
      paymentData,
      {
        headers: { Authorization: `Bearer ${testData.admin.token}` }
      }
    );
    
    if (paymentResponse.status === 200 && paymentResponse.data.success) {
      console.log('   ✅ Payment verification successful');
      console.log(`      Status: ${paymentResponse.data.consultation_request.status}`);
      console.log(`      Token generated: ${paymentResponse.data.consultation_request.registration_token ? 'Yes' : 'No'}`);
    } else {
      throw new Error('Payment verification failed');
    }
    
  } catch (error) {
    console.error('❌ Payment verification endpoints test failed:', error.message);
    throw error;
  }
}

async function testProfileManagementEndpoints(testData) {
  try {
    // Test getting client profile with onboarding data
    console.log('   👤 Testing profile management...');
    
    const profileResponse = await axios.get(
      `${BASE_URL}/api/workflow/admin/clients/${testData.client.id}`,
      {
        headers: { Authorization: `Bearer ${testData.admin.token}` }
      }
    );
    
    if (profileResponse.status === 200 && profileResponse.data.success) {
      console.log('   ✅ Profile management successful');
      console.log(`      Client: ${profileResponse.data.client.full_name}`);
      console.log(`      Onboarding completed: ${profileResponse.data.client.onboarding_completed}`);
      console.log(`      Profile unlocked: ${profileResponse.data.client.profile_unlocked}`);
      
      // Check if onboarding fields are present
      const hasOnboardingData = profileResponse.data.client.onboarding_target_roles !== null;
      console.log(`      Has onboarding data: ${hasOnboardingData}`);
    } else {
      throw new Error('Profile management failed');
    }
    
  } catch (error) {
    console.error('❌ Profile management endpoints test failed:', error.message);
    throw error;
  }
}

async function testDiscoveryModeEndpoints(testData) {
  try {
    // Test Discovery Mode profile check
    console.log('   🔍 Testing Discovery Mode profile check...');
    
    const discoveryResponse = await axios.get(
      `${BASE_URL}/api/workflow/user/profile`,
      {
        headers: { Authorization: `Bearer ${testData.client.token}` }
      }
    );
    
    if (discoveryResponse.status === 200 && discoveryResponse.data.success) {
      console.log('   ✅ Discovery Mode profile check successful');
      
      const profile = discoveryResponse.data.profile;
      
      // Determine Discovery Mode state
      let discoveryState;
      if (!profile.onboarding_completed) {
        discoveryState = 'Show onboarding button';
      } else if (profile.onboarding_completed && !profile.profile_unlocked) {
        discoveryState = 'Show "under review" message';
      } else if (profile.onboarding_completed && profile.profile_unlocked) {
        discoveryState = 'Full Application Tracker access';
      }
      
      console.log(`      Discovery Mode state: ${discoveryState}`);
      console.log(`      Onboarding completed: ${profile.onboarding_completed}`);
      console.log(`      Profile unlocked: ${profile.profile_unlocked}`);
    } else {
      throw new Error('Discovery Mode profile check failed');
    }
    
  } catch (error) {
    console.error('❌ Discovery Mode endpoints test failed:', error.message);
    throw error;
  }
}

// Run the workflow API endpoints test
testWorkflowAPIEndpoints();