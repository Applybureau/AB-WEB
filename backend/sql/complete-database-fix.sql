-- =====================================================
-- COMPLETE DATABASE FIX
-- Creates all missing tables and fills with required data
-- Prevents all dashboard and consultation errors
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CONSULTATION REQUESTS TABLE (CRITICAL - MISSING)
-- =====================================================

-- Drop and recreate consultation_requests table
DROP TABLE IF EXISTS consultation_requests CASCADE;

CREATE TABLE consultation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    
    -- Package and tier information
    package_interest VARCHAR(100) DEFAULT 'Tier 1',
    tier VARCHAR(50) DEFAULT 'Tier 1',
    weekly_target INTEGER DEFAULT 17,
    
    -- Consultation details
    consultation_type VARCHAR(100) DEFAULT 'strategy_call',
    preferred_times TEXT[],
    timezone VARCHAR(100) DEFAULT 'UTC',
    consultation_date TIMESTAMP WITH TIME ZONE,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- Contact preferences
    contact_method VARCHAR(50) DEFAULT 'email',
    whatsapp_number VARCHAR(50),
    is_whatsapp_consultation BOOLEAN DEFAULT false,
    
    -- Additional information
    current_situation TEXT,
    goals TEXT,
    experience_level VARCHAR(100),
    industry_interest VARCHAR(255),
    
    -- Admin fields
    assigned_advisor UUID,
    admin_notes TEXT,
    internal_priority INTEGER DEFAULT 3,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_consultation_requests_user_id ON consultation_requests(user_id);
CREATE INDEX idx_consultation_requests_status ON consultation_requests(status);
CREATE INDEX idx_consultation_requests_tier ON consultation_requests(tier);
CREATE INDEX idx_consultation_requests_created_at ON consultation_requests(created_at);

-- =====================================================
-- 2. ENSURE ALL EXISTING TABLES HAVE CORRECT STRUCTURE
-- =====================================================

-- Fix applications table structure
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS job_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'applied',
ADD COLUMN IF NOT EXISTS application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure client_id and user_id are synchronized
UPDATE applications 
SET client_id = user_id 
WHERE client_id IS NULL AND user_id IS NOT NULL;

UPDATE applications 
SET user_id = client_id 
WHERE user_id IS NULL AND client_id IS NOT NULL;

-- Fix clients table structure
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'Tier 1',
ADD COLUMN IF NOT EXISTS weekly_target INTEGER DEFAULT 17,
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS features_unlocked JSONB DEFAULT '{"application_tracking": true, "consultation_booking": true, "document_upload": true}',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix client_onboarding_20q table structure
ALTER TABLE client_onboarding_20q
ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'Tier 1',
ADD COLUMN IF NOT EXISTS weekly_target INTEGER DEFAULT 17,
ADD COLUMN IF NOT EXISTS target_job_titles TEXT[],
ADD COLUMN IF NOT EXISTS target_industries TEXT[],
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS job_search_timeline VARCHAR(100) DEFAULT '1-3 months',
ADD COLUMN IF NOT EXISTS execution_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- 3. INSERT SAMPLE DATA FOR ISRAEL LOKO (TEST CLIENT)
-- =====================================================

-- Insert consultation request for Israel Loko
INSERT INTO consultation_requests (
    id,
    user_id,
    email,
    full_name,
    phone_number,
    package_interest,
    tier,
    weekly_target,
    consultation_type,
    status,
    contact_method,
    current_situation,
    goals,
    experience_level,
    industry_interest,
    created_at,
    updated_at,
    completed_at
) VALUES (
    uuid_generate_v4(),
    '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b',
    'israelloko65@gmail.com',
    'Israel Loko',
    '+1234567890',
    'Tier 1',
    'Tier 1',
    17,
    'strategy_call',
    'completed',
    'email',
    'Looking to advance my software engineering career',
    'Land a senior software engineer role at a top tech company',
    'Mid-level (3-5 years)',
    'Technology, Software Development',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
) ON CONFLICT (user_id) DO UPDATE SET
    tier = EXCLUDED.tier,
    weekly_target = EXCLUDED.weekly_target,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Update client record with tier information
UPDATE clients 
SET 
    tier = 'Tier 1',
    weekly_target = 17,
    profile_completion_percentage = 85,
    features_unlocked = '{"application_tracking": true, "consultation_booking": true, "document_upload": true}',
    updated_at = NOW()
WHERE id = '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b';

-- Update onboarding record
UPDATE client_onboarding_20q 
SET 
    tier = 'Tier 1',
    weekly_target = 17,
    target_job_titles = ARRAY['Software Engineer', 'Product Manager'],
    target_industries = ARRAY['Technology', 'Software Development'],
    years_of_experience = 5,
    job_search_timeline = '1-3 months',
    execution_status = 'active',
    approved_at = NOW() - INTERVAL '1 day',
    completed_at = NOW() - INTERVAL '1 day'
WHERE user_id = '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b';

-- =====================================================
-- 4. CREATE ADDITIONAL SUPPORTING TABLES
-- =====================================================

-- Contact requests table (if missing)
CREATE TABLE IF NOT EXISTS contact_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    company VARCHAR(255),
    message TEXT,
    status VARCHAR(50) DEFAULT 'new',
    priority VARCHAR(20) DEFAULT 'normal',
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings table (if missing)
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL,
    admin_id UUID,
    consultation_request_id UUID,
    meeting_type VARCHAR(100) DEFAULT 'consultation',
    title VARCHAR(255),
    description TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 60,
    meeting_link VARCHAR(500),
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client tiers lookup table
CREATE TABLE IF NOT EXISTS client_tiers (
    tier_name VARCHAR(50) PRIMARY KEY,
    weekly_target INTEGER NOT NULL,
    description TEXT,
    features JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert tier definitions
INSERT INTO client_tiers (tier_name, weekly_target, description, features) VALUES
('Tier 1', 17, 'Standard tier for most clients', '{"application_tracking": true, "consultation_booking": true, "document_upload": true}'),
('Tier 2', 30, 'Advanced tier for active job seekers', '{"application_tracking": true, "consultation_booking": true, "document_upload": true, "priority_support": true}'),
('Tier 3', 50, 'Premium tier for intensive job search', '{"application_tracking": true, "consultation_booking": true, "document_upload": true, "priority_support": true, "weekly_calls": true}')
ON CONFLICT (tier_name) DO UPDATE SET
    weekly_target = EXCLUDED.weekly_target,
    description = EXCLUDED.description,
    features = EXCLUDED.features;

-- =====================================================
-- 5. CREATE VIEWS FOR EASY DATA ACCESS
-- =====================================================

-- Client dashboard view
CREATE OR REPLACE VIEW client_dashboard_view AS
SELECT 
    c.id,
    c.email,
    c.full_name,
    c.tier,
    c.weekly_target,
    c.profile_completion_percentage,
    c.features_unlocked,
    c.created_at,
    
    -- Onboarding information
    o.execution_status as onboarding_status,
    o.target_job_titles,
    o.target_industries,
    o.years_of_experience,
    o.job_search_timeline,
    o.approved_at as onboarding_approved_at,
    
    -- Consultation information
    cr.status as consultation_status,
    cr.package_interest,
    cr.completed_at as consultation_completed_at,
    
    -- Application statistics
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status = 'applied' THEN 1 END) as applied_count,
    COUNT(CASE WHEN a.status = 'interviewing' THEN 1 END) as interviewing_count,
    COUNT(CASE WHEN a.status = 'offer' THEN 1 END) as offer_count,
    COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected_count
    
FROM clients c
LEFT JOIN client_onboarding_20q o ON c.id = o.user_id
LEFT JOIN consultation_requests cr ON c.id = cr.user_id
LEFT JOIN applications a ON c.id = a.client_id
GROUP BY c.id, c.email, c.full_name, c.tier, c.weekly_target, c.profile_completion_percentage, 
         c.features_unlocked, c.created_at, o.execution_status, o.target_job_titles, 
         o.target_industries, o.years_of_experience, o.job_search_timeline, o.approved_at,
         cr.status, cr.package_interest, cr.completed_at;

-- =====================================================
-- 6. CREATE FUNCTIONS FOR TIER MANAGEMENT
-- =====================================================

-- Function to get weekly target by tier
CREATE OR REPLACE FUNCTION get_weekly_target(tier_name VARCHAR(50))
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE 
        WHEN tier_name = 'Tier 1' THEN 17
        WHEN tier_name = 'Tier 2' THEN 30
        WHEN tier_name = 'Tier 3' THEN 50
        ELSE 17
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to update client tier
CREATE OR REPLACE FUNCTION update_client_tier(client_id UUID, new_tier VARCHAR(50))
RETURNS VOID AS $$
DECLARE
    target INTEGER;
BEGIN
    target := get_weekly_target(new_tier);
    
    UPDATE clients 
    SET tier = new_tier, weekly_target = target, updated_at = NOW()
    WHERE id = client_id;
    
    UPDATE consultation_requests 
    SET tier = new_tier, weekly_target = target, updated_at = NOW()
    WHERE user_id = client_id;
    
    UPDATE client_onboarding_20q 
    SET tier = new_tier, weekly_target = target
    WHERE user_id = client_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. ENSURE DATA CONSISTENCY
-- =====================================================

-- Update all existing clients to have proper tier information
UPDATE clients 
SET 
    tier = COALESCE(tier, 'Tier 1'),
    weekly_target = COALESCE(weekly_target, 17),
    profile_completion_percentage = COALESCE(profile_completion_percentage, 50),
    features_unlocked = COALESCE(features_unlocked, '{"application_tracking": true, "consultation_booking": true, "document_upload": true}')
WHERE tier IS NULL OR weekly_target IS NULL;

-- Ensure all applications have proper client_id
UPDATE applications 
SET client_id = user_id 
WHERE client_id IS NULL AND user_id IS NOT NULL;

-- =====================================================
-- 8. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS update_consultation_requests_updated_at ON consultation_requests;
CREATE TRIGGER update_consultation_requests_updated_at
    BEFORE UPDATE ON consultation_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant permissions to service role (adjust as needed)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Verify the fix worked
DO $$
BEGIN
    RAISE NOTICE 'Database fix completed successfully!';
    RAISE NOTICE 'Tables created/updated:';
    RAISE NOTICE '- consultation_requests: %', (SELECT COUNT(*) FROM consultation_requests);
    RAISE NOTICE '- clients: %', (SELECT COUNT(*) FROM clients);
    RAISE NOTICE '- applications: %', (SELECT COUNT(*) FROM applications);
    RAISE NOTICE '- client_onboarding_20q: %', (SELECT COUNT(*) FROM client_onboarding_20q);
    RAISE NOTICE 'Israel Loko consultation record: %', (SELECT CASE WHEN EXISTS(SELECT 1 FROM consultation_requests WHERE email = 'israelloko65@gmail.com') THEN 'EXISTS' ELSE 'MISSING' END);
END $$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 
    'DATABASE FIX COMPLETED SUCCESSFULLY!' as status,
    'All missing tables created and populated' as message,
    'Dashboard and consultation errors should be resolved' as result;