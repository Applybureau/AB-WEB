# DigitalOcean Deployment Fix - Environment Variables & NPM Issues

## 🚨 Issues Identified

DigitalOcean reported two critical issues preventing deployment:

1. **Missing Environment Variable**: `SUPABASE_URL` environment variable is required but not provided
2. **NPM Configuration Warning**: Unknown cli config "--unsafe-perm" causing potential npm permissions issues

## ✅ Fixes Applied

### 1. NPM Configuration Fix
- **Added** `NPM_CONFIG_UNSAFE_PERM=false` to `backend/.do/app.yaml`
- **Updated** `backend/package.json` with npm config section:
  ```json
  "config": {
    "unsafe-perm": false
  }
  ```

### 2. Environment Variables Documentation
- **Created** `backend/DIGITALOCEAN_ENV_CHECKLIST.md` with complete setup instructions
- **Verified** all required environment variables are properly referenced in `app.yaml`

### 3. Enhanced Deployment Verification
- **Updated** `backend/verify-digitalocean-deployment.js` with environment variable checking
- **Added** comprehensive error reporting and troubleshooting guidance

## 🔐 Required Environment Variables

These MUST be set in DigitalOcean App Platform dashboard:

### Database Configuration
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key  
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key

### Email Configuration
- `RESEND_API_KEY` - Your Resend API key for sending emails

### Security Configuration
- `JWT_SECRET` - Secret key for JWT token signing

### URL Configuration
- `FRONTEND_URL` - Your frontend application URL
- `BACKEND_URL` - Your DigitalOcean app URL

## 📋 Critical Next Steps

### 1. Set Environment Variables in DigitalOcean
1. Go to DigitalOcean App Platform dashboard
2. Select your app (apply-bureau-backend)
3. Go to "Settings" tab
4. Click on "App-Level Environment Variables"
5. Add each required variable with its value
6. Click "Save"

### 2. Redeploy Application
After setting environment variables, redeploy the application in DigitalOcean.

### 3. Verify Deployment
Run the verification script to test the deployment:
```bash
node backend/verify-digitalocean-deployment.js
```

## 🔧 Technical Details

### App.yaml Configuration
```yaml
envs:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "8080"
  - key: SUPABASE_URL
    value: ${SUPABASE_URL}
  - key: SUPABASE_ANON_KEY
    value: ${SUPABASE_ANON_KEY}
  - key: SUPABASE_SERVICE_KEY
    value: ${SUPABASE_SERVICE_KEY}
  - key: RESEND_API_KEY
    value: ${RESEND_API_KEY}
  - key: JWT_SECRET
    value: ${JWT_SECRET}
  - key: FRONTEND_URL
    value: ${FRONTEND_URL}
  - key: BACKEND_URL
    value: ${BACKEND_URL}
  - key: NPM_CONFIG_UNSAFE_PERM
    value: "false"
  - key: ENABLE_WEBSOCKET
    value: "false"
```

### Package.json NPM Configuration
```json
{
  "config": {
    "unsafe-perm": false
  }
}
```

## ⚠️ Important Notes

1. **Environment Variables**: The `${}` syntax in app.yaml tells DigitalOcean to look for these variables in the app settings. The actual values must be set in the DigitalOcean dashboard.

2. **NPM Permissions**: The `NPM_CONFIG_UNSAFE_PERM=false` setting resolves npm permission warnings during the build process.

3. **Case Sensitivity**: Environment variable names are case-sensitive. Ensure exact matches.

4. **No Spaces**: Ensure no extra spaces in variable names or values.

## 🎯 Expected Results

After applying these fixes and setting environment variables:

- ✅ DigitalOcean build should complete successfully
- ✅ Application should start without environment variable errors
- ✅ Health endpoints should respond:
  - `/health` returns 200 OK
  - `/api/health` returns 200 OK
- ✅ NPM warnings should be resolved

## 📞 Troubleshooting

If deployment still fails:

1. **Check DigitalOcean build logs** for specific error messages
2. **Verify all environment variables** are set correctly in the dashboard
3. **Ensure variable names match exactly** (case-sensitive)
4. **Check for typos** in variable values
5. **Redeploy after making any changes**

## 🚀 Deployment Status

- ✅ Code changes committed and pushed to GitHub
- ⏳ Environment variables need to be set in DigitalOcean dashboard
- ⏳ Application needs to be redeployed
- ⏳ Deployment verification pending

## 📁 Files Modified

1. `backend/.do/app.yaml` - Added NPM_CONFIG_UNSAFE_PERM
2. `backend/package.json` - Added npm config section
3. `backend/verify-digitalocean-deployment.js` - Enhanced with env checking
4. `backend/DIGITALOCEAN_ENV_CHECKLIST.md` - New setup guide
5. `backend/fix-digitalocean-env-issues.js` - Fix script for future reference

---

**Next Action Required**: Set environment variables in DigitalOcean App Platform dashboard and redeploy.