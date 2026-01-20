-- SAFE DATABASE FIX - Adds missing columns without dropping data
-- Run this in Supabase SQL Editor if you want to keep existing data

-- Fix notifications table - add missing columns
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'client',
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';

-- Fix applications table - add missing columns
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Fix consultations table - add missing columns
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS prospect_name TEXT,
ADD COLUMN IF NOT EXISTS prospect_email TEXT,
ADD COLUMN IF NOT EXISTS prospect_phone TEXT,
ADD COLUMN IF NOT EXISTS client_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Fix clients table - add missing columns
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS assigned_advisor_id UUID,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS current_job_title TEXT,
ADD COLUMN IF NOT EXISTS current_company TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Fix admins table - add missing columns
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Fix contact_requests table - add missing columns
ALTER TABLE contact_requests 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Fix messages table - add missing columns
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'client',
ADD COLUMN IF NOT EXISTS recipient_type TEXT DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Fix dashboard_activities table - add missing columns
ALTER TABLE dashboard_activities 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_client_id ON applications(client_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_consultations_prospect_email ON consultations(prospect_email);

-- Update data consistency
UPDATE applications SET client_id = user_id WHERE client_id IS NULL AND user_id IS NOT NULL;

-- Create missing functions
CREATE OR REPLACE FUNCTION create_client_invitation(
  p_full_name TEXT,
  p_email TEXT,
  p_admin_id UUID
) RETURNS TABLE(client_id UUID, invite_token TEXT, temp_password TEXT) AS $$
DECLARE
  v_client_id UUID;
  v_temp_password TEXT;
  v_invite_token TEXT;
BEGIN
  v_temp_password := substr(md5(random()::text), 1, 8);
  v_invite_token := encode(gen_random_bytes(32), 'hex');
  
  INSERT INTO clients (full_name, email, password, status, assigned_advisor_id)
  VALUES (p_full_name, p_email, crypt(v_temp_password, gen_salt('bf')), 'invited', p_admin_id)
  RETURNING id INTO v_client_id;
  
  RETURN QUERY SELECT v_client_id, v_invite_token, v_temp_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_complete_onboarding(p_user_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM clients WHERE id = p_user_id AND status IN ('active', 'invited'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION complete_client_onboarding(p_user_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE clients 
  SET onboarding_complete = true, status = 'active', updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;