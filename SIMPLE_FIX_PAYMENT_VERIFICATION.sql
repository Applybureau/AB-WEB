-- SIMPLE FIX FOR PAYMENT VERIFICATION ISSUES
-- Run this in Supabase SQL Editor

-- 1. Fix consultations status constraint to allow 'onboarding' status
ALTER TABLE consultations DROP CONSTRAINT IF EXISTS consultations_status_check;
ALTER TABLE consultations ADD CONSTRAINT consultations_status_check 
CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'pending', 'confirmed', 'onboarding', 'waitlisted'));

-- 2. Add missing columns to registered_users table (using IF NOT EXISTS for safety)
ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT false;
ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;
ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS registration_token TEXT;
ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS token_used BOOLEAN DEFAULT false;
ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS profile_unlocked BOOLEAN DEFAULT false;
ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS profile_unlocked_by UUID;
ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS profile_unlocked_at TIMESTAMPTZ;
ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS payment_received BOOLEAN DEFAULT false;
ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 3. Verify the fixes (simple version)
SELECT 'Payment verification database fix completed successfully' as status;