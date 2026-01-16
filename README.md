# Apply Bureau Backend API Documentation

## 🎯 Overview

This is the complete backend API for Apply Bureau - a consultation and client management system. This document explains EVERY endpoint in simple terms, like talking to a 5-year-old, so the frontend never gets confused.

**Base URL (Production):** `https://apply-bureau-backend.vercel.app`  
**Frontend URL:** `https://apply-bureau.vercel.app`

---

## 📋 Table of Contents

1. [Authentication System](#authentication-system)
2. [Registration Token System (15-Day Expiry)](#registration-token-system)
3. [Public Endpoints (No Auth Required)](#public-endpoints)
4. [Client Endpoints (Client Auth Required)](#client-endpoints)
5. [Admin Endpoints (Admin Auth Required)](#admin-endpoints)
6. [Complete Endpoint List](#complete-endpoint-list)
7. [Data Formats & Examples](#data-formats--examples)
8. [Error Handling](#error-handling)

---

## 🔐 Authentication System

### How Authentication Works

1. **Login** → Get a token
2. **Use token** → Include in all requests as `Authorization: Bearer YOUR_TOKEN`
3. **Token expires** → Login again

### Token Format
```javascript
{
  "userId": "uuid",
  "id": "uuid",
  "email": "user@example.com",
  "role": "client" or "admin",
  "full_name": "John Doe",
  "exp": 1234567890 // Expiry timestamp
}
```



---

## 🎫 Registration Token System (15-Day Expiry)

### How It Works (Step by Step)

**Step 1: Admin Confirms Payment**
- Admin clicks "Verify & Invite" button in dashboard
- Calls: `POST /api/admin/concierge/payment-confirmation`

**Step 2: System Generates Token**
- Token is valid for **15 DAYS** (not 7 days!)
- Token contains: email, name, payment confirmation
- Token is stored in database with expiry date

**Step 3: Client Receives Email**
- Email contains registration link: `https://apply-bureau.vercel.app/register?token=XXXXX`
- Link is valid for 15 days

**Step 4: Client Registers**
- Client clicks link → Frontend validates token
- Client creates password → Account is activated
- Token is marked as "used" (can't be reused)

### Token Generation Code Location
- **File:** `backend/routes/adminConcierge.js`
- **Lines:** ~434 and ~598
- **Expiry:** `{ expiresIn: '15d' }` (15 days)

### Token Validation Endpoint
```
GET /api/client-registration/validate-token/:token
```

**Response (Valid Token):**
```json
{
  "valid": true,
  "client": {
    "full_name": "John Doe",
    "email": "john@example.com",
    "expires_at": "2026-01-31T12:00:00Z"
  }
}
```

**Response (Invalid Token):**
```json
{
  "valid": false,
  "error": "Token expired" // or "Token already used" or "Invalid token"
}
```



---

## 🌐 Public Endpoints (No Auth Required)

### 1. Health Check
```
GET /health
GET /api/health
```
**Purpose:** Check if server is running  
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-16T12:00:00Z",
  "service": "Apply Bureau Backend"
}
```

---

### 2. Contact Form Submission
```
POST /api/contact
```
**Purpose:** Public contact form on website  
**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "I want to learn more about your services"
}
```
**Response:**
```json
{
  "message": "Contact request submitted successfully",
  "id": "uuid"
}
```

---

### 3. Public Consultation Request
```
POST /api/public-consultations
```
**Purpose:** Book a consultation (public form)  
**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "I need help with job applications",
  "preferred_slots": [
    { "date": "2026-01-20", "time": "10:00" },
    { "date": "2026-01-21", "time": "14:00" },
    { "date": "2026-01-22", "time": "16:00" }
  ]
}
```
**Important:** Must provide exactly 3 preferred time slots!

**Response:**
```json
{
  "message": "Consultation request submitted successfully",
  "id": "uuid",
  "status": "pending"
}
```

---

### 4. Validate Registration Token
```
GET /api/client-registration/validate-token/:token
```
**Purpose:** Check if registration token is valid  
**See:** [Registration Token System](#registration-token-system) above

---

### 5. Client Registration (Using Token)
```
POST /api/client-registration/register
```
**Purpose:** Create account using registration token  
**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "SecurePassword123!",
  "confirm_password": "SecurePassword123!"
}
```
**Response:**
```json
{
  "message": "Account created successfully",
  "token": "auth_token_here",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "client",
    "profile_unlocked": false,
    "payment_confirmed": true,
    "onboarding_completed": false
  },
  "next_steps": "Complete your onboarding questionnaire to unlock your Application Tracker."
}
```



---

## 🔑 Authentication Endpoints

### 1. Login
```
POST /api/auth/login
```
**Purpose:** Login for both clients and admins  
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "client",
    "profile_unlocked": true,
    "onboarding_completed": true
  }
}
```

---

### 2. Get Current User
```
GET /api/auth/me
```
**Headers:** `Authorization: Bearer YOUR_TOKEN`  
**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "client",
  "profile_unlocked": true,
  "onboarding_completed": true
}
```

---

### 3. Logout
```
POST /api/auth/logout
```
**Headers:** `Authorization: Bearer YOUR_TOKEN`  
**Response:**
```json
{
  "message": "Logged out successfully"
}
```



---

## 👤 Client Endpoints (Client Auth Required)

All these endpoints require: `Authorization: Bearer YOUR_TOKEN`

### 1. Client Dashboard
```
GET /api/client/dashboard
```
**Purpose:** Get client's dashboard data  
**Response:**
```json
{
  "user": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "profile_unlocked": true,
    "onboarding_completed": true
  },
  "status": {
    "consultation_completed": true,
    "payment_confirmed": true,
    "onboarding_completed": true,
    "profile_unlocked": true
  },
  "applications": [],
  "upcoming_meetings": [],
  "notifications": []
}
```

---

### 2. Submit Onboarding (20 Questions)
```
POST /api/client/onboarding-20q
```
**Purpose:** Submit 20-question onboarding form  
**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "current_location": "Toronto, Canada",
  "target_countries": ["Canada", "USA"],
  "education_level": "Bachelor's Degree",
  "field_of_study": "Computer Science",
  "years_of_experience": 5,
  "current_job_title": "Software Developer",
  "target_job_titles": ["Senior Developer", "Tech Lead"],
  "industries_of_interest": ["Technology", "Finance"],
  "work_authorization": "Canadian Citizen",
  "resume_uploaded": true,
  "linkedin_profile": "https://linkedin.com/in/johndoe",
  "portfolio_url": "https://johndoe.com",
  "job_search_timeline": "3-6 months",
  "application_support_needed": ["Resume Review", "Interview Prep"],
  "budget_range": "$1000-$2000",
  "additional_notes": "Looking for remote opportunities"
}
```
**Response:**
```json
{
  "message": "Onboarding submitted successfully",
  "id": "uuid",
  "status": "pending",
  "next_steps": "Your submission is under review. You'll be notified once approved."
}
```

---

### 3. Get Onboarding Status
```
GET /api/client/onboarding-20q/status
```
**Response:**
```json
{
  "status": "pending",
  "submitted_at": "2026-01-16T12:00:00Z",
  "approved": false,
  "profile_unlocked": false
}
```

---

### 4. Upload Files
```
POST /api/client/uploads
```
**Purpose:** Upload resume, LinkedIn PDF, portfolio  
**Content-Type:** `multipart/form-data`  
**Form Fields:**
- `file`: The file to upload
- `file_type`: "resume" | "linkedin" | "portfolio"

**Response:**
```json
{
  "message": "File uploaded successfully",
  "file_url": "https://storage.url/file.pdf",
  "file_type": "resume"
}
```

---

### 5. Get Notifications
```
GET /api/notifications
```
**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "profile_unlocked",
      "title": "Profile Unlocked!",
      "message": "Your Application Tracker is now active",
      "read": false,
      "created_at": "2026-01-16T12:00:00Z"
    }
  ],
  "unread_count": 1
}
```

---

### 6. Mark Notification as Read
```
PATCH /api/notifications/:id/read
```
**Response:**
```json
{
  "message": "Notification marked as read"
}
```

---

### 7. Get Unread Notification Count
```
GET /api/notifications/unread/count
```
**Response:**
```json
{
  "count": 5
}
```



---

## 👨‍💼 Admin Endpoints (Admin Auth Required)

All these endpoints require: `Authorization: Bearer YOUR_TOKEN` (with admin role)

### 1. Admin Dashboard Overview
```
GET /api/admin-dashboard/overview
```
**Purpose:** Get admin dashboard statistics  
**Response:**
```json
{
  "stats": {
    "total_consultations": 45,
    "pending_consultations": 12,
    "confirmed_consultations": 20,
    "total_clients": 30,
    "active_clients": 25,
    "pending_onboarding": 8,
    "revenue_this_month": 15000
  },
  "recent_activity": [],
  "pending_actions": []
}
```

---

### 2. Get All Consultation Requests
```
GET /api/admin/concierge/consultations
```
**Query Parameters:**
- `admin_status`: "all" | "pending" | "confirmed" | "rescheduled" | "waitlisted"
- `limit`: Number (default: 50)
- `offset`: Number (default: 0)
- `sort_by`: "created_at" | "name" | "email"
- `sort_order`: "asc" | "desc"

**Response:**
```json
{
  "consultations": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "message": "Need help with applications",
      "preferred_slots": [
        { "date": "2026-01-20", "time": "10:00" },
        { "date": "2026-01-21", "time": "14:00" },
        { "date": "2026-01-22", "time": "16:00" }
      ],
      "admin_status": "pending",
      "status": "pending",
      "created_at": "2026-01-16T12:00:00Z"
    }
  ],
  "total": 45,
  "offset": 0,
  "limit": 50,
  "status_counts": {
    "pending": 12,
    "confirmed": 20,
    "rescheduled": 3,
    "waitlisted": 10
  }
}
```

---

### 3. Confirm Consultation (GATEKEEPER ACTION)
```
POST /api/admin/concierge/consultations/:id/confirm
```
**Purpose:** Confirm one of the 3 time slots  
**Request Body:**
```json
{
  "selected_slot_index": 0,
  "meeting_details": "We'll discuss your job search strategy",
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "admin_notes": "Client is interested in tech roles"
}
```
**Important:** `selected_slot_index` must be 0, 1, or 2 (which of the 3 slots to confirm)

**Response:**
```json
{
  "message": "Consultation confirmed successfully",
  "consultation": {
    "id": "uuid",
    "admin_status": "confirmed",
    "status": "confirmed",
    "confirmed_time": "2026-01-20T10:00:00Z"
  },
  "confirmed_slot": {
    "date": "2026-01-20",
    "time": "10:00"
  }
}
```

---

### 4. Request Reschedule
```
POST /api/admin/concierge/consultations/:id/reschedule
```
**Request Body:**
```json
{
  "reschedule_reason": "No availability at requested times",
  "admin_notes": "Will follow up next week"
}
```
**Response:**
```json
{
  "message": "Reschedule request sent successfully",
  "consultation": {
    "id": "uuid",
    "admin_status": "rescheduled"
  }
}
```

---

### 5. Add to Waitlist
```
POST /api/admin/concierge/consultations/:id/waitlist
```
**Request Body:**
```json
{
  "waitlist_reason": "Fully booked this month",
  "admin_notes": "High priority client"
}
```
**Response:**
```json
{
  "message": "Consultation added to waitlist successfully",
  "consultation": {
    "id": "uuid",
    "admin_status": "waitlisted"
  }
}
```



---

### 6. Confirm Payment & Send Registration Invite (MOST IMPORTANT!)
```
POST /api/admin/concierge/payment-confirmation
```
**Purpose:** This is the "Verify & Invite" button - confirms payment and sends 15-day registration link  
**Request Body:**
```json
{
  "consultation_id": "uuid",
  "client_email": "john@example.com",
  "client_name": "John Doe",
  "payment_amount": 1500,
  "payment_date": "2026-01-16",
  "package_tier": "Premium Package",
  "package_type": "tier",
  "selected_services": ["Resume Review", "Interview Prep", "Application Support"],
  "payment_method": "interac_etransfer",
  "payment_reference": "REF123456",
  "admin_notes": "Payment verified via Interac"
}
```

**What This Does:**
1. Updates consultation status to "onboarding"
2. Generates 15-day registration token
3. Creates/updates user in database
4. Sends email with registration link
5. Registration link: `https://apply-bureau.vercel.app/register?token=XXXXX`

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed and registration invite sent successfully",
  "data": {
    "consultation_id": "uuid",
    "client_email": "john@example.com",
    "client_name": "John Doe",
    "payment_amount": 1500,
    "status": "onboarding",
    "registration_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_expires_at": "2026-01-31T12:00:00Z",
    "registration_url": "https://apply-bureau.vercel.app/register?token=...",
    "email_sent": true
  }
}
```

---

### 7. Get All Onboarding Submissions
```
GET /api/admin/concierge/onboarding
```
**Query Parameters:**
- `status`: "all" | "pending" | "active" | "completed"
- `limit`: Number (default: 50)
- `offset`: Number (default: 0)

**Response:**
```json
{
  "submissions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "execution_status": "pending",
      "submitted_at": "2026-01-16T12:00:00Z",
      "registered_users": {
        "id": "uuid",
        "email": "john@example.com",
        "full_name": "John Doe",
        "profile_unlocked": false,
        "onboarding_completed": true
      }
    }
  ],
  "total": 8,
  "status_counts": {
    "pending": 5,
    "active": 2,
    "completed": 1
  }
}
```

---

### 8. Approve Onboarding & Unlock Profile
```
POST /api/admin/concierge/onboarding/:id/approve
```
**Purpose:** Approve onboarding and unlock Application Tracker  
**Request Body:**
```json
{
  "admin_notes": "Great profile, approved for full access"
}
```

**What This Does:**
1. Changes onboarding status to "active"
2. Sets `profile_unlocked = true` in database
3. Sets `onboarding_completed = true`
4. Sends "Profile Unlocked" email to client
5. Client can now access Application Tracker

**Response:**
```json
{
  "message": "Onboarding approved and profile unlocked successfully",
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "execution_status": "active",
  "profile_unlocked": true,
  "approved_by": "Admin Name",
  "approved_at": "2026-01-16T12:00:00Z"
}
```

---

### 9. Get Contact Requests
```
GET /api/contact-requests
```
**Response:**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "message": "Interested in your services",
      "status": "new",
      "created_at": "2026-01-16T12:00:00Z"
    }
  ],
  "total": 25
}
```

---

### 10. Get Activity Logs
```
GET /api/admin/activity-logs
```
**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "action": "consultation_confirmed",
      "admin_name": "Admin User",
      "details": "Confirmed consultation for John Doe",
      "timestamp": "2026-01-16T12:00:00Z"
    }
  ]
}
```

---

### 11. Enhanced Dashboard
```
GET /api/enhanced-dashboard
```
**Purpose:** Real-time dashboard with all metrics  
**Response:**
```json
{
  "overview": {
    "total_consultations": 45,
    "pending_consultations": 12,
    "total_clients": 30,
    "revenue_this_month": 15000
  },
  "recent_consultations": [],
  "pending_onboarding": [],
  "recent_activity": []
}
```



---

## 📊 Complete Endpoint List

### Public Endpoints (No Auth)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| GET | `/api/health` | API health check |
| POST | `/api/contact` | Submit contact form |
| POST | `/api/public-consultations` | Book consultation |
| GET | `/api/client-registration/validate-token/:token` | Validate registration token |
| POST | `/api/client-registration/register` | Register using token |
| GET | `/api/public/info` | Get public info |

### Authentication Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Client Endpoints (Client Auth Required)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/client/dashboard` | Get dashboard |
| POST | `/api/client/onboarding-20q` | Submit onboarding |
| GET | `/api/client/onboarding-20q/status` | Get onboarding status |
| POST | `/api/client/uploads` | Upload files |
| GET | `/api/notifications` | Get notifications |
| GET | `/api/notifications/unread/count` | Get unread count |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| GET | `/api/applications` | Get applications |
| POST | `/api/applications` | Create application |
| GET | `/api/strategy-calls` | Get strategy calls |
| POST | `/api/strategy-calls` | Book strategy call |

### Admin Endpoints (Admin Auth Required)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin-dashboard/overview` | Dashboard stats |
| GET | `/api/admin/concierge/consultations` | List consultations |
| POST | `/api/admin/concierge/consultations/:id/confirm` | Confirm consultation |
| POST | `/api/admin/concierge/consultations/:id/reschedule` | Request reschedule |
| POST | `/api/admin/concierge/consultations/:id/waitlist` | Add to waitlist |
| POST | `/api/admin/concierge/payment-confirmation` | **Verify & Invite (15-day token)** |
| GET | `/api/admin/concierge/onboarding` | List onboarding submissions |
| POST | `/api/admin/concierge/onboarding/:id/approve` | Approve & unlock profile |
| GET | `/api/contact-requests` | Get contact requests |
| GET | `/api/enhanced-dashboard` | Real-time dashboard |
| GET | `/api/admin/activity-logs` | Get activity logs |
| POST | `/api/webhooks/test` | Test webhook |



---

## 📝 Data Formats & Examples

### Consultation Request Format
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "I need help with job applications",
  "preferred_slots": [
    { "date": "2026-01-20", "time": "10:00" },
    { "date": "2026-01-21", "time": "14:00" },
    { "date": "2026-01-22", "time": "16:00" }
  ]
}
```
**Important:** 
- Must have exactly 3 preferred_slots
- Date format: "YYYY-MM-DD"
- Time format: "HH:MM" (24-hour)

---

### Contact Form Format
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "Your message here"
}
```
**Note:** Use `full_name` (not `firstName` and `lastName`)

---

### Onboarding Submission Format
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "current_location": "Toronto, Canada",
  "target_countries": ["Canada", "USA", "UK"],
  "education_level": "Bachelor's Degree",
  "field_of_study": "Computer Science",
  "years_of_experience": 5,
  "current_job_title": "Software Developer",
  "target_job_titles": ["Senior Developer", "Tech Lead"],
  "industries_of_interest": ["Technology", "Finance"],
  "work_authorization": "Canadian Citizen",
  "resume_uploaded": true,
  "linkedin_profile": "https://linkedin.com/in/johndoe",
  "portfolio_url": "https://johndoe.com",
  "job_search_timeline": "3-6 months",
  "application_support_needed": ["Resume Review", "Interview Prep"],
  "budget_range": "$1000-$2000",
  "additional_notes": "Looking for remote opportunities"
}
```

---

### Payment Confirmation Format
```json
{
  "consultation_id": "uuid",
  "client_email": "john@example.com",
  "client_name": "John Doe",
  "payment_amount": 1500,
  "payment_date": "2026-01-16",
  "package_tier": "Premium Package",
  "package_type": "tier",
  "selected_services": ["Resume Review", "Interview Prep"],
  "payment_method": "interac_etransfer",
  "payment_reference": "REF123456",
  "admin_notes": "Payment verified"
}
```

---

### User Object Format
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "full_name": "John Doe",
  "role": "client",
  "profile_unlocked": true,
  "payment_confirmed": true,
  "onboarding_completed": true,
  "is_active": true,
  "created_at": "2026-01-16T12:00:00Z"
}
```

---

### Notification Format
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "type": "profile_unlocked",
  "title": "Profile Unlocked!",
  "message": "Your Application Tracker is now active",
  "read": false,
  "created_at": "2026-01-16T12:00:00Z"
}
```



---

## ⚠️ Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message here",
  "details": "More specific details (optional)",
  "errorId": "abc123def456"
}
```

### Common HTTP Status Codes
| Code | Meaning | When It Happens |
|------|---------|-----------------|
| 200 | Success | Request completed successfully |
| 201 | Created | New resource created |
| 400 | Bad Request | Missing or invalid data |
| 401 | Unauthorized | No token or invalid token |
| 403 | Forbidden | Don't have permission |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Something broke on server |

### Common Error Messages

**Authentication Errors:**
```json
{ "error": "Invalid or expired token" }
{ "error": "Authentication required" }
{ "error": "Admin access required" }
```

**Validation Errors:**
```json
{ "error": "Missing required fields: email, password" }
{ "error": "Invalid email format" }
{ "error": "Password must be at least 8 characters" }
```

**Token Errors:**
```json
{ "error": "Token expired" }
{ "error": "Token already used" }
{ "error": "Invalid token type" }
```

**Rate Limit Errors:**
```json
{
  "error": "Too many login attempts",
  "retryAfter": 900
}
```



---

## 🔄 Complete User Flow (Step by Step)

### Flow 1: Public User → Consultation → Payment → Registration → Onboarding → Active Client

**Step 1: User Books Consultation**
```
POST /api/public-consultations
Body: { name, email, phone, message, preferred_slots (3 slots) }
→ Status: "pending"
```

**Step 2: Admin Confirms Consultation**
```
POST /api/admin/concierge/consultations/:id/confirm
Body: { selected_slot_index: 0, meeting_details, meeting_link }
→ Status: "confirmed"
→ Email sent to client with meeting details
```

**Step 3: Consultation Happens**
- Client and admin meet
- Admin discusses services and pricing

**Step 4: Admin Confirms Payment & Sends Invite**
```
POST /api/admin/concierge/payment-confirmation
Body: { 
  consultation_id, 
  client_email, 
  client_name, 
  payment_amount, 
  package_tier 
}
→ Generates 15-day registration token
→ Sends email with registration link
→ Status: "onboarding"
```

**Step 5: Client Registers**
```
GET /api/client-registration/validate-token/:token
→ Check if token is valid

POST /api/client-registration/register
Body: { token, password, confirm_password }
→ Account created
→ Returns auth token
→ profile_unlocked: false
→ onboarding_completed: false
```

**Step 6: Client Submits Onboarding**
```
POST /api/client/onboarding-20q
Headers: Authorization: Bearer TOKEN
Body: { 20 questions answered }
→ Status: "pending"
→ Waiting for admin approval
```

**Step 7: Admin Approves Onboarding**
```
POST /api/admin/concierge/onboarding/:id/approve
Body: { admin_notes }
→ profile_unlocked: true
→ onboarding_completed: true
→ Email sent: "Profile Unlocked!"
→ Client can now access Application Tracker
```

**Step 8: Client Uses Application Tracker**
```
GET /api/client/dashboard
→ Full access to all features
→ Can track applications
→ Can book strategy calls
→ Can upload documents
```

---

## 🎯 Key Points for Frontend

### 1. Registration Token is 15 DAYS (not 7!)
- Token expires in 15 days
- Generated at: `backend/routes/adminConcierge.js` lines ~434 and ~598
- Code: `{ expiresIn: '15d' }`

### 2. Contact Form Uses `full_name` (not firstName/lastName)
```javascript
// ✅ CORRECT
{ full_name: "John Doe", email: "...", phone: "...", message: "..." }

// ❌ WRONG
{ firstName: "John", lastName: "Doe", ... }
```

### 3. Consultation Requires Exactly 3 Time Slots
```javascript
preferred_slots: [
  { date: "2026-01-20", time: "10:00" },
  { date: "2026-01-21", time: "14:00" },
  { date: "2026-01-22", time: "16:00" }
]
```

### 4. Frontend URL is Production URL
- Use: `https://apply-bureau.vercel.app`
- NOT: `http://localhost:5173`

### 5. Always Include Authorization Header
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### 6. Profile Unlocked = Application Tracker Access
- `profile_unlocked: false` → No tracker access
- `profile_unlocked: true` → Full tracker access
- Only admin can unlock via onboarding approval

---

## 🚀 Deployment Info

**Backend URL:** `https://apply-bureau-backend.vercel.app`  
**Frontend URL:** `https://apply-bureau.vercel.app`  
**Platform:** Vercel  
**Database:** Supabase (PostgreSQL)  
**Email Service:** Custom email service  

---

## 📞 Support

If you encounter any errors:
1. Check the error message and `errorId`
2. Verify request format matches examples above
3. Ensure token is valid and not expired
4. Check that all required fields are included
5. Verify you're using the correct endpoint URL

---

**Last Updated:** January 16, 2026  
**Version:** 1.0.0  
**Maintained by:** Apply Bureau Development Team

