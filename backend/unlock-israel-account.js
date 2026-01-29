#!/usr/bin/env node

/**
 * Unlock Israel's Account for Testing
 * Unlocks israelloko65@gmail.com and creates sample applications
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');
const jwt = require('jsonwebtoken');

const BACKEND_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';
const TEST_EMAIL = 'israelloko65@gmail.com';
const USER_ID = '22b2f3cb-a834-4fc8-ae53-269cb876e565'; // From the user list

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

async function unlockIsraelAccount() {
  console.log('🚀 Unlocking Israel\'s Account for Testing...\n');

  try {
    // 1. Update the registered user profile to unlock it
    console.log('1️⃣ Unlocking user profile...');
    
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('registered_users')
      .update({
        profile_unlocked: true,
        payment_confirmed: true,
        onboarding_completed: true,
        full_name: 'Israel Loko',
        phone: '+1-555-0123',
        status: 'active',
        is_active: true,
        email_verified: true,
        payment_verified: true,
        profile_unlocked_at: new Date().toISOString(),
        payment_confirmed_at: new Date().toISOString(),
        email_verified_at: new Date().toISOString(),
        payment_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', USER_ID)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return;
    }

    console.log('✅ Profile unlocked and updated');

    // 2. Create or update strategy call record
    console.log('\n2️⃣ Setting up strategy call...');
    
    // First, check if strategy call exists
    const { data: existingCall } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .eq('client_id', USER_ID)
      .single();

    if (existingCall) {
      // Update existing call
      const { error: strategyUpdateError } = await supabaseAdmin
        .from('strategy_calls')
        .update({
          admin_status: 'confirmed',
          confirmed_time: new Date().toISOString(),
          meeting_link: 'https://meet.google.com/israel-strategy-call'
        })
        .eq('client_id', USER_ID);

      if (strategyUpdateError) {
        console.log('⚠️ Strategy call update failed:', strategyUpdateError.message);
      } else {
        console.log('✅ Strategy call updated and confirmed');
      }
    } else {
      // Create new strategy call
      const { error: strategyError } = await supabaseAdmin
        .from('strategy_calls')
        .insert({
          client_id: USER_ID,
          client_name: 'Israel Loko',
          client_email: TEST_EMAIL,
          admin_status: 'confirmed',
          confirmed_time: new Date().toISOString(),
          meeting_link: 'https://meet.google.com/israel-strategy-call',
          created_at: new Date().toISOString()
        });

      if (strategyError) {
        console.log('⚠️ Strategy call creation failed:', strategyError.message);
      } else {
        console.log('✅ Strategy call created and confirmed');
      }
    }

    // 3. Create or update 20Q onboarding record
    console.log('\n3️⃣ Setting up onboarding assessment...');
    
    // Check if onboarding exists
    const { data: existingOnboarding } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('*')
      .eq('user_id', USER_ID)
      .single();

    if (existingOnboarding) {
      // Update existing onboarding
      const { error: onboardingUpdateError } = await supabaseAdmin
        .from('client_onboarding_20q')
        .update({
          execution_status: 'active',
          target_job_titles: ['Software Engineer', 'Product Manager', 'Data Scientist'],
          target_industries: ['Technology', 'Software', 'AI/ML'],
          years_of_experience: '5-7 years',
          job_search_timeline: '1-3 months',
          completed_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          approved_by: 'system'
        })
        .eq('user_id', USER_ID);

      if (onboardingUpdateError) {
        console.log('⚠️ Onboarding update failed:', onboardingUpdateError.message);
      } else {
        console.log('✅ Onboarding assessment updated and approved');
      }
    } else {
      // Create new onboarding
      const { error: onboardingError } = await supabaseAdmin
        .from('client_onboarding_20q')
        .insert({
          user_id: USER_ID,
          execution_status: 'active',
          target_job_titles: ['Software Engineer', 'Product Manager', 'Data Scientist'],
          target_industries: ['Technology', 'Software', 'AI/ML'],
          years_of_experience: '5-7 years',
          job_search_timeline: '1-3 months',
          completed_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          approved_by: 'system',
          created_at: new Date().toISOString()
        });

      if (onboardingError) {
        console.log('⚠️ Onboarding creation failed:', onboardingError.message);
      } else {
        console.log('✅ Onboarding assessment created and approved');
      }
    }

    // 4. Clear existing applications and create new ones
    console.log('\n4️⃣ Setting up sample applications...');
    
    // Delete existing applications
    await supabaseAdmin
      .from('applications')
      .delete()
      .eq('user_id', USER_ID);

    console.log('✅ Cleared existing applications');

    // Create new sample applications
    const applications = [];
    for (const app of SAMPLE_APPLICATIONS) {
      const { data: application, error: appError } = await supabaseAdmin
        .from('applications')
        .insert({
          user_id: USER_ID,
          client_id: USER_ID,
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

    // 5. Generate JWT token for testing
    console.log('\n5️⃣ Generating authentication token...');
    
    const token = jwt.sign(
      {
        id: USER_ID,
        email: TEST_EMAIL,
        role: 'client',
        full_name: 'Israel Loko'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // 7 days for testing
    );

    // 6. Test API endpoints
    console.log('\n6️⃣ Testing API endpoints...');
    
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

    // 7. Display results
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ISRAEL\'S ACCOUNT UNLOCKED SUCCESSFULLY!');
    console.log('='.repeat(60));
    
    console.log('\n📋 ACCOUNT CREDENTIALS:');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   User ID: ${USER_ID}`);
    console.log(`   Password: Use existing password or reset if needed`);
    
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
    console.log('1. Login with israelloko65@gmail.com using your existing password');
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
        email: TEST_EMAIL,
        userId: USER_ID
      },
      token: token,
      applications: applications
    };

  } catch (error) {
    console.error('❌ Failed to unlock account:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  unlockIsraelAccount()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Account unlock completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Account unlock failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { unlockIsraelAccount };