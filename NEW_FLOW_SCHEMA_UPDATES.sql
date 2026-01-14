-- NEW FLOW SCHEMA UPDATES
-- Database schema updates to support the new client flow

-- 1. Create strategy_calls table
CREATE TABLE IF NOT EXISTS strategy_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    preferred_slots JSONB DEFAULT '[]',
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    admin_status VARCHAR(20) DEFAULT 'pending',
    confirmed_time TIMESTAMP WITH TIME ZONE,
    meeting_link TEXT,
    admin_notes TEXT,
    admin_action_by UUID REFERENCES auth.users(id),
    admin_action_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for strategy_calls
CREATE INDEX IF NOT EXISTS idx_strategy_calls_client_id ON strategy_calls(client_id);
CREATE INDEX IF NOT EXISTS idx_strategy_calls_admin_status ON strategy_calls(admin_status);
CREATE INDEX IF NOT EXISTS idx_strategy_calls_created_at ON strategy_calls(created_at);

-- 2. Add new columns to registered_users for file uploads
-- Note: Using profiles table instead of registered_users as per master schema
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS linkedin_profile_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_urls JSONB DEFAULT '[]';

-- 3. Note: client_onboarding_20q table handling moved to separate concierge schema

-- 4. Add new columns to applications for enhanced tracking
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
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Add indexes for application_status_history
CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_application_status_history_changed_at ON application_status_history(changed_at);

-- 6. Update applications status enum to include new statuses
-- Note: This would need to be done manually in Supabase if using enum types
-- For now, we'll use VARCHAR with check constraints

-- Add check constraint for application status values
ALTER TABLE applications 
DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications 
ADD CONSTRAINT applications_status_check 
CHECK (status IN (
    'applied', 
    'in_review', 
    'interview_requested', 
    'interview_completed', 
    'offer_received', 
    'closed',
    'rejected',
    'no_response'
));

-- 7. Create client_dashboard_settings table for personalization
CREATE TABLE IF NOT EXISTS client_dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

COMMENT ON COLUMN profiles.linkedin_profile_url IS 'Client LinkedIn profile URL (optional)';
COMMENT ON COLUMN profiles.portfolio_urls IS 'Array of portfolio/website/GitHub URLs';
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

-- 11. Create function to get client dashboard summary
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
            WHERE user_id = client_user_id
        ),
        'onboarding', (
            SELECT json_build_object(
                'completed', onboarding_completed,
                'profile_unlocked', profile_approved
            )
            FROM profiles
            WHERE id = client_user_id
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 12. Grant necessary permissions (adjust as needed for your setup)
-- These would typically be handled by your database admin or Supabase RLS policies

-- Example RLS policies (uncomment and adjust as needed):
-- ALTER TABLE strategy_calls ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE client_dashboard_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy examples:
-- CREATE POLICY "Users can view their own strategy calls" ON strategy_calls FOR SELECT USING (client_id = auth.uid());
-- CREATE POLICY "Users can create their own strategy calls" ON strategy_calls FOR INSERT WITH CHECK (client_id = auth.uid());
-- CREATE POLICY "Admins can view all strategy calls" ON strategy_calls FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 13. Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- 14. Insert default dashboard settings for existing clients
INSERT INTO client_dashboard_settings (client_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT client_id FROM client_dashboard_settings)
ON CONFLICT (client_id) DO NOTHING;