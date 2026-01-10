-- Supabase Storage Setup for Apply Bureau
-- Run these commands in your Supabase SQL Editor after creating the main tables

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('resumes', 'resumes', false),
    ('consultation-resumes', 'consultation-resumes', false),
    ('email-assets', 'email-assets', true);

-- Create storage policies for resumes bucket
CREATE POLICY "Clients can upload own resume" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'resumes' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Clients can view own resume" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'resumes' AND 
        (auth.uid()::text = (storage.foldername(name))[1] OR 
         EXISTS (SELECT 1 FROM clients WHERE id = auth.uid() AND role = 'admin'))
    );

CREATE POLICY "Clients can update own resume" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'resumes' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Clients can delete own resume" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'resumes' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create storage policies for consultation-resumes bucket (public uploads, admin access)
CREATE POLICY "Anyone can upload consultation resume" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'consultation-resumes');

CREATE POLICY "Admins can view consultation resumes" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'consultation-resumes' AND 
        (EXISTS (SELECT 1 FROM registered_users WHERE id = auth.uid() AND role = 'admin') OR auth.uid() IS NULL)
    );

CREATE POLICY "Admins can manage consultation resumes" ON storage.objects
    FOR ALL USING (
        bucket_id = 'consultation-resumes' AND 
        EXISTS (SELECT 1 FROM registered_users WHERE id = auth.uid() AND role = 'admin')
    );

-- Create storage policies for email-assets bucket (public read)
CREATE POLICY "Public can view email assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'email-assets');

CREATE POLICY "Admins can manage email assets" ON storage.objects
    FOR ALL USING (
        bucket_id = 'email-assets' AND 
        EXISTS (SELECT 1 FROM clients WHERE id = auth.uid() AND role = 'admin')
    );