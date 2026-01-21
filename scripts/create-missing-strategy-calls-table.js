require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function createMissingStrategyCallsTable() {
  console.log('🔧 CREATING MISSING STRATEGY_CALLS TABLE');
  console.log('=======================================\n');

  try {
    // Create strategy_calls table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS strategy_calls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL,
        client_name TEXT NOT NULL,
        client_email TEXT NOT NULL,
        preferred_slots JSONB NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
        admin_status TEXT DEFAULT 'pending' CHECK (admin_status IN ('pending', 'confirmed', 'rejected', 'completed')),
        confirmed_time TIMESTAMPTZ,
        meeting_link TEXT,
        admin_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    console.log('Creating strategy_calls table...');
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: createTableSQL 
    });

    if (createError) {
      console.log('❌ Error creating table:', createError);
      
      // Try alternative method - direct SQL execution
      console.log('Trying alternative method...');
      
      // Use a simple insert to test if we can execute SQL
      const { data, error: testError } = await supabaseAdmin
        .from('strategy_calls')
        .select('*')
        .limit(1);
        
      if (testError && testError.message.includes('does not exist')) {
        console.log('❌ Table definitely does not exist. Manual creation needed.');
        console.log('\nSQL to run manually in Supabase:');
        console.log('================================');
        console.log(createTableSQL);
        console.log('\n-- Add indexes');
        console.log('CREATE INDEX IF NOT EXISTS idx_strategy_calls_client_id ON strategy_calls(client_id);');
        console.log('CREATE INDEX IF NOT EXISTS idx_strategy_calls_admin_status ON strategy_calls(admin_status);');
        console.log('CREATE INDEX IF NOT EXISTS idx_strategy_calls_created_at ON strategy_calls(created_at);');
        
        return;
      } else {
        console.log('✅ Table already exists or was created successfully');
      }
    } else {
      console.log('✅ Table created successfully');
    }

    // Create indexes
    const indexSQL = [
      'CREATE INDEX IF NOT EXISTS idx_strategy_calls_client_id ON strategy_calls(client_id);',
      'CREATE INDEX IF NOT EXISTS idx_strategy_calls_admin_status ON strategy_calls(admin_status);',
      'CREATE INDEX IF NOT EXISTS idx_strategy_calls_created_at ON strategy_calls(created_at);'
    ];

    for (const sql of indexSQL) {
      console.log(`Creating index: ${sql}`);
      const { error: indexError } = await supabaseAdmin.rpc('exec_sql', { sql });
      if (indexError) {
        console.log(`⚠️ Index creation warning: ${indexError.message}`);
      }
    }

    // Test the table
    console.log('\nTesting strategy_calls table...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('strategy_calls')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Table test failed:', testError.message);
    } else {
      console.log('✅ Table test successful');
      console.log(`   Records found: ${testData?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Failed to create strategy_calls table:', error);
    
    console.log('\n🔧 MANUAL SETUP REQUIRED');
    console.log('========================');
    console.log('Please run this SQL manually in your Supabase SQL editor:');
    console.log(`
CREATE TABLE IF NOT EXISTS strategy_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  preferred_slots JSONB NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  admin_status TEXT DEFAULT 'pending' CHECK (admin_status IN ('pending', 'confirmed', 'rejected', 'completed')),
  confirmed_time TIMESTAMPTZ,
  meeting_link TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_strategy_calls_client_id ON strategy_calls(client_id);
CREATE INDEX IF NOT EXISTS idx_strategy_calls_admin_status ON strategy_calls(admin_status);
CREATE INDEX IF NOT EXISTS idx_strategy_calls_created_at ON strategy_calls(created_at);

-- Add RLS policies (optional)
ALTER TABLE strategy_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own strategy calls" ON strategy_calls FOR SELECT USING (client_id::text = auth.uid()::text);
CREATE POLICY "Users can create their own strategy calls" ON strategy_calls FOR INSERT WITH CHECK (client_id::text = auth.uid()::text);
    `);
  }
}

createMissingStrategyCallsTable();