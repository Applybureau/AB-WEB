-- NEW FLOW SCHEMA UPDATES - CORRECTED VERSION
-- Database schema updates to support the new client flow
-- This version works with the existing mixed schema (both registered_users and profiles tables)

-- 1. Strategy calls table should already exist, but let's ensure it has all needed columns
-- Add any missing columns to strategy_calls
ALTER TABLE strategy_calls 
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_action_by UUID REFERENCES registered_users(id),
ADD COLUMN IF NOT EXISTS admin_action_at TIMESTAMP WITH TIME ZONE;

-- 2. Add new columns to both user tables for file uploads
-- Add to registered_users table
ALTER TABLE registered_users 
ADD COLUMN IF NOT EXISTS linkedin_profile_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_urls JSONB DEFAULT '[]';

-- Add to profiles table as well (since both exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS linkedin_profile_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_urls JSONB DEFAULT '[]';

-- 3. Add new columns to client_onboarding_20q for confirmation tracking (if table exists)
ALTER TABLE client_onboarding_20q 
ADD COLUMN IF NOT EXISTS confirmation_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS confirmation_email_sent_by UUID REFERENCES registered_users(id),
ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMP WITH TIME ZONE;

-- 4. Add new columns to applications for enhanced tracking
-- The applications table has both client_id and user_id, so we'll use the existing columns
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS resume_version_used VARCHAR(255),
ADD COLUMN IF NOT EXISTS job_posting_link TEXT,
ADD COLUMN IF NOT EXISTS application_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS interview_notification_sent_at TIMESTAMP WITH TIME ZONE;

-- 5. Create application_status_history table for tracking status changes
CREATE TABLE IF NOT EXISTS application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES registered_users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Add indexes for application_status_history
CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_application_status_history_changed_at ON application_status_history(changed_at);

-- 6. Update applications status enum to include new statuses
-- Add check constraint for application status values (drop existing first)
ALTER TABLE applications 
DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications 
ADD CONSTRAINT applications_status_check 
CHECK (status IN (
    'pending',
    'under_review', 
    'approved', 
    'rejected', 
    'completed', 
    'cancelled', 
    'on_hold',
    'applied', 
    'in_review', 
    'interview_requested', 
    'interview_completed', 
    'offer_received', 
    'closed',
    'no_response'
));

-- 7. Create client_dashboard_settings table for personalization
CREATE TABLE IF NOT EXISTS client_dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES registered_users(id) ON DELETE CASCADE,
    show_strategy_call_reminder BOOLEAN DEFAULT TRUE,
    show_onboarding_reminder BOOLEAN DEFAULT TRUE,
    show_upload_reminders BOOLEAN DEFAULT TRUE,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    dashboard_theme VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id)
);

-- 8. Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES registered_users(id) ON DELETE CASCADE,
    interview_notifications BOOLEAN DEFAULT TRUE,
    status_update_notifications BOOLEAN DEFAULT TRUE,
    onboarding_notifications BOOLEAN DEFAULT TRUE,
    strategy_call_notifications BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 9. Add comments to document the new schema
COMMENT ON TABLE strategy_calls IS 'Strategy call booking and management system';
COMMENT ON TABLE application_status_history IS 'Track all status changes for applications with audit trail';
COMMENT ON TABLE client_dashboard_settings IS 'Client dashboard personalization settings';
COMMENT ON TABLE notification_preferences IS 'User notification preferences for different types of alerts';

COMMENT ON COLUMN registered_users.linkedin_profile_url IS 'Client LinkedIn profile URL (optional)';
COMMENT ON COLUMN registered_users.portfolio_urls IS 'Array of portfolio/website/GitHub URLs';
COMMENT ON COLUMN profiles.linkedin_profile_url IS 'Client LinkedIn profile URL (optional)';
COMMENT ON COLUMN profiles.portfolio_urls IS 'Array of portfolio/website/GitHub URLs';
COMMENT ON COLUMN client_onboarding_20q.confirmation_email_sent IS 'Track if onboarding confirmation email was sent';
COMMENT ON COLUMN applications.resume_version_used IS 'Which version of resume was used for this application';
COMMENT ON COLUMN applications.job_posting_link IS 'Link to the original job posting';
COMMENT ON COLUMN applications.application_method IS 'How the application was submitted (direct, linkedin, etc)';

-- 10. Create functions for automatic status history tracking
CREATE OR REPLACE FUNCTION track_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO application_status_history (
            application_id,
            previous_status,
            new_status,
            changed_at,
            notes
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NOW(),
            CASE 
                WHEN NEW.status = 'interview_requested' THEN 'Interview notification sent automatically'
                ELSE NULL
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic status history tracking
DROP TRIGGER IF EXISTS trigger_track_application_status_change ON applications;
CREATE TRIGGER trigger_track_application_status_change
    AFTER UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION track_application_status_change();

-- 11. Create function to get client dashboard summary (works with existing schema)
CREATE OR REPLACE FUNCTION get_client_dashboard_summary(client_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'strategy_calls', (
            SELECT json_build_object(
                'total', COUNT(*),
                'confirmed', COUNT(*) FILTER (WHERE admin_status = 'confirmed'),
                'latest_status', (
                    SELECT admin_status 
                    FROM strategy_calls 
                    WHERE client_id = client_user_id 
                    ORDER BY created_at DESC 
                    LIMIT 1
                )
            )
            FROM strategy_calls 
            WHERE client_id = client_user_id
        ),
        'applications', (
            SELECT json_build_object(
                'total', COUNT(*),
                'active', COUNT(*) FILTER (WHERE status IN ('applied', 'in_review', 'interview_requested', 'interview_completed')),
                'interviews', COUNT(*) FILTER (WHERE status IN ('interview_requested', 'interview_completed')),
                'offers', COUNT(*) FILTER (WHERE status = 'offer_received')
            )
            FROM applications 
            WHERE client_id = client_user_id OR user_id = client_user_id
        ),
        'onboarding', (
            SELECT json_build_object(
                'completed', COALESCE(ru.onboarding_completed, p.onboarding_completed, false),
                'profile_unlocked', COALESCE(ru.profile_unlocked, p.profile_approved, false)
            )
            FROM registered_users ru
            FULL OUTER JOIN profiles p ON ru.id = p.id
            WHERE ru.id = client_user_id OR p.id = client_user_id
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 12. Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM registered_users 
WHERE id NOT IN (SELECT user_id FROM notification_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- 13. Insert default dashboard settings for existing clients
INSERT INTO client_dashboard_settings (client_id)
SELECT id FROM registered_users 
WHERE role = 'client' 
AND id NOT IN (SELECT client_id FROM client_dashboard_settings WHERE client_id IS NOT NULL)
ON CONFLICT (client_id) DO NOTHING;

-- 14. Add indexes for new tables
CREATE INDEX IF NOT EXISTS idx_client_dashboard_settings_client_id ON client_dashboard_settings(client_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- 15. Success message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'NEW FLOW SCHEMA UPDATES COMPLETED!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Updated tables: strategy_calls, registered_users, profiles, applications, client_onboarding_20q';
    RAISE NOTICE 'Created tables: application_status_history, client_dashboard_settings, notification_preferences';
    RAISE NOTICE 'Added functions: track_application_status_change, get_client_dashboard_summary';
    RAISE NOTICE 'Added triggers: automatic status history tracking';
    RAISE NOTICE '==============================================';
END $$;