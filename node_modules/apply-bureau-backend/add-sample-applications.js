#!/usr/bin/env node

/**
 * Add Sample Applications for Israel's Account
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');

const USER_ID = '22b2f3cb-a834-4fc8-ae53-269cb876e565';

// Sample applications using the correct schema
const SAMPLE_APPLICATIONS = [
  {
    type: 'job_application',
    title: 'Google - Senior Software Engineer',
    description: 'Application for Senior Software Engineer position at Google',
    company: 'Google',
    job_title: 'Senior Software Engineer',
    job_url: 'https://careers.google.com/jobs/123',
    status: 'applied',
    admin_notes: 'Strong technical background, good fit for the role. Salary range: $150,000 - $200,000',
    date_applied: '2026-01-20'
  },
  {
    type: 'job_application',
    title: 'Microsoft - Product Manager',
    description: 'Application for Product Manager position at Microsoft',
    company: 'Microsoft',
    job_title: 'Product Manager',
    job_url: 'https://careers.microsoft.com/jobs/456',
    status: 'interview_requested',
    admin_notes: 'Interview scheduled for next week. Salary range: $140,000 - $180,000',
    date_applied: '2026-01-22',
    interview_scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    type: 'job_application',
    title: 'Apple - iOS Developer',
    description: 'Application for iOS Developer position at Apple',
    company: 'Apple',
    job_title: 'iOS Developer',
    job_url: 'https://jobs.apple.com/jobs/789',
    status: 'interviewing',
    admin_notes: 'Currently in second round of interviews. Salary range: $130,000 - $170,000',
    date_applied: '2026-01-18'
  },
  {
    type: 'job_application',
    title: 'Netflix - Data Scientist',
    description: 'Application for Data Scientist position at Netflix',
    company: 'Netflix',
    job_title: 'Data Scientist',
    job_url: 'https://jobs.netflix.com/jobs/101',
    status: 'offer',
    admin_notes: 'Received competitive offer, negotiating terms. Salary range: $160,000 - $190,000',
    date_applied: '2026-01-15'
  },
  {
    type: 'job_application',
    title: 'Tesla - Software Engineer',
    description: 'Application for Software Engineer position at Tesla',
    company: 'Tesla',
    job_title: 'Software Engineer',
    job_url: 'https://tesla.com/careers/112',
    status: 'rejected',
    admin_notes: 'Not selected for this round, but encouraged to apply for future roles. Salary range: $120,000 - $150,000',
    date_applied: '2026-01-10',
    rejection_reason: 'Position filled by internal candidate'
  },
  {
    type: 'job_application',
    title: 'Amazon - Cloud Solutions Architect',
    description: 'Application for Cloud Solutions Architect position at Amazon',
    company: 'Amazon',
    job_title: 'Cloud Solutions Architect',
    job_url: 'https://amazon.jobs/jobs/131',
    status: 'applied',
    admin_notes: 'Recently applied, waiting for initial screening. Salary range: $145,000 - $185,000',
    date_applied: '2026-01-25'
  },
  {
    type: 'job_application',
    title: 'Meta - Frontend Engineer',
    description: 'Application for Frontend Engineer position at Meta',
    company: 'Meta',
    job_title: 'Frontend Engineer',
    job_url: 'https://careers.meta.com/jobs/415',
    status: 'applied',
    admin_notes: 'Applied this week, strong React background. Salary range: $135,000 - $175,000',
    date_applied: '2026-01-26'
  }
];

async function addSampleApplications() {
  console.log('📝 Adding Sample Applications for Israel\'s Account...\n');

  try {
    // 1. Clear existing applications
    console.log('1️⃣ Clearing existing applications...');
    
    const { error: deleteError } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('user_id', USER_ID);

    if (deleteError) {
      console.log('⚠️ Error clearing applications:', deleteError.message);
    } else {
      console.log('✅ Existing applications cleared');
    }

    // 2. Create new sample applications
    console.log('\n2️⃣ Creating sample applications...');
    
    const applications = [];
    for (const app of SAMPLE_APPLICATIONS) {
      const { data: application, error: appError } = await supabaseAdmin
        .from('applications')
        .insert({
          user_id: USER_ID,
          client_id: USER_ID,
          type: app.type,
          title: app.title,
          description: app.description,
          company: app.company,
          job_title: app.job_title,
          job_url: app.job_url,
          status: app.status,
          admin_notes: app.admin_notes,
          date_applied: app.date_applied,
          interview_scheduled_at: app.interview_scheduled_at || null,
          rejection_reason: app.rejection_reason || null,
          priority: 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (appError) {
        console.log(`⚠️ Failed to create application for ${app.company}:`, appError.message);
      } else {
        applications.push(application);
        console.log(`✅ Created: ${app.company} - ${app.job_title} (${app.status})`);
      }
    }

    // 3. Display results
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SAMPLE APPLICATIONS CREATED!');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Created ${applications.length} applications:`);
    
    const statusCounts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   • ${status}: ${count} applications`);
    });
    
    console.log('\n🧪 NOW YOU CAN TEST:');
    console.log('1. Login with israelloko65@gmail.com / TestPassword123!');
    console.log('2. Check the client dashboard for applications');
    console.log('3. View application statistics and charts');
    console.log('4. Test all dashboard endpoints');
    
    console.log('\n🌐 API ENDPOINTS WITH DATA:');
    console.log('   Applications: https://jellyfish-app-t4m35.ondigitalocean.app/api/applications');
    console.log('   Statistics: https://jellyfish-app-t4m35.ondigitalocean.app/api/applications/stats');
    console.log('   Dashboard: https://jellyfish-app-t4m35.ondigitalocean.app/api/client/dashboard');

    return {
      success: true,
      applications: applications,
      count: applications.length
    };

  } catch (error) {
    console.error('❌ Failed to add applications:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  addSampleApplications()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Sample applications added successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Failed to add applications:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { addSampleApplications };