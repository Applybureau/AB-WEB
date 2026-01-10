-- Add current_country field to consultation_requests table
-- Run this in Supabase SQL Editor

-- Add the current_country column
ALTER TABLE consultation_requests 
ADD COLUMN current_country TEXT;

-- Add a comment to document the field
COMMENT ON COLUMN consultation_requests.current_country IS 'The country where the client is currently located';

-- Create an index for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_consultation_requests_current_country 
ON consultation_requests(current_country);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'consultation_requests' 
AND column_name = 'current_country';