-- Consultation Requests System Schema
-- Run this in Supabase SQL Editor

-- Create consultation_requests table
CREATE TABLE IF NOT EXISTS consultation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(200),
    job_title VARCHAR(200),
    consultation_type VARCHAR(100) NOT NULL CHECK (consultation_type IN (
        'career_strategy', 
        'resume_review', 
        'interview_prep', 
        'job_search', 
        'salary_negotiation', 
        'career_transition',
        'linkedin_optimization',
        'general_consultation'
    )),
    preferred_date DATE,
    preferred_time TIME,
    message TEXT,
    urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed', 'cancelled')),
    source VARCHAR(50) DEFAULT 'website' CHECK (source IN ('website', 'phone', 'email', 'referral', 'admin')),
    
    -- Confirmation fields
    confirmed_by UUID REFERENCES clients(id),
    confirmed_at TIMESTAMPTZ,
    scheduled_date DATE,
    scheduled_time TIME,
    meeting_url TEXT,
    admin_notes TEXT,
    
    -- Rejection fields
    rejected_by UUID REFERENCES clients(id),
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Reschedule fields
    rescheduled_by UUID REFERENCES clients(id),
    rescheduled_at TIMESTAMPTZ,
    reschedule_reason TEXT,
    
    -- Tracking fields
    consultation_request_id UUID, -- Links to created consultation
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add consultation_request_id to consultations table
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS consultation_request_id UUID REFERENCES consultation_requests(id);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS client_name VARCHAR(100);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS client_email VARCHAR(255);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS client_phone VARCHAR(20);
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'admin';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status ON consultation_requests(status);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_email ON consultation_requests(email);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_created ON consultation_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_urgency ON consultation_requests(urgency_level);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_type ON consultation_requests(consultation_type);
CREATE INDEX IF NOT EXISTS idx_consultations_request_id ON consultations(consultation_request_id);

-- Enable RLS
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admins can see all consultation requests
CREATE POLICY "Admins can view all consultation requests" ON consultation_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Admins can update consultation requests
CREATE POLICY "Admins can update consultation requests" ON consultation_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Anyone can create consultation requests (for website form)
CREATE POLICY "Anyone can create consultation requests" ON consultation_requests
    FOR INSERT WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_consultation_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_consultation_requests_updated_at ON consultation_requests;
CREATE TRIGGER update_consultation_requests_updated_at
    BEFORE UPDATE ON consultation_requests
    FOR EACH ROW EXECUTE FUNCTION update_consultation_requests_updated_at();

-- Grant permissions
GRANT ALL ON consultation_requests TO authenticated;
GRANT ALL ON consultation_requests TO anon; -- For website form submissions

-- Insert sample consultation types for reference
INSERT INTO consultation_requests (
    full_name, 
    email, 
    consultation_type, 
    message, 
    status,
    urgency_level
) VALUES 
(
    'Sample Request', 
    'sample@example.com', 
    'career_strategy', 
    'This is a sample consultation request to demonstrate the system.', 
    'pending',
    'normal'
) ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Consultation Requests System schema created successfully!' as status;