-- Enhanced Admin Management Schema for Apply Bureau
-- Run this in Supabase SQL Editor

-- 1. Add profile picture and enhanced fields to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS current_job_title VARCHAR(200);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS current_company VARCHAR(200);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS target_role VARCHAR(200);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS target_salary_min INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS target_salary_max INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS preferred_locations TEXT[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS career_goals TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES clients(id);

-- 2. Create admins table for enhanced admin management
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    profile_picture_url TEXT,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'advisor')),
    permissions JSONB DEFAULT '{"can_create_admins": false, "can_delete_admins": false, "can_manage_clients": true, "can_schedule_consultations": true, "can_view_reports": true}',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_by_admin_id UUID REFERENCES admins(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enhanced consultations table with Google Meet integration
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admins(id);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS meeting_title VARCHAR(200);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS meeting_description TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS preparation_notes TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS client_confirmed BOOLEAN DEFAULT false;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS admin_confirmed BOOLEAN DEFAULT false;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS meeting_started_at TIMESTAMPTZ;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS meeting_ended_at TIMESTAMPTZ;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS meeting_recording_url TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS client_satisfaction_rating INTEGER CHECK (client_satisfaction_rating >= 1 AND client_satisfaction_rating <= 5);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS next_steps TEXT;

-- 4. Create file_uploads table for resumes and profile pictures
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Can reference clients or admins
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'admin')),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    upload_purpose VARCHAR(50) NOT NULL CHECK (upload_purpose IN ('resume', 'profile_picture', 'document', 'other')),
    is_active BOOLEAN DEFAULT true,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create admin_sessions table for enhanced security tracking
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    login_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    logout_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create consultation_documents table for resume viewing
CREATE TABLE IF NOT EXISTS consultation_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    file_upload_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('resume', 'cover_letter', 'portfolio', 'other')),
    is_reviewed BOOLEAN DEFAULT false,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create admin_activity_log for security auditing
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admins(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50), -- 'client', 'consultation', 'admin', etc.
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Insert super admin (migrate existing admin)
INSERT INTO admins (id, full_name, email, password, role, permissions, is_active)
SELECT 
    id,
    full_name,
    email,
    password,
    'super_admin',
    '{"can_create_admins": true, "can_delete_admins": true, "can_manage_clients": true, "can_schedule_consultations": true, "can_view_reports": true, "can_manage_system": true}',
    true
FROM clients 
WHERE role = 'admin' AND email = 'admin@applybureau.com'
ON CONFLICT (email) DO NOTHING;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_file_uploads_user ON file_uploads(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_file_uploads_purpose ON file_uploads(upload_purpose);
CREATE INDEX IF NOT EXISTS idx_consultation_documents_consultation ON consultation_documents(consultation_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON admin_activity_log(created_at);

-- 10. Create RLS policies for enhanced security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Admins can only see themselves unless they're super_admin
CREATE POLICY "Admins can view own profile" ON admins
    FOR SELECT USING (
        auth.uid()::text = id::text OR 
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id::text = auth.uid()::text 
            AND role = 'super_admin'
        )
    );

-- Super admins can manage all admins
CREATE POLICY "Super admins can manage admins" ON admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id::text = auth.uid()::text 
            AND role = 'super_admin'
        )
    );

-- File uploads policy
CREATE POLICY "Users can manage own files" ON file_uploads
    FOR ALL USING (
        user_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id::text = auth.uid()::text
        )
    );

-- Admin sessions policy
CREATE POLICY "Admins can view own sessions" ON admin_sessions
    FOR SELECT USING (admin_id::text = auth.uid()::text);

-- 11. Create functions for admin management
CREATE OR REPLACE FUNCTION update_admin_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE admin_sessions 
    SET last_activity_at = NOW()
    WHERE admin_id = NEW.admin_id AND is_active = true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at 
    BEFORE UPDATE ON consultations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('profile-pictures', 'profile-pictures', true),
    ('resumes', 'resumes', false),
    ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 14. Create storage policies
CREATE POLICY "Public profile pictures" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Authenticated users can upload profile pictures" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-pictures' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can manage own profile pictures" ON storage.objects
    FOR ALL USING (
        bucket_id = 'profile-pictures' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Admins can access resumes" ON storage.objects
    FOR ALL USING (
        bucket_id = 'resumes' AND
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id::text = auth.uid()::text
        )
    );

CREATE POLICY "Authenticated users can upload resumes" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'resumes' AND 
        auth.role() = 'authenticated'
    );

-- 15. Grant necessary permissions
GRANT ALL ON admins TO authenticated;
GRANT ALL ON admin_sessions TO authenticated;
GRANT ALL ON file_uploads TO authenticated;
GRANT ALL ON consultation_documents TO authenticated;
GRANT ALL ON admin_activity_log TO authenticated;

-- Success message
SELECT 'Enhanced Admin Management Schema created successfully!' as status;