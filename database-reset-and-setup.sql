-- =====================================================
-- APPLY BUREAU - COMPLETE DATABASE SETUP
-- Human-Led Application & Interview Advisory System
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CUSTOM TYPES & ENUMS
-- =====================================================

-- User roles (Admin = Mr Loko, Client = Mr Eze)
CREATE TYPE user_role AS ENUM ('admin', 'client');

-- Client status throughout the journey
CREATE TYPE client_status AS ENUM (
    'invited',           -- Just invited, hasn't logged in yet
    'onboarding',        -- Logged in but hasn't completed onboarding
    'active',            -- Fully onboarded and active
    'inactive',          -- Temporarily inactive
    'archived'           -- No longer working with Apply Bureau
);

-- Application status (human-controlled by admin)
CREATE TYPE application_status AS ENUM (
    'applied',           -- Admin applied on behalf of client
    'under_review',      -- Company is reviewing
    'interview_scheduled', -- Interview scheduled
    'interview_completed', -- Interview done, waiting for result
    'second_round',      -- Multiple interview rounds
    'offer_received',    -- Job offer received
    'offer_accepted',    -- Client accepted offer
    'offer_declined',    -- Client declined offer
    'rejected',          -- Application rejected
    'withdrawn',         -- Application withdrawn
    'closed'             -- Application closed for other reasons
);

-- Consultation status
CREATE TYPE consultation_status AS ENUM (
    'scheduled',         -- Booked via Calendly
    'completed',         -- Consultation finished
    'cancelled',         -- Cancelled by either party
    'rescheduled',       -- Moved to different time
    'no_show'            -- Client didn't show up
);

-- Message types for admin-client communication
CREATE TYPE message_type AS ENUM (
    'admin_to_client',   -- Admin sending update to client
    'client_to_admin',   -- Client replying to admin
    'system_notification', -- Automated system messages
    'application_update'  -- Application status updates
);

-- Notification types
CREATE TYPE notification_type AS ENUM (
    'consultation_booked',
    'consultation_reminder',
    'application_update',
    'message_received',
    'onboarding_reminder',
    'document_request',
    'general_update'
);

-- =====================================================
-- 2. MAIN TABLES
-- =====================================================

-- Clients table (Mr Eze and other clients)
CREATE TABLE clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Basic Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    
    -- Authentication
    password VARCHAR(255) NOT NULL,
    temporary_password BOOLEAN DEFAULT TRUE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status & Onboarding
    status client_status DEFAULT 'invited',
    onboarding_complete BOOLEAN DEFAULT FALSE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Profile Information
    resume_url TEXT,
    linkedin_url TEXT,
    current_job_title VARCHAR(255),
    current_company VARCHAR(255),
    years_experience INTEGER,
    target_role VARCHAR(255),
    target_salary_min INTEGER,
    target_salary_max INTEGER,
    preferred_locations TEXT[], -- Array of locations
    
    -- Onboarding Questionnaire Responses
    career_goals TEXT,
    job_search_timeline VARCHAR(100), -- 'immediate', '1-3 months', '3-6 months', 'flexible'
    current_challenges TEXT,
    previous_applications_count INTEGER,
    referral_source VARCHAR(255),
    
    -- Admin Assignment
    assigned_advisor_id UUID, -- References admin who manages this client
    
    -- System fields
    role user_role DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_salary_range CHECK (target_salary_max IS NULL OR target_salary_min IS NULL OR target_salary_max >= target_salary_min)
);

-- Admin/Advisors table (Mr Loko and team)
CREATE TABLE admins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Basic Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    
    -- Authentication
    password VARCHAR(255) NOT NULL,
    
    -- Admin Details
    title VARCHAR(255), -- 'Senior Advisor', 'Career Consultant', etc.
    bio TEXT,
    specializations TEXT[], -- Array of specializations
    
    -- System fields
    role user_role DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Consultations table (Calendly bookings and follow-ups)
CREATE TABLE consultations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Participants
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    
    -- Consultation Details
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    consultation_type VARCHAR(100) DEFAULT 'initial', -- 'initial', 'follow_up', 'strategy', 'interview_prep'
    
    -- Calendly Integration
    calendly_event_id VARCHAR(255), -- Store Calendly event ID for reference
    calendly_meeting_url TEXT,
    
    -- Status & Notes
    status consultation_status DEFAULT 'scheduled',
    client_reason TEXT, -- Why client booked (from Calendly form)
    admin_notes TEXT, -- Private notes for admin
    client_summary TEXT, -- Summary shared with client
    
    -- Outcomes
    onboarding_decision BOOLEAN, -- Did admin decide to onboard this client?
    onboarding_reason TEXT, -- Why yes/no decision was made
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table (Jobs admin applies for on behalf of clients)
CREATE TABLE applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Relationships
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    applied_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    
    -- Job Details
    job_title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    job_description TEXT,
    job_url TEXT,
    salary_range VARCHAR(100),
    location VARCHAR(255),
    job_type VARCHAR(50), -- 'full-time', 'part-time', 'contract', 'remote'
    
    -- Application Process
    application_method VARCHAR(100), -- 'company_website', 'linkedin', 'recruiter', 'referral'
    date_applied TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status application_status DEFAULT 'applied',
    
    -- Progress Tracking
    application_deadline TIMESTAMP WITH TIME ZONE,
    expected_response_date TIMESTAMP WITH TIME ZONE,
    
    -- Interview Details (if applicable)
    interview_scheduled_at TIMESTAMP WITH TIME ZONE,
    interview_type VARCHAR(50), -- 'phone', 'video', 'in_person', 'panel'
    interview_notes TEXT,
    
    -- Offer Details (if applicable)
    offer_salary INTEGER,
    offer_benefits TEXT,
    offer_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Admin Notes & Strategy
    admin_notes TEXT, -- Private notes for admin team
    application_strategy TEXT, -- How admin plans to approach this application
    client_feedback TEXT, -- Client's thoughts on the role/company
    
    -- Status Updates
    last_status_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status_update_reason TEXT, -- Why status was changed
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (Admin-Client communication)
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Participants
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    
    -- Message Details
    type message_type NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Related Records
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL, -- If message is about specific application
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL, -- If message is about consultation
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Email Integration
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table (In-app notifications)
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Recipient
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Notification Details
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related Records
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table (Resumes, cover letters, etc.)
CREATE TABLE documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Owner
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    uploaded_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    
    -- Document Details
    document_type VARCHAR(50) NOT NULL, -- 'resume', 'cover_letter', 'portfolio', 'certificate'
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Metadata
    description TEXT,
    is_current BOOLEAN DEFAULT TRUE, -- Is this the current version?
    version_number INTEGER DEFAULT 1,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table (Track all important actions)
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Who performed the action
    user_id UUID, -- Could be admin or client
    user_type user_role,
    user_email VARCHAR(255),
    
    -- What was done
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', 'invite', etc.
    table_name VARCHAR(100), -- Which table was affected
    record_id UUID, -- Which specific record
    
    -- Details
    old_values JSONB, -- Previous values (for updates)
    new_values JSONB, -- New values (for creates/updates)
    description TEXT, -- Human-readable description
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table (Configuration)
CREATE TABLE system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Setting Details
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    
    -- Metadata
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Can clients see this setting?
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

-- Client indexes
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_advisor ON clients(assigned_advisor_id);
CREATE INDEX idx_clients_onboarding ON clients(onboarding_complete);

-- Application indexes
CREATE INDEX idx_applications_client ON applications(client_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_date ON applications(date_applied);
CREATE INDEX idx_applications_company ON applications(company);

-- Consultation indexes
CREATE INDEX idx_consultations_client ON consultations(client_id);
CREATE INDEX idx_consultations_admin ON consultations(admin_id);
CREATE INDEX idx_consultations_date ON consultations(scheduled_at);
CREATE INDEX idx_consultations_status ON consultations(status);

-- Message indexes
CREATE INDEX idx_messages_client ON messages(client_id);
CREATE INDEX idx_messages_admin ON messages(admin_id);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_read ON messages(is_read);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Notification indexes
CREATE INDEX idx_notifications_client ON notifications(client_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Audit log indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get client ID from auth
CREATE OR REPLACE FUNCTION get_client_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM clients 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for clients table
CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (is_admin());

CREATE POLICY "Clients can view own record" ON clients
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can insert clients" ON clients
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update all clients" ON clients
  FOR UPDATE USING (is_admin());

CREATE POLICY "Clients can update own record" ON clients
  FOR UPDATE USING (id = auth.uid());

-- RLS Policies for admins table
CREATE POLICY "Admins can view all admins" ON admins
  FOR ALL USING (is_admin());

-- RLS Policies for consultations table
CREATE POLICY "Admins can view all consultations" ON consultations
  FOR ALL USING (is_admin());

CREATE POLICY "Clients can view own consultations" ON consultations
  FOR SELECT USING (client_id = auth.uid());

-- RLS Policies for applications table
CREATE POLICY "Admins can manage all applications" ON applications
  FOR ALL USING (is_admin());

CREATE POLICY "Clients can view own applications" ON applications
  FOR SELECT USING (client_id = auth.uid());

-- RLS Policies for messages table
CREATE POLICY "Admins can manage all messages" ON messages
  FOR ALL USING (is_admin());

CREATE POLICY "Clients can view own messages" ON messages
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Clients can create messages to admin" ON messages
  FOR INSERT WITH CHECK (client_id = auth.uid() AND type = 'client_to_admin');

CREATE POLICY "Clients can update own message read status" ON messages
  FOR UPDATE USING (client_id = auth.uid()) 
  WITH CHECK (client_id = auth.uid());

-- RLS Policies for notifications table
CREATE POLICY "Admins can manage all notifications" ON notifications
  FOR ALL USING (is_admin());

CREATE POLICY "Clients can view own notifications" ON notifications
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Clients can update own notifications" ON notifications
  FOR UPDATE USING (client_id = auth.uid()) 
  WITH CHECK (client_id = auth.uid());

-- RLS Policies for documents table
CREATE POLICY "Admins can manage all documents" ON documents
  FOR ALL USING (is_admin());

CREATE POLICY "Clients can view own documents" ON documents
  FOR SELECT USING (client_id = auth.uid());

-- RLS Policies for audit_logs table
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (is_admin());

-- RLS Policies for system_settings table
CREATE POLICY "Admins can manage system settings" ON system_settings
  FOR ALL USING (is_admin());

CREATE POLICY "Everyone can view public settings" ON system_settings
  FOR SELECT USING (is_public = TRUE);

-- =====================================================
-- 5. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_client_id UUID,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_application_id UUID DEFAULT NULL,
    p_consultation_id UUID DEFAULT NULL,
    p_message_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        client_id, type, title, message, 
        application_id, consultation_id, message_id
    )
    VALUES (
        p_client_id, p_type, p_title, p_message,
        p_application_id, p_consultation_id, p_message_id
    )
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event() RETURNS TRIGGER AS $$
DECLARE
    user_email_val VARCHAR(255);
    user_type_val user_role;
BEGIN
    -- Get user details
    IF auth.uid() IS NOT NULL THEN
        -- Try to get from clients first
        SELECT email, role INTO user_email_val, user_type_val
        FROM clients WHERE id = auth.uid();
        
        -- If not found in clients, try admins
        IF user_email_val IS NULL THEN
            SELECT email, role INTO user_email_val, user_type_val
            FROM admins WHERE id = auth.uid();
        END IF;
    END IF;

    -- Log the event
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            user_id, user_type, user_email, action, table_name, 
            record_id, old_values, description
        ) VALUES (
            auth.uid(), user_type_val, user_email_val, 'delete', TG_TABLE_NAME,
            OLD.id, to_jsonb(OLD), 'Record deleted'
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            user_id, user_type, user_email, action, table_name,
            record_id, old_values, new_values, description
        ) VALUES (
            auth.uid(), user_type_val, user_email_val, 'update', TG_TABLE_NAME,
            NEW.id, to_jsonb(OLD), to_jsonb(NEW), 'Record updated'
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            user_id, user_type, user_email, action, table_name,
            record_id, new_values, description
        ) VALUES (
            auth.uid(), user_type_val, user_email_val, 'insert', TG_TABLE_NAME,
            NEW.id, to_jsonb(NEW), 'Record created'
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle application status updates
CREATE OR REPLACE FUNCTION handle_application_status_update() RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Update the last_status_update timestamp
        NEW.last_status_update = NOW();
        
        -- Create notification for client
        PERFORM create_notification(
            NEW.client_id,
            'application_update',
            'Application Status Updated',
            'Your application for ' || NEW.job_title || ' at ' || NEW.company || 
            ' has been updated to: ' || NEW.status::text,
            NEW.id,
            NULL,
            NULL
        );
        
        -- Create a message for the client
        INSERT INTO messages (
            client_id, admin_id, type, subject, content, application_id
        ) VALUES (
            NEW.client_id,
            NEW.applied_by_admin_id,
            'admin_to_client',
            'Application Update: ' || NEW.job_title || ' at ' || NEW.company,
            'Your application status has been updated to: ' || NEW.status::text || 
            CASE 
                WHEN NEW.status_update_reason IS NOT NULL 
                THEN E'\n\nReason: ' || NEW.status_update_reason
                ELSE ''
            END,
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new consultation bookings
CREATE OR REPLACE FUNCTION handle_consultation_booking() RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for client
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
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new messages
CREATE OR REPLACE FUNCTION handle_new_message() RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification for admin-to-client messages
    IF NEW.type = 'admin_to_client' THEN
        PERFORM create_notification(
            NEW.client_id,
            'message_received',
            'New Message from Your Advisor',
            COALESCE(NEW.subject, 'You have received a new message from your advisor'),
            NEW.application_id,
            NEW.consultation_id,
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for all main tables
CREATE TRIGGER audit_clients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_admins_trigger
    AFTER INSERT OR UPDATE OR DELETE ON admins
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_consultations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON consultations
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_applications_trigger
    AFTER INSERT OR UPDATE OR DELETE ON applications
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_messages_trigger
    AFTER INSERT OR UPDATE OR DELETE ON messages
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Create business logic triggers
CREATE TRIGGER application_status_update_trigger
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION handle_application_status_update();

CREATE TRIGGER consultation_booking_trigger
    AFTER INSERT ON consultations
    FOR EACH ROW EXECUTE FUNCTION handle_consultation_booking();

CREATE TRIGGER new_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION handle_new_message();

-- =====================================================
-- 6. INITIAL DATA & SYSTEM SETTINGS
-- =====================================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('company_name', 'Apply Bureau', 'string', 'Company name displayed in emails and UI', TRUE),
('support_email', 'support@applybureau.com', 'string', 'Support contact email', TRUE),
('calendly_url', 'https://calendly.com/raewealth1/30min', 'string', 'Calendly booking URL', TRUE),
('onboarding_required_fields', '["resume", "career_goals", "target_role"]', 'json', 'Required fields for onboarding completion', FALSE),
('max_file_size_mb', '10', 'number', 'Maximum file upload size in MB', FALSE),
('allowed_file_types', '["pdf", "doc", "docx"]', 'json', 'Allowed file types for uploads', FALSE),
('consultation_duration_default', '30', 'number', 'Default consultation duration in minutes', FALSE),
('notification_email_enabled', 'true', 'boolean', 'Whether to send email notifications', FALSE),
('client_dashboard_readonly', 'true', 'boolean', 'Whether client dashboard is read-only', FALSE);

-- Create default admin user (Mr Loko)
-- Note: You'll need to update the password hash with a real bcrypt hash
INSERT INTO admins (
    full_name, 
    email, 
    password, 
    title, 
    bio,
    specializations
) VALUES (
    'Mr Loko', 
    'admin@applybureau.com', 
    '$2b$10$example.hash.replace.with.real.bcrypt.hash', -- Replace with actual bcrypt hash
    'Senior Career Advisor',
    'Experienced career advisor specializing in helping professionals advance their careers through strategic job applications and interview preparation.',
    ARRAY['Career Strategy', 'Interview Preparation', 'Resume Optimization', 'Salary Negotiation']
);

-- =====================================================
-- 7. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for client dashboard summary
CREATE VIEW client_dashboard_summary AS
SELECT 
    c.id,
    c.full_name,
    c.email,
    c.status,
    c.onboarding_complete,
    c.assigned_advisor_id,
    a.full_name as advisor_name,
    
    -- Application statistics
    COUNT(DISTINCT app.id) as total_applications,
    COUNT(DISTINCT CASE WHEN app.status = 'applied' THEN app.id END) as applications_applied,
    COUNT(DISTINCT CASE WHEN app.status IN ('interview_scheduled', 'interview_completed', 'second_round') THEN app.id END) as applications_interview,
    COUNT(DISTINCT CASE WHEN app.status IN ('offer_received', 'offer_accepted') THEN app.id END) as applications_offer,
    COUNT(DISTINCT CASE WHEN app.status = 'rejected' THEN app.id END) as applications_rejected,
    
    -- Recent activity
    MAX(app.date_applied) as last_application_date,
    COUNT(DISTINCT CASE WHEN n.is_read = FALSE THEN n.id END) as unread_notifications,
    COUNT(DISTINCT CASE WHEN m.is_read = FALSE AND m.type = 'admin_to_client' THEN m.id END) as unread_messages,
    
    -- Next consultation
    MIN(CASE WHEN cons.scheduled_at > NOW() AND cons.status = 'scheduled' THEN cons.scheduled_at END) as next_consultation_date
    
FROM clients c
LEFT JOIN admins a ON c.assigned_advisor_id = a.id
LEFT JOIN applications app ON c.id = app.client_id
LEFT JOIN notifications n ON c.id = n.client_id
LEFT JOIN messages m ON c.id = m.client_id
LEFT JOIN consultations cons ON c.id = cons.client_id
GROUP BY c.id, c.full_name, c.email, c.status, c.onboarding_complete, c.assigned_advisor_id, a.full_name;

-- View for admin client overview
CREATE VIEW admin_client_overview AS
SELECT 
    c.id,
    c.full_name,
    c.email,
    c.status,
    c.onboarding_complete,
    c.created_at as client_since,
    c.last_login_at,
    
    -- Application summary
    COUNT(DISTINCT app.id) as total_applications,
    MAX(app.date_applied) as last_application_date,
    
    -- Recent consultation
    MAX(cons.scheduled_at) as last_consultation_date,
    
    -- Communication
    COUNT(DISTINCT CASE WHEN m.type = 'client_to_admin' AND m.is_read = FALSE THEN m.id END) as pending_client_messages
    
FROM clients c
LEFT JOIN applications app ON c.id = app.client_id
LEFT JOIN consultations cons ON c.id = cons.client_id
LEFT JOIN messages m ON c.id = m.client_id
GROUP BY c.id, c.full_name, c.email, c.status, c.onboarding_complete, c.created_at, c.last_login_at;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'APPLY BUREAU DATABASE SETUP COMPLETE!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tables created: 9 main tables + 2 views';
    RAISE NOTICE 'Security: Row Level Security enabled';
    RAISE NOTICE 'Triggers: Audit logging and notifications active';
    RAISE NOTICE 'Default admin: admin@applybureau.com';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Update admin password hash in admins table';
    RAISE NOTICE '2. Set up storage buckets (run storage-setup.sql)';
    RAISE NOTICE '3. Test backend connection';
    RAISE NOTICE '4. Create your first client invitation';
    RAISE NOTICE '==============================================';
END $$;