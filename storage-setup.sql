-- =====================================================
-- APPLY BUREAU - STORAGE BUCKETS SETUP
-- File storage for resumes, documents, and email assets
-- =====================================================

-- =====================================================

-- STEP 1: Clean up existing storage (if any)
-- =====================================================

-- Delete existing policies
DROP POLICY IF EXISTS "Clients can upload own resume" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view own resume" ON storage.objects;
DROP POLICY IF EXISTS "Clients can update own resume" ON storage.objects;
DROP POLICY IF EXISTS "Clients can delete own resume" ON storage.objects;
DROP POLICY IF EXISTS "Public can view email assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage email assets" ON storage.objects;

-- Delete existing buckets
DELETE FROM storage.buckets WHERE id IN ('resumes', 'email-assets');

-- STEP 2: Create Storage Buckets
-- =====================================================

-- Create resumes bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'resumes', 
    'resumes', 
    false, 
    5242880, -- 5MB limit
    ARRAY['application/pdf']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create email-assets bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'email-assets', 
    'email-assets', 
    true, 
    10485760, -- 10MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- STEP 3: Create Storage Policies for Resumes Bucket
-- =====================================================

-- Policy: Clients can upload their own resume
CREATE POLICY "Clients can upload own resume" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'resumes' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy: Clients can view their own resume, admins can view all
CREATE POLICY "Clients can view own resume" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'resumes' AND 
        (
            (storage.foldername(name))[1] = auth.uid()::text OR 
            EXISTS (
                SELECT 1 FROM clients 
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Policy: Clients can update their own resume
CREATE POLICY "Clients can update own resume" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'resumes' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy: Clients can delete their own resume
CREATE POLICY "Clients can delete own resume" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'resumes' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- STEP 4: Create Storage Policies for Email Assets Bucket
-- =====================================================

-- Policy: Public can view email assets (for email templates)
CREATE POLICY "Public can view email assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'email-assets');

-- Policy: Admins can manage email assets
CREATE POLICY "Admins can manage email assets" ON storage.objects
    FOR ALL USING (
        bucket_id = 'email-assets' AND 
        EXISTS (
            SELECT 1 FROM clients 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Allow anonymous access to email assets (for email viewing)
CREATE POLICY "Anonymous can view email assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'email-assets');

-- STEP 5: Verification
-- =====================================================

-- Verify buckets were created
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at
FROM storage.buckets 
WHERE id IN ('resumes', 'email-assets');

-- Verify policies were created
SELECT policyname, tablename, cmd, qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%resume%' OR policyname LIKE '%email%';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Storage setup completed successfully!';
    RAISE NOTICE '📁 Buckets created: resumes (private), email-assets (public)';
    RAISE NOTICE '🔒 Storage policies configured';
    RAISE NOTICE '📄 Resume uploads: 5MB PDF limit';
    RAISE NOTICE '🖼️  Email assets: 10MB image limit';
    RAISE NOTICE '🚀 Storage is ready for file uploads!';
END $$;