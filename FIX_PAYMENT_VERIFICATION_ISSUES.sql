-- FIX PAYMENT VERIFICATION ISSUES
-- Run this in Supabase SQL Editor

-- 1. Fix consultations status constraint to allow 'onboarding' status
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_status_check;
ALTER TABLE consultations ADD CONSTRAINT consultations_status_check 
CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'pending', 'confirmed', 'onboarding', 'waitlisted'));

-- 2. Add missing columns to registered_users table if they don't exist
DO $$ 
BEGIN
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registered_users' AND column_name = 'is_active') THEN
        ALTER TABLE registered_users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add payment_confirmed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registered_users' AND column_name = 'payment_confirmed') THEN
        ALTER TABLE registered_users ADD COLUMN payment_confirmed BOOLEAN DEFAULT false;
    END IF;
    
    -- Add payment_confirmed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registered_users' AND column_name = 'payment_confirmed_at') THEN
        ALTER TABLE registered_users ADD COLUMN payment_confirmed_at TIMESTAMPTZ;
    END IF;
    
    -- Add registration_token column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registered_users' AND column_name = 'registration_token') THEN
        ALTER TABLE registered_users ADD COLUMN registration_token TEXT;
    END IF;
    
    -- Add token_expires_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registered_users' AND column_name = 'token_expires_at') THEN
        ALTER TABLE registered_users ADD COLUMN token_expires_at TIMESTAMPTZ;
    END IF;
    
    -- Add token_used column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registered_users' AND column_name = 'token_used') THEN
        ALTER TABLE registered_users ADD COLUMN token_used BOOLEAN DEFAULT false;
    END IF;
    
    -- Add profile_unlocked column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registered_users' AND column_name = 'profile_unlocked') THEN
        ALTER TABLE registered_users ADD COLUMN profile_unlocked BOOLEAN DEFAULT false;
    END IF;
    
    -- Add profile_unlocked_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registered_users' AND column_name = 'profile_unlocked_by') THEN
        ALTER TABLE registered_users ADD COLUMN profile_unlocked_by UUID;
    END IF;
    
    -- Add profile_unlocked_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registered_users' AND column_name = 'profile_unlocked_at') THEN
        ALTER TABLE registered_users ADD COLUMN profile_unlocked_at TIMESTAMPTZ;
    END IF;
    
    -- Add payment_received column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registered_users' AND column_name = 'payment_received') THEN
        ALTER TABLE registered_users ADD COLUMN payment_received BOOLEAN DEFAULT false;
    END IF;
    
    -- Add onboarding_completed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'registered_users' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE registered_users ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Verify the fixes
SELECT 'Consultations status constraint updated' as fix_1;
SELECT 'Missing columns added to registered_users' as fix_2;

-- 4. Show current registered_users table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'registered_users' 
ORDER BY ordinal_position;

-- 5. Show current consultations status constraint
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'consultations_status_check';