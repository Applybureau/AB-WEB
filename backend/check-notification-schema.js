require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');

async function checkNotificationSchema() {
  console.log('🔍 Checking Actual Notification Table Schema...');

  try {
    // Get a sample record to see the actual structure
    const { data: sampleRecord, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.log('❌ Error getting sample record:', error);
      return;
    }

    if (sampleRecord) {
      console.log('✅ Sample notification record:');
      console.log(JSON.stringify(sampleRecord, null, 2));
      
      console.log('\n📋 Available fields:');
      Object.keys(sampleRecord).forEach(field => {
        console.log(`   - ${field}: ${typeof sampleRecord[field]}`);
      });
    } else {
      console.log('⚠️  No notifications found in table');
      
      // Try to create a minimal notification to see what fields are required
      console.log('\n🧪 Testing minimal notification creation...');
      
      const { data: testRecord, error: createError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: 'f25f8ce9-3673-41f1-9235-72488531d5ec',
          type: 'test',
          title: 'Test',
          message: 'Test message',
          is_read: false
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Error creating test notification:', createError);
      } else {
        console.log('✅ Test notification created:');
        console.log(JSON.stringify(testRecord, null, 2));
        
        // Clean up
        await supabaseAdmin
          .from('notifications')
          .delete()
          .eq('id', testRecord.id);
        
        console.log('🧹 Test notification cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ Schema check error:', error);
  }
}

// Run the check
checkNotificationSchema();