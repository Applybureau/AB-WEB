# DigitalOcean Environment Variables Checklist

## 🚨 CRITICAL ISSUE: Missing Environment Variables

DigitalOcean is reporting that `SUPABASE_URL` is missing, which means the environment variables are not set in the DigitalOcean App Platform dashboard.

## Required Environment Variables

These environment variables MUST be set in the DigitalOcean App Platform dashboard:

### 🔐 Database Configuration
- **SUPABASE_URL** - Your Supabase project URL (e.g., https://your-project.supabase.co)
- **SUPABASE_ANON_KEY** - Your Supabase anonymous key  
- **SUPABASE_SERVICE_KEY** - Your Supabase service role key

### 📧 Email Configuration
- **RESEND_API_KEY** - Your Resend API key for sending emails

### 🔑 Security Configuration
- **JWT_SECRET** - Secret key for JWT token signing (generate a strong random string)

### 🌐 URL Configuration
- **FRONTEND_URL** - Your frontend application URL
- **BACKEND_URL** - Your DigitalOcean app URL (e.g., https://your-app.ondigitalocean.app)

## How to Set Environment Variables in DigitalOcean

1. **Go to DigitalOcean App Platform dashboard**
2. **Select your app** (apply-bureau-backend)
3. **Go to "Settings" tab**
4. **Click on "App-Level Environment Variables"**
5. **Add each variable with its value:**
   - Click "Add Variable"
   - Enter the variable name (e.g., SUPABASE_URL)
   - Enter the variable value
   - Repeat for all variables
6. **Click "Save"**
7. **Redeploy the application**

## ⚠️ CRITICAL: Why Environment Variables Are Missing

The app.yaml file references variables like `${SUPABASE_URL}`, but DigitalOcean needs the actual values set in the dashboard. The `${}` syntax tells DigitalOcean to look for these variables in the app settings.

## 🔧 NPM Configuration Fix

Added `NPM_CONFIG_UNSAFE_PERM=false` to fix the npm warning about unknown cli config "--unsafe-perm".

## 🧪 Testing After Fixes

After setting all environment variables and redeploying:

```bash
node verify-digitalocean-deployment.js
```

## 📞 Troubleshooting

If deployment still fails:

1. **Double-check variable names** - They are case-sensitive
2. **Ensure no extra spaces** in variable names or values
3. **Verify all required variables are set** in DigitalOcean dashboard
4. **Check deployment logs** in DigitalOcean for specific errors
5. **Redeploy after making changes**

## 🎯 Expected Result

After setting environment variables, the deployment should succeed and the health endpoints should respond:
- `/health` - Returns 200 OK
- `/api/health` - Returns 200 OK