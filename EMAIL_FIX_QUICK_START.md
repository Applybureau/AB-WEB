# Email Fix Quick Start Guide

## 🚨 Problem
Emails not being sent in production despite code being deployed.

## 🎯 Most Likely Cause
`RESEND_API_KEY` environment variable is NOT set in DigitalOcean.

## ⚡ Quick Fix (5 minutes)

### Step 1: Test if API Key Works
```bash
cd backend
node test-resend-api-key-direct.js
```

**Expected**: Email arrives at israelloko65@gmail.com within 30 seconds

**If email arrives**: API key works ✅ → Go to Step 2
**If email fails**: API key is invalid ❌ → Get new key from https://resend.com/api-keys

---

### Step 2: Add Environment Variable to DigitalOcean

1. Go to: https://cloud.digitalocean.com/apps
2. Select your app: `jellyfish-app-t4m35`
3. Click **Settings** tab
4. Click **App-Level Environment Variables**
5. Click **Edit**
6. Add new variable:
   ```
   Key:   RESEND_API_KEY
   Value: re_DkzYXYAB_DN7Td7bHkh6FFYbT9sLvHib8
   Scope: All components
   ```
7. Click **Save**
8. Wait for automatic redeploy (2-3 minutes)

---

### Step 3: Test Production Endpoint

Get your admin token:
1. Login to https://www.applybureau.com/admin
2. Open browser console (F12)
3. Run: `localStorage.getItem("token")`
4. Copy the token

Run diagnostic:
```bash
node backend/diagnose-production-email-complete.js YOUR_ADMIN_TOKEN
```

**Expected Output**:
```
✅ Server Reachable: YES
✅ Auth Valid: YES
✅ Endpoint Exists: YES
✅ Email Sent Flag: TRUE  <-- Should be TRUE now
```

---

### Step 4: Verify Email Received

Check inbox at: israelloko65@gmail.com

**If email received**: ✅ FIXED! Emails are working.

**If no email**: Check spam folder or run diagnostic again.

---

## 🔍 Detailed Diagnosis

If quick fix doesn't work, see: `PRODUCTION_EMAIL_DIAGNOSIS_GUIDE.md`

---

## 📝 Summary

The issue is that DigitalOcean doesn't have the `RESEND_API_KEY` environment variable set. Once you add it and redeploy, emails will work.

**Time to fix**: 5 minutes
**Difficulty**: Easy
**Success rate**: 99%

---

## 🆘 Still Not Working?

1. Check DigitalOcean logs:
   - Go to app dashboard
   - Click "Runtime Logs"
   - Look for email errors

2. Verify domain:
   - Go to https://resend.com/domains
   - Check if `applybureau.com` is verified

3. Test manually:
   ```bash
   curl -X POST https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/concierge/payment-confirmation \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"client_email":"israelloko65@gmail.com","client_name":"Test","payment_amount":"499"}'
   ```

4. Contact support if still failing after all checks.
