# Vercel Environment Variables Setup

## 🚨 IMPORTANT: Frontend URL Configuration

The backend is currently using `http://localhost:5173` in emails because the `FRONTEND_URL` environment variable needs to be updated in Vercel.

---

## 📋 Required Environment Variables in Vercel

### 1. Go to Vercel Dashboard
1. Open your project: https://vercel.com/dashboard
2. Click on your backend project
3. Go to **Settings** → **Environment Variables**

### 2. Update FRONTEND_URL

**Current Value** (WRONG):
```
FRONTEND_URL=http://localhost:5173
```

**Should Be** (CORRECT):
```
FRONTEND_URL=https://your-actual-frontend-domain.com
```

**Example**:
```
FRONTEND_URL=https://apply-bureau.vercel.app
```

or

```
FRONTEND_URL=https://www.applybureau.com
```

---

## 🔧 How to Update

### Method 1: Vercel Dashboard (Recommended)
1. Go to: https://vercel.com/dashboard
2. Select your backend project
3. Click **Settings**
4. Click **Environment Variables**
5. Find `FRONTEND_URL`
6. Click **Edit**
7. Change value to your actual frontend URL
8. Click **Save**
9. **Redeploy** the project (important!)

### Method 2: Vercel CLI
```bash
vercel env add FRONTEND_URL production
# Enter your frontend URL when prompted
# Example: https://apply-bureau.vercel.app

# Then redeploy
vercel --prod
```

---

## 📧 What This Affects

The `FRONTEND_URL` is used in:

1. **Registration Links** in emails
   - Current: `http://localhost:5173/register?token=...`
   - Should be: `https://your-domain.com/register?token=...`

2. **Password Reset Links**
   - Current: `http://localhost:5173/reset-password?token=...`
   - Should be: `https://your-domain.com/reset-password?token=...`

3. **All Email Templates** that include links back to the frontend

---

## ✅ Verification

After updating and redeploying, test by:

1. Trigger a payment verification
2. Check the email received
3. Verify the registration link uses your actual domain

### Test Script:
```bash
node scripts/test-vercel-payment-with-manual-token.js
```

Check the response for `registration_url` - it should show your actual domain, not localhost.

---

## 🔍 Current Environment Variables Needed

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIs...` |
| `RESEND_API_KEY` | Resend email API key | `re_xxxxx` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `NODE_ENV` | Environment | `production` |
| `FRONTEND_URL` | **Frontend domain** | `https://your-domain.com` ⚠️ |
| `PORT` | Server port (optional) | `3000` |

---

## 🚀 After Updating

1. **Save** the environment variable in Vercel
2. **Redeploy** the project (Vercel → Deployments → Redeploy)
3. **Wait** for deployment to complete (~2-3 minutes)
4. **Test** the payment verification endpoint
5. **Check** the email for correct URLs

---

## 💡 Pro Tip

You can set different values for different environments:

- **Production**: `https://www.applybureau.com`
- **Preview**: `https://preview.applybureau.com`
- **Development**: `http://localhost:5173`

This way, preview deployments use preview URLs, and production uses production URLs.

---

## 🐛 Troubleshooting

### Issue: Emails still show localhost
**Solution**: Make sure you redeployed after changing the environment variable. Vercel doesn't automatically redeploy when you change env vars.

### Issue: Registration link doesn't work
**Solution**: Check that the frontend URL doesn't have a trailing slash. Use `https://domain.com` not `https://domain.com/`

### Issue: Changes not taking effect
**Solution**: 
1. Clear Vercel build cache
2. Trigger a fresh deployment
3. Wait for deployment to complete
4. Test again

---

## 📝 Quick Fix Checklist

- [ ] Go to Vercel Dashboard
- [ ] Open backend project settings
- [ ] Find Environment Variables
- [ ] Update `FRONTEND_URL` to actual domain
- [ ] Save changes
- [ ] Redeploy project
- [ ] Wait for deployment
- [ ] Test payment verification
- [ ] Check email for correct URL

---

**Last Updated**: January 15, 2026  
**Priority**: HIGH - Required for production emails to work correctly
