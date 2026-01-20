-- STEP-BY-STEP DATABASE FIX
-- Run each section separately in Supabase SQL Editor
-- Copy and paste one section at a time and click "Run"

-- STEP 1: Fix Applications Table - Add missing client_id column
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS user_id UUID;

-- STEP 2: Fix Notifications Table - Add missing is_read column
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'client',
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';

-- STEP 3: Fix Consultations Table - Add missing columns
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS prospect_name TEXT,
ADD COLUMN IF NOT EXISTS prospect_email TEXT,
ADD COLUMN IF NOT EXISTS prospect_phone TEXT,
ADD COLUMN IF NOT EXISTS client_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- STEP 4: Fix Clients Table - Add missing columns
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS assigned_advisor_id UUID,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS current_job_title TEXT,
ADD COLUMN IF NOT EXISTS current_company TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- STEP 5: Fix Admins Table - Add missing columns
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- STEP 6: Fix Contact Requests Table - Add missing columns
ALTER TABLE contact_requests 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- STEP 7: Fix Messages Table - Add missing columns
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'client',
ADD COLUMN IF NOT EXISTS recipient_type TEXT DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- STEP 8: Fix Dashboard Activities Table - Add missing columns
ALTER TABLE dashboard_activities 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- STEP 9: Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_applications_client_id ON applications(client_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_consultations_client_id ON consultations(client_id);
CREATE INDEX IF NOT EXISTS idx_consultations_prospect_email ON consultations(prospect_email);

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_role ON clients(role);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON contact_requests(email);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

CREATE INDEX IF NOT EXISTS idx_dashboard_activities_user_id ON dashboard_activities(user_id);

-- STEP 10: Update data consistency
UPDATE applications SET client_id = user_id WHERE client_id IS NULL AND user_id IS NOT NULL;