-- =====================================================
-- COMPLETE ENHANCED APPLY BUREAU SCHEMA
-- Includes all tables + enhanced real-time features
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables safely
DROP TABLE IF EXISTS dashboard_activities CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Drop existing functions safely
DROP FUNCTION IF EXISTS handle_enhanced_consultation_booking() CASCADE;
DROP FUNCTION IF EXISTS handle_new_message() CASCADE;
DROP FUNCTION IF EXISTS create_enhanced_notification(UUID, text, text, text, text, UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS log_dashboard_activity(UUID, text, text, text, text, UUID, UUID, UUID) CASCADE;

-- Create ENUM types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE client_status AS ENUM ('invited', 'active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE consultation_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('applied', 'interview', 'offer', 'rejected', 'withdrawn');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Admins table with enhanced features
CREATE TABLE admins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Enhanced admin features
    permissions JSONB DEFAULT '{"can_create_admins": false, "can_manage_clients": true, "can_view_analytics": true}',
    last_active_at TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{"email": true, "dashboard": true, "meeting_reminders": true}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table with enhanced features
CREATE TABLE clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password VARCHAR(255) NOT NULL,
    status client_status DEFAULT 'invited',
    assigned_advisor_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    role user_role DEFAULT 'client',
    
    -- Enhanced client features
    last_active_at TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{"email": true, "dashboard": true, "meeting_reminders": true}',
    dashboard_theme VARCHAR(20) DEFAULT 'light',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultations table with Google Meet support
CREATE TABLE consultations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Participants
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    
    -- Prospect Information (for pre-client bookings)
    prospect_name VARCHAR(255),
    prospect_email VARCHAR(255),
    prospect_phone VARCHAR(50),
    
    -- Consultation Details
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    consultation_type VARCHAR(100) DEFAULT 'initial',
    
    -- Google Meet integration
    google_meet_link TEXT,
    google_meet_id VARCHAR(255),
    meeting_created_at TIMESTAMP WITH TIME ZONE,
    
    -- Status & Notes
    status consultation_status DEFAULT 'scheduled',
    client_reason TEXT,
    admin_notes TEXT,
    client_summary TEXT,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480),
    CONSTRAINT valid_scheduled_time CHECK (scheduled_at > created_at),
    CONSTRAINT prospect_or_client_required CHECK (
        (client_id IS NOT NULL) OR 
        (prospect_name IS NOT NULL AND prospect_email IS NOT NULL)
    )
);

-- Applications table
CREATE TABLE applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Relationships
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    applied_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    
    -- Job Details
    job_title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    job_url TEXT,
    job_description TEXT,
    
    -- Application Details
    date_applied DATE NOT NULL,
    status application_status DEFAULT 'applied',
    
    -- Notes
    admin_notes TEXT,
    client_notes TEXT,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced messages table for real-time chat
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Participants
    sender_id UUID NOT NULL,
    sender_type user_role NOT NULL,
    recipient_id UUID NOT NULL,
    recipient_type user_role NOT NULL,
    
    -- Message content
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    
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

-- Enhanced notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Recipient
    user_id UUID NOT NULL,
    user_type user_role NOT NULL,
    
    -- Notification details
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entities
    related_consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
    related_application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    related_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    
    -- Status and priority
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- Real-time delivery
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_method VARCHAR(50) DEFAULT 'dashboard',
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Dashboard activity log for real-time updates
CREATE TABLE dashboard_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- User who performed the action
    user_id UUID NOT NULL,
    user_type user_role NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    
    -- Activity details
    activity_type VARCHAR(100) NOT NULL,
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
        'User',
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

-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_activities ENABLE ROW LEVEL SECURITY;

-- Basic policies (allow all for now - can be enhanced later)
CREATE POLICY "Allow all for admins" ON admins FOR ALL USING (true);
CREATE POLICY "Allow all for clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all for consultations" ON consultations FOR ALL USING (true);
CREATE POLICY "Allow all for applications" ON applications FOR ALL USING (true);
CREATE POLICY "Allow all for messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all for notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Allow all for dashboard_activities" ON dashboard_activities FOR ALL USING (true);

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Create admin user with proper password hash
INSERT INTO admins (full_name, email, password, is_active) VALUES 
('Israel Loko', 'israelloko65@gmail.com', '$2a$10$2QCwQKgE8DR9C7q748wsY.IXnMAtQvgXlRXIsgDow4tajW9ifyGbC', true)
ON CONFLICT (email) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    password = EXCLUDED.password,
    is_active = EXCLUDED.is_active;

-- Success message
SELECT 'SUCCESS: Complete Enhanced Apply Bureau schema created successfully!' as status,
       'Features: Real-time dashboards, WebSocket messaging, Google Meet integration, Enhanced notifications' as features;