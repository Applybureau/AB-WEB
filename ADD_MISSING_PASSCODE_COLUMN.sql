-- Add missing passcode_hash column to registered_users table
-- Run this in Supabase SQL Editor

ALTER TABLE registered_users ADD COLUMN IF NOT EXISTS passcode_hash TEXT;

-- Verify completion
SELECT 'Passcode hash column added successfully' as status;