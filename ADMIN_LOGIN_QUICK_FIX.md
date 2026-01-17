# Admin Login 400 Error - Quick Fix

## 🚨 Current Issue: RATE LIMITED

Your API is **rate limited** due to too many login attempts.

**Wait 15 minutes** before testing again.

---

## ⚡ Quick Diagnosis

### If you get 400 error:
**Problem**: Frontend is sending wrong payload format

**Check these**:
1. Field names must be lowercase: `email` and `password` (not `Email`, `Password`, or `username`)
2. Both fields must be present
3. Email must be valid format (contains @)
4. Content-Type header must be `application/json`

### If you get 401 error:
**Problem**: Wrong credentials or user doesn't exist

**Check these**:
1. Email: `admin@applybureau.com`
2. Password: `Admin@123456`
3. Admin exists in Supabase `admins` table

### If you get 429 error:
**Problem**: Too many attempts

**Solution**: Wait 15 minutes

---

## ✅ Correct Frontend Code

```javascript
// Login function
async function login(email, password) {
  try {
    const response = await fetch('https://apply-bureau-backend.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,      // lowercase!
        password: password // lowercase!
      })
    });

    const data = await response.json();

    if (response.status === 400) {
      console.error('Validation error:', data);
      alert('Invalid email or password format');
      return;
    }

    if (response.status === 401) {
      console.error('Auth error:', data);
      alert('Wrong email or password');
      return;
    }

    if (response.status === 429) {
      console.error('Rate limited:', data);
      alert('Too many attempts. Wait 15 minutes.');
      return;
    }

    if (response.ok) {
      // Success!
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/dashboard';
    }

  } catch (error) {
    console.error('Network error:', error);
    alert('Connection failed. Check your internet.');
  }
}

// Form submission
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  // Validate before sending
  if (!email || !password) {
    alert('Please enter both email and password');
    return;
  }
  
  if (!email.includes('@')) {
    alert('Please enter a valid email');
    return;
  }
  
  login(email, password);
});
```

---

## 🧪 Test After Rate Limit Resets

**Step 1**: Wait 15 minutes

**Step 2**: Run test script
```bash
node backend/scripts/test-login-after-rate-limit.js
```

**Step 3**: If script returns 200, backend is working!
- Problem is in frontend
- Check payload format
- Check field names (lowercase)
- Check Content-Type header

**Step 4**: If script returns 400, something is very wrong
- This shouldn't happen with the test script
- Contact support

**Step 5**: If script returns 401, credentials issue
- Admin doesn't exist
- Password is wrong
- Run: `node backend/scripts/create-production-admin.js`

---

## 🔍 Debug Frontend Payload

Add this to your frontend code:

```javascript
// Before sending request
console.log('Sending login request with:', {
  email: email,
  password: '***' // Don't log actual password
});

// After receiving response
console.log('Response status:', response.status);
console.log('Response data:', data);
```

Then check browser console (F12) to see what's being sent.

---

## 📋 Checklist

- [ ] Waited 15 minutes since last attempt
- [ ] Field names are lowercase: `email`, `password`
- [ ] Both fields are present in payload
- [ ] Email is valid format (has @)
- [ ] Content-Type header is `application/json`
- [ ] Using correct endpoint: `/api/auth/login`
- [ ] Using correct credentials: `admin@applybureau.com` / `Admin@123456`
- [ ] Tested with curl or test script (backend works)
- [ ] Checked browser console for errors
- [ ] Verified frontend is not using hardcoded wrong credentials

---

## 🎯 Most Likely Issues

### 1. Wrong Field Names (90% of 400 errors)
```javascript
// ❌ Wrong
{ username: "...", password: "..." }
{ Email: "...", Password: "..." }

// ✅ Correct
{ email: "...", password: "..." }
```

### 2. Missing Fields
```javascript
// ❌ Wrong
{ email: "..." }  // Missing password

// ✅ Correct
{ email: "...", password: "..." }
```

### 3. Invalid Email Format
```javascript
// ❌ Wrong
{ email: "not-an-email", password: "..." }

// ✅ Correct
{ email: "admin@applybureau.com", password: "..." }
```

---

## 📞 Still Stuck?

1. Run: `node backend/scripts/test-login-after-rate-limit.js`
2. Share the output
3. Share your frontend login code
4. Share browser console errors
5. Share Network tab request payload

---

## 📚 Full Documentation

See `backend/ADMIN_LOGIN_400_ERROR_GUIDE.md` for complete details.
