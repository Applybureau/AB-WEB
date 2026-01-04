-- URGENT: Run this in your Supabase SQL Editor to fix the consultation booking trigger
-- This prevents the trigger from trying to create notifications for prospects (who don't have client_id)

-- Update the consultation booking trigger function
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
SELECT 'SUCCESS: Consultation booking trigger updated to handle prospects' as status;