-- =====================================================
-- APPLICATION LOGGING DATABASE SCHEMA FIX
-- =====================================================
-- This script fixes the client_id vs user_id mismatch in the applications table
-- Run this in your Supabase SQL editor

-- Step 1: Check current applications table structure
-- (Run this first to see current state)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'applications' 
ORDER BY ordinal_position;

-- Step 2: Check if applications table exists and has data
SELECT COUNT(*) as total_applications FROM applications;

-- Step 3: Fix the schema - Option A (Recommended)
-- Add user_id column if it doesn't exist and populate it from client_id
DO $$
BEGIN
    -- Check if user_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' AND column_name = 'user_id'
    ) THEN
        -- Add user_id column
        ALTER TABLE applications ADD COLUMN user_id UUID;
        
        -- Copy data from client_id to user_id if client_id exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'applications' AND column_name = 'client_id'
        ) THEN
            UPDATE applications SET user_id = client_id WHERE client_id IS NOT NULL;
        END IF;
        
        -- Add foreign key constraint to auth.users
        ALTER TABLE applications 
        ADD CONSTRAINT fk_applications_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added user_id column and populated from client_id';
    ELSE
        RAISE NOTICE 'user_id column already exists';
    END IF;
END $$;

-- Step 4: Make user_id NOT NULL if we have data
DO $$
BEGIN
    -- Only make NOT NULL if we have data and all rows have user_id
    IF (SELECT COUNT(*) FROM applications WHERE user_id IS NULL) = 0 
       AND (SELECT COUNT(*) FROM applications) > 0 THEN
        ALTER TABLE applications ALTER COLUMN user_id SET NOT NULL;
        RAISE NOTICE 'Set user_id as NOT NULL';
    ELSE
        RAISE NOTICE 'Skipped NOT NULL constraint - some rows have NULL user_id';
    END IF;
END $$;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);

-- Step 6: Ensure applications table has all required columns
DO $$
BEGIN
    -- Add missing columns if they don't exist
    
    -- Basic application info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'type') THEN
        ALTER TABLE applications ADD COLUMN type VARCHAR(50) DEFAULT 'job_application';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'title') THEN
        ALTER TABLE applications ADD COLUMN title TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'description') THEN
        ALTER TABLE applications ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'status') THEN
        ALTER TABLE applications ADD COLUMN status VARCHAR(50) DEFAULT 'applied';
    END IF;
    
    -- Timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'created_at') THEN
        ALTER TABLE applications ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'updated_at') THEN
        ALTER TABLE applications ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Admin fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'admin_notes') THEN
        ALTER TABLE applications ADD COLUMN admin_notes TEXT;
    END IF;
    
    RAISE NOTICE 'Ensured all required columns exist';
END $$;

-- Step 7: Create or update the applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'job_application',
    title TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'applied',
    priority VARCHAR(20) DEFAULT 'medium',
    
    -- Job details
    company_name TEXT,
    job_title TEXT,
    job_url TEXT,
    salary_range TEXT,
    location TEXT,
    job_type VARCHAR(50) DEFAULT 'full-time',
    
    -- Application details
    application_date TIMESTAMPTZ DEFAULT NOW(),
    application_method VARCHAR(100),
    application_strategy TEXT,
    
    -- Documents
    tailored_resume_url TEXT,
    cover_letter_url TEXT,
    documents JSONB DEFAULT '[]',
    
    -- Status tracking
    interview_date TIMESTAMPTZ,
    offer_amount DECIMAL(10,2),
    
    -- Notes
    notes TEXT,
    admin_notes TEXT,
    internal_notes TEXT,
    rejection_reason TEXT,
    
    -- Metadata
    tags TEXT[],
    deadline TIMESTAMPTZ,
    
    -- Admin tracking
    approved_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 8: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Enable Row Level Security (RLS)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
CREATE POLICY "Users can view their own applications" ON applications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own applications" ON applications;
CREATE POLICY "Users can insert their own applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own applications" ON applications;
CREATE POLICY "Users can update their own applications" ON applications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can insert applications" ON applications;
CREATE POLICY "Admins can insert applications" ON applications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update all applications" ON applications;
CREATE POLICY "Admins can update all applications" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Step 11: Verify the fix
SELECT 
    'Applications table structure:' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'applications' 
AND column_name IN ('id', 'user_id', 'client_id', 'type', 'title', 'status', 'created_at')
ORDER BY ordinal_position;

-- Final verification query
SELECT 
    COUNT(*) as total_applications,
    COUNT(user_id) as applications_with_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as applications_missing_user_id
FROM applications;

-- Success message
SELECT 'Database schema fix completed successfully!' as result;