-- =====================================================
-- COMPLETE FRESH DATABASE REBUILD FOR APPLY BUREAU
-- =====================================================
-- ⚠️  WARNING: This will DROP ALL existing data!
-- Run this in Supabase SQL Editor to completely rebuild the database

-- =====================================================
-- STEP 1: DROP ALL EXISTING TABLES AND POLICIES
-- =====================================================

-- Drop all views first
DROP VIEW IF EXISTS client_dashboard_summary CASCADE;

-- Drop all tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS dashboard_activities CASCADE;
DROP TABLE IF EXISTS contact_requests CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS registered_users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS create_client_invitation(TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS can_complete_onboarding(UUID) CASCADE;
DROP FUNCTION IF EXISTS complete_client_onboarding(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Clean up storage objects first, then buckets
DELETE FROM storage.objects WHERE bucket_id IN ('resumes', 'profile-pictures', 'documents', 'uploads');
DELETE FROM storage.buckets WHERE id IN ('resumes', 'profile-pictures', 'documents', 'uploads');

-- =====================================================
-- STEP 2: CREATE CORE TABLES
-- =====================================================

-- ADMINS TABLE - Core admin users
CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  phone TEXT,
  profile_picture_url TEXT,
  permissions JSONB DEFAULT '{
    "can_create_admins": true,
    "can_delete_admins": true,
    "can_manage_clients": true,
    "can_schedule_consultations": true,
    "can_view_reports": true,
    "can_manage_system": true
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENTS TABLE - Client users
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'client',
  phone TEXT,
  profile_picture_url TEXT,
  current_job_title TEXT,
  current_company TEXT,
  resume_url TEXT,
  assigned_advisor_id UUID REFERENCES admins(id),
  onboarding_complete BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPLICATIONS TABLE - Job applications
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- Duplicate for compatibility
  type TEXT DEFAULT 'job_application',
  title TEXT NOT NULL,
  description TEXT,
  company TEXT,
  job_title TEXT,
  job_url TEXT,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'interview', 'offer', 'rejected', 'withdrawn')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  requirements TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  estimated_duration TEXT,
  estimated_cost DECIMAL,
  actual_duration TEXT,
  actual_cost DECIMAL,
  admin_notes TEXT,
  rejection_reason TEXT,
  internal_notes TEXT,
  tags TEXT[],
  deadline DATE,
  approved_by UUID REFERENCES admins(id),
  assigned_to UUID REFERENCES admins(id),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  date_applied DATE DEFAULT CURRENT_DATE,
  interview_scheduled_at TIMESTAMPTZ,
  interview_type TEXT,
  interview_notes TEXT,
  offer_salary DECIMAL,
  offer_benefits TEXT,
  offer_deadline DATE,
  status_update_reason TEXT,
  application_strategy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONSULTATIONS TABLE - Consultation bookings
CREATE TABLE consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  consultation_type TEXT DEFAULT 'initial' CHECK (consultation_type IN ('initial', 'follow_up', 'strategy', 'review')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT,
  meeting_notes TEXT,
  client_reason TEXT,
  admin_notes TEXT,
  prospect_name TEXT, -- For non-registered prospects
  prospect_email TEXT, -- For non-registered prospects
  prospect_phone TEXT, -- For non-registered prospects
  package_interest TEXT,
  current_situation TEXT,
  timeline TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS TABLE - System notifications
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT DEFAULT 'client' CHECK (user_type IN ('client', 'admin')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGES TABLE - Internal messaging system
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  sender_type TEXT DEFAULT 'client' CHECK (sender_type IN ('client', 'admin')),
  recipient_type TEXT DEFAULT 'admin' CHECK (recipient_type IN ('client', 'admin')),
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  thread_id UUID,
  reply_to UUID REFERENCES messages(id),
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTACT_REQUESTS TABLE - Contact form submissions
CREATE TABLE contact_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT,
  subject TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'closed')),
  assigned_to UUID REFERENCES admins(id),
  response_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DASHBOARD_ACTIVITIES TABLE - Activity tracking
CREATE TABLE dashboard_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT DEFAULT 'client' CHECK (user_type IN ('client', 'admin')),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT, -- 'application', 'consultation', 'message', etc.
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REGISTERED_USERS TABLE - Registration tracking
CREATE TABLE registered_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  password TEXT,
  role TEXT DEFAULT 'client',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'deleted')),
  onboarding_complete BOOLEAN DEFAULT false,
  onboarding_current_position TEXT,
  registration_token TEXT,
  registration_expires_at TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES TABLE - Extended user profiles
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  user_type TEXT DEFAULT 'client' CHECK (user_type IN ('client', 'admin')),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  bio TEXT,
  profile_picture_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  skills TEXT[],
  experience_years INTEGER,
  education JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Admins indexes
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_is_active ON admins(is_active);
CREATE INDEX idx_admins_role ON admins(role);

-- Clients indexes
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_role ON clients(role);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_assigned_advisor_id ON clients(assigned_advisor_id);
CREATE INDEX idx_clients_onboarding_complete ON clients(onboarding_complete);

-- Applications indexes
CREATE INDEX idx_applications_client_id ON applications(client_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_priority ON applications(priority);
CREATE INDEX idx_applications_created_at ON applications(created_at);
CREATE INDEX idx_applications_date_applied ON applications(date_applied);
CREATE INDEX idx_applications_assigned_to ON applications(assigned_to);

-- Consultations indexes
CREATE INDEX idx_consultations_client_id ON consultations(client_id);
CREATE INDEX idx_consultations_admin_id ON consultations(admin_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_scheduled_at ON consultations(scheduled_at);
CREATE INDEX idx_consultations_prospect_email ON consultations(prospect_email);
CREATE INDEX idx_consultations_created_at ON consultations(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_type ON notifications(user_type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Messages indexes
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Contact requests indexes
CREATE INDEX idx_contact_requests_email ON contact_requests(email);
CREATE INDEX idx_contact_requests_status ON contact_requests(status);
CREATE INDEX idx_contact_requests_assigned_to ON contact_requests(assigned_to);
CREATE INDEX idx_contact_requests_created_at ON contact_requests(created_at);

-- Dashboard activities indexes
CREATE INDEX idx_dashboard_activities_user_id ON dashboard_activities(user_id);
CREATE INDEX idx_dashboard_activities_user_type ON dashboard_activities(user_type);
CREATE INDEX idx_dashboard_activities_activity_type ON dashboard_activities(activity_type);
CREATE INDEX idx_dashboard_activities_entity_type ON dashboard_activities(entity_type);
CREATE INDEX idx_dashboard_activities_entity_id ON dashboard_activities(entity_id);
CREATE INDEX idx_dashboard_activities_created_at ON dashboard_activities(created_at);

-- Registered users indexes
CREATE INDEX idx_registered_users_email ON registered_users(email);
CREATE INDEX idx_registered_users_status ON registered_users(status);
CREATE INDEX idx_registered_users_registration_token ON registered_users(registration_token);

-- Profiles indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_email ON profiles(email);

-- =====================================================
-- STEP 4: CREATE STORAGE BUCKETS
-- =====================================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
('resumes', 'resumes', false, 10485760, ARRAY['application/pdf']::text[]),
('profile-pictures', 'profile-pictures', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]),
('uploads', 'uploads', false, 104857600, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- STEP 5: CREATE RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Admins policies
CREATE POLICY "Admins can view all admin records" ON admins FOR SELECT USING (true);
CREATE POLICY "Admins can update their own record" ON admins FOR UPDATE USING (auth.uid() = id);

-- Clients policies
CREATE POLICY "Clients can view their own record" ON clients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Clients can update their own record" ON clients FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all clients" ON clients FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = true)
);

-- Applications policies
CREATE POLICY "Clients can view their own applications" ON applications FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Clients can create their own applications" ON applications FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "Clients can update their own applications" ON applications FOR UPDATE USING (client_id = auth.uid());
CREATE POLICY "Admins can view all applications" ON applications FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = true)
);

-- Consultations policies
CREATE POLICY "Clients can view their own consultations" ON consultations FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Admins can view all consultations" ON consultations FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = true)
);
CREATE POLICY "Anyone can create consultation requests" ON consultations FOR INSERT WITH CHECK (true);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages FOR SELECT USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);

-- Contact requests policies
CREATE POLICY "Anyone can create contact requests" ON contact_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all contact requests" ON contact_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = true)
);

-- Dashboard activities policies
CREATE POLICY "Users can view their own activities" ON dashboard_activities FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can create activities" ON dashboard_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all activities" ON dashboard_activities FOR SELECT USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = true)
);

-- Registered users policies
CREATE POLICY "Users can view their own registration" ON registered_users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "System can manage registrations" ON registered_users FOR ALL WITH CHECK (true);

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can create their own profile" ON profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- Storage policies
CREATE POLICY "Users can upload their own files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id IN ('resumes', 'profile-pictures', 'documents', 'uploads') AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files" ON storage.objects FOR SELECT USING (
  bucket_id IN ('resumes', 'profile-pictures', 'documents', 'uploads') AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files" ON storage.objects FOR UPDATE USING (
  bucket_id IN ('resumes', 'profile-pictures', 'documents', 'uploads') AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files" ON storage.objects FOR DELETE USING (
  bucket_id IN ('resumes', 'profile-pictures', 'documents', 'uploads') AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Public access for profile pictures
CREATE POLICY "Profile pictures are publicly viewable" ON storage.objects FOR SELECT USING (
  bucket_id = 'profile-pictures'
);

-- =====================================================
-- STEP 6: CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_requests_updated_at BEFORE UPDATE ON contact_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_registered_users_updated_at BEFORE UPDATE ON registered_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create client invitation
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can complete onboarding
CREATE OR REPLACE FUNCTION can_complete_onboarding(p_user_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM clients WHERE id = p_user_id AND status IN ('active', 'invited'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete client onboarding
CREATE OR REPLACE FUNCTION complete_client_onboarding(p_user_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE clients 
  SET onboarding_complete = true, status = 'active', updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 7: CREATE VIEWS
-- =====================================================

-- Client dashboard summary view
CREATE OR REPLACE VIEW client_dashboard_summary AS
SELECT 
  c.id,
  c.full_name,
  c.email,
  c.onboarding_complete,
  c.status,
  c.assigned_advisor_id,
  COUNT(DISTINCT a.id) as total_applications,
  COUNT(DISTINCT CASE WHEN a.status = 'applied' THEN a.id END) as pending_applications,
  COUNT(DISTINCT CASE WHEN a.status = 'interview' THEN a.id END) as interviews_scheduled,
  COUNT(DISTINCT CASE WHEN a.status = 'offer' THEN a.id END) as offers_received,
  COUNT(DISTINCT cons.id) as total_consultations,
  COUNT(DISTINCT CASE WHEN cons.status = 'scheduled' THEN cons.id END) as upcoming_consultations,
  COUNT(DISTINCT n.id) as unread_notifications,
  c.created_at,
  c.updated_at
FROM clients c
LEFT JOIN applications a ON c.id = a.client_id
LEFT JOIN consultations cons ON c.id = cons.client_id
LEFT JOIN notifications n ON c.id = n.user_id AND n.is_read = false
GROUP BY c.id, c.full_name, c.email, c.onboarding_complete, c.status, c.assigned_advisor_id, c.created_at, c.updated_at;

-- =====================================================
-- STEP 8: INSERT INITIAL DATA
-- =====================================================

-- Create default admin user
INSERT INTO admins (email, full_name, password, role, is_active) VALUES
('admin@applybureau.com', 'Apply Bureau Admin', crypt('admin123', gen_salt('bf')), 'admin', true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password = EXCLUDED.password,
  is_active = EXCLUDED.is_active;

-- Create sample notifications for testing
INSERT INTO notifications (user_id, user_type, title, message, type, is_read) 
SELECT 
  a.id,
  'admin',
  'Welcome to Apply Bureau Admin',
  'Your admin account has been set up successfully. You can now manage clients and consultations.',
  'info',
  false
FROM admins a 
WHERE a.email = 'admin@applybureau.com'
ON CONFLICT DO NOTHING;

-- Create sample dashboard activities
INSERT INTO dashboard_activities (user_id, user_type, activity_type, description, metadata)
SELECT 
  a.id,
  'admin',
  'system_setup',
  'Database schema initialized',
  '{"version": "1.0", "timestamp": "' || NOW() || '"}'::jsonb
FROM admins a 
WHERE a.email = 'admin@applybureau.com'
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 9: GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to service roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant storage permissions
GRANT ALL ON storage.objects TO postgres, anon, authenticated, service_role;
GRANT ALL ON storage.buckets TO postgres, anon, authenticated, service_role;

-- =====================================================
-- STEP 10: OPTIMIZE AND ANALYZE
-- =====================================================

-- Update table statistics for query optimization
ANALYZE;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 COMPLETE FRESH DATABASE REBUILD SUCCESSFUL!';
  RAISE NOTICE '===============================================';
  RAISE NOTICE '✅ All tables created with proper structure';
  RAISE NOTICE '✅ All indexes created for optimal performance';
  RAISE NOTICE '✅ All RLS policies applied for security';
  RAISE NOTICE '✅ All storage buckets configured';
  RAISE NOTICE '✅ All functions and triggers created';
  RAISE NOTICE '✅ Default admin user created (admin@applybureau.com / admin123)';
  RAISE NOTICE '✅ Sample data inserted for testing';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your Apply Bureau backend is now ready!';
  RAISE NOTICE '📊 Database is fully optimized and analyzed';
  RAISE NOTICE '🔒 Security policies are in place';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ You can now run your backend tests!';
END $$;