-- Add Missing Features Schema Migration
-- This adds support for:
-- 1. Token-based client registration
-- 2. Strategy call communication method (WhatsApp/Meeting Link)
-- 3. Admin action tracking

-- ============================================
-- 1. ADD REGISTRATION TOKEN SUPPORT
-- ============================================

-- Add registration_token column to clients table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='registration_token') THEN
        ALTER TABLE clients ADD COLUMN registration_token VARCHAR(255);
    END IF;
END $$;

-- Add registration_token_expires column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='registration_token_expires') THEN
        ALTER TABLE clients ADD COLUMN registration_token_expires TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add registration_completed column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='clients' AND column_name='registration_completed') THEN
        ALTER TABLE clients ADD COLUMN registration_completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_clients_registration_token ON clients(registration_token);

-- ============================================
-- 2. ADD STRATEGY CALL COMMUNICATION METHOD
-- ============================================

-- Add communication_method column to strategy_calls
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='strategy_calls' AND column_name='communication_method') THEN
        ALTER TABLE strategy_calls ADD COLUMN communication_method VARCHAR(50);
        -- Options: 'whatsapp', 'meeting_link', 'phone'
    END IF;
END $$;

-- Add whatsapp_number column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='strategy_calls' AND column_name='whatsapp_number') THEN
        ALTER TABLE strategy_calls ADD COLUMN whatsapp_number VARCHAR(50);
    END IF;
END $$;

-- Add admin_action_by column (who confirmed the call)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='strategy_calls' AND column_name='admin_action_by') THEN
        ALTER TABLE strategy_calls ADD COLUMN admin_action_by UUID REFERENCES clients(id);
    END IF;
END $$;

-- Add admin_action_at column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='strategy_calls' AND column_name='admin_action_at') THEN
        ALTER TABLE strategy_calls ADD COLUMN admin_action_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================
-- 3. ADD ADMIN TRACKING TO CLIENT_ONBOARDING
-- ============================================

-- Ensure approved_by references clients table correctly
-- (already exists from previous migration, but verify)

-- ============================================
-- 4. ADD SUBSCRIPTION ASSIGNMENT TRACKING
-- ============================================

-- Add assigned_by column to client_subscriptions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='client_subscriptions' AND column_name='assigned_by') THEN
        ALTER TABLE client_subscriptions ADD COLUMN assigned_by UUID REFERENCES clients(id);
    END IF;
END $$;

-- Add assigned_at column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='client_subscriptions' AND column_name='assigned_at') THEN
        ALTER TABLE client_subscriptions ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify new columns were added
SELECT 
    'clients' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'clients'
AND column_name IN ('registration_token', 'registration_token_expires', 'registration_completed')
UNION ALL
SELECT 
    'strategy_calls' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'strategy_calls'
AND column_name IN ('communication_method', 'whatsapp_number', 'admin_action_by', 'admin_action_at')
UNION ALL
SELECT 
    'client_subscriptions' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'client_subscriptions'
AND column_name IN ('assigned_by', 'assigned_at');
