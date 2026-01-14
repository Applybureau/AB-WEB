require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function applySchemaManually() {
  try {
    console.log('🔧 APPLYING NEW FLOW SCHEMA MANUALLY');
    console.log('====================================');
    
    let successCount = 0;
    let errorCount = 0;
    
    // 1. Add missing columns to strategy_calls
    console.log('\n📝 1. Updating strategy_calls table...');
    try {
      // Test if columns exist by trying to select them
      const { data: testData, error: testError } = await supabaseAdmin
        .from('strategy_calls')
        .select('message, admin_notes')
        .limit(1);
      
      if (testError && testError.message.includes('does not exist')) {
        console.log('   Adding missing columns to strategy_calls...');
        // We can't add columns directly via Supabase client, so we'll note this
        console.log('   ⚠️  Please run this SQL in Supabase SQL Editor:');
        console.log('   ALTER TABLE strategy_calls ADD COLUMN IF NOT EXISTS message TEXT;');
        console.log('   ALTER TABLE strategy_calls ADD COLUMN IF NOT EXISTS admin_notes TEXT;');
      } else {
        console.log('   ✅ strategy_calls columns already exist');
        successCount++;
      }
    } catch (err) {
      console.log('   ❌ Error checking strategy_calls:', err.message);
      errorCount++;
    }
    
    // 2. Add columns to registered_users
    console.log('\n📝 2. Checking registered_users table...');
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('registered_users')
        .select('linkedin_profile_url, portfolio_urls')
        .limit(1);
      
      if (testError && testError.message.includes('does not exist')) {
        console.log('   ⚠️  Please run this SQL in Supabase SQL Editor:');
        console.log('   ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS linkedin_profile_url TEXT;');
        console.log('   ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS portfolio_urls JSONB DEFAULT \'[]\';');
      } else {
        console.log('   ✅ registered_users columns already exist');
        successCount++;
      }
    } catch (err) {
      console.log('   ❌ Error checking registered_users:', err.message);
      errorCount++;
    }
    
    // 3. Add columns to applications
    console.log('\n📝 3. Checking applications table...');
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('applications')
        .select('resume_version_used, job_posting_link, application_method')
        .limit(1);
      
      if (testError && testError.message.includes('does not exist')) {
        console.log('   ⚠️  Please run this SQL in Supabase SQL Editor:');
        console.log('   ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_version_used VARCHAR(255);');
        console.log('   ALTER TABLE applications ADD COLUMN IF NOT EXISTS job_posting_link TEXT;');
        console.log('   ALTER TABLE applications ADD COLUMN IF NOT EXISTS application_method VARCHAR(50);');
        console.log('   ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_notification_sent_at TIMESTAMP WITH TIME ZONE;');
      } else {
        console.log('   ✅ applications columns already exist');
        successCount++;
      }
    } catch (err) {
      console.log('   ❌ Error checking applications:', err.message);
      errorCount++;
    }
    
    // 4. Check if application_status_history table exists
    console.log('\n📝 4. Checking application_status_history table...');
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('application_status_history')
        .select('id')
        .limit(1);
      
      if (testError && testError.code === 'PGRST205') {
        console.log('   ⚠️  Please run this SQL in Supabase SQL Editor:');
        console.log(`
CREATE TABLE IF NOT EXISTS application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES registered_users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_application_status_history_changed_at ON application_status_history(changed_at);
        `);
      } else {
        console.log('   ✅ application_status_history table exists');
        successCount++;
      }
    } catch (err) {
      console.log('   ❌ Error checking application_status_history:', err.message);
      errorCount++;
    }
    
    // 5. Check if client_dashboard_settings table exists
    console.log('\n📝 5. Checking client_dashboard_settings table...');
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('client_dashboard_settings')
        .select('id')
        .limit(1);
      
      if (testError && testError.code === 'PGRST205') {
        console.log('   ⚠️  Please run this SQL in Supabase SQL Editor:');
        console.log(`
CREATE TABLE IF NOT EXISTS client_dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES registered_users(id) ON DELETE CASCADE,
    show_strategy_call_reminder BOOLEAN DEFAULT TRUE,
    show_onboarding_reminder BOOLEAN DEFAULT TRUE,
    show_upload_reminders BOOLEAN DEFAULT TRUE,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    dashboard_theme VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id)
);

CREATE INDEX IF NOT EXISTS idx_client_dashboard_settings_client_id ON client_dashboard_settings(client_id);
        `);
      } else {
        console.log('   ✅ client_dashboard_settings table exists');
        successCount++;
      }
    } catch (err) {
      console.log('   ❌ Error checking client_dashboard_settings:', err.message);
      errorCount++;
    }
    
    // 6. Check if notification_preferences table exists
    console.log('\n📝 6. Checking notification_preferences table...');
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('notification_preferences')
        .select('id')
        .limit(1);
      
      if (testError && testError.code === 'PGRST205') {
        console.log('   ⚠️  Please run this SQL in Supabase SQL Editor:');
        console.log(`
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES registered_users(id) ON DELETE CASCADE,
    interview_notifications BOOLEAN DEFAULT TRUE,
    status_update_notifications BOOLEAN DEFAULT TRUE,
    onboarding_notifications BOOLEAN DEFAULT TRUE,
    strategy_call_notifications BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
        `);
      } else {
        console.log('   ✅ notification_preferences table exists');
        successCount++;
      }
    } catch (err) {
      console.log('   ❌ Error checking notification_preferences:', err.message);
      errorCount++;
    }
    
    console.log('\n📊 SCHEMA CHECK SUMMARY');
    console.log('========================');
    console.log(`✅ Tables/columns that exist: ${successCount}`);
    console.log(`⚠️  Items needing manual SQL: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n📋 MANUAL STEPS REQUIRED:');
      console.log('=========================');
      console.log('1. Open Supabase Dashboard');
      console.log('2. Go to SQL Editor');
      console.log('3. Run the SQL statements shown above');
      console.log('4. Run this script again to verify');
      
      console.log('\n📄 Or copy and run this complete SQL script:');
      console.log('==============================================');
      console.log(`
-- Add missing columns to strategy_calls
ALTER TABLE strategy_calls ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE strategy_calls ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE strategy_calls ADD COLUMN IF NOT EXISTS admin_action_by UUID REFERENCES registered_users(id);
ALTER TABLE strategy_calls ADD COLUMN IF NOT EXISTS admin_action_at TIMESTAMP WITH TIME ZONE;

-- Add columns to registered_users
ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS linkedin_profile_url TEXT;
ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS portfolio_urls JSONB DEFAULT '[]';

-- Add columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_profile_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_urls JSONB DEFAULT '[]';

-- Add columns to applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_version_used VARCHAR(255);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS job_posting_link TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS application_method VARCHAR(50);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_notification_sent_at TIMESTAMP WITH TIME ZONE;

-- Create application_status_history table
CREATE TABLE IF NOT EXISTS application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES registered_users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Create client_dashboard_settings table
CREATE TABLE IF NOT EXISTS client_dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES registered_users(id) ON DELETE CASCADE,
    show_strategy_call_reminder BOOLEAN DEFAULT TRUE,
    show_onboarding_reminder BOOLEAN DEFAULT TRUE,
    show_upload_reminders BOOLEAN DEFAULT TRUE,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    dashboard_theme VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id)
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES registered_users(id) ON DELETE CASCADE,
    interview_notifications BOOLEAN DEFAULT TRUE,
    status_update_notifications BOOLEAN DEFAULT TRUE,
    onboarding_notifications BOOLEAN DEFAULT TRUE,
    strategy_call_notifications BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_application_status_history_changed_at ON application_status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_client_dashboard_settings_client_id ON client_dashboard_settings(client_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Insert default preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM registered_users 
WHERE id NOT IN (SELECT user_id FROM notification_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO client_dashboard_settings (client_id)
SELECT id FROM registered_users 
WHERE role = 'client' 
AND id NOT IN (SELECT client_id FROM client_dashboard_settings WHERE client_id IS NOT NULL)
ON CONFLICT (client_id) DO NOTHING;
      `);
    } else {
      console.log('\n🎉 All schema updates are already applied!');
    }
    
    return errorCount === 0;
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
    return false;
  }
}

applySchemaManually().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});