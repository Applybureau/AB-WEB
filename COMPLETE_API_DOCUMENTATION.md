# Apply Bureau Complete API Documentation

## 🌐 Base URL
```
Production: https://apply-bureau-backend.onrender.com/api
Development: http://localhost:3000/api
```

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Admin Credentials
```
Email: admin@applybureau.com
Password: admin123
```

## 📋 Response Format

### Success Response
```json
{
  "message": "Success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": ["Validation error details"]
}
```

## 🚀 API Endpoints

### 🏥 Health Check

#### GET /health
**Description**: Check API health status  
**Access**: Public  
**URL**: `https://apply-bureau-backend.onrender.com/health`  
**Response**:
```json
{
  "status": "healthy",
  "service": "Apply Bureau Backend"
}
```

---

## 🔐 Authentication API

### Login
**Endpoint:** `POST /api/auth/login`
**Access:** Public

**Request Body:**
```json
{
  "email": "admin@applybureau.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "admin@applybureau.com",
    "full_name": "Admin User",
    "role": "admin",
    "dashboard_type": "admin"
  }
}
```

### Get Current User
**Endpoint:** `GET /api/auth/me`
**Authentication:** Required

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@applybureau.com",
    "full_name": "Admin User",
    "role": "admin",
    "dashboard_type": "admin",
    "onboarding_complete": true
  }
}
```

---

## 📋 Consultation Requests API

### ⚠️ Important Note
**Consultation Requests** (from the website form) go to the consultation requests system, not the consultations endpoint. The consultations endpoint is for scheduled meetings created by admins.

- **Consultation Requests**: Public submissions from website visitors requesting consultations
- **Consultations**: Scheduled meetings created by admins after confirming requests

### Submit Consultation Request
Submit a consultation request from the website (public endpoint).

**Endpoint:** `POST /api/consultation-requests`
**Authentication:** None required (public endpoint)

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Tech Corp",
  "job_title": "Software Engineer",
  "consultation_type": "career_strategy",
  "preferred_date": "2026-02-15",
  "preferred_time": "14:00",
  "message": "I need help with career planning and job search strategy.",
  "urgency_level": "normal"
}
```

**Consultation Types:**
- `career_strategy` - Career Strategy & Planning
- `resume_review` - Resume Review & Optimization
- `interview_prep` - Interview Preparation
- `job_search` - Job Search Strategy
- `salary_negotiation` - Salary Negotiation
- `career_transition` - Career Transition
- `linkedin_optimization` - LinkedIn Profile Optimization
- `general_consultation` - General Career Consultation

**Urgency Levels:**
- `low` - Low priority
- `normal` - Normal priority (default)
- `high` - High priority
- `urgent` - Urgent request

**Response:**
```json
{
  "message": "Consultation request submitted successfully",
  "request_id": "uuid",
  "status": "pending"
}
```

### Get Consultation Requests (Admin Only)
Retrieve all consultation requests for admin review.

**Endpoint:** `GET /api/consultation-requests`
**Authentication:** Admin token required

**Query Parameters:**
- `status` - Filter by status (pending, confirmed, rejected, completed, cancelled)
- `urgency_level` - Filter by urgency (low, normal, high, urgent)
- `consultation_type` - Filter by consultation type
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)
- `sort_by` - Sort field (default: created_at)
- `sort_order` - Sort order: asc/desc (default: desc)

**Response:**
```json
{
  "requests": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "Tech Corp",
      "job_title": "Software Engineer",
      "consultation_type": "career_strategy",
      "preferred_date": "2026-02-15",
      "preferred_time": "14:00",
      "message": "Career planning help needed",
      "urgency_level": "normal",
      "status": "pending",
      "source": "website",
      "created_at": "2026-01-07T10:00:00Z"
    }
  ],
  "total": 25,
  "offset": 0,
  "limit": 50,
  "status_counts": {
    "pending": 15,
    "confirmed": 8,
    "rejected": 2
  }
}
```

### Get Specific Consultation Request
Get details of a specific consultation request.

**Endpoint:** `GET /api/consultation-requests/:id`
**Authentication:** Admin token required

**Response:**
```json
{
  "request": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "consultation_type": "career_strategy",
    "status": "pending",
    "created_at": "2026-01-07T10:00:00Z"
  }
}
```

### Confirm Consultation Request
Confirm a consultation request and schedule the meeting.

**Endpoint:** `PUT /api/consultation-requests/:id/confirm`
**Authentication:** Admin token required

**Request Body:**
```json
{
  "scheduled_date": "2026-02-15",
  "scheduled_time": "14:00",
  "meeting_url": "https://meet.google.com/abc-defg-hij",
  "admin_notes": "Please prepare your current resume and career goals.",
  "meeting_duration": 60
}
```

**Response:**
```json
{
  "message": "Consultation request confirmed and scheduled successfully",
  "consultation_request": {
    "id": "uuid",
    "status": "confirmed",
    "scheduled_date": "2026-02-15",
    "scheduled_time": "14:00"
  },
  "consultation": {
    "id": "uuid",
    "scheduled_at": "2026-02-15T14:00:00Z",
    "meeting_url": "https://meet.google.com/abc-defg-hij"
  }
}
```

### Reject Consultation Request
Reject a consultation request with reason.

**Endpoint:** `PUT /api/consultation-requests/:id/reject`
**Authentication:** Admin token required

**Request Body:**
```json
{
  "rejection_reason": "Unfortunately, we cannot accommodate this request at this time due to scheduling conflicts."
}
```

**Response:**
```json
{
  "message": "Consultation request rejected successfully",
  "consultation_request": {
    "id": "uuid",
    "status": "rejected",
    "rejection_reason": "Scheduling conflicts"
  }
}
```

### Reschedule Consultation Request
Reschedule a confirmed consultation request.

**Endpoint:** `PUT /api/consultation-requests/:id/reschedule`
**Authentication:** Admin token required

**Request Body:**
```json
{
  "new_scheduled_date": "2026-02-20",
  "new_scheduled_time": "15:00",
  "reschedule_reason": "Admin availability conflict"
}
```

**Response:**
```json
{
  "message": "Consultation request rescheduled successfully",
  "consultation_request": {
    "id": "uuid",
    "scheduled_date": "2026-02-20",
    "scheduled_time": "15:00",
    "reschedule_reason": "Admin availability conflict"
  }
}
```

---

## 📅 Consultations API (Scheduled Meetings)

### Important Note
Consultation Requests (from the website form) go to the contact system, not the consultations endpoint. The consultations endpoint is for scheduled meetings created by admins.

**Check browser console for detailed API logs after clicking "Test Backend"**

### Scheduled Consultations
Manage scheduled consultation meetings

**Looking for Consultation Requests?**
Consultation requests from the website form are sent to your contact/email system, not this dashboard. This section shows scheduled consultations that you create for clients.

To see consultation requests, check your email or contact management system for messages with subject "Consultation Request".

### Get Consultations
**Endpoint:** `GET /api/consultations`
**Authentication:** Required

**Response:**
```json
{
  "consultations": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "scheduled_at": "2026-01-15T14:00:00Z",
      "status": "scheduled",
      "meeting_url": "https://meet.google.com/abc-defg-hij",
      "meeting_title": "Career Strategy Session",
      "created_at": "2026-01-07T10:00:00Z"
    }
  ]
}
```

### Create Consultation
**Endpoint:** `POST /api/consultations`
**Authentication:** Admin required

**Request Body:**
```json
{
  "client_id": "uuid",
  "scheduled_at": "2026-01-15T14:00:00Z",
  "meeting_url": "https://meet.google.com/abc-defg-hij",
  "meeting_title": "Career Strategy Session",
  "meeting_description": "Comprehensive career planning session",
  "preparation_notes": "Please bring your resume and career goals"
}
```

---

## 📊 Dashboard API

### Get Admin Dashboard
**Endpoint:** `GET /api/admin-dashboard`
**Authentication:** Admin token required

**Response:**
```json
{
  "admin": {
    "id": "uuid",
    "full_name": "Admin User",
    "email": "admin@applybureau.com",
    "role": "admin"
  },
  "dashboard_type": "admin",
  "stats": {
    "clients": {
      "total_clients": 25,
      "active_clients": 18,
      "new_clients_this_month": 5
    },
    "consultations": {
      "total_consultations": 45,
      "scheduled_consultations": 12,
      "completed_consultations": 33
    },
    "applications": {
      "total_applications": 150,
      "applications_by_status": {
        "applied": 45,
        "interview": 12,
        "offer": 8,
        "rejected": 85
      }
    }
  },
  "quick_actions": [
    {
      "action": "invite_client",
      "label": "Invite New Client",
      "icon": "user-plus"
    }
  ]
}
```

### Get Client Dashboard
**Endpoint:** `GET /api/dashboard`
**Authentication:** Client token required

**Response:**
```json
{
  "client": {
    "id": "uuid",
    "full_name": "Client Name",
    "email": "client@example.com"
  },
  "stats": {
    "total_applications": 10,
    "pending_applications": 3,
    "interviews_scheduled": 2,
    "offers_received": 1
  },
  "recent_applications": [],
  "upcoming_consultations": []
}
```

---

## 👥 Admin Management API

### Get Admin Profile
**Endpoint:** `GET /api/admin-management/profile`
**Authentication:** Admin token required

**Response:**
```json
{
  "admin": {
    "id": "uuid",
    "full_name": "Admin User",
    "email": "admin@applybureau.com",
    "role": "admin",
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
    }
  }
}
```

### List All Admins (Super Admin Only)
**Endpoint:** `GET /api/admin-management/admins`
**Authentication:** Super Admin token required

**Response:**
```json
{
  "admins": [
    {
      "id": "uuid",
      "full_name": "Admin User",
      "email": "admin@applybureau.com",
      "role": "admin",
      "is_super_admin": true,
      "can_be_modified": false,
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### Create New Admin (Super Admin Only)
**Endpoint:** `POST /api/admin-management/admins`
**Authentication:** Super Admin token required
**Content-Type:** `multipart/form-data` (for profile picture upload)

**Request Body:**
```json
{
  "full_name": "New Admin",
  "email": "newadmin@applybureau.com",
  "password": "securepassword123",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "message": "Admin created successfully",
  "admin": {
    "id": "uuid",
    "full_name": "New Admin",
    "email": "newadmin@applybureau.com",
    "role": "admin",
    "is_super_admin": false,
    "can_be_modified": true
  }
}
```

### Suspend Admin Account (Super Admin Only)
**Endpoint:** `PUT /api/admin-management/admins/:id/suspend`
**Authentication:** Super Admin token required

**Request Body:**
```json
{
  "reason": "Policy violation - inappropriate conduct"
}
```

**Response:**
```json
{
  "message": "Admin account suspended successfully",
  "admin": {
    "id": "uuid",
    "full_name": "Admin Name",
    "email": "admin@example.com",
    "is_active": false
  }
}
```

### Reactivate Admin Account (Super Admin Only)
**Endpoint:** `PUT /api/admin-management/admins/:id/reactivate`
**Authentication:** Super Admin token required

**Response:**
```json
{
  "message": "Admin account reactivated successfully",
  "admin": {
    "id": "uuid",
    "full_name": "Admin Name",
    "email": "admin@example.com",
    "is_active": true
  }
}
```

### Reset Admin Password
**Endpoint:** `PUT /api/admin-management/admins/:id/reset-password`
**Authentication:** Super Admin token required (or self-reset)

**Request Body:**
```json
{
  "new_password": "newsecurepassword123"
}
```

**Response:**
```json
{
  "message": "Admin password reset successfully",
  "admin": {
    "id": "uuid",
    "full_name": "Admin Name",
    "email": "admin@example.com"
  }
}
```

### Delete Admin Account (Super Admin Only)
**Endpoint:** `DELETE /api/admin-management/admins/:id`
**Authentication:** Super Admin token required

**Request Body:**
```json
{
  "reason": "Account no longer needed - employee departure"
}
```

**Response:**
```json
{
  "message": "Admin account deleted successfully",
  "admin": {
    "id": "uuid",
    "full_name": "Admin Name",
    "email": "admin@example.com"
  }
}
```

---

## 📁 File Management API

### Upload File
**Endpoint:** `POST /api/files/upload`
**Authentication:** Required
**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` - File to upload
- `upload_purpose` - Purpose: resume, profile_picture, document

**Response:**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": "uuid",
    "file_name": "resume.pdf",
    "file_url": "https://storage.url/file.pdf",
    "upload_purpose": "resume"
  }
}
```

### List Files
**Endpoint:** `GET /api/files`
**Authentication:** Required

**Query Parameters:**
- `upload_purpose` - Filter by purpose
- `limit` - Number of results (default: 20)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "files": [
    {
      "id": "uuid",
      "file_name": "resume.pdf",
      "file_url": "https://storage.url/file.pdf",
      "upload_purpose": "resume",
      "uploaded_at": "2026-01-07T10:00:00Z"
    }
  ],
  "total": 5,
  "offset": 0,
  "limit": 20
}
```

---

## 📧 Email Notifications

The system automatically sends professional email notifications for:

### Consultation Request Emails
- **consultation_request_received** - Sent to requester when request is submitted
- **new_consultation_request** - Sent to admin when new request arrives
- **consultation_confirmed** - Sent to client when request is confirmed
- **consultation_rejected** - Sent to client when request is rejected
- **consultation_rescheduled** - Sent to client when meeting is rescheduled

### Admin Management Emails
- **admin_welcome** - Sent to new admins with login credentials
- **admin_account_suspended** - Sent when admin account is suspended
- **admin_account_reactivated** - Sent when admin account is reactivated
- **admin_account_deleted** - Sent when admin account is deleted
- **admin_password_reset** - Sent when admin password is reset

All emails use Apply Bureau branding with green (#10b981) and light blue (#06b6d4) colors.

---

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (admin/client)
- Super admin privileges for admin management
- Session tracking and management

### Admin Management Security
- Only super admin (admin@applybureau.com) can manage other admins
- Self-protection: admins cannot suspend/delete themselves
- Super admin cannot be suspended or deleted by others
- Comprehensive audit logging for all admin actions

### Data Protection
- Secure password hashing with bcrypt (12 rounds)
- Input validation and sanitization
- SQL injection protection
- Rate limiting on sensitive endpoints
- CORS configuration for frontend security

---

## 🚀 Getting Started

### 1. Test the API
Visit the health check endpoint to verify the API is running:
```
GET https://apply-bureau-backend.onrender.com/health
```

### 2. Admin Login
Use the admin credentials to get an authentication token:
```bash
curl -X POST https://apply-bureau-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@applybureau.com","password":"admin123"}'
```

### 3. Access Admin Dashboard
Use the token to access admin features:
```bash
curl -X GET https://apply-bureau-backend.onrender.com/api/admin-dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Submit Consultation Request (Public)
Test the consultation request system:
```bash
curl -X POST https://apply-bureau-backend.onrender.com/api/consultation-requests \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "consultation_type": "career_strategy",
    "message": "I need help with my career planning."
  }'
```

---

## 📞 Support

For technical support or questions about the API:
- **Email**: admin@applybureau.com
- **Documentation**: This document
- **Health Check**: https://apply-bureau-backend.onrender.com/health

---

## 📝 Changelog

### Version 2.0 (January 2026)
- ✅ Added Consultation Requests system
- ✅ Implemented Super Admin Management
- ✅ Enhanced email notification system
- ✅ Added file management capabilities
- ✅ Improved security and authentication
- ✅ Added comprehensive admin dashboard
- ✅ Implemented role-based access control

### Version 1.0 (December 2025)
- ✅ Basic authentication system
- ✅ Client and consultation management
- ✅ Application tracking
- ✅ Email notifications
- ✅ Dashboard functionality