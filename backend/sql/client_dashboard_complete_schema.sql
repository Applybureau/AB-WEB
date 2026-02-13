-- Client Dashboard Complete Schema Migration
-- This script creates all necessary tables and columns for the new client dashboard flow
-- It's designed to be idempotent (can run multiple times safely)

-- ============================================
-- 1. CLIENT ONBOARDING (20 Questions)
-- ============================================

-- Create client_onboarding table if it doesn't exist
CREATE TABLE IF NOT EXISTS client_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Section 1: Role Targeting
    q1 TEXT, -- Roles You Want Us to Apply For
    q2 TEXT, -- Roles You Are Open To
    q3 TEXT, -- Roles to Avoid
    
    -- Section 2: Location & Work Preferences
    q4 VARCHAR(50), -- Preferred Work Type (remote, hybrid, onsite, open_to_all)
    q5 VARCHAR(50), -- Location Scope (province_state_only, country_wide, canada_us)
    q6 TEXT, -- Specific Cities or Regions
    q7 TEXT, -- Locations to Exclude
    
    -- Section 3: Compensation
    q8 INTEGER, -- Minimum Salary
    q8_currency VARCHAR(10) DEFAULT 'CAD',
    q9 INTEGER, -- Ideal Salary
    q9_currency VARCHAR(10) DEFAULT 'CAD',
    q10 VARCHAR(20), -- Contract Roles (yes, no, depends)
    q10a TEXT, -- Contract Conditions
    
    -- Section 4: Application Rules
    q11 VARCHAR(50), -- Work Authorization
    q11a TEXT, -- Work Authorization Details
    q12 VARCHAR(10), -- Visa Sponsorship (yes, no)
    q13 VARCHAR(50), -- Willing to Relocate
    q14 VARCHAR(20), -- Driver's License Required
    q14a VARCHAR(50), -- License Type Held
    q15 TEXT, -- Industries to Avoid
    
    -- Section 5: Disclosures
    q16 VARCHAR(50), -- Disability Status
    q17 VARCHAR(50), -- Veteran Status
    q18 VARCHAR(50), -- Demographic Self-ID
    
    -- Section 6: Priorities
    q19 TEXT[], -- What Matters Most (array of max 2)
    
    -- Section 7: Final Notes
    q20 TEXT, -- Additional Notes
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending_approval', -- pending_approval, active, completed
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES clients(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one onboarding per client
    UNIQUE(client_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_onboarding_client_id ON client_onboarding(client_id);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_status ON client_onboarding(status);

-- ============================================
-- 2. STRATEGY CALLS
-- ============================================

-- Create strategy_calls table if it doesn't exist
CREATE TABLE IF NOT EXISTS strategy_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Time slot preferences (client provides 1-3 options)
    time_slot_1 TIMESTAMP WITH TIME ZONE,
    time_slot_2 TIMESTAMP WITH TIME ZONE,
    time_slot_3 TIMESTAMP WITH TIME ZONE,
    
    -- Confirmed details
    scheduled_time TIMESTAMP WITH TIME ZONE,
    meeting_link TEXT,
    phone_number VARCHAR(50),
    email VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending_confirmation', -- pending_confirmation, confirmed, completed, cancelled
    
    -- Notes
    client_notes TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_strategy_calls_client_id ON strategy_calls(client_id);
CREATE INDEX IF NOT EXISTS idx_strategy_calls_status ON strategy_calls(status);
CREATE INDEX IF NOT EXISTS idx_strategy_calls_scheduled_time ON strategy_calls(scheduled_time);

-- ============================================
-- 3. FILE UPLOADS
-- ============================================

-- Create client_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS client_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- File details
    file_type VARCHAR(50) NOT NULL, -- resume, linkedin, portfolio
    filename VARCHAR(255),
    file_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- For LinkedIn and Portfolio (URL-based)
    url TEXT,
    
    -- Metadata
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_files_client_id ON client_files(client_id);
CREATE INDEX IF NOT EXISTS idx_client_files_type ON client_files(file_type);
CREATE INDEX IF NOT EXISTS idx_client_files_active ON client_files(is_active);

-- ============================================
-- 4. SUBSCRIPTION PLANS
-- ============================================

-- Create subscription_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Plan details
    plan_name VARCHAR(255) NOT NULL,
    tier INTEGER NOT NULL, -- 1, 2, 3
    price_cad DECIMAL(10, 2),
    duration_weeks INTEGER,
    applications_per_week VARCHAR(50),
    
    -- Features (stored as JSON array)
    features JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS client_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    
    -- Subscription details
    plan_name VARCHAR(255),
    price_cad DECIMAL(10, 2),
    start_date DATE,
    end_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, paused, completed, cancelled
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_client_id ON client_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_status ON client_subscriptions(status);

-- ============================================
-- 5. ADD MISSING COLUMNS TO CLIENTS TABLE
-- ============================================

-- Add onboarding_completed column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='onboarding_completed') THEN
        ALTER TABLE clients ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add onboarding_approved column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='onboarding_approved') THEN
        ALTER TABLE clients ADD COLUMN onboarding_approved BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add profile_unlocked column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='profile_unlocked') THEN
        ALTER TABLE clients ADD COLUMN profile_unlocked BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add payment_confirmed column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='payment_confirmed') THEN
        ALTER TABLE clients ADD COLUMN payment_confirmed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ============================================
-- 6. INSERT DEFAULT SUBSCRIPTION PLANS
-- ============================================

-- Insert Tier 1 plan if it doesn't exist
INSERT INTO subscription_plans (plan_name, tier, price_cad, duration_weeks, applications_per_week, features, is_active)
SELECT 
    'TIER 1 — Core Application Support',
    1,
    349.00,
    8,
    '15–17 per week',
    '["One-time strategy and role alignment call (30 minutes)", "Base resume creation or optimization", "Up to 15–17 tailored applications per week", "Resume tailored per role with keyword alignment", "Application tracking with status visibility", "2 mock interview sessions (30 minutes each)"]'::jsonb,
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM subscription_plans WHERE tier = 1 AND is_active = TRUE
);

-- Insert Tier 2 plan if it doesn't exist
INSERT INTO subscription_plans (plan_name, tier, price_cad, duration_weeks, applications_per_week, features, is_active)
SELECT 
    'TIER 2 — Advanced Application Support',
    2,
    499.00,
    12,
    '25–30 per week',
    '["Everything in Tier 1, plus:", "Advanced resume optimization for competitive roles", "Up to 25–30 deeply tailored applications per week", "Expanded interview preparation", "4 mock interview sessions (30 minutes each)", "Role-specific interview preparation materials"]'::jsonb,
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM subscription_plans WHERE tier = 2 AND is_active = TRUE
);

-- Insert Tier 3 plan if it doesn't exist
INSERT INTO subscription_plans (plan_name, tier, price_cad, duration_weeks, applications_per_week, features, is_active)
SELECT 
    'TIER 3 — Priority Application Execution',
    3,
    699.00,
    16,
    '40–50 per week',
    '["Everything in Tier 2, plus:", "Priority handling across applications and resume revisions", "Up to 40–50 tailored applications per week", "Advanced interview coaching and between-round guidance", "6 mock interview sessions (30 minutes each)", "Offer-stage and decision-support advisory"]'::jsonb,
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM subscription_plans WHERE tier = 3 AND is_active = TRUE
);

-- ============================================
-- 7. CREATE UPDATED_AT TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_client_onboarding_updated_at') THEN
        CREATE TRIGGER update_client_onboarding_updated_at
            BEFORE UPDATE ON client_onboarding
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_strategy_calls_updated_at') THEN
        CREATE TRIGGER update_strategy_calls_updated_at
            BEFORE UPDATE ON strategy_calls
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_client_files_updated_at') THEN
        CREATE TRIGGER update_client_files_updated_at
            BEFORE UPDATE ON client_files
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_client_subscriptions_updated_at') THEN
        CREATE TRIGGER update_client_subscriptions_updated_at
            BEFORE UPDATE ON client_subscriptions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables were created
SELECT 
    'client_onboarding' as table_name,
    COUNT(*) as row_count
FROM client_onboarding
UNION ALL
SELECT 
    'strategy_calls' as table_name,
    COUNT(*) as row_count
FROM strategy_calls
UNION ALL
SELECT 
    'client_files' as table_name,
    COUNT(*) as row_count
FROM client_files
UNION ALL
SELECT 
    'subscription_plans' as table_name,
    COUNT(*) as row_count
FROM subscription_plans
UNION ALL
SELECT 
    'client_subscriptions' as table_name,
    COUNT(*) as row_count
FROM client_subscriptions;
