-- =============================================
-- CLIENT DASHBOARD FINAL FIX
-- =============================================
-- This removes all problematic CHECK constraints to allow flexible data
-- Run this in your Supabase SQL Editor

-- Remove all CHECK constraints that are causing issues
ALTER TABLE client_onboarding_20q DROP CONSTRAINT IF EXISTS client_onboarding_20q_job_search_timeline_check;
ALTER TABLE client_onboarding_20q DROP CONSTRAINT IF EXISTS client_onboarding_20q_remote_work_preference_check;
ALTER TABLE client_onboarding_20q DROP CONSTRAINT IF EXISTS client_onboarding_20q_application_volume_preference_check;
ALTER TABLE client_onboarding_20q DROP CONSTRAINT IF EXISTS client_onboarding_20q_execution_status_check;

-- Add only essential constraints (very flexible)
ALTER TABLE client_onboarding_20q 
ADD CONSTRAINT client_onboarding_20q_execution_status_check 
CHECK (execution_status IN (
    'not_started',
    'in_progress', 
    'pending_approval',
    'active',
    'completed',
    'rejected'
) OR execution_status IS NULL);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ CLIENT DASHBOARD FINAL FIX APPLIED!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Removed restrictive CHECK constraints:';
    RAISE NOTICE '- job_search_timeline (now flexible)';
    RAISE NOTICE '- remote_work_preference (now flexible)';
    RAISE NOTICE '- application_volume_preference (now flexible)';
    RAISE NOTICE '';
    RAISE NOTICE 'Kept only essential constraint:';
    RAISE NOTICE '- execution_status (6 statuses + NULL)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Onboarding submissions should now work perfectly!';
END $$;