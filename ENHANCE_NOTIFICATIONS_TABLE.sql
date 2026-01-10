-- Enhance notifications table for comprehensive notification system
-- Run this in Supabase SQL Editor

-- Add new columns to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'system',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS action_text TEXT;

-- Add constraints for enum-like values
ALTER TABLE notifications 
ADD CONSTRAINT check_category 
CHECK (category IN ('consultation', 'application', 'admin', 'system', 'file', 'meeting'));

ALTER TABLE notifications 
ADD CONSTRAINT check_priority 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN notifications.type IS 'Specific notification type (e.g., consultation_submitted, application_updated)';
COMMENT ON COLUMN notifications.category IS 'Notification category for grouping (consultation, application, admin, system, file, meeting)';
COMMENT ON COLUMN notifications.priority IS 'Notification priority level (low, medium, high, urgent)';
COMMENT ON COLUMN notifications.metadata IS 'Additional structured data related to the notification';
COMMENT ON COLUMN notifications.action_url IS 'URL for the primary action button';
COMMENT ON COLUMN notifications.action_text IS 'Text for the primary action button';

-- Create a function to automatically clean up old notifications (optional)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM notifications 
  WHERE is_read = true 
  AND created_at < NOW() - INTERVAL '30 days';
  
  -- Delete unread notifications older than 90 days
  DELETE FROM notifications 
  WHERE is_read = false 
  AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;