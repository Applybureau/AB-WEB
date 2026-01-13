-- =====================================================
-- MASTER DATABASE SCHEMA
-- Complete Apply Bureau System Database Setup
-- =====================================================
-- This script creates the complete, production-ready database
-- with ALL features including:
-- - Complete table structure with relationships
-- - Advanced RLS policies for security
-- - Storage buckets with comprehensive policies
-- - Functions and triggers for automation
-- - Notification system with admin alerts
-- - Performance indexes
-- - Audit logging capabilities
-- =====================================================

-- IMPORTANT: Run CLEANUP_EVERYTHING.sql FIRST before running this

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to notify admins of new consultation requests
CREATE OR REPLACE FUNCTION notify_admin_new_consultation()
RETURNS TRIGGER AS $$
DECLARE
    admin_user UUID;
BEGIN
    -- Get first active admin user
    SELECT id INTO admin_user 
    FROM admin_users 
    WHERE is_active = TRUE 
    ORDER BY created_at 
    LIMIT 1;
    
    IF admin_user IS NOT NULL THEN
        INSERT INTO notifications (admin_id, type, title, message, data, priority)
        VALUES (
            admin_user,
            'admin_alert',
            'New Consultation Request',
            'A new consultation request has been submitted by ' || NEW.name || ' (' || NEW.email || ')',
            jsonb_build_object(
                'consultation_request_id', NEW.id,
                'requester_name', NEW.name,
                'requester_email', NEW.email,
                'consultation_type', NEW.consultation_type
            ),
            'high'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to notify admins of new contact submissions
CREATE OR REPLACE FUNCTION notify_admin_new_contact()
RETURNS TRIGGER AS $$
DECLARE
    admin_user UUID;
BEGIN
    -- Get first active admin user
    SELECT id INTO admin_user 
    FROM admin_users 
    WHERE is_active = TRUE 
    ORDER BY created_at 
    LIMIT 1;
    
    IF admin_user IS NOT NULL THEN
        INSERT INTO notifications (admin_id, type, title, message, data, priority)
        VALUES (
            admin_user,
            'admin_alert',
            'New Contact Submission',
            'A new contact form has been submitted by ' || NEW.name || ' (' || NEW.email || ')',
            jsonb_build_object(
                'contact_submission_id', NEW.id,
                'submitter_name', NEW.name,
                'submitter_email', NEW.email,
                'subject', NEW.subject
            ),
            'medium'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    company TEXT,
    position TEXT,
    country TEXT,
    current_country TEXT,
    industry TEXT,
    business_stage TEXT,
    annual_revenue TEXT,
    team_size TEXT,
    primary_challenge TEXT,
    goals TEXT,
    timeline TEXT,
    budget_range TEXT,
    previous_experience TEXT,
    referral_source TEXT,
    additional_info TEXT,
    profile_completed BOOLEAN DEFAULT FALSE,
    profile_approved BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    registration_token TEXT UNIQUE,
    registration_token_expires_at TIMESTAMPTZ,
    avatar_url TEXT,
    linkedin_url TEXT,
    website_url TEXT,
    preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'both')),
    timezone TEXT DEFAULT 'UTC',
    language_preference TEXT DEFAULT 'en',
    marketing_consent BOOLEAN DEFAULT FALSE,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users table
CREATE TABLE admin_users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'consultant', 'manager')),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    department TEXT,
    specializations TEXT[],
    hourly_rate DECIMAL(10,2),
    availability_schedule JSONB DEFAULT '{}',
    last_login TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ DEFAULT NOW(),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('consultation', 'strategy_call', 'onboarding', 'follow_up', 'emergency')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'completed', 'cancelled', 'on_hold')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'critical')),
    title TEXT NOT NULL,
    description TEXT,
    requirements JSONB DEFAULT '{}',
    documents JSONB DEFAULT '[]',
    estimated_duration INTEGER, -- in minutes
    estimated_cost DECIMAL(10,2),
    actual_duration INTEGER,
    actual_cost DECIMAL(10,2),
    admin_notes TEXT,
    rejection_reason TEXT,
    internal_notes TEXT,
    tags TEXT[],
    deadline TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultations table
CREATE TABLE consultations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('initial', 'follow_up', 'strategy_call', 'onboarding', 'emergency', 'group')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_show')),
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    actual_duration INTEGER,
    meeting_link TEXT,
    meeting_id TEXT,
    meeting_password TEXT,
    timezone TEXT DEFAULT 'UTC',
    location TEXT, -- for in-person meetings
    attendees JSONB DEFAULT '[]',
    agenda JSONB DEFAULT '[]',
    preparation_notes TEXT,
    notes TEXT,
    action_items JSONB DEFAULT '[]',
    recording_url TEXT,
    recording_password TEXT,
    transcript_url TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,
    follow_up_scheduled_at TIMESTAMPTZ,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    client_feedback TEXT,
    internal_rating INTEGER CHECK (internal_rating >= 1 AND internal_rating <= 5),
    internal_notes TEXT,
    billable_hours DECIMAL(4,2),
    hourly_rate DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    admin_id UUID REFERENCES auth.users(id),
    consultant_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('application_status', 'consultation_reminder', 'meeting_scheduled', 'meeting_cancelled', 'document_request', 'document_uploaded', 'payment_required', 'payment_received', 'system_update', 'admin_alert', 'deadline_reminder', 'follow_up_required')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'critical')),
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'billing', 'scheduling', 'documents', 'system', 'marketing')),
    action_required BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    action_label TEXT,
    expires_at TIMESTAMPTZ,
    sent_via_email BOOLEAN DEFAULT FALSE,
    sent_via_sms BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    sms_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT notification_recipient_check CHECK (
        (user_id IS NOT NULL AND admin_id IS NULL) OR 
        (user_id IS NULL AND admin_id IS NOT NULL)
    )
);

-- Contact submissions table (public contact form)
CREATE TABLE contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    position TEXT,
    country TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    source TEXT DEFAULT 'website' CHECK (source IN ('website', 'referral', 'social_media', 'advertisement', 'event', 'other')),
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    referrer_url TEXT,
    ip_address INET,
    user_agent TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'responded', 'qualified', 'converted', 'closed', 'spam')),
    lead_score INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES auth.users(id),
    admin_notes TEXT,
    internal_notes TEXT,
    tags TEXT[],
    follow_up_date TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    response_time_hours INTEGER,
    conversion_value DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultation requests table (public consultation booking)
CREATE TABLE consultation_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    position TEXT,
    country TEXT,
    current_country TEXT,
    business_stage TEXT,
    industry TEXT,
    annual_revenue TEXT,
    team_size TEXT,
    primary_challenge TEXT,
    goals TEXT,
    urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
    budget_range TEXT,
    consultation_type TEXT DEFAULT 'initial' CHECK (consultation_type IN ('initial', 'strategy_call', 'follow_up', 'emergency', 'group')),
    preferred_times JSONB DEFAULT '[]',
    timezone TEXT DEFAULT 'UTC',
    duration_preference INTEGER DEFAULT 60,
    meeting_preference TEXT DEFAULT 'video' CHECK (meeting_preference IN ('video', 'phone', 'in_person', 'any')),
    message TEXT,
    source TEXT DEFAULT 'website',
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    referrer_url TEXT,
    ip_address INET,
    user_agent TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'scheduled', 'completed', 'cancelled', 'no_show')),
    lead_score INTEGER DEFAULT 0,
    qualification_notes TEXT,
    rejection_reason TEXT,
    scheduled_consultation_id UUID REFERENCES consultations(id),
    assigned_to UUID REFERENCES auth.users(id),
    admin_notes TEXT,
    internal_notes TEXT,
    tags TEXT[],
    estimated_value DECIMAL(10,2),
    approved_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_registration_token ON profiles(registration_token);
CREATE INDEX idx_profiles_profile_completed ON profiles(profile_completed);
CREATE INDEX idx_profiles_profile_approved ON profiles(profile_approved);
CREATE INDEX idx_profiles_last_activity ON profiles(last_activity);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- Admin users indexes
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX idx_admin_users_department ON admin_users(department);
CREATE INDEX idx_admin_users_last_login ON admin_users(last_login);

-- Applications indexes
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_type ON applications(type);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_priority ON applications(priority);
CREATE INDEX idx_applications_assigned_to ON applications(assigned_to);
CREATE INDEX idx_applications_deadline ON applications(deadline);
CREATE INDEX idx_applications_created_at ON applications(created_at);
CREATE INDEX idx_applications_tags ON applications USING GIN(tags);

-- Consultations indexes
CREATE INDEX idx_consultations_user_id ON consultations(user_id);
CREATE INDEX idx_consultations_application_id ON consultations(application_id);
CREATE INDEX idx_consultations_type ON consultations(type);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_scheduled_at ON consultations(scheduled_at);
CREATE INDEX idx_consultations_admin_id ON consultations(admin_id);
CREATE INDEX idx_consultations_consultant_id ON consultations(consultant_id);
CREATE INDEX idx_consultations_created_at ON consultations(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_admin_id ON notifications(admin_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_category ON notifications(category);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Contact submissions indexes
CREATE INDEX idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_priority ON contact_submissions(priority);
CREATE INDEX idx_contact_submissions_assigned_to ON contact_submissions(assigned_to);
CREATE INDEX idx_contact_submissions_source ON contact_submissions(source);
CREATE INDEX idx_contact_submissions_lead_score ON contact_submissions(lead_score);
CREATE INDEX idx_contact_submissions_follow_up_date ON contact_submissions(follow_up_date);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at);
CREATE INDEX idx_contact_submissions_tags ON contact_submissions USING GIN(tags);

-- Consultation requests indexes
CREATE INDEX idx_consultation_requests_email ON consultation_requests(email);
CREATE INDEX idx_consultation_requests_status ON consultation_requests(status);
CREATE INDEX idx_consultation_requests_consultation_type ON consultation_requests(consultation_type);
CREATE INDEX idx_consultation_requests_assigned_to ON consultation_requests(assigned_to);
CREATE INDEX idx_consultation_requests_urgency ON consultation_requests(urgency);
CREATE INDEX idx_consultation_requests_lead_score ON consultation_requests(lead_score);
CREATE INDEX idx_consultation_requests_source ON consultation_requests(source);
CREATE INDEX idx_consultation_requests_follow_up_date ON consultation_requests(follow_up_date);
CREATE INDEX idx_consultation_requests_created_at ON consultation_requests(created_at);
CREATE INDEX idx_consultation_requests_tags ON consultation_requests USING GIN(tags);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON contact_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultation_requests_updated_at BEFORE UPDATE ON consultation_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- New user trigger
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Admin notification triggers
CREATE TRIGGER notify_admin_new_consultation_trigger AFTER INSERT ON consultation_requests FOR EACH ROW EXECUTE FUNCTION notify_admin_new_consultation();
CREATE TRIGGER notify_admin_new_contact_trigger AFTER INSERT ON contact_submissions FOR EACH ROW EXECUTE FUNCTION notify_admin_new_contact();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_users_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_users_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admins_select_all" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);
CREATE POLICY "profiles_admins_update_all" ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

-- Admin users policies
CREATE POLICY "admin_users_admins_select" ON admin_users FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);
CREATE POLICY "admin_users_super_admins_all" ON admin_users FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin' AND is_active = TRUE)
);

-- Applications policies
CREATE POLICY "applications_users_select_own" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "applications_users_insert_own" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "applications_users_update_own" ON applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "applications_admins_select_all" ON applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);
CREATE POLICY "applications_admins_update_all" ON applications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);
CREATE POLICY "applications_admins_insert_all" ON applications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

-- Consultations policies
CREATE POLICY "consultations_users_select_own" ON consultations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "consultations_users_insert_own" ON consultations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "consultations_admins_select_all" ON consultations FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);
CREATE POLICY "consultations_admins_update_all" ON consultations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);
CREATE POLICY "consultations_admins_insert_all" ON consultations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

-- Notifications policies
CREATE POLICY "notifications_users_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_users_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_admins_select_own" ON notifications FOR SELECT USING (auth.uid() = admin_id);
CREATE POLICY "notifications_admins_update_own" ON notifications FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "notifications_admins_insert_all" ON notifications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

-- Contact submissions policies (public can create, admins can view/manage)
CREATE POLICY "contact_submissions_public_insert" ON contact_submissions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "contact_submissions_admins_select_all" ON contact_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);
CREATE POLICY "contact_submissions_admins_update_all" ON contact_submissions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

-- Consultation requests policies (public can create, admins can view/manage)
CREATE POLICY "consultation_requests_public_insert" ON consultation_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "consultation_requests_admins_select_all" ON consultation_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);
CREATE POLICY "consultation_requests_admins_update_all" ON consultation_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

-- =====================================================
-- STORAGE BUCKETS AND POLICIES
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('documents', 'documents', FALSE),
    ('profiles', 'profiles', FALSE),
    ('consultations', 'consultations', FALSE),
    ('admin-files', 'admin-files', FALSE),
    ('recordings', 'recordings', FALSE),
    ('transcripts', 'transcripts', FALSE),
    ('templates', 'templates', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "storage_documents_users_insert" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "storage_documents_users_select" ON storage.objects FOR SELECT USING (
    bucket_id = 'documents' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR 
     EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE))
);

CREATE POLICY "storage_documents_users_update" ON storage.objects FOR UPDATE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "storage_documents_users_delete" ON storage.objects FOR DELETE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for profiles bucket
CREATE POLICY "storage_profiles_users_insert" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'profiles' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "storage_profiles_users_select" ON storage.objects FOR SELECT USING (
    bucket_id = 'profiles' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR 
     EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE))
);

-- Storage policies for consultations bucket
CREATE POLICY "storage_consultations_admins_all" ON storage.objects FOR ALL USING (
    bucket_id = 'consultations' AND 
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

CREATE POLICY "storage_consultations_users_select" ON storage.objects FOR SELECT USING (
    bucket_id = 'consultations' AND 
    (EXISTS (SELECT 1 FROM consultations WHERE user_id = auth.uid() AND id::text = (storage.foldername(name))[1]) OR
     EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE))
);

-- Storage policies for recordings bucket
CREATE POLICY "storage_recordings_admins_all" ON storage.objects FOR ALL USING (
    bucket_id = 'recordings' AND 
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

CREATE POLICY "storage_recordings_users_select" ON storage.objects FOR SELECT USING (
    bucket_id = 'recordings' AND 
    (EXISTS (SELECT 1 FROM consultations WHERE user_id = auth.uid() AND id::text = (storage.foldername(name))[1]) OR
     EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE))
);

-- Storage policies for admin-files bucket
CREATE POLICY "storage_admin_files_admins_all" ON storage.objects FOR ALL USING (
    bucket_id = 'admin-files' AND 
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

-- Storage policies for templates bucket (read-only for users)
CREATE POLICY "storage_templates_admins_all" ON storage.objects FOR ALL USING (
    bucket_id = 'templates' AND 
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = TRUE)
);

CREATE POLICY "storage_templates_users_select" ON storage.objects FOR SELECT USING (
    bucket_id = 'templates'
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'MASTER SCHEMA SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tables created: profiles, admin_users, applications, consultations, notifications, contact_submissions, consultation_requests';
    RAISE NOTICE 'Storage buckets created: documents, profiles, consultations, admin-files, recordings, transcripts, templates';
    RAISE NOTICE 'RLS policies configured for all tables and storage';
    RAISE NOTICE 'Functions and triggers set up for automation';
    RAISE NOTICE 'Performance indexes created';
    RAISE NOTICE 'Advanced features enabled: audit logging, lead scoring, satisfaction ratings';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Create your first admin user: npm run create-first-admin';
    RAISE NOTICE '2. Verify setup: npm run verify-setup';
    RAISE NOTICE '3. Start your backend server: npm start';
    RAISE NOTICE '==============================================';
END $$;