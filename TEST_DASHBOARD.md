# Quick Dashboard Test Guide

## ✅ Admin Credentials

```
Email: admin@applybureau.com
Password: Admin@123456
```

## 🧪 Quick Test (Using Browser or Postman)

### Step 1: Login
```
POST https://apply-bureau-backend.vercel.app/api/auth/login
Content-Type: application/json

Body:
{
  "email": "admin@applybureau.com",
  "password": "Admin@123456"
}
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "688b3986-0398-4c00-8aa9-0f14a411b378",
    "email": "admin@applybureau.com",
    "full_name": "Admin User",
    "role": "admin"
  }
}
```

### Step 2: Get Contacts
```
GET https://apply-bureau-backend.vercel.app/api/contact-requests
Authorization: Bearer <paste-token-from-step-1>
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "first_name": "Test",
      "last_name": "Contact",
      "email": "israelloko65@gmail.com",
      "phone": "+1234567890",
      "subject": "Dashboard Loading Test",
      "message": "...",
      "status": "new",
      "created_at": "2026-01-15T..."
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

## 🖥️ Test Using Command Line

### Using curl (Mac/Linux/Git Bash):
```bash
# Step 1: Login and save token
TOKEN=$(curl -s -X POST https://apply-bureau-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@applybureau.com","password":"Admin@123456"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# Step 2: Get contacts
curl -X GET https://apply-bureau-backend.vercel.app/api/contact-requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Using PowerShell (Windows):
```powershell
# Step 1: Login
$response = Invoke-RestMethod -Uri "https://apply-bureau-backend.vercel.app/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"admin@applybureau.com","password":"Admin@123456"}'

$token = $response.token
Write-Host "Token: $token"

# Step 2: Get contacts
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "https://apply-bureau-backend.vercel.app/api/contact-requests" `
  -Method Get `
  -Headers $headers
```

## 🔧 Test Using Node.js Script

```bash
cd backend
node scripts/final-dashboard-test.js
```

## ✅ What You Should See

1. **Login Success**: You get a JWT token
2. **Contacts Load**: You see 10 contact requests
3. **Data Format**: Each contact has first_name, last_name, email, subject, message, status
4. **No Errors**: No CORS errors, no authentication errors

## ❌ If Something Fails

### Login Fails (401 Invalid Credentials)
- **Cause**: Password mismatch or admin user not in database
- **Fix**: Run `node scripts/verify-admin-ready.js` to recreate admin

### Contacts Don't Load (403 Forbidden)
- **Cause**: User role is not 'admin'
- **Fix**: Check that login response has `"role": "admin"`

### CORS Error
- **Cause**: Frontend origin not allowed
- **Fix**: Add your frontend URL to CORS whitelist in `server.js`

### Network Error
- **Cause**: Backend not responding or wrong URL
- **Fix**: Check that https://apply-bureau-backend.vercel.app/health returns 200

## 📊 Current Database Status

- ✅ Admin user exists: `admin@applybureau.com`
- ✅ Contact requests: 10 total
- ✅ Contact submissions: 7 total
- ✅ Password verified: Working locally
- ✅ API endpoints: All configured

## 🎯 Success Criteria

✅ Login returns a token  
✅ Token contains role='admin'  
✅ GET /api/contact-requests returns data array  
✅ Total count matches database (10)  
✅ No CORS errors  
✅ No authentication errors  

## 📝 Notes

- Token expires after 24 hours
- Rate limit: 100 requests per 15 minutes
- Admin can see all contacts regardless of status
- Use `status` query parameter to filter: `?status=new`

---

**Quick Verification**: Run `node scripts/verify-admin-ready.js` to confirm admin is set up correctly.
