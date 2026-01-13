// Fix notification system and storage issues
require('dotenv').config();

const { supabaseAdmin } = require('../utils/supabase');

async function fixNotificationAndStorageIssues() {
  console.log('🔧 Fixing Notification System and Storage Issues');
  console.log('=' .repeat(60));

  try {
    // Step 1: Check current notifications table structure
    console.log('\n1. Checking notifications table structure...');
    
    // Try to query the notifications table directly to see what columns exist
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .limit(1);

    let columns = [];
    if (!sampleError && sampleData && sampleData.length > 0) {
      columns = Object.keys(sampleData[0]).map(key => ({ column_name: key }));
    } else if (!sampleError) {
      // Table exists but is empty, try to get structure another way
      const { data: testInsert, error: testError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000001',
          user_type: 'client',
          title: 'Structure Test',
          message: 'Testing table structure',
          is_read: false
        })
        .select()
        .single();

      if (!testError && testInsert) {
        columns = Object.keys(testInsert).map(key => ({ column_name: key }));
        // Clean up test record
        await supabaseAdmin.from('notifications').delete().eq('id', testInsert.id);
      }
    }

    const columnError = sampleError;

    if (columnError) {
      console.error('❌ Error checking table structure:', columnError);
      return;
    }

    console.log('✅ Current notifications table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    // Step 2: Check for missing columns and constraints
    console.log('\n2. Checking for missing columns...');
    
    const requiredColumns = ['type', 'category', 'priority', 'metadata', 'action_url', 'action_text'];
    const existingColumns = columns.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:', missingColumns.join(', '));
      console.log('⚠️  Please run the ENHANCE_NOTIFICATIONS_TABLE.sql script in Supabase SQL Editor');
      return;
    } else {
      console.log('✅ All required columns exist');
    }

    // Step 3: Check constraints
    console.log('\n3. Checking table constraints...');
    
    const { data: constraints, error: constraintError } = await supabaseAdmin
      .rpc('get_table_constraints', { table_name: 'notifications' })
      .catch(() => {
        // If RPC doesn't exist, query directly
        return supabaseAdmin
          .from('information_schema.table_constraints')
          .select('constraint_name, constraint_type')
          .eq('table_name', 'notifications');
      });

    if (!constraintError && constraints) {
      console.log('✅ Table constraints:', constraints.map(c => c.constraint_name).join(', '));
    }

    // Step 4: Test notification creation with proper data
    console.log('\n4. Testing notification creation with valid data...');
    
    // First, let's check if we have any users to test with
    const { data: users, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, role')
      .limit(1);

    let testUserId;
    if (userError || !users || users.length === 0) {
      console.log('⚠️  No users found, creating test notification with UUID format');
      testUserId = '00000000-0000-0000-0000-000000000001';
    } else {
      testUserId = users[0].id;
      console.log(`✅ Using existing user: ${users[0].email}`);
    }

    // Create a test notification with proper enum values
    const testNotification = {
      user_id: testUserId,
      user_type: 'client',
      type: 'test_notification',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system works.',
      category: 'system', // Must match constraint: consultation, application, admin, system, file, meeting
      priority: 'medium', // Must match constraint: low, medium, high, urgent
      metadata: { test: true, timestamp: new Date().toISOString() },
      action_url: '/dashboard',
      action_text: 'View Dashboard',
      is_read: false
    };

    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert(testNotification)
      .select()
      .single();

    if (notificationError) {
      console.error('❌ Failed to create test notification:', notificationError);
      
      // Check if it's a constraint violation
      if (notificationError.code === '23514') {
        console.log('⚠️  Constraint violation detected. Checking constraint values...');
        
        // Try with different values to identify the issue
        const testValues = [
          { category: 'system', priority: 'low' },
          { category: 'consultation', priority: 'medium' },
          { category: 'application', priority: 'high' }
        ];

        for (const testValue of testValues) {
          const testNotif = { ...testNotification, ...testValue };
          const { error: testError } = await supabaseAdmin
            .from('notifications')
            .insert(testNotif)
            .select()
            .single();

          if (!testError) {
            console.log(`✅ Success with category: ${testValue.category}, priority: ${testValue.priority}`);
            break;
          } else {
            console.log(`❌ Failed with category: ${testValue.category}, priority: ${testValue.priority}`);
          }
        }
      }
    } else {
      console.log('✅ Test notification created successfully:', notification.id);
      
      // Clean up test notification
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', notification.id);
      console.log('✅ Test notification cleaned up');
    }

    // Step 5: Test notification helpers
    console.log('\n5. Testing notification helpers...');
    
    try {
      const { NotificationHelpers } = require('../utils/notifications');
      
      // Test with a real user if available, otherwise skip
      if (users && users.length > 0) {
        const testConsultation = {
          id: '00000000-0000-0000-0000-000000000002',
          full_name: 'Test User',
          email: 'test@example.com',
          role_targets: 'Software Engineer',
          current_country: 'United States'
        };

        await NotificationHelpers.consultationSubmitted(users[0].id, testConsultation);
        console.log('✅ Consultation submitted notification helper works');

        // Clean up
        await supabaseAdmin
          .from('notifications')
          .delete()
          .eq('user_id', users[0].id)
          .eq('type', 'consultation_submitted');
      } else {
        console.log('⚠️  Skipping helper test - no users available');
      }
    } catch (error) {
      console.error('❌ Notification helper test failed:', error.message);
    }

    // Step 6: Check storage buckets
    console.log('\n6. Checking storage buckets...');
    
    const { data: buckets, error: bucketError } = await supabaseAdmin
      .storage
      .listBuckets();

    if (bucketError) {
      console.error('❌ Error checking storage buckets:', bucketError);
    } else {
      console.log('✅ Storage buckets:');
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.id} (public: ${bucket.public})`);
      });

      // Check if required buckets exist
      const requiredBuckets = ['consultation-resumes', 'resumes', 'documents'];
      const existingBuckets = buckets.map(b => b.id);
      const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b));

      if (missingBuckets.length > 0) {
        console.log('❌ Missing storage buckets:', missingBuckets.join(', '));
        console.log('⚠️  Please run the COMPLETE_STORAGE_FIX.sql script in Supabase SQL Editor');
      } else {
        console.log('✅ All required storage buckets exist');
      }
    }

    // Step 7: Test storage policies
    console.log('\n7. Testing storage access...');
    
    try {
      // Try to list objects in consultation-resumes bucket
      const { data: objects, error: objectError } = await supabaseAdmin
        .storage
        .from('consultation-resumes')
        .list();

      if (objectError) {
        console.error('❌ Storage access error:', objectError);
      } else {
        console.log(`✅ Can access consultation-resumes bucket (${objects.length} files)`);
      }
    } catch (error) {
      console.error('❌ Storage test failed:', error.message);
    }

    // Step 8: Provide summary and next steps
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Diagnostic Complete!');
    console.log('\n📋 SUMMARY:');
    
    if (missingColumns.length === 0) {
      console.log('✅ Notification system schema is properly applied');
    } else {
      console.log('❌ Notification system schema needs to be applied');
    }

    console.log('\n🚀 NEXT STEPS:');
    console.log('1. If schema issues remain, run ENHANCE_NOTIFICATIONS_TABLE.sql in Supabase');
    console.log('2. If storage issues remain, run COMPLETE_STORAGE_FIX.sql in Supabase');
    console.log('3. Test the full system with: node scripts/test-notification-system.js');
    console.log('4. Test PDF storage with: node scripts/test-pdf-storage.js');

  } catch (error) {
    console.error('💥 Diagnostic failed:', error);
  }
}

// Run the diagnostic
if (require.main === module) {
  fixNotificationAndStorageIssues();
}

module.exports = { fixNotificationAndStorageIssues };