# 🚀 Deploy Apply Bureau Backend to Vercel

## Prerequisites
- Vercel account (free tier available)
- GitHub repository (already set up)
- Supabase database (already configured)
- Resend API key (already have)

## 📋 Step-by-Step Deployment

### 1. Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 2. Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com) and sign in**
2. **Click "New Project"**
3. **Import from GitHub:**
   - Select your GitHub account
   - Choose `Apply_Bureau_backend` repository
   - Click "Import"

4. **Configure Project:**
   - **Framework Preset:** Other
   - **Root Directory:** `backend` (important!)
   - **Build Command:** `npm install`
   - **Output Directory:** Leave empty
   - **Install Command:** `npm install`

5. **Add Environment Variables:**
   Click "Environment Variables" and add these:

   ```
   SUPABASE_URL=https://uhivvmpljffhbodrklip.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoaXZ2bXBsamZmaGJvZHJrbGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDM3ODgsImV4cCI6MjA4MjcxOTc4OH0.qyggqrmJHluIRBinz2icxofmLEUp3FQvmXdKEnNOz5w
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoaXZ2bXBsamZmaGJvZHJrbGlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE0Mzc4OCwiZXhwIjoyMDgyNzE5Nzg4fQ.H6oe0EgfsqU8NrYjIQ7qpctUJh2i1VJ3j_GasyysWzc
   RESEND_API_KEY=re_DkzYXYAB_DN7Td7bHkh6FFYbT9sLvHib8
   JWT_SECRET=e3d4d47b-759c-4cbc-998a-d3a0c9667f94
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.com
   VERCEL=1
   ```

6. **Click "Deploy"**

### 3. Alternative: Deploy via CLI

```bash
# Navigate to backend directory
cd backend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name: apply-bureau-backend
# - Directory: ./
# - Override settings? N
```

## 🔧 Post-Deployment Configuration

### 1. Update CORS Settings
Once deployed, update your CORS settings in `server.js` to include your Vercel domain:

```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://your-vercel-app.vercel.app', // Add your Vercel domain
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);
```

### 2. Update Frontend URL
Set the `FRONTEND_URL` environment variable to your actual frontend domain.

### 3. Test the Deployment
Your API will be available at: `https://your-vercel-app.vercel.app/api/`

Test endpoints:
- Health check: `https://your-vercel-app.vercel.app/health`
- Admin login: `https://your-vercel-app.vercel.app/api/auth/login`

## 📧 Email Configuration

The email templates will automatically use the correct logo URL from GitHub:
- Logo URL: `https://raw.githubusercontent.com/jesusboy-ops/Apply_Bureau_backend/main/emails/assets/logo.png`
- All email templates are configured with green/blue branding
- Buttons have white text for proper contrast

## 🔍 Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Make sure Root Directory is set to `backend`
   - Check that all environment variables are set

2. **API Routes Not Working:**
   - Verify `vercel.json` is in the backend directory
   - Check that `api/index.js` exists

3. **Database Connection Issues:**
   - Verify Supabase environment variables
   - Check Supabase project is active

4. **Email Not Sending:**
   - Verify Resend API key is correct
   - Check email templates are accessible

### Logs and Debugging:
- View deployment logs in Vercel dashboard
- Use Vercel CLI: `vercel logs`
- Check function logs in Vercel dashboard

## 🎯 Vercel Free Tier Limits

- **Function Execution:** 100GB-hours/month
- **Bandwidth:** 100GB/month
- **Requests:** 1M/month
- **Function Duration:** 10 seconds (Hobby), 30 seconds (Pro)

These limits are generous for most applications!

## 🚀 Going Live

1. **Custom Domain (Optional):**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Update DNS records as instructed

2. **Environment Variables:**
   - Update `FRONTEND_URL` to your actual frontend domain
   - Consider using Vercel's preview deployments for testing

3. **Monitoring:**
   - Use Vercel Analytics (free)
   - Monitor function performance in dashboard
   - Set up alerts for errors

## ✅ Success!

Your Apply Bureau backend is now deployed on Vercel with:
- ✅ Professional email templates with green/blue branding
- ✅ Working consultation and application management
- ✅ Real email delivery via Resend
- ✅ Secure authentication and authorization
- ✅ Production-ready error handling and logging

**Your API Base URL:** `https://your-vercel-app.vercel.app`