-- =============================================
-- CLIENT DASHBOARD SCHEMA
-- =============================================
-- This schema creates the missing tables needed for the complete client dashboard system
-- Run this in your Supabase SQL Editor

-- 1. Create strategy_calls table (MISSING - REQUIRED)
CREATE TABLE IF NOT EXISTS strategy_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    preferred_slots JSONB NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    admin_status TEXT DEFAULT 'pending' CHECK (admin_status IN ('pending', 'confirmed', 'rejected', 'completed')),
    confirmed_time TIMESTAMPTZ,
    meeting_link TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for strategy_calls
CREATE INDEX IF NOT EXISTS idx_strategy_calls_client_id ON strategy_calls(client_id);
CREATE INDEX IF NOT EXISTS idx_strategy_calls_admin_status ON strategy_calls(admin_status);
CREATE INDEX IF NOT EXISTS idx_strategy_calls_created_at ON strategy_calls(created_at);

-- 2. Ensure client_onboarding_20q table has all required columns
ALTER TABLE client_onboarding_20q 
ADD COLUMN IF NOT EXISTS target_job_titles JSONB,
ADD COLUMN IF NOT EXISTS target_industries JSONB,
ADD COLUMN IF NOT EXISTS target_locations JSONB,
ADD COLUMN IF NOT EXISTS remote_work_preference TEXT,
ADD COLUMN IF NOT EXISTS target_salary_range TEXT,
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
ADD COLUMN IF NOT EXISTS key_technical_skills JSONB,
ADD COLUMN IF NOT EXISTS soft_skills_strengths JSONB,
ADD COLUMN IF NOT EXISTS certifications_licenses TEXT,
ADD COLUMN IF NOT EXISTS job_search_timeline TEXT,
ADD COLUMN IF NOT EXISTS application_volume_preference TEXT,
ADD COLUMN IF NOT EXISTS networking_comfort_level INTEGER,
ADD COLUMN IF NOT EXISTS interview_confidence_level INTEGER,
ADD COLUMN IF NOT EXISTS career_goals_short_term TEXT,
ADD COLUMN IF NOT EXISTS career_goals_long_term TEXT,
ADD COLUMN IF NOT EXISTS biggest_career_challenges JSONB,
ADD COLUMN IF NOT EXISTS support_areas_needed JSONB,
ADD COLUMN IF NOT EXISTS salary_negotiation_comfort INTEGER,
ADD COLUMN IF NOT EXISTS current_salary_range TEXT;

-- 3. Ensure applications table exists with proper structure
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'in_review', 'interview_requested', 'interview_completed', 'offer_received', 'rejected', 'withdrawn')),
    date_applied DATE,
    application_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for applications
CREATE INDEX IF NOT EXISTS idx_applications_client_id ON applications(client_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);

-- 4. Ensure notifications table exists with proper structure
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 5. Add RLS policies for security (skip if already exist)
ALTER TABLE strategy_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_onboarding_20q ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Strategy calls policies (create only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strategy_calls' AND policyname = 'Users can view their own strategy calls') THEN
        CREATE POLICY "Users can view their own strategy calls" ON strategy_calls 
        FOR SELECT USING (client_id::text = auth.uid()::text);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strategy_calls' AND policyname = 'Users can create their own strategy calls') THEN
        CREATE POLICY "Users can create their own strategy calls" ON strategy_calls 
        FOR INSERT WITH CHECK (client_id::text = auth.uid()::text);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strategy_calls' AND policyname = 'Users can update their own strategy calls') THEN
        CREATE POLICY "Users can update their own strategy calls" ON strategy_calls 
        FOR UPDATE USING (client_id::text = auth.uid()::text);
    END IF;
END $$;

-- Client onboarding policies (create only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_onboarding_20q' AND policyname = 'Users can view their own onboarding') THEN
        CREATE POLICY "Users can view their own onboarding" ON client_onboarding_20q 
        FOR SELECT USING (user_id::text = auth.uid()::text);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_onboarding_20q' AND policyname = 'Users can create their own onboarding') THEN
        CREATE POLICY "Users can create their own onboarding" ON client_onboarding_20q 
        FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_onboarding_20q' AND policyname = 'Users can update their own onboarding') THEN
        CREATE POLICY "Users can update their own onboarding" ON client_onboarding_20q 
        FOR UPDATE USING (user_id::text = auth.uid()::text);
    END IF;
END $$;

-- Applications policies (create only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'applications' AND policyname = 'Users can view their own applications') THEN
        CREATE POLICY "Users can view their own applications" ON applications 
        FOR SELECT USING (client_id::text = auth.uid()::text);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'applications' AND policyname = 'Users can create their own applications') THEN
        CREATE POLICY "Users can create their own applications" ON applications 
        FOR INSERT WITH CHECK (client_id::text = auth.uid()::text);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'applications' AND policyname = 'Users can update their own applications') THEN
        CREATE POLICY "Users can update their own applications" ON applications 
        FOR UPDATE USING (client_id::text = auth.uid()::text);
    END IF;
END $$;

-- Notifications policies (create only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
        CREATE POLICY "Users can view their own notifications" ON notifications 
        FOR SELECT USING (user_id::text = auth.uid()::text);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications') THEN
        CREATE POLICY "Users can update their own notifications" ON notifications 
        FOR UPDATE USING (user_id::text = auth.uid()::text);
    END IF;
END $$;

-- 6. Add comments for documentation
COMMENT ON TABLE strategy_calls IS 'Strategy call booking and management system for client dashboard';
COMMENT ON TABLE client_onboarding_20q IS '20-question onboarding questionnaire for client profiling';
COMMENT ON TABLE applications IS 'Client job application tracking system';
COMMENT ON TABLE notifications IS 'User notification system for dashboard updates';

-- 7. Create a function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_strategy_calls_updated_at BEFORE UPDATE ON strategy_calls 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ CLIENT DASHBOARD SCHEMA APPLIED SUCCESSFULLY!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Created/Updated tables:';
    RAISE NOTICE '- strategy_calls (strategy call booking system)';
    RAISE NOTICE '- client_onboarding_20q (20-question onboarding)';
    RAISE NOTICE '- applications (job application tracking)';
    RAISE NOTICE '- notifications (user notifications)';
    RAISE NOTICE '';
    RAISE NOTICE 'Added RLS policies for security';
    RAISE NOTICE 'Added indexes for performance';
    RAISE NOTICE 'Added triggers for timestamp updates';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Client dashboard system ready for testing!';
END $$;