# Database Cleanup Guide

## 🎯 Purpose

This script clears all test data from your database and storage, preparing the system for production use while preserving only the super admin account.

## ⚠️ WARNING

**THIS IS A DESTRUCTIVE OPERATION THAT CANNOT BE UNDONE!**

The script will permanently delete:
- All uploaded files from storage
- All consultations and consultation requests
- All applications
- All clients
- All test admin accounts (except super admin)
- All messages and notifications
- All related data

## 📋 What Gets Deleted

### Storage
- All files from all storage buckets
- Resumes, portfolios, LinkedIn PDFs
- Any uploaded documents

### Database Tables
- `applications` - All job applications
- `consultations` - All consultation records
- `consultation_requests` - All consultation requests
- `contact_requests` - All contact form submissions
- `messages` - All messages between clients and admins
- `notifications` - All system notifications
- `clients` - All client records
- `registered_users` (role='client') - All client user accounts
- `admins` (except super admin) - All test admin accounts
- `registered_users` (role='admin', except super admin) - Test admin users
- `twenty_questions` - All 20Q responses
- `strategy_calls` - All strategy call records
- `interviews` - All interview records
- `leads` - All lead records
- `meetings` - All meeting records
- `client_files` - All file metadata
- `application_logs` - All application logs

### What Gets Preserved
- ✅ Super admin account (specified by email)
- ✅ Database schema and structure
- ✅ Email templates
- ✅ System configuration

## 🚀 How to Use

### Step 1: Backup (IMPORTANT!)

Before running this script, create a backup of your database:

```bash
# Using Supabase CLI
supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use Supabase Dashboard:
# Settings → Database → Backups → Create Backup
```

### Step 2: Configure Super Admin Email

Edit `backend/clear-all-test-data.js`:

```javascript
// Line 18 - Change this to your actual super admin email
const SUPER_ADMIN_EMAIL = 'your-super-admin@example.com';
```

### Step 3: Enable Confirmation

Edit `backend/clear-all-test-data.js`:

```javascript
// Line 387 - Change this to true
const CONFIRMED = true;
```

### Step 4: Run the Script

```bash
cd backend
node clear-all-test-data.js
```

### Step 5: Verify Results

The script will output a summary showing:
- Number of records deleted from each table
- Number of files deleted from storage
- Confirmation that super admin still exists
- Any errors encountered

## 📊 Expected Output

```
🚨 CLEARING ALL TEST DATA

======================================================================

⚠️  WARNING: This will delete ALL data except super admin!
   Super admin to preserve: applybureau@gmail.com

======================================================================

📦 STEP 1: Deleting all uploaded files from storage...

Found 2 storage bucket(s)

Clearing bucket: client-files
  Found 15 file(s) in client-files
  ✅ Deleted 15 file(s) from client-files

💬 STEP 2: Deleting all messages...

✅ Deleted 23 message(s)

🔔 STEP 3: Deleting all notifications...

✅ Deleted 45 notification(s)

📋 STEP 4: Deleting all applications...

✅ Deleted 12 application(s)

📅 STEP 5: Deleting all consultations...

✅ Deleted 8 consultation(s)

📝 STEP 6: Deleting all consultation requests...

✅ Deleted 5 consultation request(s)

👥 STEP 8: Deleting all clients...

✅ Deleted 10 client(s) from registered_users
✅ Deleted 10 record(s) from clients table

👨‍💼 STEP 9: Deleting test admins (preserving super admin)...

Preserving super admin: applybureau@gmail.com
✅ Deleted 2 test admin(s) from admins table

======================================================================
📊 CLEANUP SUMMARY

Data Deleted:
  • Storage Files: 15
  • Consultations: 8
  • Consultation Requests: 5
  • Applications: 12
  • Clients: 10
  • Test Admins: 2
  • Messages: 23
  • Notifications: 45

✅ Super Admin Preserved:
  Email: applybureau@gmail.com
  Name: Super Admin
  Role: admin
  ID: abc123...

======================================================================

✅ Database cleanup complete!

💡 Next steps:
   1. Verify super admin can still login
   2. Test creating new clients
   3. Test file uploads
   4. Monitor for any issues
```

## 🔍 Troubleshooting

### Error: "Super admin not found"

If you see this warning after cleanup:
1. Check that you set the correct email in `SUPER_ADMIN_EMAIL`
2. Verify the super admin exists before running the script
3. You may need to recreate the super admin account

### Error: "Could not delete from [table]"

This usually means:
- The table doesn't exist (safe to ignore)
- There are foreign key constraints preventing deletion
- You don't have sufficient permissions

### Storage Files Not Deleted

If storage files remain:
1. Check Supabase storage permissions
2. Verify the service key has storage access
3. Manually delete from Supabase Dashboard if needed

## 🛡️ Safety Features

### Confirmation Required
The script requires explicit confirmation by setting `CONFIRMED = true`. This prevents accidental execution.

### Super Admin Protection
The script explicitly preserves the super admin account by email, ensuring you don't lock yourself out.

### Error Handling
The script continues even if some operations fail, and reports all errors at the end.

### Verification
After cleanup, the script verifies the super admin still exists and displays their details.

## 📝 Post-Cleanup Checklist

After running the cleanup script:

- [ ] Verify super admin can login
- [ ] Test creating a new client account
- [ ] Test file upload functionality
- [ ] Test consultation request flow
- [ ] Test application creation
- [ ] Check email notifications work
- [ ] Verify storage is empty
- [ ] Monitor error logs for issues

## 🔄 Restoring from Backup

If you need to restore from backup:

```bash
# Using Supabase CLI
supabase db reset --db-url "your-database-url"
psql "your-database-url" < backup_file.sql

# Or use Supabase Dashboard:
# Settings → Database → Backups → Restore
```

## 💡 Alternative: Selective Cleanup

If you want to delete only specific data types, you can modify the script:

1. Comment out the steps you don't want to run
2. Keep only the deletions you need
3. Run the modified script

Example - Delete only clients:
```javascript
// Comment out all other steps
// Only run STEP 8: DELETE ALL CLIENTS
```

## 🚨 Production Use

**Before using in production:**

1. ✅ Create a full database backup
2. ✅ Test on a staging environment first
3. ✅ Verify super admin email is correct
4. ✅ Inform your team about the cleanup
5. ✅ Schedule during low-traffic period
6. ✅ Have a rollback plan ready

## 📞 Support

If you encounter issues:
1. Check the error messages in the output
2. Verify your database permissions
3. Check Supabase logs for detailed errors
4. Restore from backup if needed

## ⚙️ Script Configuration

### Customizing Super Admin Email
```javascript
const SUPER_ADMIN_EMAIL = 'your-email@example.com';
```

### Enabling Confirmation
```javascript
const CONFIRMED = true; // Set to true to run
```

### Adding Tables to Clean
```javascript
const otherTables = [
  'twenty_questions',
  'strategy_calls',
  'your_custom_table', // Add here
];
```

## ✅ Summary

This script provides a safe, comprehensive way to reset your database to a clean state while preserving your super admin account. Always backup first, verify the super admin email, and test in staging before production use.
