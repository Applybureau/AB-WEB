#!/usr/bin/env node

/**
 * Check application table constraints and valid values
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');

async function checkConstraints() {
  console.log('🔍 Checking application constraints...\n');

  try {
    // 1. Check existing applications to see valid statuses
    console.log('1️⃣ Checking existing applications for valid statuses...');
    
    const { data: existingApps, error: appsError } = await supabaseAdmin
      .from('applications')
      .select('status, client_id, user_id')
      .limit(10);
    
    if (appsError) {
      console.error('❌ Error fetching applications:', appsError);
    } else {
      console.log('📊 Existing applications:');
      existingApps.forEach((app, index) => {
        console.log(`${index + 1}. Status: ${app.status}, Client ID: ${app.client_id}, User ID: ${app.user_id}`);
      });
      
      const uniqueStatuses = [...new Set(existingApps.map(app => app.status))];
      console.log('\n✅ Valid statuses found:', uniqueStatuses.join(', '));
    }

    // 2. Check registered users to find the correct client_id
    console.log('\n2️⃣ Checking registered users...');
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, role')
      .eq('email', 'israelloko65@gmail.com');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log('👤 Israel\'s registered user records:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
      });
    }

    // 3. Try to create a simple test application
    console.log('\n3️⃣ Testing simple application creation...');
    
    if (users.length > 0) {
      const testUserId = users[0].id;
      
      const { data: testApp, error: testError } = await supabaseAdmin
        .from('applications')
        .insert({
          user_id: testUserId,
          client_id: testUserId,
          type: 'job_application',
          title: 'Test Application',
          description: 'Test application for debugging',
          status: 'applied', // Using a status we know exists
          priority: 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (testError) {
        console.log('❌ Test application failed:', testError.message);
      } else {
        console.log('✅ Test application created successfully:', testApp.id);
        
        // Clean up test application
        await supabaseAdmin
          .from('applications')
          .delete()
          .eq('id', testApp.id);
        
        console.log('✅ Test application cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkConstraints()
  .then(() => {
    console.log('\n✅ Constraint check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script error:', error);
    process.exit(1);
  });