-- =====================================================
-- ENHANCED APPLY BUREAU FEATURES
-- Real-time dashboards, messaging, and Google Meet integration
-- =====================================================

-- Add Google Meet integration to consultations
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS google_meet_link TEXT,
ADD COLUMN IF NOT EXISTS google_meet_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS meeting_created_at TIMESTAMP WITH TIME ZONE;

-- Enhanced messages table for real-time chat
DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Participants
    sender_id UUID NOT NULL, -- Can be admin or client
    sender_type user_role NOT NULL, -- 'admin' or 'client'
    recipient_id UUID NOT NULL, -- Can be admin or client
    recipient_type user_role NOT NULL, -- 'admin' or 'client'
    
    -- Message content
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'file', 'system', 'meeting_link'
    
    -- Related entities
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- File attachment (if any)
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    attachment_size INTEGER,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_message_length CHECK (char_length(message_text) > 0 AND char_length(message_text) <= 5000)
);

-- Real-time notifications with enhanced types
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Recipient
    user_id UUID NOT NULL, -- Can be admin or client
    user_type user_role NOT NULL, -- 'admin' or 'client'
    
    -- Notification details
    type VARCHAR(100) NOT NULL, -- 'message', 'consultation', 'application', 'system', 'meeting_reminder'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entities
    related_consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
    related_application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    related_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    
    -- Status and priority
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    
    -- Real-time delivery
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_method VARCHAR(50) DEFAULT 'dashboard', -- 'dashboard', 'email', 'push', 'sms'
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Dashboard activity log for real-time updates
CREATE TABLE IF NOT EXISTS dashboard_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- User who performed the action
    user_id UUID NOT NULL,
    user_type user_role NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    
    -- Activity details
    activity_type VARCHAR(100) NOT NULL, -- 'login', 'consultation_booked', 'message_sent', 'application_updated'
    activity_description TEXT NOT NULL,
    
    -- Related entities
    related_consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    related_application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    related_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin management table for multiple admins
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"can_create_admins": false, "can_manage_clients": true, "can_view_analytics": true}',
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "dashboard": true, "meeting_reminders": true}';

-- Client enhancements for dashboard
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "dashboard": true, "meeting_reminders": true}',
ADD COLUMN IF NOT EXISTS dashboard_theme VARCHAR(20) DEFAULT 'light'; -- 'light', 'dark'

-- =====================================================
-- ENHANCED FUNCTIONS FOR REAL-TIME FEATURES
-- =====================================================

-- Function to create enhanced notifications
CREATE OR REPLACE FUNCTION create_enhanced_notification(
    p_user_id UUID,
    p_user_type text,
    p_type text,
    p_title text,
    p_message text,
    p_priority text DEFAULT 'normal',
    p_consultation_id UUID DEFAULT NULL,
    p_application_id UUID DEFAULT NULL,
    p_message_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id, user_type, type, title, message, priority,
        related_consultation_id, related_application_id, related_message_id
    ) VALUES (
        p_user_id, p_user_type::user_role, p_type, p_title, p_message, p_priority,
        p_consultation_id, p_application_id, p_message_id
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log dashboard activities
CREATE OR REPLACE FUNCTION log_dashboard_activity(
    p_user_id UUID,
    p_user_type text,
    p_user_name text,
    p_activity_type text,
    p_activity_description text,
    p_consultation_id UUID DEFAULT NULL,
    p_application_id UUID DEFAULT NULL,
    p_client_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO dashboard_activities (
        user_id, user_type, user_name, activity_type, activity_description,
        related_consultation_id, related_application_id, related_client_id
    ) VALUES (
        p_user_id, p_user_type::user_role, p_user_name, p_activity_type, p_activity_description,
        p_consultation_id, p_application_id, p_client_id
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced consultation booking trigger with Google Meet
CREATE OR REPLACE FUNCTION handle_enhanced_consultation_booking() RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for client (if exists)
    IF NEW.client_id IS NOT NULL THEN
        PERFORM create_enhanced_notification(
            NEW.client_id,
            'client',
            'consultation',
            'Consultation Scheduled',
            'Your consultation has been scheduled for ' || 
            to_char(NEW.scheduled_at, 'FMDay, FMMonth DD, YYYY at HH12:MI AM'),
            'high',
            NEW.id,
            NULL,
            NULL
        );
    END IF;
    
    -- Create notification for all active admins
    INSERT INTO notifications (user_id, user_type, type, title, message, priority, related_consultation_id)
    SELECT 
        a.id,
        'admin'::user_role,
        'consultation',
        'New Consultation Booking',
        CASE 
            WHEN NEW.prospect_name IS NOT NULL THEN 
                'New prospect consultation: ' || NEW.prospect_name || ' (' || NEW.prospect_email || ')'
            ELSE 
                'Client consultation scheduled'
        END,
        'high',
        NEW.id
    FROM admins a 
    WHERE a.is_active = true;
    
    -- Log activity
    PERFORM log_dashboard_activity(
        COALESCE(NEW.client_id, (SELECT id FROM admins WHERE is_active = true LIMIT 1)),
        CASE WHEN NEW.client_id IS NOT NULL THEN 'client' ELSE 'admin' END,
        COALESCE(NEW.prospect_name, 'System'),
        'consultation_booked',
        'New consultation scheduled for ' || to_char(NEW.scheduled_at, 'FMDay, FMMonth DD, YYYY at HH12:MI AM'),
        NEW.id,
        NULL,
        NEW.client_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced message trigger for real-time notifications
CREATE OR REPLACE FUNCTION handle_new_message() RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for recipient
    PERFORM create_enhanced_notification(
        NEW.recipient_id,
        NEW.recipient_type,
        'message',
        'New Message',
        CASE 
            WHEN NEW.sender_type = 'admin' THEN 'You have a new message from your advisor'
            ELSE 'You have a new message from your client'
        END,
        'normal',
        NEW.consultation_id,
        NEW.application_id,
        NEW.id
    );
    
    -- Log activity
    PERFORM log_dashboard_activity(
        NEW.sender_id,
        NEW.sender_type,
        'User', -- Will be updated with actual name in application
        'message_sent',
        'Sent a message: ' || LEFT(NEW.message_text, 50) || CASE WHEN LENGTH(NEW.message_text) > 50 THEN '...' ELSE '' END,
        NEW.consultation_id,
        NEW.application_id,
        CASE WHEN NEW.recipient_type = 'client' THEN NEW.recipient_id ELSE NULL END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Drop old triggers
DROP TRIGGER IF EXISTS consultation_booking_trigger ON consultations;
DROP TRIGGER IF EXISTS new_message_trigger ON messages;

-- Create enhanced triggers
CREATE TRIGGER enhanced_consultation_booking_trigger
    AFTER INSERT ON consultations
    FOR EACH ROW EXECUTE FUNCTION handle_enhanced_consultation_booking();

CREATE TRIGGER enhanced_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION handle_new_message();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for real-time queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, user_type, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_activities_recent ON dashboard_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_upcoming ON consultations(scheduled_at) WHERE status = 'scheduled';

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_activities ENABLE ROW LEVEL SECURITY;

-- Basic policies (can be enhanced later)
CREATE POLICY "Users can see their own messages" ON messages FOR ALL USING (
    (sender_id = auth.uid()) OR (recipient_id = auth.uid())
);

CREATE POLICY "Users can see their own notifications" ON notifications FOR ALL USING (
    user_id = auth.uid()
);

CREATE POLICY "Admins can see all activities" ON dashboard_activities FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = true)
);

-- Success message
SELECT 'SUCCESS: Enhanced Apply Bureau schema with real-time features created!' as status;