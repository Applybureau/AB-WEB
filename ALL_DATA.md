# Apply Bureau Backend - Complete API Documentation

**Base URL:** `https://apply-bureau-backend.vercel.app`  
**Last Updated:** January 15, 2026  
**Version:** 2.0.0  
**Status:** Production Ready ✅

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Public Endpoints](#public-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Client Endpoints](#client-endpoints)
6. [Data Formats](#data-formats)
7. [Error Handling](#error-handling)

---

## 🚀 Quick Start

### Admin Access
```bash
Email: admin@applybureau.com
Password: Admin@123456
```

### Base URL
```
https://apply-bureau-backend.vercel.app
```

### Authentication Header
```http
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication

### Login (Admin/Client)
```http
POST https://apply-bureau-backend.vercel.app/api/auth/login
Content-Type: application/json

{
  "email": "admin@applybureau.com",
  "password": "Admin@123456"
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
    "role": "admin"
  }
}
```

### Get Current User
```http
GET https://apply-bureau-backend.vercel.app/api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "client"
  }
}
```

### Logout
```http
POST https://apply-bureau-backend.vercel.app/api/auth/logout
Authorization: Bearer <token>
```

---

## 🌐 Public Endpoints

### 1. Health Check
```http
GET https://apply-bureau-backend.vercel.app/health
GET https://apply-bureau-backend.vercel.app/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T10:00:00.000Z",
  "uptime": 3600,
  "service": "Apply Bureau Backend"
}
```

### 2. Submit Consultation Request
```http
POST https://apply-bureau-backend.vercel.app/api/public-consultations
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "Interested in career services",
  "preferred_slots": [
    { "date": "2026-01-19", "time": "14:00" },
    { "date": "2026-01-20", "time": "15:00" },
    { "date": "2026-01-21", "time": "16:00" }
  ]
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "pending",
  "message": "Request received. We will confirm your consultation shortly."
}
```

### 3. Submit Contact Form
```http
POST https://apply-bureau-backend.vercel.app/api/contact
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "subject": "General Inquiry",
  "message": "I have a question about your services"
}
```

**Response:**
```json
{
  "id": "uuid",
  "message": "Contact form submitted successfully"
}
```

### 4. Submit Contact Request (Alternative)
```http
POST https://apply-bureau-backend.vercel.app/api/contact-requests
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subject": "Service Inquiry",
  "message": "I would like to learn more about your services"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "new",
  "message": "Contact request submitted successfully"
}
```

---

## 👨‍💼 Admin Endpoints

### Dashboard & Stats

#### Get Admin Dashboard Stats
```http
GET https://apply-bureau-backend.vercel.app/api/admin/stats
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "system": {
    "uptime": 3600,
    "memory": "256MB",
    "cpu": "2 cores"
  },
  "cache": {
    "hits": 1000,
    "misses": 50
  },
  "security": {
    "blocked_ips": 5,
    "failed_attempts": 10
  }
}
```

### Contact Management

#### Get All Contact Requests
```http
GET https://apply-bureau-backend.vercel.app/api/contact-requests
Authorization: Bearer <admin-token>

Query Parameters:
- status: new | in_progress | handled | archived
- search: search term
- page: page number (default: 1)
- limit: items per page (default: 50)
- sort: created_at | email | status
- order: asc | desc (default: desc)
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "subject": "Service Inquiry",
      "message": "I would like to learn more",
      "status": "new",
      "created_at": "2026-01-15T10:00:00.000Z",
      "admin_notes": null,
      "handled_at": null,
      "handled_by": null
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

#### Get Single Contact Request
```http
GET https://apply-bureau-backend.vercel.app/api/contact-requests/:id
Authorization: Bearer <admin-token>
```

#### Update Contact Request Status
```http
PATCH https://apply-bureau-backend.vercel.app/api/contact-requests/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "in_progress",
  "admin_notes": "Following up with client"
}
```

**Valid Status Values:**
- `new` - New contact request
- `in_progress` - Being handled
- `handled` - Completed
- `archived` - Archived

#### Get Contact Submissions
```http
GET https://apply-bureau-backend.vercel.app/api/contact
Authorization: Bearer <admin-token>

Query Parameters:
- status: new | in_progress | resolved
- search: search term
- page: page number
- limit: items per page
```

**Response:**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "subject": "General Inquiry",
      "message": "Question about services",
      "status": "new",
      "created_at": "2026-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 7,
    "totalPages": 1
  }
}
```

#### Update Contact Submission
```http
PATCH https://apply-bureau-backend.vercel.app/api/contact/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "resolved",
  "admin_notes": "Issue resolved"
}
```

### Consultation Management

#### Get All Consultations
```http
GET https://apply-bureau-backend.vercel.app/api/admin/concierge/consultations
Authorization: Bearer <admin-token>

Query Parameters:
- admin_status: pending | confirmed | rescheduled | waitlisted
- limit: items per page
- offset: pagination offset
```

**Response:**
```json
{
  "consultations": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "message": "Interested in services",
      "preferred_slots": [...],
      "admin_status": "pending",
      "status": "pending",
      "created_at": "2026-01-15T10:00:00.000Z"
    }
  ],
  "total": 10,
  "status_counts": {
    "pending": 10,
    "confirmed": 25,
    "rescheduled": 3,
    "waitlisted": 2
  }
}
```

#### Confirm Consultation
```http
POST https://apply-bureau-backend.vercel.app/api/admin/concierge/consultations/:id/confirm
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "selected_slot_index": 0,
  "meeting_link": "https://meet.google.com/xxx-yyyy-zzz",
  "meeting_details": "Looking forward to our call!",
  "admin_notes": "Client prepared"
}
```

#### Reschedule Consultation
```http
POST https://apply-bureau-backend.vercel.app/api/admin/concierge/consultations/:id/reschedule
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reschedule_reason": "Times not available",
  "admin_notes": "Requesting new times"
}
```

#### Waitlist Consultation
```http
POST https://apply-bureau-backend.vercel.app/api/admin/concierge/consultations/:id/waitlist
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "waitlist_reason": "Currently at capacity",
  "admin_notes": "Will contact when available"
}
```

### Payment & Registration

#### Confirm Payment and Send Registration Link
```http
POST https://apply-bureau-backend.vercel.app/api/admin/concierge/payment/confirm-and-invite
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "client_email": "john@example.com",
  "client_name": "John Doe",
  "payment_amount": "2500",
  "payment_method": "interac_etransfer",
  "payment_reference": "Transfer #12345",
  "admin_notes": "Payment verified"
}
```

**Response:**
```json
{
  "message": "Payment confirmed and registration link sent",
  "registration_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "registration_link": "https://yourfrontend.com/register?token=...",
  "expires_at": "2026-01-22T10:00:00.000Z"
}
```

### Onboarding Management

#### Get Onboarding Submissions
```http
GET https://apply-bureau-backend.vercel.app/api/admin/concierge/onboarding
Authorization: Bearer <admin-token>

Query Parameters:
- execution_status: review_required | active | completed
- limit: items per page
- offset: pagination offset
```

#### Approve Onboarding (Unlock Profile)
```http
POST https://apply-bureau-backend.vercel.app/api/admin/concierge/onboarding/:id/approve
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "admin_notes": "All information verified. Ready to begin."
}
```

**Response:**
```json
{
  "message": "Onboarding approved and profile unlocked",
  "onboarding": {
    "id": "uuid",
    "execution_status": "active",
    "approved_at": "2026-01-15T10:00:00.000Z"
  },
  "profile_unlocked": true
}
```

### Application Management

#### Add Job Application
```http
POST https://apply-bureau-backend.vercel.app/api/admin/applications/add
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "client_id": "uuid",
  "company_name": "Tech Corp",
  "job_title": "Senior Software Engineer",
  "job_url": "https://techcorp.com/careers/123",
  "status": "applied",
  "applied_date": "2026-01-14",
  "notes": "Strong match for skills"
}
```

#### Update Application Status
```http
PATCH https://apply-bureau-backend.vercel.app/api/admin/applications/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "interview_requested",
  "interview_date": "2026-01-20T14:00:00.000Z",
  "interview_type": "Technical Interview",
  "notes": "First round interview scheduled"
}
```

**Valid Status Values:**
- `applied` - Application submitted
- `under_review` - Being reviewed by company
- `interview_requested` - Interview scheduled
- `offer_received` - Job offer received
- `rejected` - Application rejected
- `withdrawn` - Application withdrawn

### Client Management

#### Get All Clients
```http
GET https://apply-bureau-backend.vercel.app/api/admin/clients
Authorization: Bearer <admin-token>

Query Parameters:
- status: active | inactive
- profile_unlocked: true | false
- page: page number
- limit: items per page
```

#### Get Client Details
```http
GET https://apply-bureau-backend.vercel.app/api/admin/clients/:id
Authorization: Bearer <admin-token>
```

---

## 👤 Client Endpoints

### Registration

#### Complete Registration with Token
```http
POST https://apply-bureau-backend.vercel.app/api/client-registration/register
Content-Type: application/json

{
  "registration_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "SecurePassword123!",
  "confirm_password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Registration completed successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "client"
  }
}
```

### Dashboard

#### Get Client Dashboard
```http
GET https://apply-bureau-backend.vercel.app/api/client/dashboard
Authorization: Bearer <client-token>
```

**Response:**
```json
{
  "client": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "profile_unlocked": true,
    "payment_confirmed": true,
    "onboarding_completed": true
  },
  "status": {
    "overall_status": "active",
    "message": "Setup complete. Applications are being processed.",
    "progress_percentage": 100
  },
  "strategy_call": {
    "has_booked": true,
    "has_confirmed": true,
    "confirmed_time": "2026-01-15T14:00:00.000Z",
    "meeting_link": "https://meet.google.com/xxx-yyyy-zzz"
  },
  "onboarding": {
    "completed": true,
    "approved": true,
    "execution_status": "active"
  },
  "applications": {
    "total_count": 15,
    "active_count": 8,
    "can_view": true
  }
}
```

### Onboarding

#### Submit 20-Question Onboarding
```http
POST https://apply-bureau-backend.vercel.app/api/client/onboarding-20q/submit
Authorization: Bearer <client-token>
Content-Type: application/json

{
  "current_salary": "$80,000",
  "target_salary": "$120,000",
  "target_roles": "Senior Software Engineer, Tech Lead",
  "years_of_experience": 5,
  "education_level": "Bachelor's Degree",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "github_url": "https://github.com/johndoe",
  "portfolio_url": "https://johndoe.com",
  "current_location": "Toronto, ON",
  "willing_to_relocate": true,
  "preferred_locations": ["Vancouver", "Montreal", "Remote"],
  "work_authorization": "Canadian Citizen",
  "notice_period": "2 weeks",
  "availability_start": "2026-02-01",
  "key_skills": ["JavaScript", "React", "Node.js", "AWS"],
  "certifications": ["AWS Solutions Architect"],
  "languages": ["English", "French"],
  "preferred_company_size": "Startup (1-50)",
  "preferred_industries": ["Tech", "FinTech", "SaaS"],
  "additional_notes": "Looking for remote-first companies"
}
```

**Response:**
```json
{
  "message": "Onboarding submitted successfully",
  "onboarding": {
    "id": "uuid",
    "user_id": "uuid",
    "execution_status": "review_required",
    "completed_at": "2026-01-15T10:00:00.000Z"
  },
  "next_steps": "Your onboarding is under review."
}
```

#### Get Onboarding Status
```http
GET https://apply-bureau-backend.vercel.app/api/client/onboarding-20q/status
Authorization: Bearer <client-token>
```

### File Uploads

#### Upload Resume/Documents
```http
POST https://apply-bureau-backend.vercel.app/api/client/uploads
Authorization: Bearer <client-token>
Content-Type: multipart/form-data

Form Data:
- file: <binary_file_data>
- type: "resume" | "linkedin_pdf" | "portfolio"
- description: "Optional description"
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "id": "uuid",
    "filename": "resume.pdf",
    "url": "https://storage.supabase.co/...",
    "type": "resume",
    "size": 1024000,
    "uploaded_at": "2026-01-15T10:00:00.000Z"
  }
}
```

#### Get Uploaded Files
```http
GET https://apply-bureau-backend.vercel.app/api/client/uploads
Authorization: Bearer <client-token>
```

### Applications

#### Get My Applications
```http
GET https://apply-bureau-backend.vercel.app/api/client/applications
Authorization: Bearer <client-token>

Query Parameters:
- status: applied | under_review | interview_requested | offer_received | rejected
- page: page number
- limit: items per page
```

**Response:**
```json
{
  "applications": [
    {
      "id": "uuid",
      "company_name": "Tech Corp",
      "job_title": "Senior Software Engineer",
      "job_url": "https://techcorp.com/careers/123",
      "status": "interview_requested",
      "applied_date": "2026-01-14",
      "interview_date": "2026-01-20T14:00:00.000Z",
      "notes": "First round interview scheduled",
      "created_at": "2026-01-14T10:00:00.000Z"
    }
  ],
  "total": 15,
  "page": 1,
  "totalPages": 2
}
```

#### Get Application Details
```http
GET https://apply-bureau-backend.vercel.app/api/client/applications/:id
Authorization: Bearer <client-token>
```

### Notifications

#### Get My Notifications
```http
GET https://apply-bureau-backend.vercel.app/api/notifications
Authorization: Bearer <client-token>

Query Parameters:
- unread: true | false
- type: application_update | interview_alert | profile_update
- limit: items per page
```

#### Mark Notification as Read
```http
PATCH https://apply-bureau-backend.vercel.app/api/notifications/:id/read
Authorization: Bearer <client-token>
```

---

## 📊 Data Formats

### User Object
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "client" | "admin",
  "profile_unlocked": true,
  "onboarding_completed": true,
  "created_at": "2026-01-15T10:00:00.000Z"
}
```

### Contact Request Object
```json
{
  "id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subject": "Service Inquiry",
  "message": "Message content",
  "status": "new" | "in_progress" | "handled" | "archived",
  "admin_notes": "Optional notes",
  "handled_at": "2026-01-15T10:00:00.000Z",
  "handled_by": "admin-uuid",
  "created_at": "2026-01-15T10:00:00.000Z"
}
```

### Consultation Object
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "Interested in services",
  "preferred_slots": [
    { "date": "2026-01-19", "time": "14:00" },
    { "date": "2026-01-20", "time": "15:00" },
    { "date": "2026-01-21", "time": "16:00" }
  ],
  "admin_status": "pending" | "confirmed" | "rescheduled" | "waitlisted",
  "status": "pending" | "confirmed",
  "confirmed_time": "2026-01-19T14:00:00.000Z",
  "meeting_link": "https://meet.google.com/xxx-yyyy-zzz",
  "admin_notes": "Notes",
  "created_at": "2026-01-15T10:00:00.000Z"
}
```

### Application Object
```json
{
  "id": "uuid",
  "client_id": "uuid",
  "company_name": "Tech Corp",
  "job_title": "Senior Software Engineer",
  "job_url": "https://techcorp.com/careers/123",
  "status": "applied" | "under_review" | "interview_requested" | "offer_received" | "rejected",
  "applied_date": "2026-01-14",
  "interview_date": "2026-01-20T14:00:00.000Z",
  "interview_type": "Technical Interview",
  "notes": "Notes",
  "created_at": "2026-01-14T10:00:00.000Z",
  "updated_at": "2026-01-15T10:00:00.000Z"
}
```

---

## ❌ Error Handling

### Error Response Format
```json
{
  "error": "Error message",
  "errorId": "abc123def456",
  "details": "Additional details (dev mode only)"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Common Errors

#### Authentication Error
```json
{
  "error": "Access token required"
}
```

#### Validation Error
```json
{
  "error": "Validation error",
  "details": "Missing required fields: email, password"
}
```

#### Rate Limit Error
```json
{
  "error": "Too many requests from this IP",
  "retryAfter": 900
}
```

---

## 🔒 Security

### Rate Limits
- **Login:** 5 attempts per 15 minutes
- **Registration:** 10 attempts per hour
- **File Upload:** 20 uploads per hour
- **General API:** 100 requests per 15 minutes

### Token Expiry
- **Auth Token:** 24 hours
- **Registration Token:** 7 days (one-time use)

### CORS
Allowed origins:
- `http://localhost:3000`
- `http://localhost:5173`
- Your configured `FRONTEND_URL`

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All endpoints return JSON
- File uploads limited to 10MB
- Pagination default: 50 items per page
- Search is case-insensitive

---

**For support, contact:** admin@applybureau.com  
**Documentation:** https://apply-bureau-backend.vercel.app/health
