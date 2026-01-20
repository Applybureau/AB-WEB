-- COMPLETE DATABASE SCHEMA FIX FOR APPLY BUREAU BACKEND
-- This script creates all missing tables and fields required by the backend

-- 1. NOTIFICATIONS TABLE
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
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 2. CONTACT_REQUESTS TABLE
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
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests(created_at);

-- 3. DASHBOARD_ACTIVITIES TABLE
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
CREATE INDEX IF NOT EXISTS idx_dashboard_activities_created_at ON dashboard_activities(created_at);

-- 4. MESSAGES TABLE
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
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 5. FIX APPLICATIONS TABLE - Add missing columns
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Update client_id from user_id if needed
UPDATE applications SET client_id = user_id WHERE client_id IS NULL AND user_id IS NOT NULL;

-- Add indexes for applications
CREATE INDEX IF NOT EXISTS idx_applications_client_id ON applications(client_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);

-- 6. FIX CONSULTATIONS TABLE - Add missing columns
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS prospect_name TEXT,
ADD COLUMN IF NOT EXISTS prospect_email TEXT,
ADD COLUMN IF NOT EXISTS prospect_phone TEXT,
ADD COLUMN IF NOT EXISTS client_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add indexes for consultations
CREATE INDEX IF NOT EXISTS idx_consultations_client_id ON consultations(client_id);
CREATE INDEX IF NOT EXISTS idx_consultations_admin_id ON consultations(admin_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_scheduled_at ON consultations(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_consultations_prospect_email ON consultations(prospect_email);

-- 7. FIX CLIENTS TABLE - Add missing columns
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS assigned_advisor_id UUID,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS current_job_title TEXT,
ADD COLUMN IF NOT EXISTS current_company TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_role ON clients(role);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_advisor_id ON clients(assigned_advisor_id);

-- 8. FIX ADMINS TABLE - Add missing columns if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admins') THEN
    ALTER TABLE admins 
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
    ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    
    -- Add indexes for admins
    CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
    CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);
  END IF;
END $$;

-- 9. CREATE REGISTERED_USERS TABLE (if referenced in code)
CREATE TABLE IF NOT EXISTS registered_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  password TEXT,
  role TEXT DEFAULT 'client',
  status TEXT DEFAULT 'pending',
  onboarding_complete BOOLEAN DEFAULT false,
  onboarding_current_position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registered_users_email ON registered_users(email);
CREATE INDEX IF NOT EXISTS idx_registered_users_status ON registered_users(status);

-- 10. CREATE PROFILES TABLE (if referenced in code)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  bio TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 11. CREATE ADMIN_USERS TABLE (if referenced in code)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- 12. CREATE CLIENT_DASHBOARD_SUMMARY VIEW
CREATE OR REPLACE VIEW client_dashboard_summary AS
SELECT 
  c.id,
  c.full_name,
  c.email,
  c.onboarding_complete,
  c.status,
  COUNT(DISTINCT a.id) as total_applications,
  COUNT(DISTINCT CASE WHEN a.status = 'applied' THEN a.id END) as pending_applications,
  COUNT(DISTINCT CASE WHEN a.status = 'interview' THEN a.id END) as interviews_scheduled,
  COUNT(DISTINCT CASE WHEN a.status = 'offer' THEN a.id END) as offers_received,
  COUNT(DISTINCT cons.id) as total_consultations,
  COUNT(DISTINCT n.id) as unread_notifications
FROM clients c
LEFT JOIN applications a ON c.id = a.client_id
LEFT JOIN consultations cons ON c.id = cons.client_id
LEFT JOIN notifications n ON c.id = n.user_id AND n.is_read = false
GROUP BY c.id, c.full_name, c.email, c.onboarding_complete, c.status;

-- 13. INSERT SAMPLE DASHBOARD ACTIVITIES (for testing)
INSERT INTO dashboard_activities (user_id, activity_type, description, metadata) 
SELECT 
  c.id,
  'login',
  'User logged in',
  '{"ip": "127.0.0.1", "user_agent": "Test"}'
FROM clients c 
WHERE c.role = 'admin'
ON CONFLICT DO NOTHING;

-- 14. INSERT SAMPLE NOTIFICATIONS (for testing)
INSERT INTO notifications (user_id, user_type, title, message, type)
SELECT 
  c.id,
  'admin',
  'Welcome to Apply Bureau',
  'Your admin account has been set up successfully.',
  'info'
FROM clients c 
WHERE c.role = 'admin'
ON CONFLICT DO NOTHING;

-- 15. CREATE RPC FUNCTIONS THAT ARE REFERENCED IN CODE
CREATE OR REPLACE FUNCTION create_client_invitation(
  p_full_name TEXT,
  p_email TEXT,
  p_admin_id UUID
) RETURNS TABLE(client_id UUID, invite_token TEXT, temp_password TEXT) AS $$
DECLARE
  v_client_id UUID;
  v_temp_password TEXT;
  v_invite_token TEXT;
BEGIN
  -- Generate temporary password
  v_temp_password := substr(md5(random()::text), 1, 8);
  
  -- Generate invite token
  v_invite_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert client
  INSERT INTO clients (full_name, email, password, status, assigned_advisor_id)
  VALUES (p_full_name, p_email, crypt(v_temp_password, gen_salt('bf')), 'invited', p_admin_id)
  RETURNING id INTO v_client_id;
  
  RETURN QUERY SELECT v_client_id, v_invite_token, v_temp_password;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION can_complete_onboarding(p_user_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
  -- Simple check - user exists and is active
  RETURN EXISTS(SELECT 1 FROM clients WHERE id = p_user_id AND status = 'active');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION complete_client_onboarding(p_user_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE clients 
  SET onboarding_complete = true, updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 16. ENABLE ROW LEVEL SECURITY (RLS) ON SENSITIVE TABLES
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (can be customized later)
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Anyone can insert contact requests" ON contact_requests
  FOR INSERT WITH CHECK (true);

-- 17. CREATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables that have updated_at columns
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN 
    SELECT t.table_name 
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name
    WHERE c.column_name = 'updated_at' 
    AND t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
      CREATE TRIGGER update_%s_updated_at 
        BEFORE UPDATE ON %s 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', table_name, table_name, table_name, table_name);
  END LOOP;
END $$;

-- 18. GRANT NECESSARY PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 19. REFRESH MATERIALIZED VIEWS (if any exist)
-- This will be skipped if no materialized views exist
DO $$
DECLARE
  view_name TEXT;
BEGIN
  FOR view_name IN 
    SELECT matviewname FROM pg_matviews WHERE schemaname = 'public'
  LOOP
    EXECUTE 'REFRESH MATERIALIZED VIEW ' || view_name;
  END LOOP;
END $$;

-- 20. ANALYZE TABLES FOR BETTER QUERY PERFORMANCE
ANALYZE;

-- COMPLETION MESSAGE
DO $$
BEGIN
  RAISE NOTICE '✅ COMPLETE DATABASE SCHEMA FIX APPLIED SUCCESSFULLY';
  RAISE NOTICE '📊 All missing tables, columns, indexes, and functions have been created';
  RAISE NOTICE '🔒 Row Level Security policies have been applied';
  RAISE NOTICE '⚡ Performance optimizations have been applied';
  RAISE NOTICE '🎉 Backend should now work without database errors';
END $$;