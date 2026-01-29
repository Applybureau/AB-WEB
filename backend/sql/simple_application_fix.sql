-- =====================================================
-- SIMPLE APPLICATION SCHEMA FIX
-- =====================================================
-- Run this in your Supabase SQL editor
-- This is a simpler version that just fixes the immediate issue

-- Option 1: If you want to keep using client_id (RECOMMENDED)
-- Just add user_id column and copy data from client_id

-- Add user_id column if it doesn't exist
ALTER TABLE applications ADD COLUMN IF NOT EXISTS user_id UUID;

-- Copy client_id to user_id for existing records
UPDATE applications SET user_id = client_id WHERE client_id IS NOT NULL AND user_id IS NULL;

-- Add foreign key constraint
ALTER TABLE applications 
ADD CONSTRAINT IF NOT EXISTS fk_applications_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);

-- Verify the fix
SELECT 
    COUNT(*) as total_applications,
    COUNT(user_id) as with_user_id,
    COUNT(client_id) as with_client_id
FROM applications;

SELECT 'Simple fix completed - applications table now has both user_id and client_id columns' as result;