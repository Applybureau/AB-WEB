# Admin Management API Documentation

Complete guide to the Admin Management system including authentication, permissions, and all available endpoints.

## Table of Contents
- [Authentication](#authentication)
- [Super Admin System](#super-admin-system)
- [API Endpoints](#api-endpoints)
- [Email Notifications](#email-notifications)
- [Frontend Integration](#frontend-integration)

---

## Authentication

### Login Credentials
- **Super Admin Email**: `admin@applybureau.com`
- **Password**: `admin123`

### Login Endpoint
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@applybureau.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "688b3986-0398-4c00-8aa9-0f14a411b378",
    "email": "admin@applybureau.com",
    "full_name": "Admin User",
    "role": "admin",
    "dashboard_type": "admin"
  }
}
```

### Token Usage
Include the token in all subsequent requests:
```http
Authorization: Bearer <token>
```

---

## Super Admin System

### Overview
Only the **Super Admin** (`admin@applybureau.com`) can:
- Create new admin accounts
- Suspend/reactivate admin accounts
- Delete admin accounts
- Reset admin passwords
- View all admin accounts
- Access system settings

### Permission Structure
```javascript
{
  "can_create_admins": true,        // Super admin only
  "can_delete_admins": true,        // Super admin only
  "can_suspend_admins": true,       // Super admin only
  "can_manage_clients": true,       // All admins
  "can_schedule_consultations": true, // All admins
  "can_view_reports": true,         // All admins
  "can_manage_system": true,        // Super admin only
  "can_reset_passwords": true       // Super admin only
}
```

---

## API Endpoints

### Base URL
- **Production**: `https://apply-bureau-backend.vercel.app`
- **Base Path**: `/api/admin-management`

---

### 1. Get Admin Profile

Get the current admin's profile with full details and permissions.

```http
GET /api/admin-management/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "admin": {
    "id": "688b3986-0398-4c00-8aa9-0f14a411b378",
    "full_name": "Admin User",
    "email": "admin@applybureau.com",
    "role": "admin",
    "profile_picture_url": null,
    "phone": "+1234567890",
    "is_super_admin": true,
    "permissions": {
      "can_create_admins": true,
      "can_delete_admins": true,
      "can_suspend_admins": true,
      "can_manage_clients": true,
      "can_schedule_consultations": true,
      "can_view_reports": true,
      "can_manage_system": true,
      "can_reset_passwords": true
    },
    "is_active": true,
    "last_login_at": "2026-01-16T17:30:00Z",
    "created_at": "2026-01-06T19:25:10Z"
  },
  "recent_activity": [],
  "system_info": {
    "super_admin_email": "admin@applybureau.com",
    "can_manage_admins": true
  }
}
```

---

### 2. List All Admins

Get a list of all admin accounts (Super Admin only).

```http
GET /api/admin-management/admins
Authorization: Bearer <token>
```

**Response:**
```json
{
  "admins": [
    {
      "id": "688b3986-0398-4c00-8aa9-0f14a411b378",
      "full_name": "Admin User",
      "email": "admin@applybureau.com",
      "role": "admin",
      "profile_picture_url": null,
      "phone": "+1234567890",
      "is_active": true,
      "last_login_at": "2026-01-16T17:30:00Z",
      "created_at": "2026-01-06T19:25:10Z",
      "is_super_admin": true,
      "can_be_modified": false
    },
    {
      "id": "4427e7cf-c240-4706-b7cc-2e82a5aa9e0d",
      "full_name": "Test Admin",
      "email": "testadmin@applybureau.com",
      "role": "admin",
      "profile_picture_url": null,
      "phone": "",
      "is_active": true,
      "last_login_at": null,
      "created_at": "2026-01-16T17:48:40Z",
      "is_super_admin": false,
      "can_be_modified": true
    }
  ]
}
```

**Error Responses:**
- `403`: Not a super admin
- `500`: Server error

---

### 3. Create New Admin

Create a new admin account (Super Admin only).

```http
POST /api/admin-management/admins
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "full_name": "John Doe",
  "email": "john@applybureau.com",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "profile_picture": <file> (optional)
}
```

**Request Body:**
- `full_name` (required): Admin's full name
- `email` (required): Valid email address
- `password` (required): Strong password (min 8 characters)
- `phone` (optional): Phone number
- `profile_picture` (optional): Image file (PNG, JPG, JPEG, GIF - max 10MB)

**Response:**
```json
{
  "message": "Admin created successfully",
  "admin": {
    "id": "4427e7cf-c240-4706-b7cc-2e82a5aa9e0d",
    "full_name": "John Doe",
    "email": "john@applybureau.com",
    "role": "admin",
    "profile_picture_url": "https://...",
    "phone": "+1234567890",
    "is_active": true,
    "created_at": "2026-01-16T17:48:40Z",
    "is_super_admin": false,
    "can_be_modified": true
  }
}
```

**Email Sent:**
- Template: `admin_welcome.html`
- Contains: Login URL, temporary password, super admin contact

**Error Responses:**
- `400`: Email already exists or validation error
- `403`: Not a super admin
- `500`: Server error

---

### 4. Suspend Admin Account

Suspend an admin account (Super Admin only).

```http
PUT /api/admin-management/admins/:id/suspend
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Policy violation"
}
```

**Path Parameters:**
- `id`: Admin ID to suspend

**Request Body:**
- `reason` (optional): Reason for suspension

**Response:**
```json
{
  "message": "Admin account suspended successfully",
  "admin": {
    "id": "4427e7cf-c240-4706-b7cc-2e82a5aa9e0d",
    "full_name": "John Doe",
    "email": "john@applybureau.com",
    "is_active": false
  }
}
```

**Email Sent:**
- Template: `admin_account_suspended.html`
- Contains: Suspension reason, contact information

**Error Responses:**
- `400`: Cannot suspend own account or super admin
- `403`: Not a super admin
- `404`: Admin not found
- `500`: Server error

---

### 5. Reactivate Admin Account

Reactivate a suspended admin account (Super Admin only).

```http
PUT /api/admin-management/admins/:id/reactivate
Authorization: Bearer <token>
```

**Path Parameters:**
- `id`: Admin ID to reactivate

**Response:**
```json
{
  "message": "Admin account reactivated successfully",
  "admin": {
    "id": "4427e7cf-c240-4706-b7cc-2e82a5aa9e0d",
    "full_name": "John Doe",
    "email": "john@applybureau.com",
    "is_active": true
  }
}
```

**Email Sent:**
- Template: `admin_account_reactivated.html`
- Contains: Reactivation notification, login URL

**Error Responses:**
- `403`: Not a super admin
- `404`: Admin not found
- `500`: Server error

---

### 6. Reset Admin Password

Reset an admin's password (Super Admin or self-reset).

```http
PUT /api/admin-management/admins/:id/reset-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "new_password": "NewSecurePass123!"
}
```

**Path Parameters:**
- `id`: Admin ID (can be own ID for self-reset)

**Request Body:**
- `new_password` (required): New password (min 6 characters)

**Response:**
```json
{
  "message": "Password updated successfully",
  "admin": {
    "id": "4427e7cf-c240-4706-b7cc-2e82a5aa9e0d",
    "full_name": "John Doe",
    "email": "john@applybureau.com"
  }
}
```

**Email Sent (if not self-reset):**
- Template: `admin_password_reset.html`
- Contains: New password, login URL, reset by information

**Error Responses:**
- `400`: Password too short
- `403`: Not authorized (not super admin and not self-reset)
- `404`: Admin not found
- `500`: Server error

---

### 7. Delete Admin Account

Soft delete an admin account (Super Admin only).

```http
DELETE /api/admin-management/admins/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Account no longer needed"
}
```

**Path Parameters:**
- `id`: Admin ID to delete

**Request Body:**
- `reason` (optional): Reason for deletion

**Response:**
```json
{
  "message": "Admin account deleted successfully",
  "admin": {
    "id": "4427e7cf-c240-4706-b7cc-2e82a5aa9e0d",
    "full_name": "John Doe",
    "email": "john@applybureau.com"
  }
}
```

**Note:** This is a soft delete - the account is marked as `deleted_admin` and deactivated, not permanently removed.

**Email Sent:**
- Template: `admin_account_deleted.html`
- Contains: Deletion notification, reason, contact information

**Error Responses:**
- `400`: Cannot delete own account or super admin
- `403`: Not a super admin
- `404`: Admin not found
- `500`: Server error

---

### 8. Get System Settings

Get system settings (Super Admin only).

```http
GET /api/admin-management/settings
Authorization: Bearer <token>
```

**Response:**
```json
{
  "settings": {
    "super_admin_email": "admin@applybureau.com",
    "system_status": "active",
    "admin_creation_enabled": true,
    "email_notifications_enabled": true,
    "password_reset_enabled": true,
    "account_suspension_enabled": true,
    "last_updated": "2026-01-16T17:30:00Z"
  }
}
```

**Error Responses:**
- `403`: Not a super admin
- `500`: Server error

---

### 9. Get Activity Logs

Get admin activity logs with filtering options.

```http
GET /api/admin-management/activity-logs?limit=50&offset=0&admin_id=<id>&action_type=<type>
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `admin_id` (optional): Filter by admin ID
- `action_type` (optional): Filter by action type
- `start_date` (optional): Filter from date (ISO format)
- `end_date` (optional): Filter to date (ISO format)

**Response:**
```json
{
  "activity_logs": [
    {
      "id": "log-id",
      "admin_id": "admin-id",
      "action_type": "admin_created",
      "details": {},
      "created_at": "2026-01-16T17:48:40Z"
    }
  ],
  "total": 1,
  "offset": 0,
  "limit": 50
}
```

**Note:** If the activity logs table doesn't exist yet, returns empty array with a message.

---

## Email Notifications

### Templates Used

1. **admin_welcome.html**
   - Sent when: New admin account created
   - Contains: Login URL, temporary password, super admin contact

2. **admin_account_suspended.html**
   - Sent when: Admin account suspended
   - Contains: Suspension reason, contact information

3. **admin_account_reactivated.html**
   - Sent when: Admin account reactivated
   - Contains: Reactivation notification, login URL

4. **admin_password_reset.html**
   - Sent when: Password reset by super admin
   - Contains: New password, login URL, reset by information

5. **admin_account_deleted.html**
   - Sent when: Admin account deleted
   - Contains: Deletion notification, reason, contact information

### Email Configuration
All emails are sent to: `israelloko65@gmail.com` (configured in environment)

---

## Frontend Integration

### Example: Create Admin with Profile Picture

```javascript
const createAdmin = async (adminData, profilePicture) => {
  const formData = new FormData();
  formData.append('full_name', adminData.full_name);
  formData.append('email', adminData.email);
  formData.append('password', adminData.password);
  formData.append('phone', adminData.phone || '');
  
  if (profilePicture) {
    formData.append('profile_picture', profilePicture);
  }

  const response = await fetch('https://apply-bureau-backend.vercel.app/api/admin-management/admins', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return await response.json();
};
```

### Example: List All Admins

```javascript
const getAllAdmins = async (token) => {
  const response = await fetch('https://apply-bureau-backend.vercel.app/api/admin-management/admins', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  return data.admins;
};
```

### Example: Suspend Admin

```javascript
const suspendAdmin = async (adminId, reason, token) => {
  const response = await fetch(`https://apply-bureau-backend.vercel.app/api/admin-management/admins/${adminId}/suspend`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  });

  return await response.json();
};
```

---

## Security Notes

1. **Super Admin Protection**
   - Super admin account cannot be suspended, deleted, or modified by others
   - Super admin cannot suspend or delete their own account

2. **Password Requirements**
   - Minimum 6 characters (recommended: 8+ with mixed case, numbers, symbols)
   - Passwords are hashed with bcrypt (12 rounds)

3. **Token Expiration**
   - JWT tokens expire after 24 hours
   - Users must re-login after expiration

4. **Profile Picture Upload**
   - Accepted formats: PNG, JPG, JPEG, GIF
   - Maximum size: 10MB
   - Stored in Supabase storage bucket: `profile-pictures/admins/`

5. **Database Tables**
   - Admins stored in: `admins` table (primary)
   - Legacy admins in: `clients` table (filtered out from client lists)

---

## Testing

### Test Scripts Available

1. **Test Admin Creation**
   ```bash
   node scripts/test-admin-creation-no-photo.js
   ```

2. **Test Super Admin Check**
   ```bash
   node scripts/test-updated-is-super-admin.js
   ```

3. **Verify Admin in Clients Table**
   ```bash
   node scripts/verify-and-fix-admin-in-clients.js
   ```

4. **Delete Admin from Clients Table**
   ```bash
   node scripts/delete-admin-from-clients.js
   ```

---

## Troubleshooting

### Issue: 403 Error when creating admin
**Solution**: Ensure you're logged in as the super admin (`admin@applybureau.com`)

### Issue: Admin appears in clients list
**Solution**: Run `node scripts/delete-admin-from-clients.js` to remove admin from clients table

### Issue: Password reset not working
**Solution**: Verify the admin ID is correct and you have super admin permissions

### Issue: Email not received
**Solution**: Check spam folder and verify `RESEND_API_KEY` is configured in environment variables

---

## Support

For issues or questions:
- Super Admin Email: `admin@applybureau.com`
- Support Email: `israelloko65@gmail.com`

---

**Last Updated**: January 16, 2026
**API Version**: 1.0
**Status**: ✅ Production Ready
