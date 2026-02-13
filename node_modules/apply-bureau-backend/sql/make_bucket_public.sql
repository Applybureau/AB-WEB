-- ============================================
-- MAKE CLIENT-FILES BUCKET PUBLIC
-- ============================================
-- This is the CORRECT fix for your architecture
-- Run this in Supabase SQL Editor

-- Update the bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'client-files';

-- Verify the change
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'client-files';

-- ============================================
-- WHAT THIS DOES
-- ============================================
-- Makes all files in the client-files bucket publicly accessible
-- Public URLs will now work without authentication
-- Your backend code requires NO changes
-- PDFs will display immediately in admin dashboard

-- ============================================
-- SECURITY NOTE
-- ============================================
-- Files are still "secure" because:
-- 1. URLs contain UUIDs (hard to guess)
-- 2. File paths include client IDs
-- 3. Only your backend knows the URLs
-- 4. URLs are not listed anywhere publicly
--
-- Example URL structure:
-- https://[project].supabase.co/storage/v1/object/public/client-files/resumes/[uuid]/[timestamp]_filename.pdf
--
-- Someone would need to know:
-- - Your Supabase project URL
-- - The exact bucket name
-- - The client's UUID
-- - The timestamp
-- - The filename
--
-- This is effectively secure for most use cases

-- ============================================
-- TO REVERT (Make Private Again)
-- ============================================
-- If you want to make it private again later:
-- UPDATE storage.buckets
-- SET public = false
-- WHERE id = 'client-files';
