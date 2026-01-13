-- APPLY BUREAU CONCIERGE BACKEND - COMPLETE SCHEMA FIX
-- This script fixes all database schema issues for the concierge model

-- 1. Add message field to consultation_requests table
ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS message TEXT;

-- Add comment to document the field
COMMENT ON COLUMN consultation_requests.message IS 'Brief message from client during consultation request';

-- 2. Ensure consultation_requests has all required concierge fields
ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS admin_status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS preferred_slots JSONB DEFAULT '[]';

ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS confirmed_time TIMESTAMP WITH TIME ZONE;

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

-- 3. Create client_onboarding_20q table if not exists
CREATE TABLE IF NOT EXISTS client_onboarding_20q (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES registered_users(id) ON DELETE CASCADE,
    
    -- Role Targeting (Questions 1-5)
    target_job_titles TEXT[],
    target_industries TEXT[],
    target_company_sizes TEXT[],
    target_locations TEXT[],
    remote_work_preference VARCHAR(20),
    
    -- Compensation Guardrails (Questions 6-8)
    current_salary_range VARCHAR(50),
    target_salary_range VARCHAR(50),
    salary_negotiation_comfort INTEGER CHECK (salary_negotiation_comfort >= 1 AND salary_negotiation_comfort <= 10),
    
    -- Experience & Skills (Questions 9-12)
    years_of_experience INTEGER,
    key_technical_skills TEXT[],
    soft_skills_strengths TEXT[],
    certifications_licenses TEXT[],
    
    -- Job Search Strategy (Questions 13-16)
    job_search_timeline VARCHAR(20),
    application_volume_preference VARCHAR(20),
    networking_comfort_level INTEGER CHECK (networking_comfort_level >= 1 AND networking_comfort_level <= 10),
    interview_confidence_level INTEGER CHECK (interview_confidence_level >= 1 AND interview_confidence_level <= 10),
    
    -- Career Goals & Challenges (Questions 17-20)
    career_goals_short_term TEXT,
    career_goals_long_term TEXT,
    biggest_career_challenges TEXT[],
    support_areas_needed TEXT[],
    
    -- Admin approval system
    execution_status VARCHAR(20) DEFAULT 'pending_approval' CHECK (execution_status IN ('pending_approval', 'active', 'paused', 'completed')),
    approved_by UUID REFERENCES registered_users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add concierge fields to registered_users table
ALTER TABLE registered_users 
ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT FALSE;

ALTER TABLE registered_users 
ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID REFERENCES registered_users(id);

ALTER TABLE registered_users 
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE registered_users 
ADD COLUMN IF NOT EXISTS profile_unlocked BOOLEAN DEFAULT FALSE;

ALTER TABLE registered_users 
ADD COLUMN IF NOT EXISTS profile_unlocked_by UUID REFERENCES registered_users(id);

ALTER TABLE registered_users 
ADD COLUMN IF NOT EXISTS profile_unlocked_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE registered_users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE registered_users 
ADD COLUMN IF NOT EXISTS registration_token TEXT;

ALTER TABLE registered_users 
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE registered_users 
ADD COLUMN IF NOT EXISTS token_used BOOLEAN DEFAULT FALSE;

-- 5. Add week_number to applications table for mobile grouping
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS week_number INTEGER;

ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS interview_update_sent BOOLEAN DEFAULT FALSE;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultation_requests_admin_status ON consultation_requests(admin_status);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_created_at ON consultation_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_user_id ON client_onboarding_20q(user_id);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_execution_status ON client_onboarding_20q(execution_status);
CREATE INDEX IF NOT EXISTS idx_registered_users_payment_confirmed ON registered_users(payment_confirmed);
CREATE INDEX IF NOT EXISTS idx_registered_users_profile_unlocked ON registered_users(profile_unlocked);
CREATE INDEX IF NOT EXISTS idx_applications_week_number ON applications(week_number);

-- 7. Create or update admin_status constraint
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE consultation_requests DROP CONSTRAINT IF EXISTS consultation_requests_admin_status_check;
    
    -- Add new constraint
    ALTER TABLE consultation_requests 
    ADD CONSTRAINT consultation_requests_admin_status_check 
    CHECK (admin_status IN ('pending', 'confirmed', 'rescheduled', 'waitlisted'));
EXCEPTION
    WHEN OTHERS THEN
        -- Constraint might not exist, continue
        NULL;
END $$;

-- 8. Update status constraint to include valid values
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE consultation_requests DROP CONSTRAINT IF EXISTS consultation_requests_status_check;
    
    -- Add new constraint with valid status values
    ALTER TABLE consultation_requests 
    ADD CONSTRAINT consultation_requests_status_check 
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));
EXCEPTION
    WHEN OTHERS THEN
        -- Constraint might not exist, continue
        NULL;
END $$;

-- 9. Create function to calculate week number for applications
CREATE OR REPLACE FUNCTION calculate_week_number(created_date TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
BEGIN
    -- Calculate week number based on year and week
    RETURN EXTRACT(YEAR FROM created_date) * 100 + EXTRACT(WEEK FROM created_date);
END;
$$ LANGUAGE plpgsql;

-- 10. Update existing applications with week numbers
UPDATE applications 
SET week_number = calculate_week_number(created_at)
WHERE week_number IS NULL;

-- 11. Create trigger to automatically set week_number for new applications
CREATE OR REPLACE FUNCTION set_application_week_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.week_number = calculate_week_number(NEW.created_at);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_application_week_number ON applications;
CREATE TRIGGER trigger_set_application_week_number
    BEFORE INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION set_application_week_number();

-- 12. Insert sample consultation data for testing
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
    'Test Client',
    'test@example.com',
    '+1-555-0123',
    'I am interested in your concierge services and would like to schedule a consultation.',
    '[
        {"date": "2024-02-15", "time": "14:00"},
        {"date": "2024-02-16", "time": "15:00"},
        {"date": "2024-02-17", "time": "16:00"}
    ]'::jsonb,
    'pending',
    'pending',
    NOW()
) ON CONFLICT DO NOTHING;

-- 13. Verify schema changes
SELECT 
    'consultation_requests' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'consultation_requests' 
AND column_name IN ('message', 'admin_status', 'preferred_slots')
ORDER BY column_name;

SELECT 
    'registered_users' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'registered_users' 
AND column_name IN ('payment_confirmed', 'profile_unlocked', 'registration_token')
ORDER BY column_name;

SELECT 
    'client_onboarding_20q' as table_name,
    COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_name = 'client_onboarding_20q';

-- 14. Show sample data
SELECT 
    id,
    full_name,
    email,
    message,
    admin_status,
    status,
    created_at
FROM consultation_requests 
LIMIT 3;