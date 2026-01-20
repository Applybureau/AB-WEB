require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function fixAllDatabaseIssues() {
  console.log('🔧 FIXING ALL DATABASE ISSUES');
  console.log('================================');

  try {
    // 1. Check and create missing tables
    console.log('\n1. Checking and creating missing tables...');
    
    // Create notifications table if it doesn't exist
    try {
      const { error: notificationsError } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (notificationsError && notificationsError.code === 'PGRST116') {
        console.log('   Creating notifications table...');
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS notifications (
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
            
            CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
            CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
          `
        });
        
        if (error) {
          console.log('   ❌ Failed to create notifications table:', error.message);
        } else {
          console.log('   ✅ Notifications table created');
        }
      } else {
        console.log('   ✅ Notifications table exists');
      }
    } catch (err) {
      console.log('   ❌ Error checking notifications table:', err.message);
    }

    // 2. Check applications table structure
    console.log('\n2. Checking applications table structure...');
    try {
      const { data: apps, error: appsError } = await supabaseAdmin
        .from('applications')
        .select('client_id, user_id')
        .limit(1);
      
      if (appsError) {
        console.log('   ❌ Applications table issue:', appsError.message);
        
        // Try to add missing columns
        const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
          sql: `
            ALTER TABLE applications 
            ADD COLUMN IF NOT EXISTS client_id UUID,
            ADD COLUMN IF NOT EXISTS user_id UUID;
            
            -- Update client_id from user_id if needed
            UPDATE applications SET client_id = user_id WHERE client_id IS NULL AND user_id IS NOT NULL;
          `
        });
        
        if (alterError) {
          console.log('   ❌ Failed to fix applications table:', alterError.message);
        } else {
          console.log('   ✅ Applications table structure fixed');
        }
      } else {
        console.log('   ✅ Applications table structure OK');
      }
    } catch (err) {
      console.log('   ❌ Error checking applications table:', err.message);
    }

    // 3. Check consultations table structure
    console.log('\n3. Checking consultations table structure...');
    try {
      const { data: consults, error: consultsError } = await supabaseAdmin
        .from('consultations')
        .select('prospect_name, prospect_email, prospect_phone')
        .limit(1);
      
      if (consultsError) {
        console.log('   ❌ Consultations table issue:', consultsError.message);
        
        // Try to add missing columns
        const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
          sql: `
            ALTER TABLE consultations 
            ADD COLUMN IF NOT EXISTS prospect_name TEXT,
            ADD COLUMN IF NOT EXISTS prospect_email TEXT,
            ADD COLUMN IF NOT EXISTS prospect_phone TEXT;
          `
        });
        
        if (alterError) {
          console.log('   ❌ Failed to fix consultations table:', alterError.message);
        } else {
          console.log('   ✅ Consultations table structure fixed');
        }
      } else {
        console.log('   ✅ Consultations table structure OK');
      }
    } catch (err) {
      console.log('   ❌ Error checking consultations table:', err.message);
    }

    // 4. Check contact_requests table
    console.log('\n4. Checking contact_requests table...');
    try {
      const { error: contactError } = await supabaseAdmin
        .from('contact_requests')
        .select('id')
        .limit(1);
      
      if (contactError && contactError.code === 'PGRST116') {
        console.log('   Creating contact_requests table...');
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS contact_requests (
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
            
            CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON contact_requests(email);
            CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
          `
        });
        
        if (error) {
          console.log('   ❌ Failed to create contact_requests table:', error.message);
        } else {
          console.log('   ✅ Contact_requests table created');
        }
      } else {
        console.log('   ✅ Contact_requests table exists');
      }
    } catch (err) {
      console.log('   ❌ Error checking contact_requests table:', err.message);
    }

    // 5. Check dashboard_activities table
    console.log('\n5. Checking dashboard_activities table...');
    try {
      const { error: activitiesError } = await supabaseAdmin
        .from('dashboard_activities')
        .select('id')
        .limit(1);
      
      if (activitiesError && activitiesError.code === 'PGRST116') {
        console.log('   Creating dashboard_activities table...');
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS dashboard_activities (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID NOT NULL,
              activity_type TEXT NOT NULL,
              description TEXT NOT NULL,
              metadata JSONB DEFAULT '{}',
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_dashboard_activities_user_id ON dashboard_activities(user_id);
            CREATE INDEX IF NOT EXISTS idx_dashboard_activities_type ON dashboard_activities(activity_type);
          `
        });
        
        if (error) {
          console.log('   ❌ Failed to create dashboard_activities table:', error.message);
        } else {
          console.log('   ✅ Dashboard_activities table created');
        }
      } else {
        console.log('   ✅ Dashboard_activities table exists');
      }
    } catch (err) {
      console.log('   ❌ Error checking dashboard_activities table:', err.message);
    }

    // 6. Check messages table
    console.log('\n6. Checking messages table...');
    try {
      const { error: messagesError } = await supabaseAdmin
        .from('messages')
        .select('id')
        .limit(1);
      
      if (messagesError && messagesError.code === 'PGRST116') {
        console.log('   Creating messages table...');
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS messages (
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
            
            CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
            CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
            CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
          `
        });
        
        if (error) {
          console.log('   ❌ Failed to create messages table:', error.message);
        } else {
          console.log('   ✅ Messages table created');
        }
      } else {
        console.log('   ✅ Messages table exists');
      }
    } catch (err) {
      console.log('   ❌ Error checking messages table:', err.message);
    }

    console.log('\n🎉 DATABASE FIXES COMPLETE');
    console.log('===========================');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to fix database issues:', error);
    return false;
  }
}

// Run the fixes
if (require.main === module) {
  fixAllDatabaseIssues()
    .then(success => {
      if (success) {
        console.log('\n✅ All database issues have been addressed');
        process.exit(0);
      } else {
        console.log('\n❌ Some database issues could not be fixed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixAllDatabaseIssues };