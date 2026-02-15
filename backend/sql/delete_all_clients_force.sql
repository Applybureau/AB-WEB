-- FORCE DELETE ALL CLIENTS - SQL SCRIPT
-- This script will delete ALL clients and their data
-- Run this in Supabase SQL Editor

-- ⚠️ WARNING: THIS IS DESTRUCTIVE AND CANNOT BE UNDONE!

BEGIN;

-- Disable triggers temporarily to avoid cascading issues
SET session_replication_role = 'replica';

-- Delete all dependent records first (in order of dependencies)
-- Try to delete from each table, ignore errors if table/column doesn't exist

DO $$
BEGIN
    -- application_logs
    DELETE FROM application_logs WHERE client_id IN (SELECT id FROM registered_users WHERE role = 'client');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    -- messages
    DELETE FROM messages WHERE client_id IN (SELECT id FROM registered_users WHERE role = 'client');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    -- notifications (try user_id)
    DELETE FROM notifications WHERE user_id IN (SELECT id FROM registered_users WHERE role = 'client');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    -- applications
    DELETE FROM applications WHERE client_id IN (SELECT id FROM registered_users WHERE role = 'client');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    -- consultations
    DELETE FROM consultations WHERE client_id IN (SELECT id FROM registered_users WHERE role = 'client');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    -- consultation_requests
    DELETE FROM consultation_requests WHERE email IN (SELECT email FROM registered_users WHERE role = 'client');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    -- twenty_questions
    DELETE FROM twenty_questions WHERE client_id IN (SELECT id FROM registered_users WHERE role = 'client');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    -- strategy_calls
    DELETE FROM strategy_calls WHERE client_id IN (SELECT id FROM registered_users WHERE role = 'client');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    -- interviews
    DELETE FROM interviews WHERE client_id IN (SELECT id FROM registered_users WHERE role = 'client');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    -- meetings
    DELETE FROM meetings WHERE client_id IN (SELECT id FROM registered_users WHERE role = 'client');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    -- client_files
    DELETE FROM client_files WHERE client_id IN (SELECT id FROM registered_users WHERE role = 'client');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    -- leads
    DELETE FROM leads WHERE client_id IN (SELECT id FROM registered_users WHERE role = 'client');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    -- contact_requests
    DELETE FROM contact_requests WHERE email IN (SELECT email FROM registered_users WHERE role = 'client');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Delete from clients table (PRESERVE SUPER ADMIN)
DELETE FROM clients WHERE email != 'applybureau@gmail.com';

-- Delete from registered_users table (all clients, PRESERVE SUPER ADMIN)
DELETE FROM registered_users WHERE role = 'client' AND email != 'applybureau@gmail.com';

-- Re-enable triggers
SET session_replication_role = 'origin';

COMMIT;

-- Verify deletion
SELECT 'Remaining clients in registered_users:' as check_type, COUNT(*) as count FROM registered_users WHERE role = 'client'
UNION ALL
SELECT 'Remaining records in clients table:' as check_type, COUNT(*) as count FROM clients;
