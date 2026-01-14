-- COMPLETE MISSING TABLES AND COLUMNS SCHEMA
-- This script adds all missing tables and columns needed for the Apply Bureau Concierge Backend

-- =====================================================
-- 1. ADD MISSING COLUMNS TO consultation_requests
-- =====================================================

-- Add admin_status column for concierge gatekeeper control
ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS admin_status VARCHAR(20) DEFAULT 'pending';

-- Add constraint for admin_status
DO $$ 
BEGIN
    ALTER TABLE consultation_requests DROP CONSTRAINT IF EXISTS consultation_requests_admin_status_check;
    ALTER TABLE consultation_requests 
    ADD CONSTRAINT consultation_requests_admin_status_check 
    CHECK (admin_status IN ('pending', 'confirmed', 'rescheduled', 'waitlisted'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Add message column for client brief message
ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS message TEXT;

-- Add preferred_slots for time slot selection
ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS preferred_slots JSONB DEFAULT '[]';

-- Add confirmed_time for admin-confirmed consultation time
ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS confirmed_time TIMESTAMP WITH TIME ZONE;

-- Add admin action tracking
ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS reschedule_reason TEXT;

ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS waitlist_reason TEXT;

ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS admin_action_by UUID REFERENCES registered_users(id);

ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS admin_action_at TIMESTAMP WITH TIME ZONE;

-- Update status constraint to include valid values
DO $$ 
BEGIN
    ALTER TABLE consultation_requests DROP CONSTRAINT IF EXISTS consultation_requests_status_check;
    ALTER TABLE consultation_requests 
    ADD CONSTRAINT consultation_requests_status_check 
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- =====================================================
-- 2. ADD MISSING COLUMNS TO applications
-- =====================================================

-- Add week_number for mobile application grouping
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS week_number INTEGER;

-- Add interview notification tracking
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS interview_update_sent BOOLEAN DEFAULT FALSE;

-- =====================================================
-- 3. CREATE MISSING TABLES
-- =====================================================

-- Create contact_requests table if not exists
CREATE TABLE IF NOT EXISTS contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    message TEXT,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    source VARCHAR(50) DEFAULT 'website',
    assigned_to UUID REFERENCES registered_users(id),
    responded_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table if not exists
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    source VARCHAR(50) DEFAULT 'website',
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    lead_score INTEGER DEFAULT 0,
    notes TEXT,
    assigned_to UUID REFERENCES registered_users(id),
    converted_to_client_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meetings table if not exists
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES registered_users(id),
    admin_id UUID REFERENCES registered_users(id),
    meeting_type VARCHAR(50) DEFAULT 'consultation' CHECK (meeting_type IN ('consultation', 'strategy_call', 'follow_up', 'interview_prep')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    meeting_link VARCHAR(500),
    meeting_platform VARCHAR(50) DEFAULT 'google_meet',
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to calculate week number for applications
CREATE OR REPLACE FUNCTION calculate_week_number(created_date TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
BEGIN
    -- Calculate week number based on year and week
    RETURN EXTRACT(YEAR FROM created_date) * 100 + EXTRACT(WEEK FROM created_date);
END;
$$ LANGUAGE plpgsql;

-- Function to update week_number automatically
CREATE OR REPLACE FUNCTION set_application_week_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.week_number = calculate_week_number(NEW.created_at);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CREATE TRIGGERS
-- =====================================================

-- Trigger to automatically set week_number for new applications
DROP TRIGGER IF EXISTS trigger_set_application_week_number ON applications;
CREATE TRIGGER trigger_set_application_week_number
    BEFORE INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION set_application_week_number();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_consultation_requests_updated_at ON consultation_requests;
CREATE TRIGGER update_consultation_requests_updated_at
    BEFORE UPDATE ON consultation_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_requests_updated_at ON contact_requests;
CREATE TRIGGER update_contact_requests_updated_at
    BEFORE UPDATE ON contact_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for consultation_requests
CREATE INDEX IF NOT EXISTS idx_consultation_requests_admin_status ON consultation_requests(admin_status);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_created_at ON consultation_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_email ON consultation_requests(email);

-- Indexes for applications
CREATE INDEX IF NOT EXISTS idx_applications_week_number ON applications(week_number);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);

-- Indexes for contact_requests
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON contact_requests(email);

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Indexes for meetings
CREATE INDEX IF NOT EXISTS idx_meetings_client_id ON meetings(client_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

-- Indexes for client_onboarding_20q
CREATE INDEX IF NOT EXISTS idx_client_onboarding_user_id ON client_onboarding_20q(user_id);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_execution_status ON client_onboarding_20q(execution_status);

-- =====================================================
-- 7. UPDATE EXISTING DATA
-- =====================================================

-- Update existing applications with week numbers
UPDATE applications 
SET week_number = calculate_week_number(created_at)
WHERE week_number IS NULL;

-- Set default admin_status for existing consultation_requests
UPDATE consultation_requests 
SET admin_status = 'pending'
WHERE admin_status IS NULL;

-- =====================================================
-- 8. INSERT SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample consultation request for testing
INSERT INTO consultation_requests (
    full_name, 
    email, 
    phone, 
    message,
    preferred_slots,
    admin_status,
    status,
    created_at
) VALUES (
    'Sample Client',
    'sample@example.com',
    '+1-555-0123',
    'I am interested in your concierge services and would like to schedule a consultation to discuss my career goals.',
    '[
        {"date": "2024-02-15", "time": "14:00"},
        {"date": "2024-02-16", "time": "15:00"},
        {"date": "2024-02-17", "time": "16:00"}
    ]'::jsonb,
    'pending',
    'pending',
    NOW()
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================

-- Verify consultation_requests structure
SELECT 
    'consultation_requests' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'consultation_requests' 
AND column_name IN ('message', 'admin_status', 'preferred_slots', 'confirmed_time', 'admin_notes')
ORDER BY column_name;

-- Verify applications structure
SELECT 
    'applications' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'applications' 
AND column_name IN ('week_number', 'interview_update_sent')
ORDER BY column_name;

-- Verify new tables exist
SELECT 
    table_name,
    'exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('contact_requests', 'leads', 'meetings')
ORDER BY table_name;

-- Show sample data
SELECT 
    id,
    full_name,
    email,
    message,
    admin_status,
    status,
    preferred_slots,
    created_at
FROM consultation_requests 
LIMIT 3;

-- =====================================================
-- 10. COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ COMPLETE MISSING TABLES SCHEMA APPLIED SUCCESSFULLY';
    RAISE NOTICE '📋 Added columns: admin_status, message, preferred_slots to consultation_requests';
    RAISE NOTICE '📋 Added columns: week_number, interview_update_sent to applications';
    RAISE NOTICE '📋 Created tables: contact_requests, leads, meetings (if not existed)';
    RAISE NOTICE '📋 Created indexes and triggers for performance';
    RAISE NOTICE '📋 Added sample data for testing';
    RAISE NOTICE '🎯 Ready for concierge backend testing';
END $$;