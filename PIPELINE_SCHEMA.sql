-- ============================================
-- COMPLETE PIPELINE SCHEMA
-- Consultation-to-Client Pipeline for Apply Bureau
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CONSULTATION_REQUESTS TABLE (Leads)
-- ============================================

CREATE TABLE IF NOT EXISTS consultation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic lead info
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(200),
    job_title VARCHAR(200),
    linkedin_url TEXT,
    
    -- Consultation details
    consultation_type VARCHAR(100) DEFAULT 'general_consultation',
    role_targets TEXT,
    location_preferences TEXT,
    minimum_salary VARCHAR(50),
    target_market VARCHAR(100),
    employment_status VARCHAR(50),
    package_interest VARCHAR(100),
    area_of_concern TEXT,
    consultation_window VARCHAR(100),
    preferred_date DATE,
    preferred_time TIME,
    message TEXT,
    urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
    source VARCHAR(50) DEFAULT 'website',
    
    -- Pipeline status (4-stage lifecycle)
    pipeline_status VARCHAR(20) DEFAULT 'lead' CHECK (pipeline_status IN ('lead', 'under_review', 'approved', 'client', 'rejected')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'confirmed', 'rejected', 'completed', 'cancelled')),
    
    -- PDF/Resume storage
    pdf_url TEXT,
    pdf_path TEXT,
    
    -- Review stage fields
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID,
    
    -- Approval stage fields
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    registration_token TEXT,
    token_expires_at TIMESTAMPTZ,
    token_used BOOLEAN DEFAULT FALSE,
    
    -- Registration stage fields
    registered_at TIMESTAMPTZ,
    user_id UUID,
    
    -- Profile fields (populated during registration)
    age INTEGER,
    profile_pic_url TEXT,
    current_job VARCHAR(200),
    target_job VARCHAR(200),
    country VARCHAR(100),
    user_location VARCHAR(200),
    years_of_experience INTEGER,
    
    -- Admin fields
    admin_notes TEXT,
    confirmed_by UUID,
    confirmed_at TIMESTAMPTZ,
    scheduled_date DATE,
    scheduled_time TIME,
    meeting_url TEXT,
    rejected_by UUID,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for consultation_requests
CREATE INDEX IF NOT EXISTS idx_consultation_requests_email ON consultation_requests(email);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status ON consultation_requests(status);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_pipeline_status ON consultation_requests(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_created_at ON consultation_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_token ON consultation_requests(registration_token) WHERE registration_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consultation_requests_user_id ON consultation_requests(user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can create consultation requests" ON consultation_requests;
CREATE POLICY "Anyone can create consultation requests" ON consultation_requests
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access consultation_requests" ON consultation_requests;
CREATE POLICY "Service role full access consultation_requests" ON consultation_requests
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON consultation_requests TO authenticated;
GRANT INSERT, SELECT ON consultation_requests TO anon;


-- ============================================
-- 2. CONTACT_REQUESTS TABLE (General Inquiries)
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

-- Indexes for contact_requests
CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON contact_requests(email);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests(created_at);

-- Enable RLS
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can create contact requests" ON contact_requests;
CREATE POLICY "Anyone can create contact requests" ON contact_requests
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access contact_requests" ON contact_requests;
CREATE POLICY "Service role full access contact_requests" ON contact_requests
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON contact_requests TO authenticated;
GRANT INSERT ON contact_requests TO anon;


-- ============================================
-- 3. CLIENT_MEETINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS client_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES consultation_requests(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_time TIME NOT NULL,
    meeting_link TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for client_meetings
CREATE INDEX IF NOT EXISTS idx_client_meetings_lead_id ON client_meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_client_meetings_date ON client_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_client_meetings_admin_id ON client_meetings(admin_id);

-- Enable RLS
ALTER TABLE client_meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Service role full access client_meetings" ON client_meetings;
CREATE POLICY "Service role full access client_meetings" ON client_meetings
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON client_meetings TO authenticated;


-- ============================================
-- 4. REGISTERED_USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS registered_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID UNIQUE REFERENCES consultation_requests(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    passcode_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(20) DEFAULT 'client',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for registered_users
CREATE INDEX IF NOT EXISTS idx_registered_users_email ON registered_users(email);
CREATE INDEX IF NOT EXISTS idx_registered_users_lead_id ON registered_users(lead_id);

-- Enable RLS
ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Service role full access registered_users" ON registered_users;
CREATE POLICY "Service role full access registered_users" ON registered_users
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON registered_users TO authenticated;


-- ============================================
-- 5. TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for consultation_requests
DROP TRIGGER IF EXISTS update_consultation_requests_updated_at ON consultation_requests;
CREATE TRIGGER update_consultation_requests_updated_at
    BEFORE UPDATE ON consultation_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for contact_requests
DROP TRIGGER IF EXISTS update_contact_requests_updated_at ON contact_requests;
CREATE TRIGGER update_contact_requests_updated_at
    BEFORE UPDATE ON contact_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for client_meetings
DROP TRIGGER IF EXISTS update_client_meetings_updated_at ON client_meetings;
CREATE TRIGGER update_client_meetings_updated_at
    BEFORE UPDATE ON client_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for registered_users
DROP TRIGGER IF EXISTS update_registered_users_updated_at ON registered_users;
CREATE TRIGGER update_registered_users_updated_at
    BEFORE UPDATE ON registered_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Pipeline Schema created successfully!' as status;
