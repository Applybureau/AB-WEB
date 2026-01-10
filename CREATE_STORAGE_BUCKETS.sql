-- Apply Bureau - Complete Supabase Storage Setup
-- Run this SQL in your Supabase SQL Editor to create all necessary storage buckets and policies

-- =====================================================
-- STEP 1: CREATE STORAGE BUCKETS
-- =====================================================

-- Create storage buckets (if they don't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('resumes', 'resumes', false, 5242880, ARRAY['application/pdf']),
    ('consultation-resumes', 'consultation-resumes', false, 5242880, ARRAY['application/pdf']),
    ('email-assets', 'email-assets', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 2: DROP EXISTING POLICIES (if any conflicts)
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can upload consultation resume" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view consultation resumes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage consultation resumes" ON storage.objects;
DROP POLICY IF EXISTS "Public can view email assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage email assets" ON storage.objects;
DROP POLICY IF EXISTS "Clients can upload own resume" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view own resume" ON storage.objects;
DROP POLICY IF EXISTS "Clients can update own resume" ON storage.objects;
DROP POLICY IF EXISTS "Clients can delete own resume" ON storage.objects;

-- =====================================================
-- STEP 3: CREATE STORAGE POLICIES FOR CONSULTATION-RESUMES BUCKET
-- =====================================================

-- Allow anyone to upload consultation resumes (public form submissions)
CREATE POLICY "Anyone can upload consultation resume" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'consultation-resumes');

-- Allow admins to view consultation resumes
CREATE POLICY "Admins can view consultation resumes" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'consultation-resumes' AND 
        (
            -- Allow if user is admin
            EXISTS (SELECT 1 FROM registered_users WHERE id = auth.uid() AND role = 'admin') 
            OR 
            -- Allow public access for file serving (needed for PDF display)
            auth.uid() IS NULL
        )
    );

-- Allow admins to manage (update/delete) consultation resumes
CREATE POLICY "Admins can manage consultation resumes" ON storage.objects
    FOR ALL USING (
        bucket_id = 'consultation-resumes' AND 
        EXISTS (SELECT 1 FROM registered_users WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- STEP 4: CREATE STORAGE POLICIES FOR RESUMES BUCKET (Client resumes)
-- =====================================================

-- Clients can upload their own resume
CREATE POLICY "Clients can upload own resume" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'resumes' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Clients can view their own resume, admins can view all
CREATE POLICY "Clients can view own resume" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'resumes' AND 
        (
            auth.uid()::text = (storage.foldername(name))[1] OR 
            EXISTS (SELECT 1 FROM registered_users WHERE id = auth.uid() AND role = 'admin')
        )
    );

-- Clients can update their own resume
CREATE POLICY "Clients can update own resume" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'resumes' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Clients can delete their own resume
CREATE POLICY "Clients can delete own resume" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'resumes' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- STEP 5: CREATE STORAGE POLICIES FOR EMAIL-ASSETS BUCKET
-- =====================================================

-- Public can view email assets (for email templates)
CREATE POLICY "Public can view email assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'email-assets');

-- Admins can manage email assets
CREATE POLICY "Admins can manage email assets" ON storage.objects
    FOR ALL USING (
        bucket_id = 'email-assets' AND 
        EXISTS (SELECT 1 FROM registered_users WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- STEP 6: VERIFY SETUP
-- =====================================================

-- Check that buckets were created
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id IN ('resumes', 'consultation-resumes', 'email-assets')
ORDER BY id;

-- Check that policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%consultation%' OR policyname LIKE '%resume%' OR policyname LIKE '%email%'
ORDER BY policyname;

-- =====================================================
-- STEP 7: GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Ensure the service role can manage storage
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role;

-- Ensure authenticated users can access storage
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;

-- Ensure anonymous users can upload consultation resumes
GRANT INSERT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO anon;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Apply Bureau Storage Setup Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Created buckets:';
    RAISE NOTICE '  - consultation-resumes (private, 5MB limit, PDF only)';
    RAISE NOTICE '  - resumes (private, 5MB limit, PDF only)';
    RAISE NOTICE '  - email-assets (public, 10MB limit, images)';
    RAISE NOTICE '';
    RAISE NOTICE 'Storage policies configured for:';
    RAISE NOTICE '  - Public consultation resume uploads';
    RAISE NOTICE '  - Admin access to all consultation resumes';
    RAISE NOTICE '  - Client access to their own resumes';
    RAISE NOTICE '  - Public access to email assets';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now test PDF uploads through the API!';
END $$;