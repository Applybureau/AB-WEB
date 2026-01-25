# Apply Bureau - Login System Documentation

## 🔐 Authentication System Overview

The Apply Bureau backend provides secure authentication for both administrators and clients using JWT tokens with bcrypt password hashing.

**Base URL:** `https://jellyfish-app-t4m35.ondigitalocean.app`

---

## 👨‍💼 Admin Login

### Admin Credentials
```
Email: admin@applybureau.com
Password: Admin123@#
```

### Admin Login API

**Endpoint:** `POST /api/auth/login`

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "admin@applybureau.com",
  "password": "Admin123@#"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "f25f8ce9-3673-41f1-9235-72488531d5ec",
    "email": "admin@applybureau.com",
    "full_name": "Super Admin",
    "role": "admin",
    "is_super_admin": true,
    "permissions": {
      "can_create_admins": true,
      "can_delete_admins": true,
      "can_manage_clients": true,
      "can_schedule_consultations": true,
      "can_view_reports": true,
      "can_manage_system": true
    }
  },
  "expires_in": "24h"
}
```

### Admin Dashboard Access

**Endpoint:** `GET /api/admin-dashboard`

**Request Headers:**
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Success Response (200):**
```json
{
  "admin": {
    "id": "f25f8ce9-3673-41f1-9235-72488531d5ec",
    "full_name": "Super Admin",
    "email": "admin@applybureau.com",
    "role": "admin",
    "permissions": {...}
  },
  "dashboard_type": "admin",
  "stats": {
    "clients": {
      "total_clients": 25,
      "active_clients": 18,
      "new_clients_this_month": 5,
      "onboarded_clients": 20,
      "pending_onboarding": 5
    },
    "consultations": {
      "total_consultations": 45,
      "scheduled_consultations": 12,
      "completed_consultations": 30,
      "upcoming_consultations": 8
    },
    "applications": {
      "total_applications": 120,
      "applications_by_status": {
        "applied": 45,
        "interview": 25,
        "offer": 30,
        "rejected": 15,
        "withdrawn": 5
      },
      "success_rate": "25.0"
    }
  },
  "recent_activity": {...},
  "quick_actions": [...]
}
```

---

## 👤 Client Login

### Client Registration Process

Clients are typically invited by admins and must complete onboarding before full access.

**Client Invitation Endpoint:** `POST /api/auth/invite`

**Request Headers:**
```json
{
  "Authorization": "Bearer ADMIN_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "client@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890"
}
```

### Client Login API

**Endpoint:** `POST /api/auth/login`

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "client@example.com",
  "password": "ClientPassword123!"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "client-uuid-here",
    "email": "client@example.com",
    "full_name": "John Doe",
    "role": "client",
    "onboarding_complete": true,
    "profile_picture_url": null,
    "current_job_title": "Software Engineer",
    "current_company": "Tech Corp"
  },
  "expires_in": "24h"
}
```

### Client Dashboard Access

**Endpoint:** `GET /api/client-dashboard`

**Request Headers:**
```json
{
  "Authorization": "Bearer CLIENT_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Success Response (200):**
```json
{
  "client": {
    "id": "client-uuid-here",
    "full_name": "John Doe",
    "email": "client@example.com",
    "role": "client",
    "onboarding_complete": true,
    "profile_completion": 85
  },
  "dashboard_type": "client",
  "application_status": {
    "total_applications": 5,
    "active_applications": 3,
    "interviews_scheduled": 2,
    "offers_received": 1
  },
  "upcoming_events": [...],
  "recent_activity": [...],
  "next_steps": [...]
}
```

---

## 🔒 Authentication Flow

### 1. Login Process
1. Send POST request to `/api/auth/login` with credentials
2. Receive JWT token in response
3. Include token in `Authorization: Bearer TOKEN` header for all subsequent requests

### 2. Token Validation
- Tokens expire after 24 hours
- Server validates tokens on every protected route
- Invalid/expired tokens return 401 or 403 status codes

### 3. Role-Based Access Control
- **Admin Role:** Full system access, can manage clients and view all data
- **Client Role:** Limited to own data and client-specific features

---

## 🛡️ Security Features

### Password Requirements
- Minimum 8 characters
- Must contain uppercase and lowercase letters
- Must contain numbers
- Special characters recommended

### Security Measures
- bcrypt password hashing (12 rounds)
- JWT tokens with secure secrets
- CORS protection
- Helmet security headers
- Request logging and monitoring
- No rate limiting (removed for 24/7 operation)

---

## 🧪 Testing the Login System

### Using cURL

**Admin Login:**
```bash
curl -X POST https://jellyfish-app-t4m35.ondigitalocean.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@applybureau.com",
    "password": "Admin123@#"
  }'
```

**Access Admin Dashboard:**
```bash
curl -X GET https://jellyfish-app-t4m35.ondigitalocean.app/api/admin-dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using JavaScript/Axios

```javascript
// Admin Login
const loginResponse = await axios.post('https://jellyfish-app-t4m35.ondigitalocean.app/api/auth/login', {
  email: 'admin@applybureau.com',
  password: 'Admin123@#'
});

const token = loginResponse.data.token;

// Access Protected Route
const dashboardResponse = await axios.get('https://jellyfish-app-t4m35.ondigitalocean.app/api/admin-dashboard', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 🚨 Error Responses

### Invalid Credentials (401)
```json
{
  "error": "Invalid credentials"
}
```

### Missing Token (401)
```json
{
  "error": "Access token required"
}
```

### Invalid/Expired Token (403)
```json
{
  "error": "Invalid or expired token"
}
```

### Insufficient Permissions (403)
```json
{
  "error": "Admin access required"
}
```

---

## 📊 System Status

**Current Status:** ✅ Fully Operational (100% test success rate)

**Last Tested:** January 24, 2026

**Features Verified:**
- ✅ Health checks
- ✅ Admin authentication
- ✅ Admin dashboard access
- ✅ Client authentication
- ✅ Public endpoints
- ✅ Error handling
- ✅ CORS configuration

---

## 🔧 Admin Management

### Create New Admin
**Endpoint:** `POST /api/admin-management/create`

**Request Headers:**
```json
{
  "Authorization": "Bearer ADMIN_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "newadmin@applybureau.com",
  "full_name": "New Admin",
  "password": "SecurePassword123!",
  "permissions": {
    "can_create_admins": false,
    "can_delete_admins": false,
    "can_manage_clients": true,
    "can_schedule_consultations": true,
    "can_view_reports": true,
    "can_manage_system": false
  }
}
```

### Reset Admin Password
Run the admin setup script to reset credentials:
```bash
cd backend
node scripts/setup-correct-admin.js
```

---

## 📞 Support

For technical issues or credential resets, contact the system administrator or run the provided setup scripts in the `/backend/scripts/` directory.

**Production URL:** https://jellyfish-app-t4m35.ondigitalocean.app
**Repository:** https://github.com/jesusboy-ops/Apply_Bureau_backend
**Documentation:** This file and other `.md` files in the backend directory