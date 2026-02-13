require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function testNotificationTypes() {
  console.log('🔍 Testing Allowed Notification Types...');

  // Get existing notifications to see what types are used
  const { data: existingNotifications, error } = await supabaseAdmin
    .from('notifications')
    .select('type')
    .limit(10);

  if (error) {
    console.log('❌ Error fetching existing notifications:', error);
    return;
  }

  console.log('✅ Existing notification types:');
  const uniqueTypes = [...new Set(existingNotifications.map(n => n.type))];
  uniqueTypes.forEach(type => {
    console.log(`   - ${type}`);
  });

  // Test common notification types
  const typesToTest = [
    'info',
    'success', 
    'warning',
    'error',
    'system',
    'application',
    'consultation',
    'payment',
    'test',
    'admin_test',
    'system_test'
  ];

  console.log('\n🧪 Testing notification type constraints...');

  for (const type of typesToTest) {
    try {
      const { data: testNotification, error: testError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: '0f2fdf6c-723f-41ae-8769-c1956f24fca4',
          user_type: 'client',
          type: type,
          title: `Test ${type}`,
          message: `Testing ${type} notification type`,
          is_read: false,
          metadata: { test: true },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (testError) {
        console.log(`   ❌ Type '${type}': ${testError.message}`);
      } else {
        console.log(`   ✅ Type '${type}': Allowed`);
        
        // Clean up
        await supabaseAdmin
          .from('notifications')
          .delete()
          .eq('id', testNotification.id);
      }
    } catch (err) {
      console.log(`   ❌ Type '${type}': ${err.message}`);
    }
  }
}

// Run the test
testNotificationTypes();