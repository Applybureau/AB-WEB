-- ============================================
-- ADD READ TRACKING TO CLIENT ONBOARDING
-- ============================================
-- This adds fields to track when admin views 20Q responses
-- Status will change from "pending_approval" to "read" when viewed

-- Add read tracking columns if they don't exist
DO $$ 
BEGIN
    -- Add read_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_onboarding' 
        AND column_name = 'read_at'
    ) THEN
        ALTER TABLE client_onboarding 
        ADD COLUMN read_at TIMESTAMPTZ;
    END IF;

    -- Add read_by column (admin who viewed it)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_onboarding' 
        AND column_name = 'read_by'
    ) THEN
        ALTER TABLE client_onboarding 
        ADD COLUMN read_by UUID REFERENCES registered_users(id);
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN client_onboarding.read_at IS 'Timestamp when admin first viewed the 20Q responses';
COMMENT ON COLUMN client_onboarding.read_by IS 'Admin user ID who first viewed the 20Q responses';

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'client_onboarding'
AND column_name IN ('read_at', 'read_by')
ORDER BY column_name;
