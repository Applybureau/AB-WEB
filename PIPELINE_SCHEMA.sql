-- Consultation-to-Client Pipeline Schema Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. LEADS TABLE (Enhanced consultation_requests)
-- ============================================

-- Add pipeline status field
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS pipeline_status VARCHAR(20) DEFAULT 'lead' 
  CHECK (pipeline_status IN ('lead', 'under_review', 'approved', 'client', 'rejected'));

-- Add PDF storage fields
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- Add review stage fields
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- Add approval stage fields
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS registration_token TEXT;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS token_used BOOLEAN DEFAULT FALSE;

-- Add registration stage fields
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add profile fields (populated during registration)
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS profile_pic_url TEXT;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS current_job VARCHAR(200);
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS target_job VARCHAR(200);
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS user_location VARCHAR(200);
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;

-- Performance indexes for leads
CREATE INDEX IF NOT EXISTS idx_consultation_requests_pipeline_status ON consultation_requests(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_token ON consultation_requests(registration_token) WHERE registration_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consultation_requests_user_id ON consultation_requests(user_id) WHERE user_id IS NOT NULL;

-- ============================================
-- 2. CONTACT REQUESTS TABLE (General Inquiries)
-- ============================================

CREATE TABLE IF NOT EXISTS contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'handled', 'archived')),
    handled_by UUID,
    handled_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for contact_requests
CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON contact_requests(email);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests(created_at);

-- Enable RLS
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_requests
DROP POLICY IF EXISTS "Anyone can create contact requests" ON contact_requests;
CREATE POLICY "Anyone can create contact requests" ON contact_requests
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can do everything" ON contact_requests;
CREATE POLICY "Service role can do everything" ON contact_requests
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON contact_requests TO authenticated;
GRANT INSERT ON contact_requests TO anon;

-- ============================================
-- 3. MEETINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS client_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL,
    admin_id UUID NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_time TIME NOT NULL,
    meeting_link TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for meetings
CREATE INDEX IF NOT EXISTS idx_client_meetings_lead_id ON client_meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_client_meetings_date ON client_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_client_meetings_admin_id ON client_meetings(admin_id);

-- Enable RLS
ALTER TABLE client_meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meetings
DROP POLICY IF EXISTS "Service role can do everything on meetings" ON client_meetings;
CREATE POLICY "Service role can do everything on meetings" ON client_meetings
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON client_meetings TO authenticated;

-- ============================================
-- 4. REGISTERED USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS registered_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    passcode_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(20) DEFAULT 'client',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for registered_users
CREATE INDEX IF NOT EXISTS idx_registered_users_email ON registered_users(email);
CREATE INDEX IF NOT EXISTS idx_registered_users_lead_id ON registered_users(lead_id);

-- Enable RLS
ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for registered_users
DROP POLICY IF EXISTS "Service role can do everything on users" ON registered_users;
CREATE POLICY "Service role can do everything on users" ON registered_users
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON registered_users TO authenticated;

-- ============================================
-- 5. TRIGGER FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to contact_requests
DROP TRIGGER IF EXISTS update_contact_requests_updated_at ON contact_requests;
CREATE TRIGGER update_contact_requests_updated_at
    BEFORE UPDATE ON contact_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to client_meetings
DROP TRIGGER IF EXISTS update_client_meetings_updated_at ON client_meetings;
CREATE TRIGGER update_client_meetings_updated_at
    BEFORE UPDATE ON client_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to registered_users
DROP TRIGGER IF EXISTS update_registered_users_updated_at ON registered_users;
CREATE TRIGGER update_registered_users_updated_at
    BEFORE UPDATE ON registered_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Pipeline Schema Migration completed successfully!' as status;
