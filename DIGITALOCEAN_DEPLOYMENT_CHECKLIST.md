# DigitalOcean Deployment Checklist

## 🚨 CRITICAL: Environment Variables Setup

Your deployment is failing because **environment variables are not set in DigitalOcean App Platform dashboard**.

### Required Environment Variables

These MUST be set in DigitalOcean dashboard (not just referenced in app.yaml):

#### 🔐 Database Configuration (CRITICAL)
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 📧 Email Service (CRITICAL)
```
RESEND_API_KEY=re_xxxxxxxxxx
```

#### 🔑 Security (CRITICAL)
```
JWT_SECRET=your-32-character-random-secret-key
```

#### 🌐 URLs (IMPORTANT)
```
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-app.ondigitalocean.app
```

## 📋 Step-by-Step Setup

### 1. Access DigitalOcean Dashboard
1. Go to: https://cloud.digitalocean.com/apps
2. Select your app: "apply-bureau-backend"
3. Click "Settings" tab
4. Click "App-Level Environment Variables"

### 2. Add Environment Variables
For each variable above:
1. Click "Add Variable"
2. Enter variable name (e.g., `SUPABASE_URL`)
3. Enter the actual value (not `${SUPABASE_URL}`)
4. Repeat for all variables

### 3. Save and Redeploy
1. Click "Save"
2. Go to "Deployments" tab
3. Click "Create Deployment"

## 🔧 Technical Details

### Why This Happens
- The `app.yaml` file uses `${VARIABLE_NAME}` syntax
- This tells DigitalOcean to look for variables in app settings
- Variables must be manually added to DigitalOcean dashboard
- They are NOT automatically copied from your local `.env` file

### Current App.yaml Configuration ✅
```yaml
envs:
  - key: SUPABASE_URL
    value: ${SUPABASE_URL}  # References dashboard variable
  - key: SUPABASE_ANON_KEY
    value: ${SUPABASE_ANON_KEY}
  # ... etc
```

### Server Configuration ✅
```javascript
const PORT = process.env.PORT || 8080;  # Correct
app.listen(PORT, '0.0.0.0', () => {     # Correct
```

## 🧪 Testing After Deployment

### 1. Run Environment Validation
```bash
node backend/validate-env.js
```

### 2. Test Health Endpoints
```bash
curl https://your-app.ondigitalocean.app/health
curl https://your-app.ondigitalocean.app/api/health
```

### Expected Results
- Both endpoints should return `200 OK`
- Response should include `"service": "Apply Bureau Backend"`

## ⚠️ Common Issues

### Issue: "Missing required environment variable: SUPABASE_URL"
**Cause**: Environment variables not set in DigitalOcean dashboard
**Fix**: Follow steps 1-3 above

### Issue: "Health check failure on port 8080"
**Cause**: App cannot start due to missing environment variables
**Fix**: Set environment variables and redeploy

### Issue: "Non-Zero Exit Code"
**Cause**: App crashes during startup due to missing variables
**Fix**: Environment variables setup

## 📞 Troubleshooting

### Check DigitalOcean Build Logs
1. Go to your app in DigitalOcean
2. Click "Deployments" tab
3. Click on latest deployment
4. Check "Build Logs" and "Runtime Logs"

### Verify Variable Names
- Variable names are case-sensitive
- No extra spaces in names or values
- Use exact names from checklist above

### Test Locally First
```bash
# Set environment variables locally
export SUPABASE_URL="your-url"
export SUPABASE_ANON_KEY="your-key"
# ... etc

# Test server startup
npm start
```

## 🎯 Success Criteria

After setting environment variables and redeploying:

- ✅ Build completes without errors
- ✅ App starts successfully (no exit code errors)
- ✅ Health checks pass
- ✅ `/health` endpoint returns 200 OK
- ✅ `/api/health` endpoint returns 200 OK
- ✅ No "Missing environment variable" errors in logs

## 📁 Files Modified for Better Error Handling

1. `backend/utils/supabase.js` - Enhanced error messages for missing variables
2. `backend/server.js` - Startup validation with clear instructions
3. `backend/validate-env.js` - Environment variable validation script
4. `backend/package.json` - Optimized scripts for production

---

**Next Action**: Set environment variables in DigitalOcean dashboard and redeploy.