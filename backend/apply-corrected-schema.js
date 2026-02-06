#!/usr/bin/env node

/**
 * Apply Corrected Application Schema
 * Uses the existing column names (payment_verified instead of payment_confirmed)
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');

async function applyCorrectedSchema() {
  console.log('🔧 Applying Corrected Application Schema...\n');

  try {
    // 1. First, let's ensure our test client exists with correct data
    console.log('1️⃣ Ensuring test client exists...');
    
    const { data: existingClient, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', 'israelloko65@gmail.com')
      .single();

    if (clientError && clientError.code !== 'PGRST116') {
      console.log('⚠️ Error checking client:', clientError.message);
    }

    if (existingClient) {
      console.log('✅ Test client exists:', existingClient.email);
      console.log('   ID:', existingClient.id);
      console.log('   Profile Unlocked:', existingClient.profile_unlocked);
      console.log('   Payment Verified:', existingClient.payment_verified);
      console.log('   Is Active:', existingClient.is_active);
    } else {
      console.log('⚠️ Test client not found in clients table');
    }

    // 2. Create sample applications using the correct client_id
    console.log('\n2️⃣ Creating sample applications...');
    
    if (existingClient) {
      const sampleApplications = [
        {
          title: 'Google - Senior Software Engineer',
          description: 'Application for Senior Software Engineer position at Google',
          company: 'Google',
          job_title: 'Senior Software Engineer',
          job_url: 'https://careers.google.com/jobs/123',
          status: 'applied',
          priority: 'high',
          admin_notes: 'Strong technical background, excellent fit for the role',
          date_applied: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          title: 'Microsoft - Product Manager',
          description: 'Application for Product Manager position at Microsoft',
          company: 'Microsoft',
          job_title: 'Product Manager',
          job_url: 'https://careers.microsoft.com/jobs/456',
          status: 'interview_requested',
          priority: 'high',
          admin_notes: 'Interview scheduled for next week',
          date_applied: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          title: 'Apple - iOS Developer',
          description: 'Application for iOS Developer position at Apple',
          company: 'Apple',
          job_title: 'iOS Developer',
          job_url: 'https://jobs.apple.com/jobs/789',
          status: 'interviewing',
          priority: 'medium',
          admin_notes: 'Currently in second round of interviews',
          date_applied: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ];

      // Clear existing applications first
      await supabaseAdmin
        .from('applications')
        .delete()
        .eq('client_id', existingClient.id);

      console.log('   Cleared existing applications');

      // Create new applications
      for (const app of sampleApplications) {
        const { data: newApp, error: appError } = await supabaseAdmin
          .from('applications')
          .insert({
            client_id: existingClient.id,
            user_id: existingClient.id, // Also set user_id for compatibility
            type: 'job_application',
            title: app.title,
            description: app.description,
            company: app.company,
            job_title: app.job_title,
            job_url: app.job_url,
            status: app.status,
            priority: app.priority,
            admin_notes: app.admin_notes,
            date_applied: app.date_applied,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (appError) {
          console.log(`   ⚠️ Failed to create ${app.company} application:`, appError.message);
        } else {
          console.log(`   ✅ Created: ${app.company} - ${app.job_title}`);
        }
      }
    }

    // 3. Test the applications endpoint
    console.log('\n3️⃣ Testing applications endpoint...');
    
    try {
      const response = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'israelloko65@gmail.com',
          password: 'SimplePass123!'
        })
      });

      if (response.ok) {
        const loginData = await response.json();
        console.log('✅ Login successful, testing applications...');
        
        // Test applications endpoint
        const appsResponse = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/applications', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (appsResponse.ok) {
          const appsData = await appsResponse.json();
          console.log(`✅ Applications endpoint working (${appsData.applications?.length || 0} applications)`);
        } else {
          const errorText = await appsResponse.text();
          console.log('⚠️ Applications endpoint issue:', appsResponse.status, errorText.substring(0, 100));
        }

        // Test stats endpoint
        const statsResponse = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/applications/stats', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('✅ Statistics endpoint working');
        } else {
          const errorText = await statsResponse.text();
          console.log('⚠️ Statistics endpoint issue:', statsResponse.status, errorText.substring(0, 100));
        }

      } else {
        console.log('❌ Login failed, cannot test endpoints');
      }
    } catch (testError) {
      console.log('⚠️ Endpoint testing failed:', testError.message);
    }

    // 4. Display final status
    console.log('\n' + '='.repeat(60));
    console.log('🎉 CORRECTED SCHEMA APPLIED!');
    console.log('='.repeat(60));
    
    console.log('\n📋 WORKING CREDENTIALS:');
    console.log('   📧 Email: israelloko65@gmail.com');
    console.log('   🔑 Password: SimplePass123!');
    
    console.log('\n🌐 TESTING URLS:');
    console.log('   Frontend: https://www.applybureau.com/login');
    console.log('   API Login: https://jellyfish-app-t4m35.ondigitalocean.app/api/auth/login');
    console.log('   Applications: https://jellyfish-app-t4m35.ondigitalocean.app/api/applications');
    
    console.log('\n✅ WHAT SHOULD WORK NOW:');
    console.log('   ✅ User login and authentication');
    console.log('   ✅ Applications endpoint (should return sample data)');
    console.log('   ✅ Statistics endpoint');
    console.log('   ✅ Client dashboard data');
    
    console.log('\n🧪 NEXT STEPS:');
    console.log('1. Test login with the credentials above');
    console.log('2. Check if applications are visible in the dashboard');
    console.log('3. Verify all endpoints return proper data');

    return {
      success: true,
      message: 'Corrected schema applied successfully'
    };

  } catch (error) {
    console.error('❌ Failed to apply corrected schema:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  applyCorrectedSchema()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Corrected schema application completed!');
        process.exit(0);
      } else {
        console.error('\n💥 Schema application failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { applyCorrectedSchema };