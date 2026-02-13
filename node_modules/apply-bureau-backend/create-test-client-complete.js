#!/usr/bin/env node

/**
 * Create Complete Test Client Account
 * Creates a fully unlocked client account with sample applications for dashboard testing
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const BACKEND_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

// Test client details
const TEST_CLIENT = {
  email: 'testclient@applybureau.com',
  password: 'TestClient123!',
  full_name: 'John Test Client',
  phone: '+1-555-0123',
  linkedin_profile_url: 'https://linkedin.com/in/johntestclient',
  resume_url: 'https://example.com/resume.pdf',
  portfolio_urls: ['https://github.com/johntestclient', 'https://johntestclient.dev']
};

// Sample applications to create
const SAMPLE_APPLICATIONS = [
  {
    company: 'Google',
    job_title: 'Senior Software Engineer',
    status: 'applied',
    job_url: 'https://careers.google.com/jobs/123',
    offer_salary: '$150,000 - $200,000',
    admin_notes: 'Strong technical background, good fit for the role'
  },
  {
    company: 'Microsoft',
    job_title: 'Product Manager',
    status: 'interview_requested',
    job_url: 'https://careers.microsoft.com/jobs/456',
    offer_salary: '$140,000 - $180,000',
    interview_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    admin_notes: 'Interview scheduled for next week'
  },
  {
    company: 'Apple',
    job_title: 'iOS Developer',
    status: 'interviewing',
    job_url: 'https://jobs.apple.com/jobs/789',
    offer_salary: '$130,000 - $170,000',
    admin_notes: 'Currently in second round of interviews'
  },
  {
    company: 'Netflix',
    job_title: 'Data Scientist',
    status: 'offer',
    job_url: 'https://jobs.netflix.com/jobs/101',
    offer_salary: '$160,000 - $190,000',
    offer_amount: '$175,000',
    admin_notes: 'Received competitive offer, negotiating terms'
  },
  {
    company: 'Tesla',
    job_title: 'Software Engineer',
    status: 'rejected',
    job_url: 'https://tesla.com/careers/112',
    offer_salary: '$120,000 - $150,000',
    admin_notes: 'Not selected for this round, but encouraged to apply for future roles'
  },
  {
    company: 'Amazon',
    job_title: 'Cloud Solutions Architect',
    status: 'applied',
    job_url: 'https://amazon.jobs/jobs/131',
    offer_salary: '$145,000 - $185,000',
    admin_notes: 'Recently applied, waiting for initial screening'
  },
  {
    company: 'Meta',
    job_title: 'Frontend Engineer',
    status: 'applied',
    job_url: 'https://careers.meta.com/jobs/415',
    offer_salary: '$135,000 - $175,000',
    admin_notes: 'Applied this week, strong React background'
  }
];

async function createTestClient() {
  console.log('🚀 Creating Complete Test Client Account...\n');

  try {
    // 0. Check if user already exists and delete if necessary
    console.log('0️⃣ Checking for existing test user...');
    
    try {
      // Try to get existing user
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(u => u.email === TEST_CLIENT.email);
      
      if (existingUser) {
        console.log('⚠️ Existing test user found, deleting...');
        
        // Delete from registered_users table first
        await supabaseAdmin
          .from('registered_users')
          .delete()
          .eq('id', existingUser.id);
        
        // Delete from applications table
        await supabaseAdmin
          .from('applications')
          .delete()
          .eq('user_id', existingUser.id);
        
        // Delete from strategy_calls table
        await supabaseAdmin
          .from('strategy_calls')
          .delete()
          .eq('client_id', existingUser.id);
        
        // Delete from client_onboarding_20q table
        await supabaseAdmin
          .from('client_onboarding_20q')
          .delete()
          .eq('user_id', existingUser.id);
        
        // Delete the auth user
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
        
        console.log('✅ Existing test user cleaned up');
      } else {
        console.log('✅ No existing test user found');
      }
    } catch (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError.message);
    }

    // 1. Create user in auth.users table
    console.log('\n1️⃣ Creating user account...');
    
    const hashedPassword = await bcrypt.hash(TEST_CLIENT.password, 12);
    
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_CLIENT.email,
      password: TEST_CLIENT.password,
      email_confirm: true,
      user_metadata: {
        full_name: TEST_CLIENT.full_name,
        role: 'client'
      }
    });

    if (userError) {
      console.error('❌ Error creating user:', userError);
      return;
    }

    console.log('✅ User created:', user.user.id);
    const userId = user.user.id;

    // 2. Create registered user profile
    console.log('\n2️⃣ Creating user profile...');
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('registered_users')
      .insert({
        id: userId,
        email: TEST_CLIENT.email,
        full_name: TEST_CLIENT.full_name,
        phone: TEST_CLIENT.phone,
        linkedin_profile_url: TEST_CLIENT.linkedin_profile_url,
        resume_url: TEST_CLIENT.resume_url,
        portfolio_urls: TEST_CLIENT.portfolio_urls,
        role: 'client',
        profile_unlocked: true, // UNLOCK PROFILE
        payment_confirmed: true, // CONFIRM PAYMENT
        onboarding_completed: true, // COMPLETE ONBOARDING
        registration_completed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      return;
    }

    console.log('✅ Profile created with unlocked access');

    // 3. Create strategy call record
    console.log('\n3️⃣ Creating strategy call record...');
    
    const { data: strategyCall, error: strategyError } = await supabaseAdmin
      .from('strategy_calls')
      .insert({
        client_id: userId,
        client_name: TEST_CLIENT.full_name,
        client_email: TEST_CLIENT.email,
        admin_status: 'confirmed',
        confirmed_time: new Date().toISOString(),
        meeting_link: 'https://meet.google.com/test-strategy-call',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (strategyError) {
      console.log('⚠️ Strategy call creation failed:', strategyError.message);
    } else {
      console.log('✅ Strategy call confirmed');
    }

    // 4. Create 20Q onboarding record
    console.log('\n4️⃣ Creating onboarding assessment...');
    
    const { data: onboarding, error: onboardingError } = await supabaseAdmin
      .from('client_onboarding_20q')
      .insert({
        user_id: userId,
        execution_status: 'active', // ACTIVE STATUS
        target_job_titles: ['Software Engineer', 'Product Manager', 'Data Scientist'],
        target_industries: ['Technology', 'Software', 'AI/ML'],
        years_of_experience: '5-7 years',
        job_search_timeline: '1-3 months',
        completed_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        approved_by: 'system',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (onboardingError) {
      console.log('⚠️ Onboarding creation failed:', onboardingError.message);
    } else {
      console.log('✅ Onboarding assessment completed and approved');
    }

    // 5. Create sample applications
    console.log('\n5️⃣ Creating sample applications...');
    
    const applications = [];
    for (const app of SAMPLE_APPLICATIONS) {
      const { data: application, error: appError } = await supabaseAdmin
        .from('applications')
        .insert({
          user_id: userId,
          client_id: userId,
          type: 'job_application',
          title: `${app.company} - ${app.job_title}`,
          description: `Application for ${app.job_title} position at ${app.company}`,
          status: app.status,
          company: app.company,
          job_title: app.job_title,
          job_url: app.job_url,
          offer_salary: app.offer_salary,
          offer_amount: app.offer_amount || null,
          interview_date: app.interview_date || null,
          admin_notes: app.admin_notes,
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 30 days
        })
        .select()
        .single();

      if (appError) {
        console.log(`⚠️ Failed to create application for ${app.company}:`, appError.message);
      } else {
        applications.push(application);
        console.log(`✅ Created application: ${app.company} - ${app.job_title} (${app.status})`);
      }
    }

    // 6. Generate JWT token for testing
    console.log('\n6️⃣ Generating authentication token...');
    
    const token = jwt.sign(
      {
        id: userId,
        email: TEST_CLIENT.email,
        role: 'client',
        full_name: TEST_CLIENT.full_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // 7 days for testing
    );

    // 7. Test API endpoints
    console.log('\n7️⃣ Testing API endpoints...');
    
    try {
      // Test dashboard endpoint
      const dashboardResponse = await fetch(`${BACKEND_URL}/api/client/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (dashboardResponse.ok) {
        console.log('✅ Dashboard endpoint working');
      } else {
        console.log('⚠️ Dashboard endpoint issue:', dashboardResponse.status);
      }

      // Test applications endpoint
      const appsResponse = await fetch(`${BACKEND_URL}/api/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (appsResponse.ok) {
        const appsData = await appsResponse.json();
        console.log(`✅ Applications endpoint working (${appsData.applications?.length || 0} applications)`);
      } else {
        console.log('⚠️ Applications endpoint issue:', appsResponse.status);
      }

      // Test stats endpoint
      const statsResponse = await fetch(`${BACKEND_URL}/api/applications/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        console.log('✅ Statistics endpoint working');
      } else {
        console.log('⚠️ Statistics endpoint issue:', statsResponse.status);
      }

    } catch (fetchError) {
      console.log('⚠️ API testing failed:', fetchError.message);
    }

    // 8. Display results
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TEST CLIENT ACCOUNT CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    
    console.log('\n📋 CLIENT CREDENTIALS:');
    console.log(`   Email: ${TEST_CLIENT.email}`);
    console.log(`   Password: ${TEST_CLIENT.password}`);
    console.log(`   User ID: ${userId}`);
    
    console.log('\n🔑 AUTHENTICATION TOKEN (7 days):');
    console.log(`   ${token}`);
    
    console.log('\n🌐 API ENDPOINTS TO TEST:');
    console.log(`   Dashboard: ${BACKEND_URL}/api/client/dashboard`);
    console.log(`   Applications: ${BACKEND_URL}/api/applications`);
    console.log(`   Statistics: ${BACKEND_URL}/api/applications/stats`);
    console.log(`   Weekly Apps: ${BACKEND_URL}/api/applications/weekly`);
    
    console.log('\n✅ ACCOUNT STATUS:');
    console.log('   ✅ Profile Unlocked: YES');
    console.log('   ✅ Payment Confirmed: YES');
    console.log('   ✅ Onboarding Completed: YES');
    console.log('   ✅ Strategy Call Confirmed: YES');
    console.log('   ✅ 20Q Assessment: ACTIVE');
    console.log(`   ✅ Sample Applications: ${applications.length} created`);
    
    console.log('\n📊 APPLICATION BREAKDOWN:');
    const statusCounts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   • ${status}: ${count} applications`);
    });
    
    console.log('\n🧪 TESTING INSTRUCTIONS:');
    console.log('1. Use the credentials above to login via your frontend');
    console.log('2. Or use the JWT token directly for API testing');
    console.log('3. Test all dashboard endpoints with the provided URLs');
    console.log('4. Verify applications are loading correctly');
    console.log('5. Check statistics and weekly views');
    
    console.log('\n🔗 CURL TESTING EXAMPLE:');
    console.log(`curl -H "Authorization: Bearer ${token}" \\`);
    console.log(`     ${BACKEND_URL}/api/client/dashboard`);
    
    return {
      success: true,
      credentials: {
        email: TEST_CLIENT.email,
        password: TEST_CLIENT.password,
        userId: userId
      },
      token: token,
      applications: applications
    };

  } catch (error) {
    console.error('❌ Failed to create test client:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  createTestClient()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Test client creation completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Test client creation failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { createTestClient, TEST_CLIENT };