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

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'consultations' 
ORDER BY ordinal_position;