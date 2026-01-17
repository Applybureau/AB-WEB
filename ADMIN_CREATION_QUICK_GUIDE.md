# Admin Creation - Quick Guide

## 🔐 Master Admin Credentials

```
Email: admin@applybureau.com
Password: Admin@123456
```

⚠️ **Only master admin can create other admins!**

---

## 🎯 Create New Admin

### Endpoint
```
POST /api/admin-management/admins
```

### Request (Without Profile Picture)
```bash
curl -X POST https://apply-bureau-backend.vercel.app/api/admin-management/admins \
  -H "Authorization: Bearer <master-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john.doe@applybureau.com",
    "password": "SecurePass@123",
    "phone": "+1234567890"
  }'
```

### Request (With Profile Picture)
```bash
curl -X POST https://apply-bureau-backend.vercel.app/api/admin-management/admins \
  -H "Authorization: Bearer <master-admin-token>" \
  -F "full_name=John Doe" \
  -F "email=john.doe@applybureau.com" \
  -F "password=SecurePass@123" \
  -F "phone=+1234567890" \
  -F "profile_picture=@/path/to/photo.jpg"
```

**Profile Picture Requirements**:
- Formats: PNG, JPG, JPEG, GIF
- Max size: 10MB
- Stored in Supabase `profile-pictures` bucket

### Response
```json
{
  "success": true,
  "message": "Admin account created successfully",
  "admin": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john.doe@applybureau.com",
    "role": "admin",
    "status": "active",
    "permissions": {
      "can_create_admins": false,
      "can_manage_clients": true,
      "can_schedule_consultations": true
    }
  }
}
```

---

## 📋 List All Admins

### Endpoint
```
GET /api/admin-management/admins
```

### Request
```bash
curl -X GET https://apply-bureau-backend.vercel.app/api/admin-management/admins \
  -H "Authorization: Bearer <admin-token>"
```

---

## 🔄 Workflow

1. **Login as Master Admin**
   ```
   POST /api/auth/login
   Body: { email, password }
   ```

2. **Get Token** from login response

3. **Create New Admin**
   ```
   POST /api/admin-management/admins
   Headers: Authorization: Bearer <token>
   Body: { full_name, email, password, phone }
   ```

4. **New Admin Receives Email** with login credentials

5. **New Admin Can Login**
   ```
   POST /api/auth/login
   Body: { email, password }
   ```

---

## 📧 Email Sent

When admin is created, they receive:
- **Template**: `admin_welcome`
- **Contains**: Login URL, temporary password, welcome message

---

## 🛡️ Permissions

New admins get these permissions by default:
- ✅ Can manage clients
- ✅ Can schedule consultations
- ✅ Can view reports
- ❌ Cannot create admins
- ❌ Cannot delete admins
- ❌ Cannot suspend admins

Master admin can update permissions later.

---

## 🧪 Test

```bash
cd backend
node scripts/test-admin-creation.js
```

---

## 💡 Frontend Example

### Without Profile Picture
```javascript
// 1. Login as master admin
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@applybureau.com',
    password: 'Admin@123456'
  })
});

const { token } = await loginResponse.json();

// 2. Create new admin
const createResponse = await fetch('/api/admin-management/admins', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    full_name: 'John Doe',
    email: 'john.doe@applybureau.com',
    password: 'SecurePass@123',
    phone: '+1234567890'
  })
});

const { admin } = await createResponse.json();
console.log('New admin created:', admin);
```

### With Profile Picture
```javascript
// 1. Login as master admin (same as above)
const { token } = await loginResponse.json();

// 2. Create FormData with profile picture
const formData = new FormData();
formData.append('full_name', 'John Doe');
formData.append('email', 'john.doe@applybureau.com');
formData.append('password', 'SecurePass@123');
formData.append('phone', '+1234567890');
formData.append('profile_picture', fileInput.files[0]); // from <input type="file">

// 3. Create new admin with photo
const createResponse = await fetch('/api/admin-management/admins', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Don't set Content-Type - browser sets it automatically with boundary
  },
  body: formData
});

const { admin } = await createResponse.json();
console.log('New admin created with photo:', admin.profile_picture_url);
```

---

## ❌ Common Errors

### 403 Forbidden
```json
{
  "error": "Insufficient permissions to create admin accounts"
}
```
**Solution**: Only master admin can create admins

### 409 Conflict
```json
{
  "error": "Email already exists"
}
```
**Solution**: Use a different email address

### 400 Bad Request
```json
{
  "error": "Password must be at least 8 characters long"
}
```
**Solution**: Use a stronger password

---

**For detailed documentation, see**: `ADMIN_ACCOUNT_MANAGEMENT.md`
