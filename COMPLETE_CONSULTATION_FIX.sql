-- COMPLETE FIX: Run this in your Supabase SQL Editor to fix consultation booking
-- This includes both the missing columns and the trigger fix

-- Step 1: Add missing prospect columns to consultations table
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS prospect_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS prospect_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS prospect_phone VARCHAR(50);

-- Step 2: Add constraint to ensure either client_id or prospect info is provided
ALTER TABLE consultations 
DROP CONSTRAINT IF EXISTS prospect_or_client_required;

ALTER TABLE consultations 
ADD CONSTRAINT prospect_or_client_required CHECK (
    (client_id IS NOT NULL) OR 
    (prospect_name IS NOT NULL AND prospect_email IS NOT NULL)
);

-- Step 3: Update the consultation booking trigger function
CREATE OR REPLACE FUNCTION handle_consultation_booking() RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification if there's a client_id (not for prospect bookings)
    IF NEW.client_id IS NOT NULL THEN
        PERFORM create_notification(
            NEW.client_id,
            'consultation_booked',
            'Consultation Scheduled',
            'Your consultation has been scheduled for ' || 
            to_char(NEW.scheduled_at, 'FMDay, FMMonth DD, YYYY at HH12:MI AM'),
            NULL,
            NEW.id,
            NULL
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the fix worked
SELECT 'SUCCESS: Complete consultation booking system fixed' as status;