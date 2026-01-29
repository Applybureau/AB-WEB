require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function checkAndFixApplications() {
  try {
    console.log('🔧 Checking applications table...');
    
    // First, let's see what we have in the applications table
    const { data: applications, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .limit(5);
    
    if (appError) {
      console.error('❌ Error accessing applications table:', appError);
      
      if (appError.code === '42P01') {
        console.log('📝 Applications table does not exist. This needs to be created in Supabase dashboard.');
        return;
      }
      return;
    }
    
    console.log(`📊 Found ${applications?.length || 0} applications in the table`);
    
    if (applications && applications.length > 0) {
      console.log('📋 Sample application structure:');
      const sample = applications[0];
      Object.keys(sample).forEach(key => {
        console.log(`  - ${key}: ${typeof sample[key]} (${sample[key] === null ? 'null' : 'has value'})`);
      });
      
      // Check for the user_id vs client_id issue
      const hasUserId = 'user_id' in sample;
      const hasClientId = 'client_id' in sample;
      
      console.log(`\n🔍 Schema Analysis:`);
      console.log(`  - Has user_id column: ${hasUserId}`);
      console.log(`  - Has client_id column: ${hasClientId}`);
      
      if (hasUserId && hasClientId) {
        // Check if data is consistent
        const userIdCount = applications.filter(app => app.user_id !== null).length;
        const clientIdCount = applications.filter(app => app.client_id !== null).length;
        
        console.log(`  - Records with user_id: ${userIdCount}`);
        console.log(`  - Records with client_id: ${clientIdCount}`);
        
        if (userIdCount === 0 && clientIdCount > 0) {
          console.log('⚠️  Need to copy client_id to user_id');
          
          // Update records to copy client_id to user_id
          for (const app of applications) {
            if (app.client_id && !app.user_id) {
              const { error: updateError } = await supabaseAdmin
                .from('applications')
                .update({ user_id: app.client_id })
                .eq('id', app.id);
              
              if (updateError) {
                console.error(`❌ Failed to update application ${app.id}:`, updateError);
              } else {
                console.log(`✅ Updated application ${app.id} with user_id`);
              }
            }
          }
        }
      }
    }
    
    // Test the applications endpoints
    console.log('\n🧪 Testing application endpoints...');
    
    // Test getting applications (this should work for admin)
    const { data: testApps, error: testError } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        user_id,
        client_id,
        type,
        title,
        description,
        status,
        admin_notes,
        created_at
      `)
      .limit(3);
    
    if (testError) {
      console.error('❌ Test query failed:', testError);
    } else {
      console.log(`✅ Test query successful - found ${testApps?.length || 0} applications`);
      if (testApps && testApps.length > 0) {
        testApps.forEach(app => {
          console.log(`  📄 ${app.title || 'Untitled'} (${app.status || 'no status'}) - user_id: ${app.user_id ? 'set' : 'null'}`);
        });
      }
    }
    
    // Test creating a new application
    console.log('\n🆕 Testing application creation...');
    
    // First, get a valid user ID from auth.users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('auth.users')
      .select('id, email')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.log('⚠️  No users found in auth.users table - cannot test creation');
    } else {
      const testUserId = users[0].id;
      console.log(`🧪 Using test user: ${users[0].email} (${testUserId})`);
      
      const testApplication = {
        user_id: testUserId,
        client_id: testUserId, // Keep both for compatibility
        type: 'job_application',
        title: 'Test Company - Test Position',
        description: 'Test application created by schema fix script',
        status: 'applied',
        admin_notes: 'Created by schema fix script for testing'
      };
      
      const { data: newApp, error: createError } = await supabaseAdmin
        .from('applications')
        .insert(testApplication)
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Test application creation failed:', createError);
        
        // Try to understand what's missing
        if (createError.message.includes('null value')) {
          console.log('💡 Likely missing required columns. Current test data:');
          console.log(JSON.stringify(testApplication, null, 2));
        }
      } else {
        console.log('✅ Test application created successfully!');
        console.log(`  📄 ID: ${newApp.id}`);
        console.log(`  📄 Title: ${newApp.title}`);
        console.log(`  📄 Status: ${newApp.status}`);
        
        // Clean up - delete the test application
        await supabaseAdmin
          .from('applications')
          .delete()
          .eq('id', newApp.id);
        console.log('🧹 Test application cleaned up');
      }
    }
    
    console.log('\n🎯 Applications table check completed!');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkAndFixApplications();