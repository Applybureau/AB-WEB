# Upload 403 Error - Diagnosis & Solution

## Summary

✅ **Your frontend code is 100% CORRECT!**

The data format you're sending matches exactly what the backend expects:
- LinkedIn: `{ "linkedin_url": "string" }`
- Portfolio: `{ "portfolio_urls": ["string", "string"] }`

❌ **The 403 error is from authentication, NOT data format**

## Root Cause

The 403 error comes from the `requireClient` middleware in `backend/middleware/auth.js`:

```javascript
const requireClient = (req, res, next) => {
  if (!req.user || req.user.role !== 'client') {
    return res.status(403).json({ error: 'Client access required' });
  }
  next();
};
```

This middleware checks:
1. `req.user` exists (from `authenticateToken` middleware)
2. `req.user.role === 'client'`

If either check fails → 403 error

## Possible Causes

### 1. Token Missing Role Field
The JWT token doesn't have a `role` field or it's not set to `'client'`

**Check:**
```javascript
// Token should contain:
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "client",  // ← This must be "client"
  "exp": 1234567890
}
```

### 2. User Role Not Set in Database
The user record in `registered_users` table doesn't have `role = 'client'`

**Check database:**
```sql
SELECT id, email, role FROM registered_users WHERE email = 'user@example.com';
```

### 3. Login Endpoint Not Setting Role
The login/registration endpoint isn't including the role in the JWT token

**Check:** `backend/routes/clientRegistration.js` line ~140

### 4. Token Format Issue
Token not being sent correctly in Authorization header

**Should be:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Diagnosis Steps

### Step 1: Check Token Contents

Run the debug script:
```bash
cd backend
node debug-upload-403-error.js
```

1. Get your token from browser (DevTools > Application > Local Storage)
2. Paste it in the script where it says `PASTE_YOUR_TOKEN_HERE`
3. Run the script to see what's in your token

### Step 2: Check Database

```sql
-- Check user role
SELECT id, email, role, is_active, payment_confirmed 
FROM registered_users 
WHERE email = 'your-email@example.com';

-- Should show: role = 'client'
```

### Step 3: Check Backend Logs

Look for this log message:
```
Client access denied { userId: 'xxx', role: 'xxx', path: '/linkedin' }
```

This tells you what role the backend sees.

## Solutions

### Solution 1: Update User Role in Database

If user role is missing or wrong:

```sql
UPDATE registered_users 
SET role = 'client' 
WHERE email = 'your-email@example.com';
```

Then log out and log in again to get a new token.

### Solution 2: Fix Token Generation

Check `backend/routes/clientRegistration.js` around line 140:

```javascript
const authToken = jwt.sign({
  userId: updatedUser.id,
  id: updatedUser.id,
  email: updatedUser.email,
  role: updatedUser.role,  // ← Make sure this is included
  full_name: updatedUser.full_name,
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
}, process.env.JWT_SECRET);
```

### Solution 3: Re-login

Sometimes the simplest solution:
1. Log out completely
2. Clear browser cache/local storage
3. Log in again
4. Try upload again

### Solution 4: Check CORS

Make sure CORS allows the Authorization header:

```javascript
// backend/server.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']  // ← Important
}));
```

## Testing

### Test 1: Verify Token

```bash
# In backend folder
node debug-upload-403-error.js
```

Should show:
- ✅ Role is correctly set to "client"
- ✅ User ID found
- ✅ Token is valid and not expired

### Test 2: Test Upload with cURL

```bash
# Replace TOKEN with your actual token
curl -X POST https://jellyfish-app-t4m35.ondigitalocean.app/api/client/uploads/linkedin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"linkedin_url":"https://linkedin.com/in/test"}'
```

Expected:
- ✅ 200 OK with success message
- ❌ 403 if role issue persists

### Test 3: Check Backend Logs

```bash
# On DigitalOcean
doctl apps logs YOUR_APP_ID --type run

# Look for:
# "Client access denied" messages
```

## Quick Fix Checklist

- [ ] Token contains `role: "client"` field
- [ ] Database has `role = 'client'` for user
- [ ] User is logged in with fresh token
- [ ] Authorization header format is correct
- [ ] CORS allows Authorization header
- [ ] Backend is running latest code
- [ ] No typos in endpoint URL

## Expected Behavior

### Correct Flow:

1. User logs in → Gets JWT token with `role: "client"`
2. Frontend stores token
3. Frontend sends request with `Authorization: Bearer <token>`
4. Backend `authenticateToken` middleware decodes token → sets `req.user`
5. Backend `requireClient` middleware checks `req.user.role === 'client'` → ✅ passes
6. Upload endpoint processes request → ✅ success

### Current Flow (with 403):

1. User logs in → Gets JWT token
2. Frontend stores token
3. Frontend sends request with `Authorization: Bearer <token>`
4. Backend `authenticateToken` middleware decodes token → sets `req.user`
5. Backend `requireClient` middleware checks `req.user.role === 'client'` → ❌ fails
6. Returns 403 error

## Contact Points

If issue persists after trying all solutions:

1. Check the token contents with debug script
2. Verify database role field
3. Check backend logs for specific error
4. Verify CORS configuration
5. Test with cURL to isolate frontend vs backend issue

## Summary

**Your frontend code is perfect!** The issue is purely authentication/authorization related, specifically the `role` field in the JWT token or database.

Most likely fix: Update user role in database and re-login.
