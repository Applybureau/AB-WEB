# Nuclear Client Deletion Guide

## 🎯 Problem
Previous deletion scripts didn't delete all clients due to foreign key constraints and RLS policies.

## ✅ Solution
I've created multiple approaches to ensure ALL clients are deleted:

## 📁 Files Created

1. **`backend/sql/delete_all_clients_force.sql`** - SQL script for Supabase SQL Editor
2. **`backend/nuclear-delete-all-clients.js`** - Most aggressive Node.js script
3. **`backend/verify-clients-deleted.js`** - Verification script
4. **Updated `backend/.env`** - Changed FRONTEND_URL to `https://applybureau.com`

## 🚀 Method 1: SQL Script (RECOMMENDED)

This is the most reliable method as it bypasses all application-level constraints.

### Steps:

1. **Go to Supabase Dashboard**
   - Open your project
   - Go to SQL Editor

2. **Copy and paste** the contents of `backend/sql/delete_all_clients_force.sql`

3. **Click "Run"**

4. **Verify** the results at the bottom showing:
   ```
   Remaining clients in registered_users: 0
   Remaining records in clients table: 0
   ```

### The SQL script will:
- Disable triggers temporarily
- Delete all dependent records (applications, consultations, etc.)
- Delete from clients table
- Delete from registered_users table
- Re-enable triggers
- Show verification counts

## 🚀 Method 2: Node.js Nuclear Script

If SQL method doesn't work or you prefer Node.js:

### Steps:

1. **Edit** `backend/nuclear-delete-all-clients.js`:
   ```javascript
   // Line 14 - Verify super admin email
   const SUPER_ADMIN_EMAIL = 'applybureau@gmail.com';
   
   // Line 175 - Enable confirmation
   const CONFIRMED = true; // Change to true
   ```

2. **Run the script**:
   ```bash
   cd backend
   node nuclear-delete-all-clients.js
   ```

3. **The script will**:
   - Find all clients in all tables
   - Delete using SQL (most powerful)
   - Fallback to API deletion if SQL fails
   - Delete from Supabase Auth
   - Verify deletion
   - Show remaining records

## 🔍 Method 3: Verify Deletion

After using either method, verify everything was deleted:

```bash
cd backend
node verify-clients-deleted.js
```

This will show:
- Clients remaining in registered_users
- Records remaining in clients table
- Auth users that might be clients
- Summary of deletion success

## ⚠️ If Clients Still Remain

If clients still exist after both methods:

### Option A: Manual Deletion in Supabase Dashboard

1. Go to **Database → Tables**
2. Open `registered_users` table
3. Filter by `role = 'client'`
4. Select all → Delete
5. Repeat for `clients` table

### Option B: Delete Auth Users Manually

1. Go to **Authentication → Users**
2. Find client users
3. Click three dots → Delete user
4. Repeat for all client users

### Option C: Disable RLS Temporarily

If RLS policies are preventing deletion:

1. Go to **Database → Tables → registered_users**
2. Click **RLS** tab
3. Click **Disable RLS**
4. Run deletion script again
5. Re-enable RLS after deletion

## 📊 What Gets Deleted

The nuclear script deletes:

### Dependent Records:
- application_logs
- messages
- notifications
- applications
- consultations
- consultation_requests
- twenty_questions
- strategy_calls
- interviews
- meetings
- client_files
- leads
- contact_requests

### Main Tables:
- clients (all records)
- registered_users (where role = 'client')

### Auth:
- Supabase Auth users (by ID)

### Preserved:
- Super admin (by email)
- All admin accounts
- Database schema
- Email templates

## 🔧 Frontend URL Update

The frontend URL has been updated in `backend/.env`:

```env
# OLD
FRONTEND_URL=https://www.applybureau.com

# NEW
FRONTEND_URL=https://applybureau.com
```

This affects:
- Registration links in emails
- Dashboard links
- Verification links
- All email templates

## ✅ Verification Checklist

After deletion, verify:

- [ ] Run `node backend/verify-clients-deleted.js`
- [ ] Check Supabase Dashboard → Database → registered_users
- [ ] Check Supabase Dashboard → Database → clients
- [ ] Check Supabase Dashboard → Authentication → Users
- [ ] Verify super admin still exists
- [ ] Test creating a new client
- [ ] Test admin login

## 🎯 Expected Output

### Successful Deletion:
```
🔍 VERIFYING CLIENT DELETION

======================================================================

📋 registered_users table:
   ✅ NO CLIENTS FOUND (table is clean)

📋 clients table:
   ✅ NO RECORDS FOUND (table is clean)

🔐 Supabase Auth:
   ✅ NO CLIENT AUTH USERS FOUND

======================================================================

📊 SUMMARY:

🎉 SUCCESS! All clients have been deleted!

======================================================================
```

### If Clients Remain:
```
📋 registered_users table:
   ⚠️  Found 2 client(s):
   1. test@example.com (abc-123)
   2. client@example.com (def-456)

⚠️  WARNING: 2 client record(s) still exist!

To delete them, run:
  node backend/nuclear-delete-all-clients.js

Or manually delete from Supabase Dashboard.
```

## 🚨 Troubleshooting

### Error: "Foreign key constraint violation"
- Use SQL method (Method 1) - it disables triggers
- Or delete dependent records first

### Error: "Permission denied"
- Check you're using service role key (not anon key)
- Verify SUPABASE_SERVICE_KEY in .env

### Error: "RLS policy violation"
- SQL method bypasses RLS
- Or temporarily disable RLS in Supabase Dashboard

### Clients still exist after deletion
- Check if they're in auth but not in tables
- Manually delete from Supabase Dashboard
- Check for typos in super admin email

## 💡 Best Practice

1. **Always backup first** (Supabase Dashboard → Database → Backups)
2. **Use SQL method** (most reliable)
3. **Verify with verification script**
4. **Check Supabase Dashboard** manually
5. **Test creating new client** after deletion

## 📞 Support

If deletion still fails:
1. Check Supabase logs for errors
2. Verify service role key has full permissions
3. Try manual deletion in Dashboard
4. Contact Supabase support if database is locked

## ✅ Summary

Three methods to delete all clients:
1. **SQL Script** (most reliable) - Run in Supabase SQL Editor
2. **Nuclear Node.js Script** - Handles everything including auth
3. **Manual Deletion** - Use Supabase Dashboard

Frontend URL updated to `https://applybureau.com` (without www).

All scripts preserve the super admin account.
