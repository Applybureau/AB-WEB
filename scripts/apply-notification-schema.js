// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('../utils/supabase');

async function applyNotificationSchema() {
  console.log('🔧 Applying Notification Schema Enhancements...');
  console.log('=' .repeat(50));

  try {
    // Check current table structure
    console.log('\n1. Checking current table structure...');
    const { data: currentColumns, error: columnError } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'notifications' })
      .catch(() => null);

    if (columnError) {
      console.log('⚠️ Could not check current columns, proceeding with schema update...');
    } else if (currentColumns) {
      console.log('Current columns:', currentColumns.map(c => c.column_name).join(', '));
    }

    // Apply schema enhancements using raw SQL
    console.log('\n2. Adding new columns...');
    
    const schemaUpdates = [
      // Add new columns if they don't exist
      `ALTER TABLE notifications 
       ADD COLUMN IF NOT EXISTS type TEXT,
       ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'system',
       ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
       ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
       ADD COLUMN IF NOT EXISTS action_url TEXT,
       ADD COLUMN IF NOT EXISTS action_text TEXT;`,
      
      // Add constraints
      `DO $$ 
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_category') THEN
           ALTER TABLE notifications 
           ADD CONSTRAINT check_category 
           CHECK (category IN ('consultation', 'application', 'admin', 'system', 'file', 'meeting'));
         END IF;
       END $$;`,
       
      `DO $$ 
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_priority') THEN
           ALTER TABLE notifications 
           ADD CONSTRAINT check_priority 
           CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
         END IF;
       END $$;`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);`
    ];

    for (let i = 0; i < schemaUpdates.length; i++) {
      const sql = schemaUpdates[i];
      console.log(`   Executing update ${i + 1}/${schemaUpdates.length}...`);
      
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error(`   ❌ Update ${i + 1} failed:`, error.message);
        // Try direct execution for some operations
        try {
          await supabaseAdmin.from('_temp').select('1').limit(0); // This will fail but might refresh schema
        } catch (e) {
          // Ignore
        }
      } else {
        console.log(`   ✅ Update ${i + 1} completed`);
      }
    }

    // Verify the updates
    console.log('\n3. Verifying schema updates...');
    
    // Test inserting a notification with new fields
    const testNotification = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      title: 'Schema Test',
      message: 'Testing new schema fields',
      type: 'schema_test',
      category: 'system',
      priority: 'low',
      metadata: { test: true },
      action_url: '/test',
      action_text: 'Test Action',
      is_read: false
    };

    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(testNotification)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Schema verification failed:', insertError.message);
      
      // Try manual column addition
      console.log('\n4. Attempting manual column addition...');
      const manualUpdates = [
        "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT;",
        "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'system';",
        "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';",
        "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';",
        "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;",
        "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_text TEXT;"
      ];

      for (const update of manualUpdates) {
        try {
          console.log(`   Executing: ${update}`);
          // Since we can't execute raw SQL directly, we'll need to do this in Supabase SQL Editor
          console.log('   ⚠️ Please run this SQL in Supabase SQL Editor manually');
        } catch (e) {
          console.log(`   ❌ Failed: ${e.message}`);
        }
      }
    } else {
      console.log('✅ Schema verification successful!');
      console.log('   New notification created with ID:', insertResult.id);
      
      // Clean up test notification
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', insertResult.id);
      console.log('   Test notification cleaned up');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Schema Enhancement Complete!');
    
    if (insertError) {
      console.log('\n⚠️ MANUAL ACTION REQUIRED:');
      console.log('Please run the following SQL in your Supabase SQL Editor:');
      console.log('\n```sql');
      console.log(`-- Enhance notifications table for comprehensive notification system
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'system',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS action_text TEXT;

-- Add constraints
ALTER TABLE notifications 
ADD CONSTRAINT IF NOT EXISTS check_category 
CHECK (category IN ('consultation', 'application', 'admin', 'system', 'file', 'meeting'));

ALTER TABLE notifications 
ADD CONSTRAINT IF NOT EXISTS check_priority 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);`);
      console.log('```\n');
    }

  } catch (error) {
    console.error('💥 Schema enhancement failed:', error);
    console.log('\n⚠️ MANUAL ACTION REQUIRED:');
    console.log('Please run the SQL from ENHANCE_NOTIFICATIONS_TABLE.sql in your Supabase SQL Editor.');
  }
}

// Run the schema enhancement
if (require.main === module) {
  applyNotificationSchema();
}

module.exports = { applyNotificationSchema };