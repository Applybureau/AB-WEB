# Frontend URL Fix Required - Registration Links Using Wrong Domain

## Issue

Registration links in emails are using the old Vercel URL:
```
https://apply-bureau.vercel.app/register?token=...
```

Instead of the production domain:
```
https://applybureau.com/register?token=...
```

## Root Cause

The backend `.env` file has been updated to:
```
FRONTEND_URL=https://applybureau.com
```

However, the backend server on DigitalOcean is still running with the OLD environment variable cached in memory. Environment variables are loaded when the server starts, so changes to `.env` don't take effect until the server is restarted.

## Where Registration Links Are Generated

**File:** `backend/routes/onboardingWorkflow.js` (line 395)

```javascript
const registrationUrl = `${process.env.FRONTEND_URL}/register?token=${registrationToken}`;
await sendEmail(consultation.email, 'payment_verified_registration', {
  client_name: consultation.name,
  registration_url: registrationUrl,
  // ...
});
```

The code is correct - it uses `process.env.FRONTEND_URL`. The problem is the server needs to be restarted to load the new value.

## Solution: Restart Backend Server on DigitalOcean

### Option 1: Restart via DigitalOcean Dashboard

1. Go to DigitalOcean Dashboard
2. Navigate to your App Platform app
3. Click on the backend component
4. Click "Actions" → "Restart"
5. Wait for restart to complete (~2-3 minutes)

### Option 2: Redeploy Backend

1. Push any change to the backend (or force redeploy)
2. DigitalOcean will automatically restart with new environment variables

### Option 3: Update Environment Variable via Dashboard

1. Go to DigitalOcean Dashboard
2. Navigate to your App Platform app
3. Go to "Settings" → "App-Level Environment Variables"
4. Update `FRONTEND_URL` to `https://applybureau.com`
5. Click "Save"
6. App will automatically restart

## Verification

After restarting, test that the new URL is being used:

### Test 1: Check Environment Variable

```bash
curl https://jellyfish-app-t4m35.ondigitalocean.app/api/health
```

### Test 2: Create Test Consultation

Create a new consultation and check the registration email. The link should now be:
```
https://applybureau.com/register?token=...
```

### Test 3: Check Server Logs

Look for the FRONTEND_URL in server startup logs to confirm it's using the correct value.

## Files That Reference FRONTEND_URL

The following files correctly use `process.env.FRONTEND_URL`:

1. `backend/routes/onboardingWorkflow.js` - Registration emails
2. `backend/routes/clientRegistration.js` - Registration flow
3. `backend/utils/email.js` - `buildUrl()` function for all email links
4. `backend/server.js` - CORS configuration

All code is correct. Only the server restart is needed.

## Expected Behavior After Fix

All registration links will use:
- ✅ `https://applybureau.com/register?token=...`
- ✅ `https://applybureau.com/login`
- ✅ `https://applybureau.com/client/dashboard`

Instead of:
- ❌ `https://apply-bureau.vercel.app/register?token=...`

## Additional Notes

### Why This Happened

The `.env` file was updated locally, but the running server on DigitalOcean still has the old value in memory. Node.js loads environment variables once at startup and doesn't reload them automatically.

### Prevention

When updating environment variables:
1. Update the `.env` file
2. Commit and push changes
3. Restart the server immediately
4. Verify the new value is being used

### CORS Configuration

The server already allows both domains in CORS:
```javascript
const allowedOrigins = [
  'https://www.applybureau.com',
  'https://applybureau.com',
  'https://apply-bureau.vercel.app', // Legacy support
  // ...
];
```

So both old and new links will work during the transition.

## Action Required

**Restart the backend server on DigitalOcean** to load the new `FRONTEND_URL` value.

After restart, all new registration emails will use the correct production domain.
