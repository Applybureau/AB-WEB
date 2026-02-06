-- Fix Application Logging Schema
-- This script creates a comprehensive schema to resolve application logging issues

-- ============================================================================
-- 1. CREATE CLIENTS TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'client',
    onboarding_complete BOOLEAN DEFAULT false,
    profile_unlocked BOOLEAN DEFAULT false,
    payment_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE APPLICATIONS TABLE WITH PROPER SCHEMA
-- ============================================================================

-- Drop existing applications table if it has issues
DROP TABLE IF EXISTS applications CASCADE;

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Application Details
    type VARCHAR(50) DEFAULT 'job_application',
    title VARCHAR(500) NOT NULL,
    description TEXT,
    company VARCHAR(255),
    job_title VARCHAR(255),
    job_url TEXT,
    
    -- Status and Priority
    status VARCHAR(50) DEFAULT 'applied' CHECK (status IN (
        'applied', 'pending', 'interview_requested', 'interviewing', 
        'offer', 'rejected', 'withdrawn', 'accepted'
    )),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Requirements and Documents
    requirements TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Cost and Duration Tracking
    estimated_duration INTEGER, -- in hours
    estimated_cost DECIMAL(10,2),
    actual_duration INTEGER, -- in hours
    actual_cost DECIMAL(10,2),
    
    -- Notes and Communication
    admin_notes TEXT,
    client_notes TEXT,
    internal_notes TEXT,
    rejection_reason TEXT,
    status_update_reason TEXT,
    
    -- Tags and Organization
    tags TEXT[],
    
    -- Important Dates
    deadline DATE,
    date_applied DATE,
    interview_scheduled_at TIMESTAMPTZ,
    follow_up_date DATE,
    
    -- Interview Details
    interview_type VARCHAR(50), -- 'phone', 'video', 'in_person', 'panel'
    interview_notes TEXT,
    
    -- Offer Details
    offer_salary_min DECIMAL(12,2),
    offer_salary_max DECIMAL(12,2),
    offer_benefits TEXT,
    offer_deadline DATE,
    
    -- Application Strategy
    application_strategy TEXT,
    
    -- Admin Assignment
    approved_by UUID,
    assigned_to UUID,
    applied_by_admin BOOLEAN DEFAULT false,
    
    -- Status Timestamps
    approved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- System Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_applications_client_id ON applications(client_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_date_applied ON applications(date_applied);
CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company);
CREATE INDEX IF NOT EXISTS idx_applications_priority ON applications(priority);

-- ============================================================================
-- 4. CREATE APPLICATION LOGS TABLE FOR DETAILED TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS application_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Log Details
    action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'status_changed', 'note_added', etc.
    old_values JSONB,
    new_values JSONB,
    changes JSONB, -- Specific fields that changed
    
    -- Context
    performed_by UUID, -- admin or client who made the change
    performed_by_type VARCHAR(20), -- 'admin', 'client', 'system'
    ip_address INET,
    user_agent TEXT,
    
    -- Additional Data
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_logs_application_id ON application_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_application_logs_client_id ON application_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_application_logs_created_at ON application_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_application_logs_action ON application_logs(action);

-- ============================================================================
-- 5. CREATE APPLICATION STATISTICS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW application_statistics AS
SELECT 
    client_id,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN status = 'applied' THEN 1 END) as applied_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'interview_requested' THEN 1 END) as interview_requested_count,
    COUNT(CASE WHEN status = 'interviewing' THEN 1 END) as interviewing_count,
    COUNT(CASE WHEN status = 'offer' THEN 1 END) as offer_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count,
    
    -- Recent Activity
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as applications_this_week,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as applications_this_month,
    
    -- Success Metrics
    ROUND(
        (COUNT(CASE WHEN status IN ('offer', 'accepted') THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(*), 0)) * 100, 2
    ) as success_rate_percentage,
    
    -- Latest Activity
    MAX(created_at) as latest_application_date,
    MAX(updated_at) as latest_update_date
    
FROM applications 
GROUP BY client_id;

-- ============================================================================
-- 6. CREATE WEEKLY APPLICATION STATS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW weekly_application_stats AS
SELECT 
    client_id,
    DATE_TRUNC('week', created_at) as week_start,
    COUNT(*) as applications_count,
    COUNT(CASE WHEN status = 'applied' THEN 1 END) as applied_count,
    COUNT(CASE WHEN status = 'interview_requested' THEN 1 END) as interview_count,
    COUNT(CASE WHEN status = 'offer' THEN 1 END) as offer_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
FROM applications 
WHERE created_at >= NOW() - INTERVAL '12 weeks'
GROUP BY client_id, DATE_TRUNC('week', created_at)
ORDER BY client_id, week_start;

-- ============================================================================
-- 7. CREATE TRIGGERS FOR AUTOMATIC LOGGING
-- ============================================================================

-- Function to log application changes
CREATE OR REPLACE FUNCTION log_application_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO application_logs (
            application_id, client_id, action, new_values, 
            performed_by_type, notes
        ) VALUES (
            NEW.id, NEW.client_id, 'created', 
            row_to_json(NEW)::jsonb,
            'system', 'Application created'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log if there are actual changes
        IF OLD IS DISTINCT FROM NEW THEN
            INSERT INTO application_logs (
                application_id, client_id, action, 
                old_values, new_values, 
                performed_by_type, notes
            ) VALUES (
                NEW.id, NEW.client_id, 'updated',
                row_to_json(OLD)::jsonb,
                row_to_json(NEW)::jsonb,
                'system', 'Application updated'
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO application_logs (
            application_id, client_id, action, old_values,
            performed_by_type, notes
        ) VALUES (
            OLD.id, OLD.client_id, 'deleted',
            row_to_json(OLD)::jsonb,
            'system', 'Application deleted'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_log_application_changes ON applications;
CREATE TRIGGER trigger_log_application_changes
    AFTER INSERT OR UPDATE OR DELETE ON applications
    FOR EACH ROW EXECUTE FUNCTION log_application_changes();

-- ============================================================================
-- 8. CREATE FUNCTION TO UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to applications table
DROP TRIGGER IF EXISTS trigger_update_applications_updated_at ON applications;
CREATE TRIGGER trigger_update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to clients table
DROP TRIGGER IF EXISTS trigger_update_clients_updated_at ON clients;
CREATE TRIGGER trigger_update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. INSERT SAMPLE DATA FOR TESTING
-- ============================================================================

-- Ensure the test client exists
INSERT INTO clients (
    id, email, full_name, role, onboarding_complete, 
    profile_unlocked, payment_verified, is_active
) VALUES (
    '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b',
    'israelloko65@gmail.com',
    'Israel Loko',
    'client',
    true,
    true,
    true,
    true
) ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    onboarding_complete = EXCLUDED.onboarding_complete,
    profile_unlocked = EXCLUDED.profile_unlocked,
    payment_verified = EXCLUDED.payment_verified,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Insert sample applications
INSERT INTO applications (
    client_id, title, description, company, job_title, job_url, 
    status, priority, admin_notes, date_applied,
    offer_salary_min, offer_salary_max
) VALUES 
(
    '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b',
    'Google - Senior Software Engineer',
    'Application for Senior Software Engineer position at Google',
    'Google',
    'Senior Software Engineer',
    'https://careers.google.com/jobs/123',
    'applied',
    'high',
    'Strong technical background, excellent fit for the role',
    CURRENT_DATE - INTERVAL '5 days',
    150000,
    200000now set 
),
(
    '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b',
    'Microsoft - Product Manager',
    'Application for Product Manager position at Microsoft',
    'Microsoft',
    'Product Manager',
    'https://careers.microsoft.com/jobs/456',
    'interview_requested',
    'high',
    'Interview scheduled for next week',
    CURRENT_DATE - INTERVAL '3 days',
    140000,
    180000
),
(
    '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b',
    'Apple - iOS Developer',
    'Application for iOS Developer position at Apple',
    'Apple',
    'iOS Developer',
    'https://jobs.apple.com/jobs/789',
    'interviewing',
    'medium',
    'Currently in second round of interviews',
    CURRENT_DATE - INTERVAL '10 days',
    130000,
    170000
),
(
    '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b',
    'Netflix - Data Scientist',
    'Application for Data Scientist position at Netflix',
    'Netflix',
    'Data Scientist',
    'https://jobs.netflix.com/jobs/101',
    'offer',
    'high',
    'Received competitive offer, negotiating terms',
    CURRENT_DATE - INTERVAL '15 days',
    160000,
    190000
),
(
    '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b',
    'Tesla - Software Engineer',
    'Application for Software Engineer position at Tesla',
    'Tesla',
    'Software Engineer',
    'https://tesla.com/careers/112',
    'rejected',
    'medium',
    'Not selected for this round, but encouraged to apply for future roles',
    CURRENT_DATE - INTERVAL '20 days',
    120000,
    150000
);

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to the service role (adjust as needed)
GRANT ALL PRIVILEGES ON TABLE clients TO service_role;
GRANT ALL PRIVILEGES ON TABLE applications TO service_role;
GRANT ALL PRIVILEGES ON TABLE application_logs TO service_role;
GRANT SELECT ON application_statistics TO service_role;
GRANT SELECT ON weekly_application_stats TO service_role;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON TABLE applications TO authenticated;
GRANT SELECT ON TABLE clients TO authenticated;
GRANT SELECT ON application_statistics TO authenticated;
GRANT SELECT ON weekly_application_stats TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if everything was created successfully
SELECT 'Schema creation completed successfully' as status;

-- Verify sample data
SELECT 
    'Sample data verification:' as info,
    COUNT(*) as total_applications,
    COUNT(DISTINCT client_id) as unique_clients
FROM applications;

-- Verify statistics view
SELECT 
    'Statistics view verification:' as info,
    client_id,
    total_applications,
    success_rate_percentage
FROM application_statistics
LIMIT 5;