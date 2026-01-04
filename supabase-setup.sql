-- Apply Bureau Supabase Database Setup
-- Run these commands in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'client');
CREATE TYPE consultation_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE application_status AS ENUM ('applied', 'interview', 'offer', 'rejected', 'withdrawn');
CREATE TYPE notification_type AS ENUM ('consultation_scheduled', 'consultation_rescheduled', 'consultation_cancelled', 'application_added', 'application_status_updated', 'general');

-- Create tables
CREATE TABLE clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    resume_url TEXT,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    role user_role DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE consultations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    status consultation_status DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    job_link TEXT,
    date_applied TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status application_status DEFAULT 'applied',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    record_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    user_id UUID,
    user_type VARCHAR(50),
    table_name VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL -- INSERT, UPDATE, DELETE
);

-- Create indexes for better performance
CREATE INDEX idx_consultations_client_id ON consultations(client_id);
CREATE INDEX idx_consultations_scheduled_at ON consultations(scheduled_at);
CREATE INDEX idx_applications_client_id ON applications(client_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_notifications_client_id ON notifications(client_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Clients table policies
CREATE POLICY "Clients can view own record" ON clients
    FOR SELECT USING (auth.uid()::text = id::text OR 
                     EXISTS (SELECT 1 FROM clients WHERE id = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admins can insert clients" ON clients
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM clients WHERE id = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Clients can update own record" ON clients
    FOR UPDATE USING (auth.uid()::text = id::text OR 
                     EXISTS (SELECT 1 FROM clients WHERE id = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admins can delete clients" ON clients
    FOR DELETE USING (EXISTS (SELECT 1 FROM clients WHERE id = auth.uid()::text AND role = 'admin'));

-- Consultations table policies
CREATE POLICY "Clients can view own consultations" ON consultations
    FOR SELECT USING (client_id = auth.uid() OR 
                     EXISTS (SELECT 1 FROM clients WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage consultations" ON consultations
    FOR ALL USING (EXISTS (SELECT 1 FROM clients WHERE id = auth.uid() AND role = 'admin'));

-- Applications table policies
CREATE POLICY "Clients can view own applications" ON applications
    FOR SELECT USING (client_id = auth.uid() OR 
                     EXISTS (SELECT 1 FROM clients WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage applications" ON applications
    FOR ALL USING (EXISTS (SELECT 1 FROM clients WHERE id = auth.uid() AND role = 'admin'));

-- Notifications table policies
CREATE POLICY "Clients can view own notifications" ON notifications
    FOR SELECT USING (client_id = auth.uid() OR 
                     EXISTS (SELECT 1 FROM clients WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Clients can update own notifications" ON notifications
    FOR UPDATE USING (client_id = auth.uid());

CREATE POLICY "Admins can manage notifications" ON notifications
    FOR ALL USING (EXISTS (SELECT 1 FROM clients WHERE id = auth.uid() AND role = 'admin'));

-- Audit logs policies (admin only)
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (EXISTS (SELECT 1 FROM clients WHERE id = auth.uid() AND role = 'admin'));

-- Create functions for notifications and audit logging
CREATE OR REPLACE FUNCTION create_notification(
    p_client_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type notification_type
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (client_id, title, message, type)
    VALUES (p_client_id, p_title, p_message, p_type)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit log function
CREATE OR REPLACE FUNCTION log_audit_event() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (record_id, old_value, table_name, action, user_id, user_type)
        VALUES (OLD.id, to_jsonb(OLD), TG_TABLE_NAME, TG_OP, auth.uid(), 'client');
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (record_id, old_value, new_value, table_name, action, user_id, user_type)
        VALUES (NEW.id, to_jsonb(OLD), to_jsonb(NEW), TG_TABLE_NAME, TG_OP, auth.uid(), 'client');
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (record_id, new_value, table_name, action, user_id, user_type)
        VALUES (NEW.id, to_jsonb(NEW), TG_TABLE_NAME, TG_OP, auth.uid(), 'client');
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification trigger function for consultations
CREATE OR REPLACE FUNCTION notify_on_consultation_created() RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        NEW.client_id,
        'Consultation Scheduled',
        'Your consultation has been scheduled for ' || NEW.scheduled_at::text,
        'consultation_scheduled'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification trigger function for applications
CREATE OR REPLACE FUNCTION notify_on_application_updated() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM create_notification(
            NEW.client_id,
            'Application Status Updated',
            'Your application for ' || NEW.job_title || ' at ' || NEW.company || ' has been updated to: ' || NEW.status,
            'application_status_updated'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER consultation_created_trigger
    AFTER INSERT ON consultations
    FOR EACH ROW EXECUTE FUNCTION notify_on_consultation_created();

CREATE TRIGGER application_updated_trigger
    AFTER UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION notify_on_application_updated();

-- Audit log triggers
CREATE TRIGGER audit_clients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_consultations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON consultations
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_applications_trigger
    AFTER INSERT OR UPDATE OR DELETE ON applications
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (update with your details)
INSERT INTO clients (full_name, email, password, role, onboarding_complete)
VALUES (
    'Admin User',
    'admin@applybureau.com',
    '$2b$10$example.hash.here', -- Replace with actual bcrypt hash
    'admin',
    true
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;