require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function createMissingTables() {
  console.log('🔧 CREATING MISSING TABLES DIRECTLY');
  console.log('===================================');

  try {
    // 1. Check and create notifications table
    console.log('\n1. Checking notifications table...');
    try {
      const { error: notificationsError } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (notificationsError && notificationsError.code === 'PGRST116') {
        console.log('   ❌ Notifications table missing');
        console.log('   📝 Please run this SQL in Supabase SQL Editor:');
        console.log(`
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT DEFAULT 'client',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
        `);
      } else {
        console.log('   ✅ Notifications table exists');
      }
    } catch (err) {
      console.log('   ❌ Error checking notifications table:', err.message);
    }

    // 2. Check and create contact_requests table
    console.log('\n2. Checking contact_requests table...');
    try {
      const { error: contactError } = await supabaseAdmin
        .from('contact_requests')
        .select('id')
        .limit(1);
      
      if (contactError && contactError.code === 'PGRST116') {
        console.log('   ❌ Contact_requests table missing');
        console.log('   📝 Please run this SQL in Supabase SQL Editor:');
        console.log(`
CREATE TABLE contact_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_requests_email ON contact_requests(email);
CREATE INDEX idx_contact_requests_status ON contact_requests(status);
        `);
      } else {
        console.log('   ✅ Contact_requests table exists');
      }
    } catch (err) {
      console.log('   ❌ Error checking contact_requests table:', err.message);
    }

    // 3. Check and create dashboard_activities table
    console.log('\n3. Checking dashboard_activities table...');
    try {
      const { error: activitiesError } = await supabaseAdmin
        .from('dashboard_activities')
        .select('id')
        .limit(1);
      
      if (activitiesError && activitiesError.code === 'PGRST116') {
        console.log('   ❌ Dashboard_activities table missing');
        console.log('   📝 Please run this SQL in Supabase SQL Editor:');
        console.log(`
CREATE TABLE dashboard_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dashboard_activities_user_id ON dashboard_activities(user_id);
CREATE INDEX idx_dashboard_activities_type ON dashboard_activities(activity_type);
        `);
      } else {
        console.log('   ✅ Dashboard_activities table exists');
      }
    } catch (err) {
      console.log('   ❌ Error checking dashboard_activities table:', err.message);
    }

    // 4. Check and create messages table
    console.log('\n4. Checking messages table...');
    try {
      const { error: messagesError } = await supabaseAdmin
        .from('messages')
        .select('id')
        .limit(1);
      
      if (messagesError && messagesError.code === 'PGRST116') {
        console.log('   ❌ Messages table missing');
        console.log('   📝 Please run this SQL in Supabase SQL Editor:');
        console.log(`
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  sender_type TEXT DEFAULT 'client',
  recipient_type TEXT DEFAULT 'admin',
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);
        `);
      } else {
        console.log('   ✅ Messages table exists');
      }
    } catch (err) {
      console.log('   ❌ Error checking messages table:', err.message);
    }

    // 5. Check applications table structure
    console.log('\n5. Checking applications table structure...');
    try {
      const { data: apps, error: appsError } = await supabaseAdmin
        .from('applications')
        .select('client_id, user_id')
        .limit(1);
      
      if (appsError) {
        console.log('   ❌ Applications table missing columns');
        console.log('   📝 Please run this SQL in Supabase SQL Editor:');
        console.log(`
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE INDEX IF NOT EXISTS idx_applications_client_id ON applications(client_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);

-- Update client_id from user_id if needed
UPDATE applications SET client_id = user_id WHERE client_id IS NULL AND user_id IS NOT NULL;
        `);
      } else {
        console.log('   ✅ Applications table structure OK');
      }
    } catch (err) {
      console.log('   ❌ Error checking applications table:', err.message);
    }

    // 6. Check consultations table structure
    console.log('\n6. Checking consultations table structure...');
    try {
      const { data: consults, error: consultsError } = await supabaseAdmin
        .from('consultations')
        .select('prospect_name, prospect_email, prospect_phone')
        .limit(1);
      
      if (consultsError) {
        console.log('   ❌ Consultations table missing columns');
        console.log('   📝 Please run this SQL in Supabase SQL Editor:');
        console.log(`
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS prospect_name TEXT,
ADD COLUMN IF NOT EXISTS prospect_email TEXT,
ADD COLUMN IF NOT EXISTS prospect_phone TEXT,
ADD COLUMN IF NOT EXISTS client_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_consultations_prospect_email ON consultations(prospect_email);
        `);
      } else {
        console.log('   ✅ Consultations table structure OK');
      }
    } catch (err) {
      console.log('   ❌ Error checking consultations table:', err.message);
    }

    // 7. Check clients table structure
    console.log('\n7. Checking clients table structure...');
    try {
      const { data: clients, error: clientsError } = await supabaseAdmin
        .from('clients')
        .select('assigned_advisor_id, last_login_at, profile_picture_url, onboarding_complete, status')
        .limit(1);
      
      if (clientsError) {
        console.log('   ❌ Clients table missing columns');
        console.log('   📝 Please run this SQL in Supabase SQL Editor:');
        console.log(`
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS assigned_advisor_id UUID,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS current_job_title TEXT,
ADD COLUMN IF NOT EXISTS current_company TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_role ON clients(role);
        `);
      } else {
        console.log('   ✅ Clients table structure OK');
      }
    } catch (err) {
      console.log('   ❌ Error checking clients table:', err.message);
    }

    console.log('\n🎯 TABLE CHECK COMPLETE');
    console.log('========================');
    console.log('📝 If any SQL was shown above, please run it in your Supabase SQL Editor');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/uhivvmpljffhbodrklip/sql');
    console.log('📋 Copy and paste the SQL statements shown above');
    console.log('▶️  Click "Run" to execute each statement');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to check database structure:', error);
    return false;
  }
}

// Also create a simple test to verify what tables exist
async function testDatabaseTables() {
  console.log('\n🧪 TESTING DATABASE TABLE ACCESS');
  console.log('=================================');

  const tables = [
    'clients',
    'admins', 
    'applications',
    'consultations',
    'notifications',
    'contact_requests',
    'dashboard_activities',
    'messages'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: OK (${data?.length || 0} records)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

// Run the checks
if (require.main === module) {
  createMissingTables()
    .then(() => testDatabaseTables())
    .then(() => {
      console.log('\n✅ Database structure check complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createMissingTables, testDatabaseTables };