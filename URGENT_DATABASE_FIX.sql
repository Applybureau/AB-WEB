-- URGENT: Run this in your Supabase SQL Editor to fix the consultations table
-- This adds the missing columns needed for the consultation booking to work

-- Add missing prospect columns to consultations table
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS prospect_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS prospect_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS prospect_phone VARCHAR(50);

-- Add constraint to ensure either client_id or prospect info is provided
ALTER TABLE consultations 
DROP CONSTRAINT IF EXISTS prospect_or_client_required;

ALTER TABLE consultations 
ADD CONSTRAINT prospect_or_client_required CHECK (
    (client_id IS NOT NULL) OR 
    (prospect_name IS NOT NULL AND prospect_email IS NOT NULL)
);

-- Verify the fix worked
SELECT 'SUCCESS: Consultations table updated' as status;