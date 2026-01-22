-- CLEANUP CONSULTATIONS TABLE
-- Remove contact form submissions, test records, and invalid data
-- Run this in Supabase SQL Editor

-- 1. Delete contact form submissions (these should be in contact_requests table)
DELETE FROM consultations WHERE id = 'c2cc46c7-52de-4809-845b-3bd63bbfaee3'; -- lol (contact form)
DELETE FROM consultations WHERE id = '50f72867-4df4-46cf-bcd6-ef99314d84f8'; -- kjkhk (contact form)
DELETE FROM consultations WHERE id = '27ffc54a-8da9-4592-a294-d573833cf59a'; -- ddd (contact form)

-- 2. Delete test records from debugging
DELETE FROM consultations WHERE id = 'e490ac00-e1c7-4a87-a6f9-7e4476b55717'; -- Test Consultation User
DELETE FROM consultations WHERE id = '055ad470-0994-4028-8cf5-5cd5fbce4b10'; -- Debug Test User
DELETE FROM consultations WHERE id = '94daaab6-69be-497c-ac2f-67e29ce02503'; -- Debug Test User
DELETE FROM consultations WHERE id = '3dfa5524-b26e-439b-bfb1-17aca47da5b6'; -- Debug Test User
DELETE FROM consultations WHERE id = '5002113b-3432-4b7a-8b4c-ae65f7e47037'; -- Debug Test User
DELETE FROM consultations WHERE id = 'e8bf6b6d-b350-4908-b35b-98c2ddf8c4c8'; -- Test User
DELETE FROM consultations WHERE id = 'e99cf1d2-b8ab-41b7-a4f8-cfc2a3291ad2'; -- Test User
DELETE FROM consultations WHERE id = '7081857e-86be-435e-9389-8e971b011c13'; -- Test User
DELETE FROM consultations WHERE id = '0c170082-2518-4d63-8012-d72c7afaaa97'; -- Test User

-- 3. Delete records with invalid time slot formats
DELETE FROM consultations WHERE id = 'cfbe030a-bf56-42d4-867a-f5ad014673c7'; -- Empty time slots
DELETE FROM consultations WHERE id = '1d9fa9c2-6b8c-4e17-9a81-69ec7ae03ab2'; -- Invalid time format
DELETE FROM consultations WHERE id = '3302b215-6df4-46fb-9be9-6a07e4350cd1'; -- Invalid time format

-- 4. Verify cleanup - this should return 0 rows after cleanup
SELECT COUNT(*) as remaining_consultations FROM consultations;

-- 5. Show what remains (should be empty or only proper consultations)
SELECT id, prospect_name, prospect_email, preferred_slots, created_at 
FROM consultations 
ORDER BY created_at DESC;

-- AFTER RUNNING THIS CLEANUP:
-- ✅ Consultations table will only contain proper consultation requests
-- ✅ Contact form submissions will only appear in contact_requests table
-- ✅ No more data mixing between contacts and consultations
-- ✅ Dashboard will show correct data in each section