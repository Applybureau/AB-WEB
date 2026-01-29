-- Fix Clients Table Schema
-- Add missing columns that are referenced in the application code

-- Add payment_confirmed column (referenced in code but missing)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT FALSE;

-- Add payment_confirmed_at column for consistency
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;

-- Add profile_unlocked_at column for consistency
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS profile_unlocked_at TIMESTAMPTZ;

-- Add profile_unlocked_by column for tracking who unlocked
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS profile_unlocked_by UUID;

-- Update existing records to sync payment_confirmed with payment_verified
UPDATE clients 
SET payment_confirmed = payment_verified,
    payment_confirmed_at = CASE 
        WHEN payment_verified = TRUE THEN COALESCE(updated_at, created_at)
        ELSE NULL 
    END
WHERE payment_confirmed IS NULL OR payment_confirmed != payment_verified;

-- Update profile_unlocked_at for existing unlocked profiles
UPDATE clients 
SET profile_unlocked_at = COALESCE(updated_at, created_at)
WHERE profile_unlocked = TRUE AND profile_unlocked_at IS NULL;

-- Create index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_profile_unlocked ON clients(profile_unlocked);
CREATE INDEX IF NOT EXISTS idx_clients_payment_confirmed ON clients(payment_confirmed);

-- Add comments for documentation
COMMENT ON COLUMN clients.payment_confirmed IS 'Whether payment has been confirmed (synced with payment_verified)';
COMMENT ON COLUMN clients.payment_confirmed_at IS 'Timestamp when payment was confirmed';
COMMENT ON COLUMN clients.profile_unlocked_at IS 'Timestamp when profile was unlocked';
COMMENT ON COLUMN clients.profile_unlocked_by IS 'ID of admin who unlocked the profile';

-- Ensure data consistency
-- Set default values for important fields
UPDATE clients 
SET 
    is_active = COALESCE(is_active, TRUE),
    status = COALESCE(status, 'active'),
    onboarding_complete = COALESCE(onboarding_complete, FALSE),
    profile_unlocked = COALESCE(profile_unlocked, FALSE),
    payment_verified = COALESCE(payment_verified, FALSE),
    payment_confirmed = COALESCE(payment_confirmed, FALSE),
    email_verified = COALESCE(email_verified, FALSE)
WHERE 
    is_active IS NULL OR 
    status IS NULL OR 
    onboarding_complete IS NULL OR 
    profile_unlocked IS NULL OR 
    payment_verified IS NULL OR 
    payment_confirmed IS NULL OR 
    email_verified IS NULL;