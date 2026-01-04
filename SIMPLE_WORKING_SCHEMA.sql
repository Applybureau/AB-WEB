-- =====================================================
-- SIMPLE APPLY BUREAU SCHEMA - CONSULTATION BOOKING FOCUS
-- This creates just what we need to get consultation booking working
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables safely
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Drop existing functions safely
DROP FUNCTION IF EXISTS handle_consultation_booking() CASCADE;
DROP FUNCTION IF EXISTS create_notification(UUID, text, text, text, UUID, UUID, UUID) CASCADE;

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
    CREATE TYPE notification_type AS ENUM ('consultation_booked', 'application_update', 'message_received', 'system_alert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Admins table
CREATE TABLE admins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password VARCHAR(255) NOT NULL,
    status client_status DEFAULT 'invited',
    assigned_advisor_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    role user_role DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultations table with prospect support
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
    
    -- Status & Notes
    status consultation_status DEFAULT 'scheduled',
    client_reason TEXT,
    admin_notes TEXT,
    
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

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Simple notification creation function
CREATE OR REPLACE FUNCTION create_notification(
    p_client_id UUID,
    p_type text,
    p_title text,
    p_message text,
    p_related_consultation_id UUID DEFAULT NULL,
    p_related_application_id UUID DEFAULT NULL,
    p_related_message_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    -- Only create notification if client exists
    IF p_client_id IS NOT NULL THEN
        INSERT INTO notifications (client_id, type, title, message)
        VALUES (p_client_id, p_type::notification_type, p_title, p_message)
        RETURNING id INTO notification_id;
    END IF;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fixed consultation booking trigger
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
            NEW.id,
            NULL,
            NULL
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER consultation_booking_trigger
    AFTER INSERT ON consultations
    FOR EACH ROW EXECUTE FUNCTION handle_consultation_booking();

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Create admin user
INSERT INTO admins (full_name, email, password, is_active) VALUES 
('Israel Loko', 'israelloko65@gmail.com', '$2b$10$rQZ9vKzX8fGHQJQYQJQYQOzX8fGHQJQYQJQYQOzX8fGHQJQYQJQYQO', true)
ON CONFLICT (email) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    password = EXCLUDED.password,
    is_active = EXCLUDED.is_active;

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for now - can be tightened later)
CREATE POLICY "Allow all for admins" ON admins FOR ALL USING (true);
CREATE POLICY "Allow all for clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all for consultations" ON consultations FOR ALL USING (true);
CREATE POLICY "Allow all for notifications" ON notifications FOR ALL USING (true);

-- Success message
SELECT 'SUCCESS: Simple Apply Bureau schema created successfully!' as status;