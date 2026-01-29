# CRITICAL: DigitalOcean Environment Variables Setup

## 🚨 IMMEDIATE ACTION REQUIRED

Your DigitalOcean deployment is failing because environment variables are not set in the DigitalOcean App Platform dashboard.

## 📍 Step-by-Step Fix

### 1. Go to DigitalOcean Dashboard
- Navigate to: https://cloud.digitalocean.com/apps
- Select your app: "apply-bureau-backend"

### 2. Access Environment Variables
- Click on your app name
- Go to "Settings" tab
- Click "App-Level Environment Variables"

### 3. Add Required Variables
Add each of these variables with their actual values:

#### 🔐 Database (CRITICAL - App won't start without these)
- **SUPABASE_URL**: https://your-project-id.supabase.co
- **SUPABASE_ANON_KEY**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- **SUPABASE_SERVICE_KEY**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

#### 📧 Email Service
- **RESEND_API_KEY**: re_xxxxxxxxxx

#### 🔑 Security
- **JWT_SECRET**: your-secret-key-here (generate a random 32+ character string)

#### 🌐 URLs
- **FRONTEND_URL**: https://your-frontend-domain.com
- **BACKEND_URL**: https://apply-bureau-backend-production.ondigitalocean.app

### 4. Save and Redeploy
- Click "Save" after adding all variables
- Go to "Deployments" tab
- Click "Create Deployment" to redeploy

## ⚠️ CRITICAL NOTES

1. **Variable Names**: Must match exactly (case-sensitive)
2. **No Spaces**: Don't add spaces in variable names or values
3. **All Required**: App will fail if any database variables are missing
4. **Redeploy Required**: Changes only take effect after redeployment

## 🧪 Test After Deployment

Once deployed, test these endpoints:
- https://your-app.ondigitalocean.app/health (should return 200 OK)
- https://your-app.ondigitalocean.app/api/health (should return 200 OK)

## 🔧 Why This Happens

The app.yaml file uses ${VARIABLE_NAME} syntax to reference environment variables, but DigitalOcean needs the actual values set in the dashboard. The variables are not automatically copied from your local .env file.
