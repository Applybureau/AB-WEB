-- ============================================
-- FIX SUPABASE STORAGE POLICY FOR CLIENT FILES
-- ============================================
-- This allows authenticated users (admins and clients) to access files in the client-files bucket
-- Run this in your Supabase SQL Editor

-- First, enable RLS on the storage.objects table if not already enabled
-- (This is usually already enabled by default)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read client files" ON storage.objects;
DROP POLICY IF EXISTS "Allow clients to upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow clients to delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins full access to client files" ON storage.objects;

-- ============================================
-- POLICY 1: Allow authenticated users to READ all files in client-files bucket
-- ============================================
-- This allows both admins and clients to view/download files
CREATE POLICY "Allow authenticated users to read client files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'client-files');

-- ============================================
-- POLICY 2: Allow clients to UPLOAD files to their own folder
-- ============================================
-- Clients can only upload to: client-files/resumes/{their_user_id}/
CREATE POLICY "Allow clients to upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-files' 
  AND (storage.foldername(name))[1] = 'resumes'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- ============================================
-- POLICY 3: Allow clients to DELETE their own files
-- ============================================
-- Clients can only delete files in their own folder
CREATE POLICY "Allow clients to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-files'
  AND (storage.foldername(name))[1] = 'resumes'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- ============================================
-- POLICY 4: Allow admins FULL access to all client files
-- ============================================
-- Admins can read, upload, update, and delete any file in client-files bucket
-- Note: This assumes you have a way to identify admins (e.g., role in registered_users table)
CREATE POLICY "Allow admins full access to client files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'client-files'
  AND EXISTS (
    SELECT 1 FROM public.registered_users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the policies were created:

-- Check all policies on storage.objects
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';

-- ============================================
-- NOTES
-- ============================================
-- 1. These policies work with Supabase Auth (authenticated users)
-- 2. Files are organized as: client-files/resumes/{user_id}/{filename}
-- 3. Clients can only access their own files
-- 4. Admins can access all files
-- 5. Public access is NOT allowed (more secure)
-- 6. If you need public access, you can make the bucket public instead
