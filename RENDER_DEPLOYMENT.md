# 🚀 Deploy Apply Bureau Backend to Render

## Prerequisites
- Render account (free tier available)
- GitHub repository (already set up)
- Supabase database (already configured)
- Resend API key (already have)

## ⚠️ Important: Node.js Version Requirement

**Apply Bureau Backend requires Node.js 20 or higher** due to Supabase dependencies.

Make sure to set:
- **Node Version:** `20` (not 18 or lower)
- This is critical for Supabase compatibility

---

## 📋 Step-by-Step Deployment

### 1. Create New Web Service on Render

1. **Go to [render.com](https://render.com) and sign in**
2. **Click "New +" → "Web Service"**
3. **Connect GitHub repository:**
   - Select your GitHub account
   - Choose `Apply_Bureau_backend` repository
   - Click "Connect"

### 2. Configure Web Service

**Basic Settings:**
- **Name:** `apply-bureau-backend`
- **Region:** Choose closest to your users
- **Branch:** `master`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Advanced Settings:**
- **Node Version:** `20` (required for Supabase)
- **Auto-Deploy:** `Yes`

### 3. Add Environment Variables

In the "Environment" section, add these variables:

```
SUPABASE_URL=https://uhivvmpljffhbodrklip.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoaXZ2bXBsamZmaGJvZHJrbGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDM3ODgsImV4cCI6MjA4MjcxOTc4OH0.qyggqrmJHluIRBinz2icxofmLEUp3FQvmXdKEnNOz5w
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoaXZ2bXBsamZmaGJvZHJrbGlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE0Mzc4OCwiZXhwIjoyMDgyNzE5Nzg4fQ.H6oe0EgfsqU8NrYjIQ7qpctUJh2i1VJ3j_GasyysWzc
RESEND_API_KEY=re_DkzYXYAB_DN7Td7bHkh6FFYbT9sLvHib8
JWT_SECRET=e3d4d47b-759c-4cbc-998a-d3a0c9667f94
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-domain.com
```

### 4. Deploy

1. **Click "Create Web Service"**
2. **Wait for deployment** (usually 2-5 minutes)
3. **Your API will be available at:** `https://your-service-name.onrender.com`

## 🔧 Post-Deployment Configuration

### 1. Update CORS Settings
Once deployed, note your Render URL and update CORS if needed in your frontend.

### 2. Test the Deployment
Your API endpoints will be available at:
- Health check: `https://your-service-name.onrender.com/health`
- Admin login: `https://your-service-name.onrender.com/api/auth/login`
- Email assets: `https://your-service-name.onrender.com/emails/assets/logo.png`

### 3. Custom Domain (Optional)
- Go to Settings → Custom Domains
- Add your domain and configure DNS

## 📧 Email Configuration

The email templates will automatically work with:
- Logo URL: `https://raw.githubusercontent.com/jesusboy-ops/Apply_Bureau_backend/main/emails/assets/logo.png`
- Green/blue branding (#10b981, #06b6d4)
- White button text
- Mobile-responsive design

## 🔍 Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check that Root Directory is set to `backend`
   - Verify all environment variables are set
   - Check build logs in Render dashboard

2. **Server Won't Start:**
   - Verify Start Command is `npm start`
   - Check that PORT environment variable is set
   - Review server logs

3. **Database Connection Issues:**
   - Verify Supabase environment variables
   - Check Supabase project is active
   - Test connection from Render logs

4. **Email Not Sending:**
   - Verify Resend API key is correct
   - Check email templates are accessible
   - Review email service logs

### Monitoring:
- View deployment logs in Render dashboard
- Monitor service health and performance
- Set up alerts for downtime

## 💰 Render Free Tier

**Free Tier Includes:**
- **750 hours/month** of runtime
- **Automatic SSL**
- **Custom domains**
- **GitHub integration**
- **Automatic deploys**

**Limitations:**
- Service spins down after 15 minutes of inactivity
- Cold start delay (10-30 seconds)
- 512MB RAM limit

**Paid Plans:**
- $7/month for always-on service
- More RAM and CPU
- No cold starts

## 🚀 Production Optimizations

### 1. Health Checks
Render automatically monitors your `/health` endpoint.

### 2. Environment Variables
Keep sensitive data in environment variables, never in code.

### 3. Logging
Use the built-in logging system - logs are available in the dashboard.

### 4. Scaling
Upgrade to paid plan for:
- Always-on service
- Better performance
- No cold starts

## ✅ Success Checklist

After deployment, verify:
- [ ] Health endpoint responds: `/health`
- [ ] Admin login works: `/api/auth/login`
- [ ] Email templates load: `/emails/assets/logo.png`
- [ ] Database connection works
- [ ] Email sending works (test with real email)
- [ ] All API endpoints respond correctly

## 🎯 Your Deployed Backend Features

✅ **Professional Email System**
- Green/blue branding
- White button text
- Logo display from GitHub
- Mobile-responsive templates

✅ **Complete API**
- Authentication and authorization
- Consultation scheduling
- Application tracking
- Real-time notifications
- File upload support

✅ **Production Ready**
- Error handling and logging
- Security features
- Rate limiting
- Performance monitoring
- Audit trails

**Your API Base URL:** `https://your-service-name.onrender.com`

## 📞 Support

- **Render Docs:** [render.com/docs](https://render.com/docs)
- **Community:** [community.render.com](https://community.render.com)
- **Status:** [status.render.com](https://status.render.com)

Ready for Render deployment! 🚀