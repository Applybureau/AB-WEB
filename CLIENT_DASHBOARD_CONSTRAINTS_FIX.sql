-- =============================================
-- CLIENT DASHBOARD CONSTRAINTS FIX
-- =============================================
-- This fixes the CHECK constraints that are preventing onboarding submissions
-- Run this in your Supabase SQL Editor

-- 1. Drop existing CHECK constraints that are too restrictive
ALTER TABLE client_onboarding_20q DROP CONSTRAINT IF EXISTS client_onboarding_20q_job_search_timeline_check;
ALTER TABLE client_onboarding_20q DROP CONSTRAINT IF EXISTS client_onboarding_20q_remote_work_preference_check;
ALTER TABLE client_onboarding_20q DROP CONSTRAINT IF EXISTS client_onboarding_20q_application_volume_preference_check;

-- 2. Add new flexible CHECK constraints that match our client dashboard data
ALTER TABLE client_onboarding_20q 
ADD CONSTRAINT client_onboarding_20q_job_search_timeline_check 
CHECK (job_search_timeline IN (
    'Immediately (0-1 month)',
    'Soon (1-3 months)', 
    'Moderate (3-6 months)',
    'Flexible (6+ months)'
));

ALTER TABLE client_onboarding_20q 
ADD CONSTRAINT client_onboarding_20q_remote_work_preference_check 
CHECK (remote_work_preference IN (
    'Remote only',
    'Hybrid', 
    'On-site only',
    'Flexible'
));

ALTER TABLE client_onboarding_20q 
ADD CONSTRAINT client_onboarding_20q_application_volume_preference_check 
CHECK (application_volume_preference IN (
    'Quality focused (fewer, targeted applications)',
    'Volume focused (more applications)',
    'Balanced approach'
) OR application_volume_preference IS NULL);

-- 3. Ensure execution_status constraint allows our values
ALTER TABLE client_onboarding_20q DROP CONSTRAINT IF EXISTS client_onboarding_20q_execution_status_check;
ALTER TABLE client_onboarding_20q 
ADD CONSTRAINT client_onboarding_20q_execution_status_check 
CHECK (execution_status IN (
    'not_started',
    'in_progress',
    'pending_approval',
    'active',
    'completed',
    'rejected'
));

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ CLIENT DASHBOARD CONSTRAINTS FIXED!';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'Updated CHECK constraints for:';
    RAISE NOTICE '- job_search_timeline (4 options)';
    RAISE NOTICE '- remote_work_preference (4 options)';
    RAISE NOTICE '- application_volume_preference (3 options + NULL)';
    RAISE NOTICE '- execution_status (6 statuses)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Onboarding submissions should now work!';
END $$;