require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function fixStrategyCalls() {
  try {
    console.log('🔧 Fixing strategy_calls table schema');
    console.log('=====================================');
    
    // Check current table structure
    console.log('🔍 Checking current strategy_calls table...');
    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.log('❌ Error checking table:', checkError.message);
      console.log('\n⚠️  The strategy_calls table needs to be created.');
      console.log('📋 Please run the following SQL in Supabase SQL Editor:\n');
      console.log(`
-- Create strategy_calls table
CREATE TABLE IF NOT EXISTS strategy_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES registered_users(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    preferred_slots JSONB DEFAULT '[]',
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    admin_status VARCHAR(20) DEFAULT 'pending',
    confirmed_time TIMESTAMP WITH TIME ZONE,
    meeting_link TEXT,
    admin_notes TEXT,
    admin_action_by UUID REFERENCES registered_users(id),
    admin_action_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_strategy_calls_client_id ON strategy_calls(client_id);
CREATE INDEX IF NOT EXISTS idx_strategy_calls_admin_status ON strategy_calls(admin_status);
CREATE INDEX IF NOT EXISTS idx_strategy_calls_created_at ON strategy_calls(created_at);
      `);
      return false;
    }
    
    console.log('✅ strategy_calls table exists');
    
    // Test if we can insert with all required columns
    console.log('🧪 Testing table structure...');
    const testUserId = '688b3986-0398-4c00-8aa9-0f14a411b378';
    
    const { data: testData, error: testError } = await supabaseAdmin
      .from('strategy_calls')
      .insert({
        client_id: testUserId,
        client_name: 'Test Client',
        client_email: 'test@example.com',
        preferred_slots: [{ date: '2024-02-15', time: '14:00' }],
        message: 'Test message',
        status: 'pending',
        admin_status: 'pending'
      })
      .select()
      .single();
    
    if (testError) {
      console.log('❌ Error testing table:', testError.message);
      console.log('\n⚠️  Please apply the full NEW_FLOW_SCHEMA_UPDATES.sql in Supabase SQL Editor');
      return false;
    }
    
    console.log('✅ Table structure is correct');
    
    // Clean up test data
    await supabaseAdmin
      .from('strategy_calls')
      .delete()
      .eq('id', testData.id);
    
    console.log('🧹 Test data cleaned up');
    console.log('✅ strategy_calls table is ready');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

fixStrategyCalls().then(success => {
  process.exit(success ? 0 : 1);
});
