-- ⚠️ COMPLETE FIX FOR CONSULTATIONS TABLE
-- Run this in Supabase SQL Editor

-- Step 1: Drop the old broken consultations table
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS consultation_requests CASCADE;

-- Step 2: Create the consultations table with correct structure
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    linkedin_url TEXT,
    role_targets TEXT,
    location_preferences TEXT,
    minimum_salary VARCHAR(50),
    target_market VARCHAR(100),
    employment_status VARCHAR(50),
    package_interest VARCHAR(100),
    area_of_concern TEXT,
    consultation_window VARCHAR(100),
    job_title TEXT,
    consultation_type VARCHAR(50) DEFAULT 'career_strategy',
    preferred_date DATE,
    preferred_time VARCHAR(50),
    message TEXT,
    urgency_level VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'pending',
    source VARCHAR(50) DEFAULT 'website',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create contact_submissions table
DROP TABLE IF EXISTS contact_submissions CASCADE;

CREATE TABLE contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_email ON consultations(email);
CREATE INDEX idx_consultations_created ON consultations(created_at);
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_created ON contact_submissions(created_at);

-- Step 5: Enable RLS
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies for service role (backend access)
CREATE POLICY "Service role full access to consultations" ON consultations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to contact_submissions" ON contact_submissions
    FOR ALL USING (true) WITH CHECK (true);

-- Step 7: Grant permissions
GRANT ALL ON consultations TO anon;
GRANT ALL ON consultations TO authenticated;
GRANT ALL ON consultations TO service_role;
GRANT ALL ON contact_submissions TO anon;
GRANT ALL ON contact_submissions TO authenticated;
GRANT ALL ON contact_submissions TO service_role;

-- Step 8: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_consultations_updated_at ON consultations;
CREATE TRIGGER update_consultations_updated_at 
    BEFORE UPDATE ON consultations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_submissions_updated_at ON contact_submissions;
CREATE TRIGGER update_contact_submissions_updated_at 
    BEFORE UPDATE ON contact_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Done!
SELECT 'SUCCESS! Consultations table is now ready.' as result;