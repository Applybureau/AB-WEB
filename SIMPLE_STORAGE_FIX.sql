-- Simple fix for consultation-resumes bucket
-- Run this in Supabase SQL Editor if you just need the consultation bucket

-- Create the consultation-resumes bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('consultation-resumes', 'consultation-resumes', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to consultation-resumes (for public form)
CREATE POLICY "consultation_upload_policy" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'consultation-resumes');

-- Allow public read access (needed for serving files)
CREATE POLICY "consultation_read_policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'consultation-resumes');

-- Grant permissions
GRANT INSERT ON storage.objects TO anon;
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO anon;

-- Verify the bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'consultation-resumes';