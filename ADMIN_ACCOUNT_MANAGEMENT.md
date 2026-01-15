# Admin Account Management API

## 🔐 Overview

This document describes the admin account creation and management system. **Only master/super admins can create other admin accounts.**

---

## 🎯 Key Points

1. **Master Admin Only**: Only users with `is_main_admin: true` or `can_create_admins: true` can create new admins
2. **Email Notification**: New admins receive a welcome email with login credentials
3. **Permission System**: Granular permissions control what each admin can do
4. **Security**: Password hashing, email validation, duplicate prevention

---

## 📋 Admin Creation Endpoint

### Create New Admin Account

**Endpoint**: `POST /api/admin-management/admins`  
**Authentication**: Required (Master Admin only)  
**Content-Type**: `application/json` (without photo) or `multipart/form-data` (with profile picture)

#### Request (Without Profile Picture)

```http
POST /api/admin-management/admins
Authorization: Bearer <master-admin-token>
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john.doe@applybureau.com",
  "password": "SecurePass@123",
  "phone": "+1234567890"
}
```

#### Request (With Profile Picture)

```http
POST /api/admin-management/admins
Authorization: Bearer <master-admin-token>
Content-Type: multipart/form-data

Form Data:
- full_name: "John Doe"
- email: "john.doe@applybureau.com"
- password: "SecurePass@123"
- phone: "+1234567890"
- profile_picture: [image file] (PNG, JPG, JPEG, GIF - max 10MB)
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `full_name` | string | ✅ Yes | Admin's full name |
| `email` | string | ✅ Yes | Admin's email (must be unique) |
| `password` | string | ✅ Yes | Password (min 6 characters) |
| `phone` | string | ❌ No | Phone number |
| `profile_picture` | file | ❌ No | Profile picture (PNG, JPG, JPEG, GIF - max 10MB, multipart/form-data only) |

#### Response (Success - 201)

```json
{
  "success": true,
  "message": "Admin account created successfully",
  "admin": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john.doe@applybureau.com",
    "phone": "+1234567890",
    "role": "admin",
    "status": "active",
    "is_main_admin": false,
    "profile_picture": "https://...",
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-15T10:00:00Z",
    "last_login": null,
    "permissions": {
      "can_create_admins": false,
      "can_delete_admins": false,
      "can_suspend_admins": false,
      "can_manage_clients": true,
      "can_schedule_consultations": true,
      "can_view_reports": true,
      "can_reset_passwords": false
    }
  }
}
```

#### Error Responses

**403 Forbidden** - Insufficient permissions
```json
{
  "success": false,
  "error": "Insufficient permissions to create admin accounts",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

**400 Bad Request** - Missing required fields
```json
{
  "success": false,
  "error": "Missing required fields: full_name, email, password",
  "code": "MISSING_REQUIRED_FIELDS"
}
```

**400 Bad Request** - Invalid email
```json
{
  "success": false,
  "error": "Invalid email format",
  "code": "INVALID_EMAIL"
}
```

**409 Conflict** - Email already exists
```json
{
  "success": false,
  "error": "Email already exists",
  "code": "EMAIL_EXISTS"
}
```

**400 Bad Request** - Weak password
```json
{
  "success": false,
  "error": "Password must be at least 8 characters long",
  "code": "WEAK_PASSWORD"
}
```

---

## 📋 List All Admins

### Get All Admin Accounts

**Endpoint**: `GET /api/admin-management/admins`  
**Authentication**: Required (Admin)

#### Request

```http
GET /api/admin-management/admins?status=active&limit=50&offset=0&sort_by=created_at&sort_order=desc
Authorization: Bearer <admin-token>
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | all | Filter by status (active/inactive) |
| `limit` | number | 50 | Number of results per page |
| `offset` | number | 0 | Pagination offset |
| `sort_by` | string | created_at | Sort field |
| `sort_order` | string | desc | Sort order (asc/desc) |

#### Response (Success - 200)

```json
{
  "success": true,
  "admins": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john.doe@applybureau.com",
      "phone": "+1234567890",
      "role": "admin",
      "status": "active",
      "is_main_admin": false,
      "profile_picture": "https://...",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-15T10:00:00Z",
      "last_login": "2026-01-15T12:00:00Z",
      "permissions": {
        "can_create_admins": false,
        "can_delete_admins": false,
        "can_suspend_admins": false,
        "can_manage_clients": true,
        "can_schedule_consultations": true,
        "can_view_reports": true,
        "can_reset_passwords": false
      }
    }
  ],
  "total": 5,
  "limit": 50,
  "offset": 0
}
```

---

## 📋 Get Single Admin

### Get Admin Details

**Endpoint**: `GET /api/admin-management/admins/:id`  
**Authentication**: Required (Admin)

#### Request

```http
GET /api/admin-management/admins/uuid-here
Authorization: Bearer <admin-token>
```

#### Response (Success - 200)

```json
{
  "success": true,
  "admin": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john.doe@applybureau.com",
    "phone": "+1234567890",
    "role": "admin",
    "status": "active",
    "is_main_admin": false,
    "profile_picture": "https://...",
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-15T10:00:00Z",
    "last_login": "2026-01-15T12:00:00Z",
    "permissions": {
      "can_create_admins": false,
      "can_delete_admins": false,
      "can_suspend_admins": false,
      "can_manage_clients": true,
      "can_schedule_consultations": true,
      "can_view_reports": true,
      "can_reset_passwords": false
    }
  }
}
```

---

## 📋 Update Admin

### Update Admin Details

**Endpoint**: `PATCH /api/admin-management/admins/:id`  
**Authentication**: Required (Master Admin)

#### Request

```http
PATCH /api/admin-management/admins/uuid-here
Authorization: Bearer <master-admin-token>
Content-Type: application/json

{
  "full_name": "John Updated Doe",
  "phone": "+0987654321",
  "permissions": {
    "can_create_admins": true,
    "can_manage_clients": true
  }
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Admin updated successfully",
  "admin": {
    "id": "uuid",
    "full_name": "John Updated Doe",
    "email": "john.doe@applybureau.com",
    "phone": "+0987654321",
    "role": "admin",
    "status": "active",
    "permissions": {
      "can_create_admins": true,
      "can_manage_clients": true
    }
  }
}
```

---

## 📋 Suspend/Activate Admin

### Suspend Admin Account

**Endpoint**: `POST /api/admin-management/admins/:id/suspend`  
**Authentication**: Required (Master Admin with `can_suspend_admins`)

#### Request

```http
POST /api/admin-management/admins/uuid-here/suspend
Authorization: Bearer <master-admin-token>
Content-Type: application/json

{
  "reason": "Policy violation"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Admin account suspended successfully"
}
```

**Email Sent**: `admin_account_suspended`

### Activate Admin Account

**Endpoint**: `POST /api/admin-management/admins/:id/activate`  
**Authentication**: Required (Master Admin)

#### Request

```http
POST /api/admin-management/admins/uuid-here/activate
Authorization: Bearer <master-admin-token>
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Admin account activated successfully"
}
```

**Email Sent**: `admin_account_reactivated`

---

## 📋 Delete Admin

### Delete Admin Account

**Endpoint**: `DELETE /api/admin-management/admins/:id`  
**Authentication**: Required (Master Admin with `can_delete_admins`)

#### Request

```http
DELETE /api/admin-management/admins/uuid-here
Authorization: Bearer <master-admin-token>
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Admin account deleted successfully"
}
```

**Email Sent**: `admin_account_deleted`

---

## 📋 Reset Admin Password

### Reset Admin Password

**Endpoint**: `POST /api/admin-management/admins/:id/reset-password`  
**Authentication**: Required (Master Admin with `can_reset_passwords`)

#### Request

```http
POST /api/admin-management/admins/uuid-here/reset-password
Authorization: Bearer <master-admin-token>
Content-Type: application/json

{
  "new_password": "NewSecurePass@123"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Email Sent**: `admin_password_reset`

---

## 🔐 Permission System

### Available Permissions

| Permission | Description |
|------------|-------------|
| `can_create_admins` | Can create new admin accounts |
| `can_delete_admins` | Can delete admin accounts |
| `can_suspend_admins` | Can suspend/activate admin accounts |
| `can_manage_clients` | Can manage client accounts |
| `can_schedule_consultations` | Can schedule consultations |
| `can_view_reports` | Can view reports and analytics |
| `can_reset_passwords` | Can reset admin passwords |

### Master Admin

Master admins have all permissions by default:
- `is_main_admin: true`
- All `can_*` permissions set to `true`
- Cannot be suspended or deleted
- Can create other admins

---

## 📧 Email Notifications

### Admin Welcome Email

**Template**: `admin_welcome`  
**Sent When**: New admin account is created  
**Variables**:
- `admin_name` - Admin's full name
- `login_url` - Login page URL
- `temporary_password` - Initial password
- `created_by` - Name of admin who created the account

### Admin Account Suspended

**Template**: `admin_account_suspended`  
**Sent When**: Admin account is suspended  
**Variables**:
- `admin_name` - Admin's full name
- `suspension_reason` - Reason for suspension
- `contact_email` - Support email

### Admin Account Reactivated

**Template**: `admin_account_reactivated`  
**Sent When**: Admin account is reactivated  
**Variables**:
- `admin_name` - Admin's full name
- `reactivation_date` - Date of reactivation
- `login_link` - Login page URL

### Admin Account Deleted

**Template**: `admin_account_deleted`  
**Sent When**: Admin account is deleted  
**Variables**:
- `admin_name` - Admin's full name
- `deletion_date` - Date of deletion
- `contact_email` - Support email

### Admin Password Reset

**Template**: `admin_password_reset`  
**Sent When**: Admin password is reset  
**Variables**:
- `admin_name` - Admin's full name
- `reset_link` - Password reset link
- `expiry_time` - Link expiry time

---

## 🧪 Testing

### Test Admin Creation

```bash
cd backend
node scripts/test-admin-creation.js
```

This script tests:
1. Master admin login
2. Admin account creation
3. Database verification
4. New admin login
5. Permission enforcement
6. Admin listing

### Manual Testing with curl

```bash
# 1. Login as master admin
curl -X POST https://apply-bureau-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@applybureau.com",
    "password": "Admin@123456"
  }'

# Save the token from response

# 2. Create new admin
curl -X POST https://apply-bureau-backend.vercel.app/api/admin-management/admins \
  -H "Authorization: Bearer <token-from-step-1>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Admin",
    "email": "testadmin@applybureau.com",
    "password": "TestAdmin@123",
    "phone": "+1234567890"
  }'

# 3. List all admins
curl -X GET https://apply-bureau-backend.vercel.app/api/admin-management/admins \
  -H "Authorization: Bearer <token-from-step-1>"
```

---

## 🔑 Master Admin Credentials

**Email**: `admin@applybureau.com`  
**Password**: `Admin@123456`  
**Role**: `admin`  
**Permissions**: All

⚠️ **Change this password in production!**

---

### Frontend Integration

### Create Admin Form (Without Profile Picture)

```javascript
const createAdmin = async (adminData) => {
  const masterToken = localStorage.getItem('adminToken');
  
  const response = await fetch('/api/admin-management/admins', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${masterToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      full_name: adminData.fullName,
      email: adminData.email,
      password: adminData.password,
      phone: adminData.phone
    })
  });
  
  const data = await response.json();
  
  if (!data.success && data.error) {
    throw new Error(data.error);
  }
  
  return data.admin;
};
```

### Create Admin Form (With Profile Picture)

```javascript
const createAdminWithPhoto = async (adminData, profilePictureFile) => {
  const masterToken = localStorage.getItem('adminToken');
  
  const formData = new FormData();
  formData.append('full_name', adminData.fullName);
  formData.append('email', adminData.email);
  formData.append('password', adminData.password);
  formData.append('phone', adminData.phone);
  
  if (profilePictureFile) {
    formData.append('profile_picture', profilePictureFile);
  }
  
  const response = await fetch('/api/admin-management/admins', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${masterToken}`
      // Don't set Content-Type - browser will set it with boundary
    },
    body: formData
  });
  
  const data = await response.json();
  
  if (!data.success && data.error) {
    throw new Error(data.error);
  }
  
  return data.admin;
};
```

### React Example with File Upload

```jsx
import React, { useState } from 'react';

function CreateAdminForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const admin = await createAdminWithPhoto(formData, profilePicture);
      alert(`Admin created: ${admin.email}`);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Full Name"
        value={formData.fullName}
        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
        required
      />
      
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        required
      />
      
      <input
        type="tel"
        placeholder="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
      />
      
      <div>
        <label>Profile Picture (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        {preview && <img src={preview} alt="Preview" style={{width: 100, height: 100}} />}
      </div>
      
      <button type="submit">Create Admin</button>
    </form>
  );
}
```

### List Admins

```javascript
const listAdmins = async (filters = {}) => {
  const token = localStorage.getItem('adminToken');
  const params = new URLSearchParams(filters);
  
  const response = await fetch(`/api/admin-management/admins?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data.admins;
};
```

### Check Permissions

```javascript
const canCreateAdmins = (user) => {
  return user.is_main_admin || user.permissions?.can_create_admins;
};

// In your component
if (canCreateAdmins(currentUser)) {
  // Show "Create Admin" button
}
```

---

## 🛡️ Security Best Practices

1. **Strong Passwords**: Enforce minimum 8 characters, mix of letters, numbers, symbols
2. **Email Verification**: Validate email format before creation
3. **Duplicate Prevention**: Check for existing email before creation
4. **Permission Checks**: Always verify requesting user has required permissions
5. **Audit Logging**: Log all admin creation/modification actions
6. **Password Hashing**: Use bcrypt with salt rounds >= 10
7. **Rate Limiting**: Limit admin creation attempts
8. **Email Notifications**: Always notify when admin accounts are created/modified

---

## 📊 Database Schema

### clients table (stores admins)

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  profile_picture_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by_admin_id UUID REFERENCES clients(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);
```

### registered_users table (alternative admin storage)

```sql
CREATE TABLE registered_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passcode_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'admin',
  profile_picture TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_main_admin BOOLEAN DEFAULT FALSE,
  can_create_admins BOOLEAN DEFAULT FALSE,
  can_delete_admins BOOLEAN DEFAULT FALSE,
  can_suspend_admins BOOLEAN DEFAULT FALSE,
  can_manage_clients BOOLEAN DEFAULT TRUE,
  can_schedule_consultations BOOLEAN DEFAULT TRUE,
  can_view_reports BOOLEAN DEFAULT TRUE,
  can_reset_passwords BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES registered_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);
```

---

## 🔄 Workflow

1. **Master Admin Logs In** → Gets authentication token
2. **Master Admin Creates New Admin** → POST to `/api/admin-management/admins`
3. **System Validates** → Checks permissions, email, password
4. **System Creates Admin** → Inserts into database with hashed password
5. **System Sends Email** → Sends welcome email with credentials
6. **New Admin Logs In** → Uses credentials from email
7. **New Admin Works** → Can perform actions based on permissions

---

**Last Updated**: January 15, 2026  
**API Version**: 1.0  
**Base URL**: https://apply-bureau-backend.vercel.app
