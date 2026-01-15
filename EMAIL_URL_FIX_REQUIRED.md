# Email URL Fix - Action Required

## 🚨 Issue

Emails are using `http://localhost:5173` instead of the actual frontend URL.

---

## ✅ What's Working

The email system IS using real data correctly:
- ✅ Client name from request
- ✅ Payment amount from request  
- ✅ Payment date from request
- ✅ Package tier from request
- ✅ Selected services from request

**Example from test**:
```json
{
  "client_name": "Test Client Vercel",
  "payment_amount": "299",
  "payment_date": "2026-01-15",
  "package_tier": "Tier 2",
  "selected_services": []
}
```

All this data appears correctly in the email! ✅

---

## ❌ What's NOT Working

The registration URL in the email shows:
```
http://localhost:5173/register?token=...
```

Instead of:
```
https://your-actual-domain.com/register?token=...
```

---

## 🔧 The Fix

### Step 1: Update Vercel Environment Variable

1. Go to https://vercel.com/dashboard
2. Select your **backend** project
3. Go to **Settings** → **Environment Variables**
4. Find `FRONTEND_URL`
5. Change from: `http://localhost:5173`
6. Change to: `https://your-actual-frontend-domain.com`
7. Click **Save**

### Step 2: Redeploy

After saving the environment variable:
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Step 3: Verify

Test the payment verification again and check the email - the URL should now be correct!

---

## 📋 What Frontend URL Should Be

Replace `http://localhost:5173` with your actual frontend domain:

**If using Vercel for frontend**:
```
FRONTEND_URL=https://apply-bureau-frontend.vercel.app
```

**If using custom domain**:
```
FRONTEND_URL=https://www.applybureau.com
```

**If using subdomain**:
```
FRONTEND_URL=https://app.applybureau.com
```

---

## 🎯 Summary

| Component | Status | Fix Required |
|-----------|--------|--------------|
| Email data (name, amount, date, etc) | ✅ Working | None |
| Email template | ✅ Working | None |
| Email sending | ✅ Working | None |
| Registration URL | ❌ Wrong | Update FRONTEND_URL in Vercel |

---

## 💡 Why This Happens

The `.env` file in the repository has:
```
FRONTEND_URL=http://localhost:5173/
```

This is correct for local development, but Vercel needs its own environment variable set to the production URL.

---

## ✅ After Fix

Once you update the `FRONTEND_URL` in Vercel and redeploy:

**Email will show**:
```
Hello Test Client Vercel,

Congratulations! Your payment has been confirmed...

Payment Details:
Amount: $299 CAD
Payment Date: 2026-01-15
Package: Tier 2
Services: Full service package

Create Your Account:
https://your-actual-domain.com/register?token=eyJhbGciOiJIUzI1NiIs...
                    ↑↑↑ CORRECT URL ↑↑↑
```

---

**Action Required**: Update `FRONTEND_URL` in Vercel environment variables  
**Priority**: HIGH  
**Impact**: All email links will work correctly after fix  
**See**: `VERCEL_ENVIRONMENT_SETUP.md` for detailed instructions
