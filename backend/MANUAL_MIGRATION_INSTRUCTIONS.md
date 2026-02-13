# Manual Database Migration Instructions

## ⚠️ IMPORTANT: Run this migration in Supabase SQL Editor

The automated migration script cannot execute DDL statements through the Supabase client library. You need to run the SQL manually.

## Steps to Run Migration:

### 1. Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Select your project
- Navigate to: **SQL Editor** (left sidebar)

### 2. Copy the SQL Migration File
- Open file: `backend/sql/client_dashboard_complete_schema.sql`
- Copy the ENTIRE contents

### 3. Execute in SQL Editor
- Paste the SQL into the SQL Editor
- Click **"Run"** button
- Wait for execution to complete

### 4. Verify Tables Were Created
Run this query to verify:

```sql
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
```

Expected result: All 5 tables should exist with row counts (subscription_plans should have 3 rows).

### 5. Verify Clients Table Columns
Run this query:

```sql
SELECT 
    id,
    email,
    onboarding_completed,
    onboarding_approved,
    profile_unlocked,
    payment_confirmed
FROM clients
LIMIT 1;
```

Expected result: All columns should exist (values may be NULL).

## What This Migration Creates:

### Tables:
1. **client_onboarding** - Stores 20 Questions assessment data
2. **strategy_calls** - Manages strategy call bookings and confirmations
3. **client_files** - Tracks uploaded files (resume, LinkedIn, portfolio)
4. **subscription_plans** - Defines Tier 1, 2, 3 plans
5. **client_subscriptions** - Links clients to their subscription plans

### Columns Added to `clients` Table:
- `onboarding_completed` (BOOLEAN)
- `onboarding_approved` (BOOLEAN)
- `profile_unlocked` (BOOLEAN)
- `payment_confirmed` (BOOLEAN)

### Default Data:
- 3 subscription plans (Tier 1: $349, Tier 2: $499, Tier 3: $699)

## After Migration:

Once the migration is complete, the following endpoints will work:

### Client Endpoints:
- `POST /api/client/onboarding/submit` - Submit 20Q assessment
- `GET /api/client/onboarding/status` - Get 20Q status
- `POST /api/strategy-calls` - Book strategy call
- `GET /api/strategy-calls/status` - Get strategy call status
- `POST /api/client/uploads/resume` - Upload resume
- `POST /api/client/uploads/linkedin` - Add LinkedIn URL
- `POST /api/client/uploads/portfolio` - Add portfolio URLs
- `GET /api/client/uploads/status` - Get upload status
- `GET /api/client/dashboard` - Complete dashboard overview

### Admin Endpoints:
- `GET /api/admin/clients/:id/onboarding` - View client's 20Q responses
- `GET /api/admin/strategy-calls` - View all strategy call requests
- `POST /api/admin/strategy-calls/:id/confirm` - Confirm strategy call
- `GET /api/admin/clients/:id/files` - View client's uploaded files

## Troubleshooting:

### If you get "table already exists" errors:
- This is normal if you've run the migration before
- The script is idempotent (safe to run multiple times)
- Existing data will NOT be deleted

### If you get "column already exists" errors:
- This is also normal and safe
- The script checks for existing columns before adding them

### If subscription plans are not inserted:
- Run this query manually:
```sql
INSERT INTO subscription_plans (plan_name, tier, price_cad, duration_weeks, applications_per_week, features, is_active)
VALUES 
('TIER 1 — Core Application Support', 1, 349.00, 8, '15–17 per week', 
 '["One-time strategy and role alignment call (30 minutes)", "Base resume creation or optimization", "Up to 15–17 tailored applications per week", "Resume tailored per role with keyword alignment", "Application tracking with status visibility", "2 mock interview sessions (30 minutes each)"]'::jsonb, TRUE),
('TIER 2 — Advanced Application Support', 2, 499.00, 12, '25–30 per week',
 '["Everything in Tier 1, plus:", "Advanced resume optimization for competitive roles", "Up to 25–30 deeply tailored applications per week", "Expanded interview preparation", "4 mock interview sessions (30 minutes each)", "Role-specific interview preparation materials"]'::jsonb, TRUE),
('TIER 3 — Priority Application Execution', 3, 699.00, 16, '40–50 per week',
 '["Everything in Tier 2, plus:", "Priority handling across applications and resume revisions", "Up to 40–50 tailored applications per week", "Advanced interview coaching and between-round guidance", "6 mock interview sessions (30 minutes each)", "Offer-stage and decision-support advisory"]'::jsonb, TRUE)
ON CONFLICT DO NOTHING;
```

## Need Help?

If you encounter any issues:
1. Check the Supabase logs in the dashboard
2. Verify your database permissions
3. Contact support with the error message
