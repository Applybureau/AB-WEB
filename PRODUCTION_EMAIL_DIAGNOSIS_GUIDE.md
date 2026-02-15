# Production Email Diagnosis Guide

## Problem Statement
Emails are not being sent in production despite:
- ✅ Code being deployed
- ✅ Frontend showing success
- ✅ Backend returning `email_sent: true` (or false)
- ❌ No emails arriving in inbox

## Root Cause Analysis

The issue is most likely one of these:

### 1. Environment Variable Not Set (MOST LIKELY)
**Symptom**: Backend returns `email_sent: false`

**Cause**: `RESEND_API_KEY` is not set in DigitalOcean environment variables

**Solution**:
```bash
# Go to DigitalOcean App Platform
# Settings > App-Level Environment Variables
# Add or verify:
RESEND_API_KEY=re_DkzYXYAB_DN7Td7bHkh6FFYbT9sLvHib8
```

### 2. Invalid or Expired API Key
**Symptom**: Backend returns `email_sent: false` with Resend API errors in logs

**Cause**: API key is invalid, expired, or revoked

**Solution**: Generate new API key from Resend dashboard

### 3. Domain Not Verified
**Symptom**: Backend returns `email_sent: false` with 403 errors

**Cause**: `admin@applybureau.com` domain not verified in Resend

**Solution**: Verify domain in Resend dashboard

### 4. Code Not Deployed
**Symptom**: Response doesn't include `email_sent` flag

**Cause**: Latest code changes not deployed to production

**Solution**: Redeploy application

### 5. Email Template Missing
**Symptom**: Backend returns `email_sent: false` with template errors

**Cause**: Email template file not included in deployment

**Solution**: Verify `backend/emails/templates/` folder is deployed

---

## Diagnostic Steps

### Step 1: Test Resend API Key Directly
This tests if the API key works at all, bypassing all application code.

```bash
node backend/test-resend-api-key-direct.js
```

**Expected Output**:
```
✅ SUCCESS: Email sent via Resend API
Response: { "id": "abc123..." }
```

**If this fails**: API key is invalid or domain not verified
**If this succeeds**: Issue is in production environment configuration

### Step 2: Run Production Diagnostic
This tests the actual production endpoint with a real request.

```bash
node backend/diagnose-production-email-complete.js <ADMIN_TOKEN>
```

**To get admin token**:
1. Login to admin dashboard at https://www.applybureau.com/admin
2. Open browser console (F12)
3. Run: `localStorage.getItem("token")`
4. Copy the token

**Expected Output**:
```
✅ Server Reachable: YES
✅ Auth Valid: YES
✅ Endpoint Exists: YES
❌ Email Sent Flag: FALSE  <-- This is the problem
```

### Step 3: Check DigitalOcean Environment Variables

1. Go to https://cloud.digitalocean.com/apps
2. Select your app (jellyfish-app-t4m35)
3. Go to **Settings** tab
4. Click **App-Level Environment Variables**
5. Verify these variables exist:

```env
RESEND_API_KEY=re_DkzYXYAB_DN7Td7bHkh6FFYbT9sLvHib8
FRONTEND_URL=https://www.applybureau.com
BACKEND_URL=https://jellyfish-app-t4m35.ondigitalocean.app
ADMIN_EMAIL=applybureau@gmail.com
```

**If RESEND_API_KEY is missing**:
1. Click "Edit"
2. Add new variable:
   - Key: `RESEND_API_KEY`
   - Value: `re_DkzYXYAB_DN7Td7bHkh6FFYbT9sLvHib8`
   - Scope: All components
   - Encrypt: Yes (recommended)
3. Click "Save"
4. App will automatically redeploy

### Step 4: Check Production Logs

1. Go to DigitalOcean App Platform
2. Select your app
3. Go to **Runtime Logs** tab
4. Look for these log messages:

**Good signs**:
```
✅ Registration email sent to: client@example.com
Email sent: { id: 'abc123...' }
```

**Bad signs**:
```
❌ Failed to send welcome email: Error: Missing API key
❌ Email sending error: 401 Unauthorized
❌ Template payment_confirmed_welcome_concierge not found
```

### Step 5: Test Production Endpoint Manually

Use curl to test the endpoint directly:

```bash
curl -X POST https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/concierge/payment-confirmation \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_email": "israelloko65@gmail.com",
    "client_name": "Test User",
    "payment_amount": "499",
    "package_tier": "Test Package",
    "payment_method": "test"
  }'
```

**Check response for**:
```json
{
  "success": true,
  "email_sent": true,  // <-- Should be true
  "registration_url": "https://www.applybureau.com/register?token=..."
}
```

If `email_sent: false`, check the logs immediately.

---

## Quick Fix Checklist

### ✅ Immediate Actions

1. **Verify API Key in DigitalOcean**
   ```
   Settings > Environment Variables > RESEND_API_KEY
   ```

2. **Test API Key Works**
   ```bash
   node backend/test-resend-api-key-direct.js
   ```

3. **Check Production Logs**
   ```
   DigitalOcean > App > Runtime Logs
   Look for email errors
   ```

4. **Redeploy if Needed**
   ```
   DigitalOcean > App > Settings > Force Rebuild
   ```

5. **Test Production Endpoint**
   ```bash
   node backend/diagnose-production-email-complete.js <TOKEN>
   ```

---

## Common Issues & Solutions

### Issue 1: `email_sent: false` in Response

**Diagnosis**:
```bash
# Test API key
node backend/test-resend-api-key-direct.js

# If API key works, check production env vars
```

**Solution**:
- Add `RESEND_API_KEY` to DigitalOcean environment variables
- Redeploy application

### Issue 2: 401 Unauthorized from Resend

**Diagnosis**: API key is invalid

**Solution**:
1. Go to https://resend.com/api-keys
2. Generate new API key
3. Update in DigitalOcean environment variables
4. Redeploy

### Issue 3: 403 Forbidden from Resend

**Diagnosis**: Domain not verified

**Solution**:
1. Go to https://resend.com/domains
2. Verify `applybureau.com` domain
3. Add DNS records as instructed
4. Wait for verification (can take up to 48 hours)

### Issue 4: Template Not Found

**Diagnosis**: Email template file missing

**Solution**:
1. Verify `backend/emails/templates/payment_confirmed_welcome_concierge.html` exists
2. Check if templates folder is in `.gitignore` (it shouldn't be)
3. Commit and push templates folder
4. Redeploy

### Issue 5: Email in Spam

**Diagnosis**: Email sent but in spam folder

**Solution**:
1. Check spam/junk folder
2. Mark as "Not Spam"
3. Add `admin@applybureau.com` to contacts
4. Check Resend dashboard for delivery status

---

## Verification Steps

After applying fixes, verify emails work:

### 1. Test Locally First
```bash
# Set environment variable
export RESEND_API_KEY=re_DkzYXYAB_DN7Td7bHkh6FFYbT9sLvHib8

# Start server
npm start

# Test endpoint
node backend/test-payment-confirmation-email.js
```

### 2. Test Production
```bash
# Run diagnostic
node backend/diagnose-production-email-complete.js <ADMIN_TOKEN>

# Should see:
# ✅ Email Sent Flag: TRUE
# ✅ Check inbox at: israelloko65@gmail.com
```

### 3. Test via Frontend
1. Login to admin dashboard
2. Go to consultation management
3. Click "Verify & Invite" on a consultation
4. Check if email arrives within 30 seconds

---

## Monitoring & Debugging

### Check Resend Dashboard
1. Go to https://resend.com/emails
2. View recent emails
3. Check delivery status
4. View bounce/complaint reports

### Check DigitalOcean Logs
```bash
# View real-time logs
doctl apps logs <app-id> --follow

# Or via web interface
DigitalOcean > App > Runtime Logs
```

### Enable Debug Logging
Add to `.env`:
```env
DEBUG=email:*
LOG_LEVEL=debug
```

---

## Contact Information

**Resend Support**: support@resend.com
**DigitalOcean Support**: https://cloud.digitalocean.com/support

---

## Summary

The most likely issue is that `RESEND_API_KEY` is not set in DigitalOcean environment variables. Follow these steps:

1. ✅ Test API key works: `node backend/test-resend-api-key-direct.js`
2. ✅ Add to DigitalOcean: Settings > Environment Variables
3. ✅ Redeploy application
4. ✅ Test production: `node backend/diagnose-production-email-complete.js <TOKEN>`
5. ✅ Verify email received

If emails still don't work after setting the environment variable, check production logs for specific error messages.
