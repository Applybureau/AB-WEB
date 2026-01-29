#!/usr/bin/env node

/**
 * Simple application creation test without client_id
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');

const USER_ID = '22b2f3cb-a834-4fc8-ae53-269cb876e565';

async function createSimpleApplications() {
  console.log('📝 Creating Simple Applications (without client_id)...\n');

  try {
    // Sample applications with minimal required fields
    const applications = [
      {
        title: 'Google - Senior Software Engineer',
        description: 'Application for Senior Software Engineer position at Google',
        status: 'applied'
      },
      {
        title: 'Microsoft - Product Manager', 
        description: 'Application for Product Manager position at Microsoft',
        status: 'pending'
      },
      {
        title: 'Apple - iOS Developer',
        description: 'Application for iOS Developer position at Apple', 
        status: 'applied'
      }
    ];

    console.log('1️⃣ Creating applications without client_id...');
    
    const createdApps = [];
    for (const app of applications) {
      const { data: application, error: appError } = await supabaseAdmin
        .from('applications')
        .insert({
          user_id: USER_ID,
          type: 'job_application',
          title: app.title,
          description: app.description,
          status: app.status,
          priority: 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (appError) {
        console.log(`⚠️ Failed to create ${app.title}:`, appError.message);
      } else {
        createdApps.push(application);
        console.log(`✅ Created: ${app.title}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 APPLICATIONS CREATED!');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Successfully created ${createdApps.length} applications`);
    
    console.log('\n🧪 NOW YOU CAN TEST:');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('   Email: israelloko65@gmail.com');
    console.log('   Password: TestPassword123!');
    
    console.log('\n🌐 FRONTEND LOGIN:');
    console.log('   https://apply-bureau.vercel.app/login');
    
    console.log('\n🔗 API ENDPOINTS:');
    console.log('   Applications: https://jellyfish-app-t4m35.ondigitalocean.app/api/applications');
    console.log('   Dashboard: https://jellyfish-app-t4m35.ondigitalocean.app/api/client/dashboard');

    return {
      success: true,
      applications: createdApps,
      count: createdApps.length
    };

  } catch (error) {
    console.error('❌ Failed to create applications:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  createSimpleApplications()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Applications created successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Failed to create applications:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { createSimpleApplications };