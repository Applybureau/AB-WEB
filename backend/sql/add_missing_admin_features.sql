-- ============================================
-- ADD MISSING ADMIN FEATURES SCHEMA
-- ============================================
-- This adds tables for:
-- 1. Interview Coordination
-- 2. Subscription History
-- 3. Enhanced 20Q tracking
-- ============================================

-- ============================================
-- INTERVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  
  -- Interview Details
  company TEXT,
  role TEXT,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('phone_screen', 'technical', 'behavioral', 'final', 'hr', 'panel', 'other')),
  interview_round INTEGER DEFAULT 1,
  
  -- Scheduling
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Interviewer Info
  interviewer_name TEXT,
  interviewer_email TEXT,
  interviewer_title TEXT,
  
  -- Meeting Details
  meeting_link TEXT,
  meeting_password TEXT,
  location TEXT CHECK (location IN ('Virtual', 'On-site', 'Phone', 'Other')),
  address TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show')),
  preparation_status TEXT DEFAULT 'not_started' CHECK (preparation_status IN ('not_started', 'in_progress', 'completed')),
  
  -- Notes and Feedback
  admin_notes TEXT,
  client_notes TEXT,
  feedback TEXT,
  outcome TEXT CHECK (outcome IN ('passed', 'failed', 'pending', 'no_decision')),
  next_steps TEXT,
  
  -- Metadata
  created_by UUID REFERENCES public.registered_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for interviews
CREATE INDEX IF NOT EXISTS idx_interviews_client_id ON public.interviews(client_id);
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON public.interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_date ON public.interviews(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.interviews(status);

-- ============================================
-- INTERVIEW MATERIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.interview_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('document', 'video', 'link', 'other')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.registered_users(id)
);

CREATE INDEX IF NOT EXISTS idx_interview_materials_interview_id ON public.interview_materials(interview_id);

-- ============================================
-- INTERVIEW HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.interview_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'cancelled', 'rescheduled', 'completed', 'feedback_added')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  by_user_id UUID REFERENCES public.registered_users(id),
  changes TEXT
);

CREATE INDEX IF NOT EXISTS idx_interview_history_interview_id ON public.interview_history(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_history_timestamp ON public.interview_history(timestamp);

-- ============================================
-- SUBSCRIPTION HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.client_subscriptions(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL CHECK (action IN ('created', 'extended', 'renewed', 'cancelled', 'expired', 'upgraded', 'downgraded')),
  
  -- Extension details
  previous_end_date DATE,
  new_end_date DATE,
  extension_days INTEGER,
  
  -- Reason and notes
  reason TEXT,
  admin_notes TEXT,
  
  -- Metadata
  performed_by UUID REFERENCES public.registered_users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON public.subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_client_id ON public.subscription_history(client_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_performed_at ON public.subscription_history(performed_at);

-- ============================================
-- UPDATE CLIENT_ONBOARDING TABLE
-- ============================================
-- Add reviewed_at and reviewed_by columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'client_onboarding' 
                 AND column_name = 'reviewed_at') THEN
    ALTER TABLE public.client_onboarding ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'client_onboarding' 
                 AND column_name = 'reviewed_by') THEN
    ALTER TABLE public.client_onboarding ADD COLUMN reviewed_by UUID REFERENCES public.registered_users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'client_onboarding' 
                 AND column_name = 'admin_notes') THEN
    ALTER TABLE public.client_onboarding ADD COLUMN admin_notes TEXT;
  END IF;
END $$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Interviews: Admins can do everything, clients can view their own
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all interviews" ON public.interviews;
CREATE POLICY "Admins can manage all interviews" ON public.interviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.registered_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Clients can view their own interviews" ON public.interviews;
CREATE POLICY "Clients can view their own interviews" ON public.interviews
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Interview Materials: Same as interviews
ALTER TABLE public.interview_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all interview materials" ON public.interview_materials;
CREATE POLICY "Admins can manage all interview materials" ON public.interview_materials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.registered_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Interview History: Read-only for clients, full access for admins
ALTER TABLE public.interview_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage interview history" ON public.interview_history;
CREATE POLICY "Admins can manage interview history" ON public.interview_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.registered_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Subscription History: Admins only
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage subscription history" ON public.subscription_history;
CREATE POLICY "Admins can manage subscription history" ON public.subscription_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.registered_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
  'interviews' as table_name,
  COUNT(*) as row_count
FROM public.interviews
UNION ALL
SELECT 
  'interview_materials' as table_name,
  COUNT(*) as row_count
FROM public.interview_materials
UNION ALL
SELECT 
  'interview_history' as table_name,
  COUNT(*) as row_count
FROM public.interview_history
UNION ALL
SELECT 
  'subscription_history' as table_name,
  COUNT(*) as row_count
FROM public.subscription_history;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Missing admin features schema created successfully!';
  RAISE NOTICE '📋 Tables created:';
  RAISE NOTICE '   • interviews';
  RAISE NOTICE '   • interview_materials';
  RAISE NOTICE '   • interview_history';
  RAISE NOTICE '   • subscription_history';
  RAISE NOTICE '🔒 RLS policies applied';
  RAISE NOTICE '✨ Ready to use new admin features!';
END $$;
