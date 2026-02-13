# Database Migration Guide - Client Dashboard

## 🎯 Goal
Add support for:
- 20 Questions onboarding assessment
- Strategy call booking system
- File uploads (resume, LinkedIn, portfolio)
- Subscription plan management

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Copy and Run the Migration
1. Open file: `backend/sql/client_dashboard_schema_fixed.sql`
2. Copy the **ENTIRE** contents
3. Paste into the SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)
5. Wait for execution (should take 5-10 seconds)

### Step 3: Verify Success
You should see a result table showing:

| table_name | row_count |
|------------|-----------|
| client_onboarding | 0 |
| strategy_calls | (existing count) |
| client_files | 0 |
| subscription_plans | 3 |
| client_subscriptions | 0 |

✅ If you see this, migration was successful!

### Step 4: Verify Clients Table Columns
Run this query to verify new columns were added:

```sql
SELECT 
    id,
    email,
    full_name,
    onboarding_completed,
    onboarding_approved,
    profile_unlocked,
    payment_confirmed
FROM clients
LIMIT 5;
```

Expected: All columns should exist (values may be NULL or FALSE).

## 🔍 What Was Created

### New Tables:
1. **client_onboarding** - Stores 20 Questions assessment responses
2. **client_files** - Tracks uploaded files (resume, LinkedIn, portfolio)
3. **subscription_plans** - Defines Tier 1, 2, 3 subscription plans
4. **client_subscriptions** - Links clients to their subscription plans

### Existing Tables (Not Modified):
- **strategy_calls** - Already exists with correct structure

### New Columns in `clients` Table:
- `onboarding_completed` (BOOLEAN) - Whether client finished 20Q
- `onboarding_approved` (BOOLEAN) - Whether admin approved 20Q
- `payment_confirmed` (BOOLEAN) - Whether payment was verified

### Default Data Inserted:
- **3 Subscription Plans**:
  - Tier 1: $349 CAD (8 weeks, 15-17 apps/week)
  - Tier 2: $499 CAD (12 weeks, 25-30 apps/week)
  - Tier 3: $699 CAD (16 weeks, 40-50 apps/week)

## ✅ After Migration

Once complete, these endpoints will work:

### Client Endpoints:
```
POST   /api/client/onboarding/submit       - Submit 20Q assessment
GET    /api/client/onboarding/status       - Get 20Q status
POST   /api/strategy-calls                 - Book strategy call
GET    /api/strategy-calls/status          - Get strategy call status
POST   /api/client/uploads/resume          - Upload resume
POST   /api/client/uploads/linkedin        - Add LinkedIn URL
POST   /api/client/uploads/portfolio       - Add portfolio URLs
GET    /api/client/uploads/status          - Get upload status
GET    /api/client/dashboard               - Complete dashboard
```

### Admin Endpoints:
```
GET    /api/admin/clients/:id/onboarding   - View client's 20Q
GET    /api/admin/strategy-calls           - View all strategy calls
POST   /api/admin/strategy-calls/:id/confirm - Confirm strategy call
GET    /api/admin/clients/:id/files        - View client's files
```

## 🚨 Troubleshooting

### Error: "relation already exists"
✅ **This is NORMAL** - The script is idempotent (safe to run multiple times)

### Error: "column already exists"
✅ **This is NORMAL** - The script checks before adding columns

### No subscription plans inserted
Run this manually:
```sql
SELECT * FROM subscription_plans;
```
If empty, the INSERT statements didn't run. Check for errors in the SQL output.

### Can't see new columns in clients table
Run this to verify:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name IN ('onboarding_completed', 'onboarding_approved', 'payment_confirmed')
ORDER BY column_name;
```

## 📞 Need Help?

If you see any errors:
1. Copy the full error message
2. Check which line number failed
3. Run that specific section separately
4. Contact support with the error details

## 🎉 Next Steps

After successful migration:
1. Test the client dashboard endpoint
2. Test 20Q submission
3. Test strategy call booking
4. Test file uploads
5. Update frontend to use new endpoints
