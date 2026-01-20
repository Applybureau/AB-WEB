-- IMMEDIATE DATABASE FIX - Run this SQL in Supabase SQL Editor
-- Copy and paste each section one by one and click "Run"

-- 1. FIX NOTIFICATIONS TABLE - Add missing columns
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'client',
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 2. FIX APPLICATIONS TABLE - Add missing columns
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create indexes for applications
CREATE INDEX IF NOT EXISTS idx_applications_client_id ON applications(client_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Update client_id from user_id if needed
UPDATE applications SET client_id = user_id WHERE client_id IS NULL AND user_id IS NOT NULL;

-- 3. FIX CONSULTATIONS TABLE - Add missing columns
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS prospect_name TEXT,
ADD COLUMN IF NOT EXISTS prospect_email TEXT,
ADD COLUMN IF NOT EXISTS prospect_phone TEXT,
ADD COLUMN IF NOT EXISTS client_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create indexes for consultations
CREATE INDEX IF NOT EXISTS idx_consultations_client_id ON consultations(client_id);
CREATE INDEX IF NOT EXISTS idx_consultations_admin_id ON consultations(admin_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_scheduled_at ON consultations(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_consultations_prospect_email ON consultations(prospect_email);

-- 4. FIX CLIENTS TABLE - Add missing columns
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS assigned_advisor_id UUID,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS current_job_title TEXT,
ADD COLUMN IF NOT EXISTS current_company TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_role ON clients(role);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_advisor_id ON clients(assigned_advisor_id);

-- 5. FIX ADMINS TABLE - Add missing columns if table exists
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create indexes for admins
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

-- 6. FIX CONTACT_REQUESTS TABLE - Add missing columns
ALTER TABLE contact_requests 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Create indexes for contact_requests
CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON contact_requests(email);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests(created_at);

-- 7. FIX MESSAGES TABLE - Add missing columns
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'client',
ADD COLUMN IF NOT EXISTS recipient_type TEXT DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 8. FIX DASHBOARD_ACTIVITIES TABLE - Add missing columns
ALTER TABLE dashboard_activities 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes for dashboard_activities
CREATE INDEX IF NOT EXISTS idx_dashboard_activities_user_id ON dashboard_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_activities_type ON dashboard_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_activities_created_at ON dashboard_activities(created_at);

-- 9. CREATE MISSING FUNCTIONS THAT ARE REFERENCED IN CODE
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

-- 10. CREATE CLIENT_DASHBOARD_SUMMARY VIEW
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

-- 11. INSERT SAMPLE DATA FOR TESTING
INSERT INTO notifications (user_id, user_type, title, message, type, is_read)
SELECT 
  c.id,
  CASE WHEN c.role = 'admin' THEN 'admin' ELSE 'client' END,
  'Welcome to Apply Bureau',
  'Your account has been set up successfully.',
  'info',
  false
FROM clients c 
ON CONFLICT DO NOTHING;

INSERT INTO dashboard_activities (user_id, activity_type, description, metadata)
SELECT 
  c.id,
  'login',
  'User logged in',
  '{"ip": "127.0.0.1", "user_agent": "Backend Test"}'::jsonb
FROM clients c 
WHERE c.role = 'admin'
ON CONFLICT DO NOTHING;

-- 12. GRANT PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 13. ANALYZE TABLES FOR PERFORMANCE
ANALYZE;