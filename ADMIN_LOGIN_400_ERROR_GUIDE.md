# Admin Login 400 Error - Troubleshooting Guide

## Current Status: RATE LIMITED ⚠️

Your Vercel backend is currently **rate limited** due to too many login attempts. The API will be accessible again in **15 minutes** from the last attempt.

---

## Rate Limiting Configuration

The backend has strict rate limiting on the login endpoint:
- **Login endpoint**: 5 attempts per 15 minutes
- **General API**: 100 requests per 15 minutes

```javascript
// From server.js
app.use('/api/auth/login', createRateLimiter(15 * 60 * 1000, 5, 'Too many login attempts'));
```

---

## Understanding HTTP Status Codes

### 400 Bad Request
**Cause**: Validation error - missing or invalid fields
**Common reasons**:
1. Missing `email` field
2. Missing `password` field
3. Invalid email format (not a valid email address)
4. Wrong field names (e.g., `username` instead of `email`)
5. Capitalized field names (e.g., `Email` instead of `email`)

### 401 Unauthorized
**Cause**: Authentication failed - wrong credentials
**Reasons**:
- Email doesn't exist in database
- Password is incorrect

### 429 Too Many Requests
**Cause**: Rate limit exceeded
**Solution**: Wait 15 minutes before trying again

---

## Required Login Payload Format

The backend expects **exactly** this format:

```json
{
  "email": "admin@applybureau.com",
  "password": "Admin@123456"
}
```

### ✅ Valid Examples
```javascript
// Correct
{ email: "admin@applybureau.com", password: "Admin@123456" }

// Also correct (with quotes)
{ "email": "admin@applybureau.com", "password": "Admin@123456" }
```

### ❌ Invalid Examples (Will cause 400 error)
```javascript
// Wrong field name
{ username: "admin@applybureau.com", password: "Admin@123456" }

// Capitalized fields
{ Email: "admin@applybureau.com", Password: "Admin@123456" }

// Missing email
{ password: "Admin@123456" }

// Missing password
{ email: "admin@applybureau.com" }

// Empty strings
{ email: "", password: "" }

// Invalid email format
{ email: "not-an-email", password: "Admin@123456" }
```

---

## Validation Schema

From `backend/utils/validation.js`:

```javascript
login: Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})
```

**Requirements**:
- `email`: Must be a valid email format (contains @, domain, etc.)
- `password`: Must be a non-empty string
- Both fields are **required**

---

## Frontend Checklist

### 1. Check Request Payload
Verify your frontend is sending the correct format:

```javascript
// ✅ Correct
const loginData = {
  email: emailInput.value,
  password: passwordInput.value
};

// ❌ Wrong
const loginData = {
  username: emailInput.value,  // Wrong field name
  password: passwordInput.value
};
```

### 2. Check Field Names (Case Sensitive)
```javascript
// ✅ Correct - lowercase
{ email: "...", password: "..." }

// ❌ Wrong - capitalized
{ Email: "...", Password: "..." }
```

### 3. Check for Empty Values
```javascript
// Add validation before sending
if (!email || !password) {
  alert('Please enter both email and password');
  return;
}

if (!email.includes('@')) {
  alert('Please enter a valid email address');
  return;
}
```

### 4. Check API Endpoint
```javascript
// ✅ Correct
const response = await fetch('https://apply-bureau-backend.vercel.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email, password })
});

// ❌ Wrong - missing /api
const response = await fetch('https://apply-bureau-backend.vercel.app/auth/login', ...);
```

### 5. Check Content-Type Header
```javascript
// ✅ Must include this header
headers: {
  'Content-Type': 'application/json'
}
```

---

## Debugging Steps

### Step 1: Wait for Rate Limit to Reset
**Wait 15 minutes** from your last login attempt before testing again.

### Step 2: Test with curl (After Rate Limit Resets)
```bash
curl -X POST https://apply-bureau-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@applybureau.com","password":"Admin@123456"}'
```

**Expected responses**:
- **200 OK**: Login successful (returns token)
- **400 Bad Request**: Validation error (check payload format)
- **401 Unauthorized**: Wrong credentials
- **429 Too Many Requests**: Still rate limited

### Step 3: Check Frontend Console
Open browser DevTools (F12) and check:

1. **Network tab**: Look at the request payload
   - Click on the login request
   - Go to "Payload" or "Request" tab
   - Verify the JSON structure

2. **Console tab**: Look for JavaScript errors
   - Check if form data is being collected correctly
   - Verify no typos in field names

### Step 4: Add Frontend Logging
```javascript
// Before sending request
console.log('Login payload:', { email, password: '***' });

// After receiving response
console.log('Response status:', response.status);
console.log('Response data:', await response.json());
```

---

## Common Frontend Issues

### Issue 1: Hardcoded Credentials
```javascript
// ❌ Bad - hardcoded
const email = "admin@applybureau.com";
const password = "Admin@123456";

// ✅ Good - from user input
const email = document.getElementById('email').value;
const password = document.getElementById('password').value;
```

### Issue 2: Form Submission Preventing Default
```javascript
// ✅ Prevent form from refreshing page
form.addEventListener('submit', async (e) => {
  e.preventDefault();  // Important!
  
  const email = emailInput.value;
  const password = passwordInput.value;
  
  // Make API call...
});
```

### Issue 3: Not Handling Errors
```javascript
// ✅ Proper error handling
try {
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    // Handle different status codes
    if (response.status === 400) {
      alert('Invalid email or password format');
    } else if (response.status === 401) {
      alert('Wrong email or password');
    } else if (response.status === 429) {
      alert('Too many attempts. Please wait 15 minutes.');
    }
    return;
  }
  
  // Success - store token
  localStorage.setItem('token', data.token);
  
} catch (error) {
  console.error('Login error:', error);
  alert('Network error. Please try again.');
}
```

---

## Testing Script (After Rate Limit Resets)

Run this script to test all scenarios:

```bash
node backend/scripts/debug-vercel-login-issue.js
```

This will test:
1. Valid login (should return 200 or 401)
2. Missing email (should return 400)
3. Missing password (should return 400)
4. Invalid email format (should return 400)
5. Empty strings (should return 400)
6. Wrong password (should return 401)
7. Various incorrect payload formats (should return 400)

---

## Quick Fix Checklist

- [ ] Wait 15 minutes for rate limit to reset
- [ ] Verify frontend sends `{ email: "...", password: "..." }` (lowercase)
- [ ] Check email input has valid email format
- [ ] Check password input is not empty
- [ ] Verify Content-Type header is `application/json`
- [ ] Check API endpoint is `/api/auth/login`
- [ ] Test with curl to isolate frontend vs backend issue
- [ ] Check browser console for errors
- [ ] Verify credentials are correct: `admin@applybureau.com` / `Admin@123456`

---

## Next Steps

1. **Wait 15 minutes** for rate limit to reset
2. **Test with curl** to verify backend is working
3. **Check frontend code** for payload format issues
4. **Add console.log** to see what's being sent
5. **Compare** frontend payload with required format above

---

## Need More Help?

If the issue persists after following this guide:

1. Share the **exact error message** from the API response
2. Share the **request payload** from browser DevTools
3. Share the **frontend code** that makes the login request
4. Check if you're using the correct admin credentials

---

## Master Admin Credentials

```
Email: admin@applybureau.com
Password: Admin@123456
```

**Note**: These credentials are stored in the `admins` table in Supabase.
