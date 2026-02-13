require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function debugNotificationTable() {
  console.log('🔍 Debugging Notification Table Structure...');

  try {
    // Check if notifications table exists and get its structure
    console.log('\n1. Testing basic table access...');
    
    const { data: testData, error: testError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Error accessing notifications table:', testError);
      return;
    }

    console.log('✅ Notifications table accessible');
    console.log(`   Found ${testData?.length || 0} records`);

    // Check table structure by trying to select specific fields
    console.log('\n2. Testing field access...');
    
    const fieldsToTest = [
      'id',
      'user_id', 
      'type',
      'title',
      'message',
      'is_read',
      'read',
      'created_at',
      'data',
      'category',
      'priority'
    ];

    for (const field of fieldsToTest) {
      try {
        const { data, error } = await supabaseAdmin
          .from('notifications')
          .select(field)
          .limit(1);

        if (error) {
          console.log(`   ❌ Field '${field}': ${error.message}`);
        } else {
          console.log(`   ✅ Field '${field}': accessible`);
        }
      } catch (err) {
        console.log(`   ❌ Field '${field}': ${err.message}`);
      }
    }

    // Test creating a notification
    console.log('\n3. Testing notification creation...');
    
    try {
      const { data: newNotification, error: createError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: 'f25f8ce9-3673-41f1-9235-72488531d5ec', // Admin user ID from logs
          type: 'debug_test',
          title: 'Debug Test',
          message: 'This is a debug test notification',
          is_read: false,
          created_at: new Date().toISOString(),
          data: { test: true }
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Error creating notification:', createError);
      } else {
        console.log('✅ Notification created successfully');
        console.log('   ID:', newNotification.id);
        
        // Clean up - delete the test notification
        await supabaseAdmin
          .from('notifications')
          .delete()
          .eq('id', newNotification.id);
        
        console.log('   🧹 Test notification cleaned up');
      }
    } catch (err) {
      console.log('❌ Notification creation failed:', err.message);
    }

    // Test the admin stats query
    console.log('\n4. Testing admin stats query...');
    
    try {
      const { data: statsData, error: statsError } = await supabaseAdmin
        .from('notifications')
        .select('type, is_read, created_at, data');

      if (statsError) {
        console.log('❌ Admin stats query failed:', statsError);
      } else {
        console.log('✅ Admin stats query successful');
        console.log(`   Found ${statsData?.length || 0} notifications for stats`);
      }
    } catch (err) {
      console.log('❌ Admin stats query error:', err.message);
    }

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the debug
debugNotificationTable();