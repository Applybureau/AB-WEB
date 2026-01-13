-- Add message field to consultation_requests table for new booking payload
-- This supports the updated consultation request format: name, email, phone, message

-- Add message column to consultation_requests table
ALTER TABLE consultation_requests 
ADD COLUMN IF NOT EXISTS message TEXT;

-- Add comment to document the field
COMMENT ON COLUMN consultation_requests.message IS 'Brief message from client during consultation request';

-- Update any existing records to have null message (they will show "No message provided" in UI)
-- No need to update existing records as NULL is acceptable

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'consultation_requests' 
AND column_name = 'message';

-- Show sample of table structure
SELECT 
  id,
  full_name,
  email,
  phone,
  message,
  preferred_slots,
  admin_status,
  status,
  created_at
FROM consultation_requests 
LIMIT 1;