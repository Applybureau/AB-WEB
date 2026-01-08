-- Website Consultation Requests Schema
-- Run this in Supabase SQL Editor

-- Create consultation_requests table for website submissions
CREATE TABLE IF NOT EXISTS consultation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    linkedin_url TEXT,
    role_targets TEXT NOT NULL,
    location_preferences TEXT,
    minimum_salary VARCHAR(50),
    target_market VARCHAR(100),
    employment_status VARCHAR(50),
    package_interest VARCHAR(20) CHECK (package_interest IN ('Tier 1', 'Tier 2', 'Tier 3')),
    area_of_concern TEXT,
    consultation_window VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'scheduled', 'completed')),
    admin_notes TEXT,
    processed_by UUID REFERENCES clients(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contact_submissions table for contact form
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
    admin_notes TEXT,
    processed_by UUID REFERENCES clients(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update admin credentials to israelloko65@gmail.com
-- UPDATE clients 
-- SET email = 'israelloko65@gmail.com'
-- WHERE role = 'admin' AND email = 'admin@applybureau.com';

-- Keep existing admin email as admin@applybureau.com

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status ON consultation_requests(status);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_created ON consultation_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_email ON consultation_requests(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created ON contact_submissions(created_at);

-- Enable RLS
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can see all consultation requests
CREATE POLICY "Admins can manage consultation requests" ON consultation_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Admins can see all contact submissions
CREATE POLICY "Admins can manage contact submissions" ON contact_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON consultation_requests TO authenticated;
GRANT ALL ON contact_submissions TO authenticated;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_consultation_requests_updated_at 
    BEFORE UPDATE ON consultation_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_submissions_updated_at 
    BEFORE UPDATE ON contact_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Website consultation requests schema created successfully!' as status;