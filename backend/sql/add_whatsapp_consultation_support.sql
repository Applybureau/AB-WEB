-- Add WhatsApp support to consultations table
-- This adds communication method options and WhatsApp contact info

-- Add communication method column
ALTER TABLE consultations 
ADD COLUMN communication_method TEXT DEFAULT 'video_call' 
CHECK (communication_method IN ('video_call', 'whatsapp_call', 'phone_call'));

-- Add WhatsApp number column
ALTER TABLE consultations 
ADD COLUMN whatsapp_number TEXT;

-- Add admin WhatsApp number column for contact
ALTER TABLE consultations 
ADD COLUMN admin_whatsapp_number TEXT;

-- Update existing consultations to have default communication method
UPDATE consultations 
SET communication_method = 'video_call' 
WHERE communication_method IS NULL;

-- Add index for better query performance
CREATE INDEX idx_consultations_communication_method ON consultations(communication_method);

-- Add comments for documentation
COMMENT ON COLUMN consultations.communication_method IS 'Method of consultation: video_call (Google Meet/Zoom), whatsapp_call, or phone_call';
COMMENT ON COLUMN consultations.whatsapp_number IS 'Client WhatsApp number for WhatsApp calls';
COMMENT ON COLUMN consultations.admin_whatsapp_number IS 'Admin WhatsApp number to be shared with client';