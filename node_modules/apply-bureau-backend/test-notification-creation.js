require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function testNotificationCreation() {
  console.log('🧪 Testing Notification Creation Directly...');

  try {
    // Get a client to test with
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, full_name, email')
      .limit(1);

    if (clientError || !clients || clients.length === 0) {
      console.log('❌ No clients found for testing');
      return;
    }

    const testClient = clients[0];
    console.log(`   Using client: ${testClient.full_name} (${testClient.id})`);

    // Test creating a notification with the correct schema
    const notificationData = {
      user_id: testClient.id,
      user_type: 'client',
      type: 'direct_test',
      title: 'Direct Test Notification',
      message: 'This is a direct test notification.',
      is_read: false,
      metadata: { 
        test: true,
        category: 'system',
        priority: 'medium'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('   Creating notification with data:');
    console.log(JSON.stringify(notificationData, null, 2));

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      console.log('❌ Error creating notification:', error);
    } else {
      console.log('✅ Notification created successfully:');
      console.log(JSON.stringify(notification, null, 2));
      
      // Clean up
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', notification.id);
      
      console.log('🧹 Test notification cleaned up');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testNotificationCreation();