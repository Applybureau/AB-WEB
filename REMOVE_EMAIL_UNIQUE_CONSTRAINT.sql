-- Remove unique constraint on email column in consultations table
-- This allows the same person to submit multiple consultation requests

-- First, find and drop any unique constraint on email
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find unique constraints on email column
    SELECT conname INTO constraint_name
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'consultations' 
    AND a.attname = 'email'
    AND c.contype = 'u';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE consultations DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
END $$;

-- Also drop any unique index on email
DROP INDEX IF EXISTS consultations_email_key;
DROP INDEX IF EXISTS consultations_email_idx;
DROP INDEX IF EXISTS idx_consultations_email;

-- Verify the change
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'consultations';
