# Apply Bureau Backend - Complete System Documentation

**Last Updated:** January 14, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅  
**Deployment:** https://apply-bureau-backend.vercel.app

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [5-Phase Flow System](#5-phase-flow-system)
4. [API Endpoints](#api-endpoints)
5. [Data Formats](#data-formats)
6. [Authentication & Authorization](#authentication--authorization)
7. [Registration Token System](#registration-token-system)
8. [Email Notification System](#email-notification-system)
9. [Database Schema](#database-schema)
10. [Environment Variables](#environment-variables)
11. [Deployment Guide](#deployment-guide)
12. [Testing](#testing)

---

## System Overview

### What is Apply Bureau Backend?

Apply Bureau Backend is a comprehensive consultation-to-client pipeline management system designed to handle the complete lifecycle of client onboarding, from initial consultation request to active application tracking.

### Core Purpose

The system implements a **5-phase gatekeeper model** where:
- No one gets in for free (payment-gated registration)
- No one gets lost in the process (tracked at every step)
- Admin has full control at every gate (manual approval system)

### Technology Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT (JSON Web Tokens)
- **Email Service:** Resend
- **Real-time:** Socket.IO
- **File Storage:** Supabase Storage
- **Deployment:** Vercel (Serverless)

### Key Features

✅ **Consultation Request System** - Public form for consultation bookings  
✅ **Admin Gatekeeper Controls** - 3-button logic (Confirm/Reschedule/Waitlist)  
✅ **Payment Verification** - Manual payment confirmation by admin  
✅ **Exclusive Registration** - Token-based registration (7-day expiry)  
✅ **Profile Lock System** - Glassmorphism blur until admin approval  
✅ **20-Question Onboarding** - Comprehensive client information collection  
✅ **Application Tracker** - Real-time job application tracking  
✅ **Email Notifications** - Automated emails at every step  
✅ **File Upload System** - Resume, LinkedIn PDF, portfolio uploads  
✅ **Admin Dashboard** - Complete client management interface  

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Vue)                     │
│                  https://yourfrontend.com                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS/REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  EXPRESS.JS SERVER                           │
│              (Node.js 20 + Express)                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes     │  │ Controllers  │  │  Middleware  │     │
│  │              │  │              │  │              │     │
│  │ - Auth       │  │ - Auth       │  │ - JWT Auth   │     │
│  │ - Public     │  │ - Admin      │  │ - CORS       │     │
│  │ - Client     │  │ - Client     │  │ - Rate Limit │     │
│  │ - Admin      │  │ - Dashboard  │  │ - Validation │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Utils      │  │   Services   │  │   Helpers    │     │
│  │              │  │              │  │              │     │
│  │ - Email      │  │ - Token      │  │ - Logger     │     │
│  │ - Supabase   │  │ - Upload     │  │ - Cache      │     │
│  │ - Auth       │  │ - Realtime   │  │ - Security   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  SUPABASE   │  │   RESEND    │  │  VERCEL     │
│  DATABASE   │  │   EMAIL     │  │  HOSTING    │
│             │  │   SERVICE   │  │             │
│ PostgreSQL  │  │             │  │ Serverless  │
│ Storage     │  │ Templates   │  │ Functions   │
│ Auth        │  │ Delivery    │  │ CDN         │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Request Flow

1. **Client Request** → Frontend sends HTTP request
2. **CORS Check** → Server validates origin
3. **Rate Limiting** → Checks request frequency
4. **Authentication** → JWT token validation (if required)
5. **Authorization** → Role-based access control
6. **Validation** → Request data validation
7. **Business Logic** → Controller processes request
8. **Database Query** → Supabase interaction
9. **Response** → JSON response sent back
10. **Logging** → Request/response logged

### Directory Structure

```
backend/
├── server.js                 # Main server entry point
├── package.json              # Dependencies
├── .env                      # Environment variables
├── .env.example              # Environment template
├── vercel.json               # Vercel deployment config
│
├── routes/                   # API route handlers
│   ├── auth.js               # Authentication routes
│   ├── publicConsultations.js # Public consultation requests
│   ├── adminConcierge.js     # Admin gatekeeper controls
│   ├── clientRegistration.js # Token-based registration
│   ├── clientOnboarding20Q.js # 20-question onboarding
│   ├── adminOnboardingTriggers.js # Admin approval triggers
│   ├── clientDashboard.js    # Client dashboard data
│   ├── clientUploads.js      # File upload system
│   ├── contact.js            # Contact form
│   └── ...                   # Other routes
│
├── controllers/              # Business logic
│   ├── authController.js
│   ├── adminController.js
│   ├── clientController.js
│   └── ...
│
├── middleware/               # Express middleware
│   ├── auth.js               # JWT authentication
│   ├── errorHandler.js       # Global error handling
│   ├── pagination.js         # Pagination helper
│   └── profileGuard.js       # Profile lock check
│
├── utils/                    # Utility functions
│   ├── supabase.js           # Supabase client
│   ├── email.js              # Email service
│   ├── auth.js               # Auth helpers
│   ├── tokenService.js       # Token generation
│   ├── validation.js         # Input validation
│   ├── logger.js             # Logging system
│   ├── cache.js              # Caching layer
│   └── security.js           # Security utilities
│
├── emails/                   # Email templates
│   └── templates/
│       ├── consultation_request_received.html
│       ├── consultation_confirmed_concierge.html
│       ├── payment_confirmed_welcome_concierge.html
│       ├── profile_unlocked.html
│       └── ...
│
├── scripts/                  # Utility scripts
│   ├── create-admin-user.js
│   ├── test-complete-5-phase-flow.js
│   └── ...
│
├── tests/                    # Test files
│   ├── api.test.js
│   ├── consultation-lifecycle.test.js
│   └── ...
│
└── logs/                     # Application logs
    ├── app.log
    └── error.log
```

---

## 5-Phase Flow System

### Overview

The Apply Bureau backend implements an exact 5-phase consultation-to-client pipeline that ensures:
- **Controlled Entry:** No one can register without payment confirmation
- **Full Tracking:** Every step is logged and monitored
- **Admin Control:** Manual approval at every critical gate

---

### 🟢 PHASE 1: The Consultation Request

#### User Experience
1. Visitor fills out form on public website
2. Picks 3 preferred time slots (Friday-Sunday)
3. Selects package tier (Tier 1, 2, or 3)
4. Hits "Confirm Selection"

#### Backend Logic
```javascript
POST /api/public-consultations

Request Body:
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "Brief message from client",
  "preferred_slots": [
    { "date": "2024-01-19", "time": "14:00" },
    { "date": "2024-01-20", "time": "15:00" },
    { "date": "2024-01-21", "time": "16:00" }
  ]
}
```

#### What Happens
1. **Lead Record Created** - Status: `PENDING`
2. **Instant Email Trigger** - "Receipt" email sent to client
3. **Admin Notification** - New card appears in Admin Dashboard
4. **Database Entry** - Stored in `consultation_requests` table

#### Email Sent
- **Template:** `consultation_request_received.html`
- **To:** Client email
- **Content:** Confirmation that request is being reviewed
- **Reminder:** Check spam folder

---

### 🟡 PHASE 2: Admin Review (The 3-Button Logic)

#### Admin Experience
Admin opens dashboard and sees new lead with 3 action buttons:
- **[Confirm]** - Select time slot and send meeting link
- **[Propose New]** - Request different time
- **[Waitlist]** - Archive with polite message

#### Button 1: [Confirm] Flow

```javascript
POST /api/admin/concierge/consultations/:id/confirm

Request Body:
{
  "selected_slot_index": 0,  // 0, 1, or 2 (which of the 3 slots)
  "meeting_link": "https://meet.google.com/xxx-yyyy-zzz",
  "meeting_details": "Looking forward to our call!",
  "admin_notes": "Client seems well-prepared"
}
```

**What Happens:**
1. Backend updates status to `CONFIRMED`
2. Saves selected time slot and meeting link
3. Sends calendar invite email to client
4. Creates admin notification

**Email Sent:**
- **Template:** `consultation_confirmed_concierge.html`
- **To:** Client email
- **Content:** Confirmed date, time, and meeting link

#### Button 2: [Propose New] Flow

```javascript
POST /api/admin/concierge/consultations/:id/reschedule

Request Body:
{
  "reschedule_reason": "Original times not available",
  "admin_notes": "Requesting new availability"
}
```

**What Happens:**
1. Status updated to `RESCHEDULED`
2. Email sent asking client for new times
3. Client can submit new preferred slots

#### Button 3: [Waitlist] Flow

```javascript
POST /api/admin/concierge/consultations/:id/waitlist

Request Body:
{
  "waitlist_reason": "Currently at capacity",
  "admin_notes": "Will contact when availability opens"
}
```

**What Happens:**
1. Status updated to `WAITLISTED`
2. Polite "we are full" email sent
3. Lead archived for future follow-up

---

### 🔵 PHASE 3: The Payment Gate (The Bridge)

#### Admin Experience
1. Meeting completed, client has paid
2. Admin clicks **[Verify & Invite]** button
3. Enters payment details

#### Backend Logic

```javascript
POST /api/admin/concierge/payment/confirm-and-invite

Request Body:
{
  "client_email": "john@example.com",
  "client_name": "John Doe",
  "payment_amount": "2500",
  "payment_method": "interac_etransfer",
  "payment_reference": "Transfer #12345",
  "admin_notes": "Payment verified"
}
```

#### What Happens
1. **Token Generation** - Unique one-time registration token created
2. **Token Expiry** - Set to 7 days from now
3. **Database Update** - User record created/updated with token
4. **Email Sent** - Exclusive registration link sent to client

#### Token Details
```javascript
// Token payload
{
  email: "john@example.com",
  name: "John Doe",
  type: "registration",
  payment_confirmed: true,
  exp: 7 days from now
}

// Registration URL
https://yourfrontend.com/register?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Email Sent
- **Template:** `payment_confirmed_welcome_concierge.html`
- **To:** Client email
- **Content:** Payment confirmation + exclusive registration link
- **Expiry:** Link expires in 7 days

#### Security Features
- ✅ Token is one-time use only
- ✅ Token expires after 7 days
- ✅ Cannot register without valid token
- ✅ Token tied to specific email address
- ✅ Token marked as "used" after registration

---

### 🟣 PHASE 4: Onboarding & The "Glass" Lock

#### Client Experience
1. Clicks registration link from email
2. Creates password and completes registration
3. Logs in for first time
4. **Sees blurred dashboard** (Glassmorphism effect)
5. Can see shapes of "Application Tracker" but can't click
6. Large button: **[Begin Onboarding]**
7. Answers 20 questions
8. Hits **[Submit for Review]**

#### Registration Flow

```javascript
POST /api/client-registration/register

Request Body:
{
  "registration_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "SecurePassword123!",
  "confirm_password": "SecurePassword123!"
}
```

**What Happens:**
1. Token validated (not expired, not used)
2. Password hashed with bcrypt
3. User account created in `registered_users` table
4. Profile created with `profile_unlocked: false`
5. Token marked as used
6. Auth token returned for login

#### 20-Question Onboarding

```javascript
POST /api/client/onboarding-20q/submit

Request Body:
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
  "availability_start": "2024-02-01",
  "key_skills": ["JavaScript", "React", "Node.js", "AWS"],
  "certifications": ["AWS Solutions Architect"],
  "languages": ["English", "French"],
  "preferred_company_size": "Startup (1-50)",
  "preferred_industries": ["Tech", "FinTech", "SaaS"],
  "additional_notes": "Looking for remote-first companies"
}
```

**What Happens:**
1. Onboarding data saved to `client_onboarding_20q` table
2. Status set to `REVIEW_REQUIRED`
3. Admin notification created
4. Email sent to admin for review
5. Client dashboard shows "Under Review" status

#### Profile Lock System

**Database Field:**
```sql
profile_unlocked BOOLEAN DEFAULT false
```

**Frontend Implementation:**
```javascript
// Check if profile is locked
if (!user.profile_unlocked) {
  // Apply blur effect to dashboard
  dashboardElement.classList.add('blur-effect');
  
  // Disable all interactive elements
  applicationTracker.disabled = true;
  
  // Show onboarding prompt
  showOnboardingPrompt();
}
```

**CSS Glassmorphism Effect:**
```css
.blur-effect {
  filter: blur(8px);
  pointer-events: none;
  user-select: none;
}

.glass-overlay {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

---

### 🔴 PHASE 5: The Unlock & Active Execution

#### Admin Experience
1. Reviews 20 onboarding answers
2. Verifies all information is complete
3. Clicks **[Unlock Profile]** button

#### Backend Logic

```javascript
POST /api/admin/concierge/onboarding/:id/approve

Request Body:
{
  "admin_notes": "All information verified. Ready to begin."
}
```

#### What Happens
1. **Boolean Flip** - `profile_unlocked: false` → `profile_unlocked: true`
2. **Status Update** - `execution_status: 'active'`
3. **Email Sent** - Profile unlocked notification
4. **Real-time Update** - Client dashboard updates instantly

#### Database Changes
```sql
UPDATE registered_users
SET 
  profile_unlocked = true,
  profile_unlocked_by = admin_user_id,
  profile_unlocked_at = NOW(),
  onboarding_completed = true
WHERE id = client_user_id;

UPDATE client_onboarding_20q
SET
  execution_status = 'active',
  approved_by = admin_user_id,
  approved_at = NOW()
WHERE user_id = client_user_id;
```

#### Email Sent
- **Template:** `profile_unlocked.html`
- **To:** Client email
- **Content:** Profile unlocked, tracker now active
- **Next Steps:** Applications will begin within 3 business days

#### Client Experience After Unlock
1. **Blur Vanishes** - Dashboard becomes fully interactive
2. **Tracker Active** - Can see "Weekly Accordions"
3. **Real-time Updates** - Job applications appear as they're submitted
4. **Interview Alerts** - High-priority emails when status changes to "Interview"

#### Ongoing Work Features

**Job Addition by Admin:**
```javascript
POST /api/admin/applications/add

Request Body:
{
  "client_id": "uuid",
  "company_name": "Tech Corp",
  "job_title": "Senior Software Engineer",
  "job_url": "https://techcorp.com/careers/123",
  "status": "applied",
  "applied_date": "2024-01-14",
  "notes": "Strong match for client's skills"
}
```

**Interview Alert System:**
```javascript
// When status changes to "interview"
if (application.status === 'interview_requested') {
  // Send high-priority email
  await sendEmail(client.email, 'interview_update_enhanced', {
    company_name: application.company_name,
    job_title: application.job_title,
    interview_date: application.interview_date,
    interview_type: application.interview_type,
    priority: 'high'
  });
}
```

---

### Phase Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: Consultation Request                               │
│ ✓ Public form submission                                    │
│ ✓ 3 time slots selected                                     │
│ ✓ Status: PENDING                                           │
│ ✓ Receipt email sent                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: Admin Review (3-Button Logic)                      │
│ ✓ Admin views request                                       │
│ ✓ [Confirm] → Select slot + meeting link                    │
│ ✓ [Propose New] → Request different time                    │
│ ✓ [Waitlist] → Archive with message                         │
│ ✓ Status: CONFIRMED                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: Payment Gate                                       │
│ ✓ Meeting completed                                         │
│ ✓ Payment verified by admin                                 │
│ ✓ Unique token generated (7-day expiry)                     │
│ ✓ Exclusive registration link sent                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: Onboarding & Glass Lock                            │
│ ✓ Client registers with token                               │
│ ✓ Dashboard visible but blurred                             │
│ ✓ 20-question onboarding completed                          │
│ ✓ Status: REVIEW_REQUIRED                                   │
│ ✓ profile_unlocked: false                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 5: Unlock & Active Execution                          │
│ ✓ Admin reviews onboarding                                  │
│ ✓ Profile unlocked (boolean flip)                           │
│ ✓ Blur vanishes instantly                                   │
│ ✓ Application tracker active                                │
│ ✓ Real-time job updates                                     │
│ ✓ Interview alerts enabled                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Complete Endpoint Reference

---

### 🌐 PUBLIC ENDPOINTS (No Authentication Required)

#### 1. Health Check
```http
GET /health
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-14T10:00:00.000Z",
  "uptime": 3600,
  "service": "Apply Bureau Backend",
  "database": "connected",
  "email": "operational"
}
```

---

#### 2. Submit Consultation Request
```http
POST /api/public-consultations
Content-Type: application/json
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "Interested in career services",
  "preferred_slots": [
    { "date": "2024-01-19", "time": "14:00" },
    { "date": "2024-01-20", "time": "15:00" },
    { "date": "2024-01-21", "time": "16:00" }
  ]
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "pending",
  "admin_status": "pending",
  "message": "Request received. We will confirm your consultation shortly.",
  "booking_details": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "message": "Interested in career services",
    "preferred_slots": [...]
  },
  "next_steps": "Our team will review your request and contact you within 24 hours."
}
```

---

#### 3. Submit Contact Form
```http
POST /api/contact
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "subject": "General Inquiry",
  "message": "I have a question about your services",
  "company": "Example Corp",
  "country": "United States"
}
```

**Response:**
```json
{
  "id": "uuid",
  "message": "Contact form submitted successfully"
}
```

---

### 🔐 AUTHENTICATION ENDPOINTS

#### 4. Client/Admin Login
```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "client",
    "dashboard_type": "client"
  }
}
```

---

#### 5. Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "client",
    "dashboard_type": "client",
    "onboarding_complete": true,
    "profile_unlocked": true
  }
}
```

---

### 👤 CLIENT ENDPOINTS (Requires Client Authentication)

#### 6. Complete Registration (Token-Based)
```http
POST /api/client-registration/register
Content-Type: application/json
```

**Request Body:**
```json
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

---

#### 7. Submit 20-Question Onboarding
```http
POST /api/client/onboarding-20q/submit
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
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
  "availability_start": "2024-02-01",
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
    "completed_at": "2024-01-14T10:00:00.000Z"
  },
  "next_steps": "Your onboarding is under review. You will be notified once approved."
}
```

---

#### 8. Get Client Dashboard
```http
GET /api/client/dashboard
Authorization: Bearer <token>
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
    "latest_status": "confirmed",
    "confirmed_time": "2024-01-15T14:00:00.000Z",
    "meeting_link": "https://meet.google.com/xxx-yyyy-zzz"
  },
  "onboarding": {
    "completed": true,
    "approved": true,
    "execution_status": "active",
    "completed_at": "2024-01-14T10:00:00.000Z"
  },
  "files": {
    "resume_uploaded": true,
    "linkedin_added": true,
    "portfolio_added": false,
    "resume_url": "https://storage.supabase.co/...",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "portfolio_urls": []
  },
  "applications": {
    "total_count": 15,
    "active_count": 8,
    "can_view": true
  },
  "next_steps": [
    {
      "action": "view_applications",
      "title": "Application Tracker",
      "description": "15 applications submitted, 8 active",
      "priority": 1,
      "required": false,
      "active": true
    }
  ]
}
```

---

#### 9. Upload Files
```http
POST /api/client/uploads
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```
file: <binary_file_data>
type: "resume" | "linkedin_pdf" | "portfolio"
description: "Optional description"
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
    "uploaded_at": "2024-01-14T10:00:00.000Z"
  }
}
```

---

### 👨‍💼 ADMIN ENDPOINTS (Requires Admin Authentication)

#### 10. Get Consultation Requests
```http
GET /api/admin/concierge/consultations?admin_status=pending&limit=50&offset=0
Authorization: Bearer <admin_token>
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
      "message": "Interested in career services",
      "preferred_slots": [...],
      "admin_status": "pending",
      "status": "pending",
      "created_at": "2024-01-14T10:00:00.000Z",
      "booking_details": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "message": "Interested in career services"
      },
      "time_slots": [...],
      "has_time_slots": true
    }
  ],
  "total": 10,
  "offset": 0,
  "limit": 50,
  "status_counts": {
    "pending": 10,
    "confirmed": 25,
    "rescheduled": 3,
    "waitlisted": 2
  },
  "gatekeeper_actions": ["confirm", "reschedule", "waitlist"]
}
```

---

#### 11. Confirm Consultation (3-Button Logic)
```http
POST /api/admin/concierge/consultations/:id/confirm
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "selected_slot_index": 0,
  "meeting_link": "https://meet.google.com/xxx-yyyy-zzz",
  "meeting_details": "Looking forward to our call!",
  "admin_notes": "Client seems well-prepared"
}
```

**Response:**
```json
{
  "message": "Consultation confirmed successfully",
  "consultation": {
    "id": "uuid",
    "admin_status": "confirmed",
    "status": "confirmed",
    "confirmed_time": "2024-01-19T14:00:00.000Z",
    "admin_notes": "Client seems well-prepared"
  },
  "confirmed_slot": {
    "date": "2024-01-19",
    "time": "14:00"
  },
  "confirmed_time": "2024-01-19T14:00:00.000Z"
}
```

---

#### 12. Reschedule Consultation
```http
POST /api/admin/concierge/consultations/:id/reschedule
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reschedule_reason": "Original times not available",
  "admin_notes": "Requesting new availability"
}
```

**Response:**
```json
{
  "message": "Reschedule request sent successfully",
  "consultation": {
    "id": "uuid",
    "admin_status": "rescheduled",
    "status": "pending",
    "reschedule_reason": "Original times not available"
  },
  "reschedule_reason": "Original times not available"
}
```

---

#### 13. Waitlist Consultation
```http
POST /api/admin/concierge/consultations/:id/waitlist
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "waitlist_reason": "Currently at capacity",
  "admin_notes": "Will contact when availability opens"
}
```

**Response:**
```json
{
  "message": "Consultation added to waitlist successfully",
  "consultation": {
    "id": "uuid",
    "admin_status": "waitlisted",
    "status": "pending",
    "waitlist_reason": "Currently at capacity"
  },
  "waitlist_reason": "Currently at capacity"
}
```

---

#### 14. Confirm Payment & Send Registration Invite
```http
POST /api/admin/concierge/payment/confirm-and-invite
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
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
  "message": "Payment confirmed and registration invite sent successfully",
  "client_email": "john@example.com",
  "client_name": "John Doe",
  "payment_amount": "2500",
  "registration_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_expires_at": "2024-01-21T10:00:00.000Z",
  "registration_url": "https://yourfrontend.com/register?token=..."
}
```

---

#### 15. Approve Onboarding & Unlock Profile
```http
POST /api/admin/concierge/onboarding/:id/approve
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "admin_notes": "All information verified. Ready to begin."
}
```

**Response:**
```json
{
  "message": "Onboarding approved and profile unlocked successfully",
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "execution_status": "active",
  "profile_unlocked": true,
  "approved_by": "Admin User",
  "approved_at": "2024-01-14T10:00:00.000Z"
}
```

---

#### 16. Get Contact Form Submissions
```http
GET /api/contact?page=1&limit=10&status=new
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "subject": "General Inquiry",
      "message": "I have a question about your services",
      "status": "new",
      "created_at": "2024-01-14T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

### 📊 ENDPOINT SUMMARY

| Category | Endpoint Count | Authentication |
|----------|---------------|----------------|
| Public | 3 | None |
| Authentication | 2 | None (for login) |
| Client | 5 | Client Token |
| Admin | 8 | Admin Token |
| **Total** | **18** | Mixed |

---

## Data Formats

### Request/Response Data Structures

---

### Consultation Request Format

```typescript
interface ConsultationRequest {
  // Required fields
  full_name: string;          // 2-100 characters
  email: string;              // Valid email format
  phone: string;              // 10-20 characters
  
  // Optional fields
  message?: string;           // Brief message from client
  preferred_slots?: Array<{   // Maximum 3 slots
    date: string;             // Format: "YYYY-MM-DD"
    time: string;             // Format: "HH:MM" (24-hour)
  }>;
}

// Example
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "Interested in career services",
  "preferred_slots": [
    { "date": "2024-01-19", "time": "14:00" },
    { "date": "2024-01-20", "time": "15:00" },
    { "date": "2024-01-21", "time": "16:00" }
  ]
}
```

---

### Contact Form Format

```typescript
interface ContactRequest {
  // Required fields
  name: string;               // Full name
  email: string;              // Valid email
  message: string;            // 10-500 characters
  
  // Optional fields
  phone?: string;
  subject?: string;
  company?: string;
  country?: string;
  position?: string;
}

// Example
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "subject": "General Inquiry",
  "message": "I have a question about your services",
  "company": "Example Corp",
  "country": "United States"
}
```

---

### Registration Format

```typescript
interface RegistrationRequest {
  registration_token: string;  // JWT token from email
  password: string;            // Min 8 chars, 1 uppercase, 1 number
  confirm_password: string;    // Must match password
}

// Example
{
  "registration_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "SecurePassword123!",
  "confirm_password": "SecurePassword123!"
}
```

---

### 20-Question Onboarding Format

```typescript
interface OnboardingData {
  // Career Information
  current_salary: string;
  target_salary: string;
  target_roles: string;
  years_of_experience: number;
  education_level: string;
  
  // Online Presence
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  
  // Location & Mobility
  current_location: string;
  willing_to_relocate: boolean;
  preferred_locations: string[];
  work_authorization: string;
  
  // Availability
  notice_period: string;
  availability_start: string;  // Format: "YYYY-MM-DD"
  
  // Skills & Qualifications
  key_skills: string[];
  certifications?: string[];
  languages: string[];
  
  // Preferences
  preferred_company_size: string;
  preferred_industries: string[];
  additional_notes?: string;
}

// Example
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
  "availability_start": "2024-02-01",
  "key_skills": ["JavaScript", "React", "Node.js", "AWS"],
  "certifications": ["AWS Solutions Architect"],
  "languages": ["English", "French"],
  "preferred_company_size": "Startup (1-50)",
  "preferred_industries": ["Tech", "FinTech", "SaaS"],
  "additional_notes": "Looking for remote-first companies"
}
```

---

### Payment Confirmation Format

```typescript
interface PaymentConfirmation {
  client_email: string;
  client_name: string;
  payment_amount: string;
  payment_method: 'interac_etransfer' | 'credit_card' | 'bank_transfer' | 'other';
  payment_reference?: string;
  admin_notes?: string;
}

// Example
{
  "client_email": "john@example.com",
  "client_name": "John Doe",
  "payment_amount": "2500",
  "payment_method": "interac_etransfer",
  "payment_reference": "Transfer #12345",
  "admin_notes": "Payment verified"
}
```

---

### File Upload Format

```typescript
interface FileUpload {
  file: File;                  // Binary file data
  type: 'resume' | 'linkedin_pdf' | 'portfolio' | 'cover_letter';
  description?: string;
}

// Multipart form data
Content-Type: multipart/form-data

Fields:
- file: <binary_file_data>
- type: "resume"
- description: "Updated resume with recent projects"
```

---

### Response Formats

#### Success Response
```typescript
interface SuccessResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

// Example
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "id": "uuid",
    "status": "active"
  }
}
```

#### Error Response
```typescript
interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
  timestamp?: string;
}

// Example
{
  "error": "Validation failed",
  "details": "Email format is invalid",
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-14T10:00:00.000Z"
}
```

#### Pagination Response
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

// Example
{
  "consultations": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Status Enums

#### Consultation Status
```typescript
type ConsultationStatus = 
  | 'pending'       // Initial submission
  | 'confirmed'     // Admin confirmed time slot
  | 'rescheduled'   // Admin requested new times
  | 'waitlisted'    // Added to waitlist
  | 'completed'     // Consultation completed
  | 'cancelled';    // Cancelled by client or admin
```

#### Admin Status
```typescript
type AdminStatus = 
  | 'pending'       // Awaiting admin review
  | 'confirmed'     // Admin confirmed
  | 'rescheduled'   // Admin requested reschedule
  | 'waitlisted';   // Admin waitlisted
```

#### Execution Status
```typescript
type ExecutionStatus = 
  | 'not_started'   // Onboarding not started
  | 'in_progress'   // Onboarding in progress
  | 'review_required' // Submitted, awaiting admin review
  | 'active'        // Approved, profile unlocked
  | 'paused'        // Temporarily paused
  | 'completed';    // Service completed
```

#### Profile Status
```typescript
type ProfileStatus = 
  | 'pending'       // Profile under review
  | 'approved'      // Profile approved
  | 'rejected'      // Profile rejected
  | 'incomplete';   // Profile incomplete
```

---

### Date/Time Formats

All dates and times use **ISO 8601 format (UTC)**:

```typescript
// Date only
"2024-01-14"

// Date and time
"2024-01-14T10:00:00.000Z"

// Time only (for slots)
"14:00"  // 24-hour format
```

---

### Validation Rules

#### Email
- Format: `user@domain.com`
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

#### Phone
- Length: 10-20 characters
- Format: `+1234567890` or `(123) 456-7890`

#### Password
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character (recommended)

#### Name
- Length: 2-100 characters
- No special characters except spaces, hyphens, apostrophes

#### URL
- Valid URL format
- Must start with `http://` or `https://`

---

## Authentication & Authorization

### JWT Token System

---

### Token Types

#### 1. Access Token (Authentication)

**Purpose:** API authentication for logged-in users

**Generation:**
```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    userId: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

**Payload:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "client",
  "full_name": "John Doe",
  "iat": 1705234567,
  "exp": 1705320967
}
```

**Usage:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expiration:** 24 hours

---

#### 2. Registration Token (One-Time Use)

**Purpose:** Exclusive client registration after payment confirmation

**Generation:**
```javascript
const token = jwt.sign(
  {
    email: client_email,
    name: client_name,
    type: 'registration',
    payment_confirmed: true
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

**Payload:**
```json
{
  "email": "john@example.com",
  "name": "John Doe",
  "type": "registration",
  "payment_confirmed": true,
  "iat": 1705234567,
  "exp": 1705839367
}
```

**Usage:**
```
https://yourfrontend.com/register?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expiration:** 7 days  
**Single Use:** Token marked as "used" after registration

---

### Authentication Middleware

```javascript
// middleware/auth.js

const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../utils/supabase');

// Authenticate any user (client or admin)
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      full_name: decoded.full_name
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Require admin role
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Require client role
function requireClient(req, res, next) {
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Client access required' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireClient
};
```

---

### Authorization Levels

#### Public Access (No Authentication)
- Health check endpoints
- Consultation request submission
- Contact form submission

#### Client Access (Client Token Required)
```javascript
router.get('/api/client/dashboard', 
  authenticateToken, 
  requireClient, 
  async (req, res) => {
    // Client-only endpoint
  }
);
```

**Accessible Endpoints:**
- Client dashboard
- Profile management
- File uploads
- Onboarding submission
- Application viewing (if unlocked)

#### Admin Access (Admin Token Required)
```javascript
router.get('/api/admin/concierge/consultations', 
  authenticateToken, 
  requireAdmin, 
  async (req, res) => {
    // Admin-only endpoint
  }
);
```

**Accessible Endpoints:**
- All consultation management
- Payment confirmation
- Profile unlock/approval
- Contact form management
- All client data viewing
- System statistics

---

### Role-Based Access Control (RBAC)

```typescript
enum UserRole {
  CLIENT = 'client',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

interface Permissions {
  // Client permissions
  canViewOwnDashboard: boolean;
  canUploadFiles: boolean;
  canSubmitOnboarding: boolean;
  canViewApplications: boolean;  // Only if profile_unlocked
  
  // Admin permissions
  canManageConsultations: boolean;
  canConfirmPayments: boolean;
  canUnlockProfiles: boolean;
  canViewAllClients: boolean;
  canManageAdmins: boolean;      // Super admin only
}
```

**Permission Matrix:**

| Action | Client | Admin | Super Admin |
|--------|--------|-------|-------------|
| View own dashboard | ✅ | ✅ | ✅ |
| Submit consultation | ✅ | ✅ | ✅ |
| Upload files | ✅ | ❌ | ❌ |
| View applications | ✅* | ✅ | ✅ |
| Manage consultations | ❌ | ✅ | ✅ |
| Confirm payments | ❌ | ✅ | ✅ |
| Unlock profiles | ❌ | ✅ | ✅ |
| View all clients | ❌ | ✅ | ✅ |
| Manage admins | ❌ | ❌ | ✅ |

*Only if `profile_unlocked = true`

---

### Security Features

#### Password Hashing
```javascript
const bcrypt = require('bcryptjs');

// Hash password during registration
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password during login
const validPassword = await bcrypt.compare(password, user.passcode_hash);
```

#### Token Validation
```javascript
// Verify token signature
jwt.verify(token, process.env.JWT_SECRET);

// Check token expiration
if (decoded.exp < Date.now() / 1000) {
  throw new Error('Token expired');
}

// Validate token type
if (decoded.type !== 'registration') {
  throw new Error('Invalid token type');
}
```

#### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

// Login rate limit (5 attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
});

app.use('/api/auth/login', loginLimiter);
```

#### CORS Configuration
```javascript
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
```

---

### Token Lifecycle

#### Access Token Flow
```
1. User logs in → POST /api/auth/login
2. Server validates credentials
3. Server generates JWT token (24h expiry)
4. Client stores token (localStorage/sessionStorage)
5. Client includes token in all requests
6. Server validates token on each request
7. Token expires after 24 hours
8. User must re-login
```

#### Registration Token Flow
```
1. Admin confirms payment → POST /api/admin/concierge/payment/confirm-and-invite
2. Server generates registration token (7d expiry)
3. Token stored in database with user record
4. Email sent with registration link
5. Client clicks link → Redirected to registration page
6. Client submits password → POST /api/client-registration/register
7. Server validates token (not expired, not used)
8. Server creates user account
9. Token marked as "used" in database
10. Token cannot be reused
```

---

### Error Handling

#### Authentication Errors

**Missing Token:**
```json
{
  "error": "Access token required",
  "code": "AUTH_TOKEN_MISSING",
  "status": 401
}
```

**Invalid Token:**
```json
{
  "error": "Invalid token",
  "code": "AUTH_TOKEN_INVALID",
  "status": 403
}
```

**Expired Token:**
```json
{
  "error": "Token expired",
  "code": "AUTH_TOKEN_EXPIRED",
  "status": 401
}
```

**Insufficient Permissions:**
```json
{
  "error": "Admin access required",
  "code": "AUTH_INSUFFICIENT_PERMISSIONS",
  "status": 403
}
```

---

### Best Practices

#### Client-Side
1. **Store tokens securely** - Use localStorage or sessionStorage
2. **Include token in headers** - `Authorization: Bearer <token>`
3. **Handle token expiration** - Redirect to login on 401 errors
4. **Clear token on logout** - Remove from storage
5. **Never expose tokens** - Don't log or display tokens

#### Server-Side
1. **Use strong JWT secret** - Random, long, complex
2. **Set appropriate expiration** - Balance security and UX
3. **Validate on every request** - Don't trust client
4. **Use HTTPS in production** - Prevent token interception
5. **Implement rate limiting** - Prevent brute force attacks

---

## Registration Token System

### Complete Token Flow Documentation

---

### Overview

The registration token system is the **exclusive gateway** for client onboarding. It ensures:
- ✅ No one can register without payment confirmation
- ✅ Each registration link is unique and one-time use
- ✅ Links expire after 7 days for security
- ✅ Admin has full control over who gets access

---

### Token Generation Process

#### Step 1: Admin Confirms Payment

```javascript
POST /api/admin/concierge/payment/confirm-and-invite

Request:
{
  "client_email": "john@example.com",
  "client_name": "John Doe",
  "payment_amount": "2500",
  "payment_method": "interac_etransfer",
  "payment_reference": "Transfer #12345"
}
```

#### Step 2: Backend Generates Token

```javascript
// routes/adminConcierge.js

const jwt = require('jsonwebtoken');

// Generate unique token
const token = jwt.sign(
  {
    email: client_email,
    name: client_name,
    type: 'registration',
    payment_confirmed: true
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Calculate expiry date
const tokenExpiry = new Date();
tokenExpiry.setDate(tokenExpiry.getDate() + 7);
```

#### Step 3: Store Token in Database

```javascript
// Create or update user record
const { error } = await supabaseAdmin
  .from('registered_users')
  .insert({
    email: client_email,
    full_name: client_name,
    role: 'client',
    passcode_hash: tempPasscodeHash,  // Temporary, will be replaced
    is_active: true,
    payment_confirmed: true,
    payment_confirmed_at: new Date().toISOString(),
    registration_token: token,
    token_expires_at: tokenExpiry.toISOString(),
    token_used: false,
    profile_unlocked: false,
    onboarding_completed: false
  });
```

#### Step 4: Send Email with Registration Link

```javascript
const registrationUrl = buildUrl(`/register?token=${token}`);

await sendEmail(client_email, 'payment_confirmed_welcome_concierge', {
  client_name,
  payment_amount,
  registration_url,
  token_expiry: tokenExpiry.toLocaleDateString()
});
```

**Email Content:**
```
Hello John Doe,

Your payment of $2500 has been confirmed!

Click the link below to create your account:
https://yourfrontend.com/register?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

This link expires on: January 21, 2024

Best regards,
The Apply Bureau Team
```

---

### Token Validation Process

#### Step 1: Client Clicks Registration Link

```
URL: https://yourfrontend.com/register?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Step 2: Frontend Extracts Token

```javascript
// Frontend code
const urlParams = new URLSearchParams(window.location.search);
const registrationToken = urlParams.get('token');

if (!registrationToken) {
  alert('Invalid registration link');
  return;
}
```

#### Step 3: Client Submits Registration Form

```javascript
POST /api/client-registration/register

Request:
{
  "registration_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "SecurePassword123!",
  "confirm_password": "SecurePassword123!"
}
```

#### Step 4: Backend Validates Token

```javascript
// routes/clientRegistration.js

// 1. Verify JWT signature and expiration
let decoded;
try {
  decoded = jwt.verify(registration_token, process.env.JWT_SECRET);
} catch (error) {
  if (error.name === 'TokenExpiredError') {
    return res.status(400).json({ 
      error: 'Registration link has expired',
      code: 'TOKEN_EXPIRED'
    });
  }
  return res.status(400).json({ 
    error: 'Invalid registration token',
    code: 'TOKEN_INVALID'
  });
}

// 2. Verify token type
if (decoded.type !== 'registration') {
  return res.status(400).json({ 
    error: 'Invalid token type',
    code: 'TOKEN_INVALID_TYPE'
  });
}

// 3. Check if token exists in database
const { data: user, error: userError } = await supabaseAdmin
  .from('registered_users')
  .select('*')
  .eq('email', decoded.email)
  .eq('registration_token', registration_token)
  .single();

if (userError || !user) {
  return res.status(404).json({ 
    error: 'Registration token not found',
    code: 'TOKEN_NOT_FOUND'
  });
}

// 4. Check if token already used
if (user.token_used) {
  return res.status(400).json({ 
    error: 'Registration link has already been used',
    code: 'TOKEN_ALREADY_USED'
  });
}

// 5. Check if token expired (database check)
if (new Date(user.token_expires_at) < new Date()) {
  return res.status(400).json({ 
    error: 'Registration link has expired',
    code: 'TOKEN_EXPIRED'
  });
}
```

#### Step 5: Create User Account

```javascript
// Hash password
const bcrypt = require('bcrypt');
const passcodeHash = await bcrypt.hash(password, 10);

// Update user record
const { data: updatedUser, error: updateError } = await supabaseAdmin
  .from('registered_users')
  .update({
    passcode_hash: passcodeHash,
    token_used: true,
    token_used_at: new Date().toISOString(),
    is_active: true
  })
  .eq('id', user.id)
  .select()
  .single();

// Generate auth token for immediate login
const authToken = jwt.sign(
  {
    userId: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    full_name: updatedUser.full_name
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Return auth token
res.json({
  message: 'Registration completed successfully',
  token: authToken,
  user: {
    id: updatedUser.id,
    email: updatedUser.email,
    full_name: updatedUser.full_name,
    role: updatedUser.role
  }
});
```

---

### Token Security Features

#### 1. JWT Signature Verification
```javascript
// Token is signed with secret key
const token = jwt.sign(payload, process.env.JWT_SECRET);

// Signature prevents tampering
jwt.verify(token, process.env.JWT_SECRET);  // Throws error if tampered
```

#### 2. Expiration Enforcement
```javascript
// Token expires after 7 days
{ expiresIn: '7d' }

// Both JWT expiration and database expiration checked
if (decoded.exp < Date.now() / 1000) {
  throw new Error('Token expired');
}

if (new Date(user.token_expires_at) < new Date()) {
  throw new Error('Token expired');
}
```

#### 3. One-Time Use
```javascript
// Token marked as used after registration
token_used: true
token_used_at: NOW()

// Cannot be reused
if (user.token_used) {
  return res.status(400).json({ error: 'Token already used' });
}
```

#### 4. Email Binding
```javascript
// Token tied to specific email
{
  email: "john@example.com",
  type: "registration"
}

// Must match database record
.eq('email', decoded.email)
```

#### 5. Type Validation
```javascript
// Token must be registration type
if (decoded.type !== 'registration') {
  return res.status(400).json({ error: 'Invalid token type' });
}
```

---

### Token States

```typescript
enum TokenState {
  VALID = 'valid',           // Token is valid and unused
  EXPIRED = 'expired',       // Token has expired
  USED = 'used',             // Token has been used
  INVALID = 'invalid',       // Token signature invalid
  NOT_FOUND = 'not_found'    // Token not in database
}
```

#### State Transitions

```
VALID → USED (successful registration)
VALID → EXPIRED (7 days passed)
VALID → INVALID (token tampered)
```

---

### Error Scenarios

#### Scenario 1: Token Expired
```json
{
  "error": "Registration link has expired",
  "code": "TOKEN_EXPIRED",
  "message": "Please contact support for a new registration link"
}
```

**Solution:** Admin must generate new token

---

#### Scenario 2: Token Already Used
```json
{
  "error": "Registration link has already been used",
  "code": "TOKEN_ALREADY_USED",
  "message": "This account has already been created. Please login instead."
}
```

**Solution:** Client should use login page

---

#### Scenario 3: Token Invalid/Tampered
```json
{
  "error": "Invalid registration token",
  "code": "TOKEN_INVALID",
  "message": "The registration link is invalid or has been tampered with"
}
```

**Solution:** Admin must generate new token

---

#### Scenario 4: Token Not Found
```json
{
  "error": "Registration token not found",
  "code": "TOKEN_NOT_FOUND",
  "message": "This registration link does not exist in our system"
}
```

**Solution:** Admin must generate new token

---

### Frontend Implementation Example

```javascript
// React component for registration page

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function RegistrationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const registrationToken = searchParams.get('token');
    if (!registrationToken) {
      setError('Invalid registration link');
      return;
    }
    setToken(registrationToken);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://api.applybureau.com/api/client-registration/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registration_token: token,
          password: password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (data.code === 'TOKEN_EXPIRED') {
          setError('Your registration link has expired. Please contact support for a new link.');
        } else if (data.code === 'TOKEN_ALREADY_USED') {
          setError('This registration link has already been used. Please login instead.');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setError(data.error || 'Registration failed');
        }
        setLoading(false);
        return;
      }

      // Store auth token
      localStorage.setItem('auth_token', data.token);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <h1>Complete Your Registration</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
```

---

### Admin Token Management

#### Generate New Token for Expired Link

```javascript
POST /api/admin/concierge/payment/confirm-and-invite

// Same endpoint, will update existing user record with new token
{
  "client_email": "john@example.com",
  "client_name": "John Doe",
  "payment_amount": "2500",
  "payment_method": "interac_etransfer"
}
```

#### View Token Status

```javascript
GET /api/admin/users/:id/token-status
Authorization: Bearer <admin_token>

Response:
{
  "user_id": "uuid",
  "email": "john@example.com",
  "registration_token_exists": true,
  "token_used": false,
  "token_expires_at": "2024-01-21T10:00:00.000Z",
  "token_expired": false,
  "days_until_expiry": 5
}
```

---

### Database Schema for Tokens

```sql
-- registered_users table
CREATE TABLE registered_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  passcode_hash TEXT NOT NULL,
  role TEXT DEFAULT 'client',
  
  -- Token fields
  registration_token TEXT,
  token_expires_at TIMESTAMPTZ,
  token_used BOOLEAN DEFAULT false,
  token_used_at TIMESTAMPTZ,
  
  -- Payment fields
  payment_confirmed BOOLEAN DEFAULT false,
  payment_confirmed_at TIMESTAMPTZ,
  
  -- Profile fields
  profile_unlocked BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX idx_registration_token ON registered_users(registration_token);
CREATE INDEX idx_token_expires_at ON registered_users(token_expires_at);
```

---

### Token Lifecycle Summary

```
1. Admin confirms payment
   ↓
2. Backend generates JWT token (7-day expiry)
   ↓
3. Token stored in database with user record
   ↓
4. Email sent with registration link
   ↓
5. Client clicks link (within 7 days)
   ↓
6. Frontend extracts token from URL
   ↓
7. Client submits password
   ↓
8. Backend validates token (signature, expiry, usage)
   ↓
9. User account created/updated
   ↓
10. Token marked as "used"
    ↓
11. Auth token returned for immediate login
    ↓
12. Client redirected to dashboard
```

---

## Email Notification System

### Complete Email Documentation

---

### Overview

The email system uses **Resend** as the email service provider with custom HTML templates for every notification type. All emails follow a consistent, simple format with real data (no placeholders).

---

### Email Service Configuration

```javascript
// utils/email.js

const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, templateName, data) {
  try {
    // Load email template
    const templatePath = path.join(__dirname, '../emails/templates', `${templateName}.html`);
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    // Replace variables in template
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, data[key] || '');
    });

    // Send email
    const { data: emailData, error } = await resend.emails.send({
      from: 'Apply Bureau <noreply@applybureau.com>',
      to: [to],
      subject: getEmailSubject(templateName, data),
      html: htmlContent,
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    console.log('Email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

function getEmailSubject(templateName, data) {
  const subjects = {
    'consultation_request_received': 'Consultation Request Received',
    'consultation_confirmed_concierge': 'Consultation Confirmed',
    'payment_confirmed_welcome_concierge': 'Payment Confirmed - Complete Your Registration',
    'profile_unlocked': 'Profile Unlocked - Application Tracker Active',
    'contact_form_received': 'Contact Form Received',
    'interview_update_enhanced': `Interview Scheduled - ${data.company_name}`,
  };
  return subjects[templateName] || 'Apply Bureau Notification';
}

module.exports = { sendEmail };
```

---

### Email Templates

All email templates follow this simple format:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apply Bureau</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <!-- Logo -->
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://yourcdn.com/logo.png" alt="Apply Bureau" style="max-width: 200px;">
  </div>

  <!-- Greeting -->
  <p>Hello {{client_name}},</p>

  <!-- Content -->
  <p>{{main_message}}</p>

  <!-- Details Section -->
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Details:</h3>
    <p><strong>Field:</strong> {{value}}</p>
  </div>

  <!-- Next Steps -->
  <p><strong>What happens next:</strong></p>
  <p>{{next_steps}}</p>

  <!-- Footer -->
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
    <p>Best regards,<br>The Apply Bureau Team</p>
    <p>Questions? Contact us at support@applybureau.com</p>
    <p>© 2026 Apply Bureau. All rights reserved.</p>
  </div>

</body>
</html>
```

---

### Email Types & Triggers

#### 1. Consultation Request Received

**Template:** `consultation_request_received.html`  
**Trigger:** Client submits consultation request  
**Recipient:** Client  

**Data:**
```javascript
{
  client_name: "John Doe",
  role_targets: "Software Engineer, Tech Lead",
  package_interest: "Tier 2",
  country: "United States",
  employment_status: "Currently Employed",
  request_id: "uuid",
  message: "Interested in career services",
  preferred_slots: [...],
  confirmation_message: "Request received. We will confirm your consultation shortly.",
  next_steps: "Our team will review your request and contact you within 24 hours."
}
```

**Email Content:**
```
Hello John Doe,

Thank you for submitting your consultation request. We have received your information and our team will review it shortly.

Request Details:
- Target Roles: Software Engineer, Tech Lead
- Package Interest: Tier 2
- Current Country: United States
- Employment Status: Currently Employed

What happens next:
Our team will review your request within 1-2 business days. You will receive an email with our response. If approved, we will schedule your consultation.

Best regards,
The Apply Bureau Team
```

---

#### 2. Consultation Confirmed

**Template:** `consultation_confirmed_concierge.html`  
**Trigger:** Admin confirms consultation with time slot  
**Recipient:** Client  

**Data:**
```javascript
{
  client_name: "John Doe",
  confirmed_date: "2024-01-19",
  confirmed_time: "14:00",
  meeting_details: "Looking forward to our call!",
  meeting_link: "https://meet.google.com/xxx-yyyy-zzz",
  admin_name: "Admin User",
  next_steps: "Please mark this time in your calendar."
}
```

**Email Content:**
```
Hello John Doe,

Your consultation has been confirmed!

Confirmed Details:
- Date: January 19, 2024
- Time: 2:00 PM
- Meeting Link: https://meet.google.com/xxx-yyyy-zzz

Message from Admin User:
Looking forward to our call!

What happens next:
Please mark this time in your calendar. We look forward to speaking with you!

Best regards,
The Apply Bureau Team
```

---

#### 3. Payment Confirmed & Registration Invite

**Template:** `payment_confirmed_welcome_concierge.html`  
**Trigger:** Admin confirms payment and sends registration invite  
**Recipient:** Client  

**Data:**
```javascript
{
  client_name: "John Doe",
  payment_amount: "2500",
  payment_method: "Interac e-Transfer",
  payment_reference: "Transfer #12345",
  registration_url: "https://yourfrontend.com/register?token=...",
  token_expiry: "January 21, 2024",
  admin_name: "Admin User",
  next_steps: "Click the registration link to create your account."
}
```

**Email Content:**
```
Hello John Doe,

Your payment of $2500 has been confirmed!

Payment Details:
- Amount: $2500
- Method: Interac e-Transfer
- Reference: Transfer #12345

Create Your Account:
Click the link below to complete your registration:
https://yourfrontend.com/register?token=...

This link expires on: January 21, 2024

What happens next:
Click the registration link to create your account and begin your onboarding process.

Best regards,
The Apply Bureau Team
```

---

#### 4. Profile Unlocked

**Template:** `profile_unlocked.html`  
**Trigger:** Admin approves onboarding and unlocks profile  
**Recipient:** Client  

**Data:**
```javascript
{
  client_name: "John Doe",
  admin_name: "Admin User",
  dashboard_url: "https://yourfrontend.com/dashboard",
  next_steps: "Your Application Tracker is now active!"
}
```

**Email Content:**
```
Hello John Doe,

Great news! Your profile has been unlocked by Admin User.

Your Application Tracker is now active! You can view and track your job applications in your dashboard.

Access Your Dashboard:
https://yourfrontend.com/dashboard

What happens next:
You can expect activity to begin within 3 business days. No action is required on your end. Updates will appear in your dashboard.

Best regards,
The Apply Bureau Team
```

---

#### 5. Contact Form Received

**Template:** `contact_form_received.html`  
**Trigger:** Client submits contact form  
**Recipient:** Client  

**Data:**
```javascript
{
  client_name: "Jane Smith",
  subject: "General Inquiry",
  message: "I have a question about your services",
  next_steps: "We will respond to your inquiry within 24 hours."
}
```

**Email Content:**
```
Hello Jane Smith,

Thank you for contacting Apply Bureau. We have received your message.

Your Message:
Subject: General Inquiry
Message: I have a question about your services

What happens next:
We will respond to your inquiry within 24 hours.

Best regards,
The Apply Bureau Team
```

---

#### 6. Interview Update (High Priority)

**Template:** `interview_update_enhanced.html`  
**Trigger:** Application status changes to "interview"  
**Recipient:** Client  

**Data:**
```javascript
{
  client_name: "John Doe",
  company_name: "Tech Corp",
  job_title: "Senior Software Engineer",
  interview_date: "2024-01-25",
  interview_time: "10:00 AM",
  interview_type: "Technical Interview",
  interview_link: "https://zoom.us/j/123456789",
  priority: "high"
}
```

**Email Content:**
```
Hello John Doe,

🎉 INTERVIEW SCHEDULED - ACTION REQUIRED

You have an interview scheduled with Tech Corp!

Interview Details:
- Company: Tech Corp
- Position: Senior Software Engineer
- Date: January 25, 2024
- Time: 10:00 AM
- Type: Technical Interview
- Link: https://zoom.us/j/123456789

What happens next:
Prepare for your interview. Review the job description and company information. Good luck!

Best regards,
The Apply Bureau Team
```

---

### Email Sending Functions

#### Send Single Email
```javascript
const { sendEmail } = require('../utils/email');

await sendEmail('client@example.com', 'consultation_confirmed_concierge', {
  client_name: 'John Doe',
  confirmed_date: '2024-01-19',
  confirmed_time: '14:00',
  meeting_link: 'https://meet.google.com/xxx-yyyy-zzz',
  admin_name: 'Admin User',
  next_steps: 'Please mark this time in your calendar.'
});
```

#### Send Bulk Emails
```javascript
async function sendBulkEmails(recipients, templateName, dataGenerator) {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const data = dataGenerator(recipient);
      await sendEmail(recipient.email, templateName, data);
      results.push({ email: recipient.email, success: true });
    } catch (error) {
      results.push({ email: recipient.email, success: false, error: error.message });
    }
  }
  
  return results;
}
```

---

### Email Template Variables

#### Common Variables (All Templates)
- `{{client_name}}` - Client's full name
- `{{admin_name}}` - Admin's full name (if applicable)
- `{{next_steps}}` - What happens next message

#### Consultation Templates
- `{{role_targets}}` - Target job roles
- `{{package_interest}}` - Package tier
- `{{country}}` - Client's country
- `{{employment_status}}` - Current employment status
- `{{confirmed_date}}` - Confirmed consultation date
- `{{confirmed_time}}` - Confirmed consultation time
- `{{meeting_link}}` - Video meeting link

#### Payment Templates
- `{{payment_amount}}` - Payment amount
- `{{payment_method}}` - Payment method
- `{{payment_reference}}` - Payment reference number
- `{{registration_url}}` - Registration link with token
- `{{token_expiry}}` - Token expiration date

#### Profile Templates
- `{{dashboard_url}}` - Dashboard URL
- `{{application_tracker_url}}` - Application tracker URL

#### Interview Templates
- `{{company_name}}` - Company name
- `{{job_title}}` - Job title
- `{{interview_date}}` - Interview date
- `{{interview_time}}` - Interview time
- `{{interview_type}}` - Interview type
- `{{interview_link}}` - Interview link

---

### Email Delivery Status

#### Success Response
```javascript
{
  id: "email_id",
  from: "Apply Bureau <noreply@applybureau.com>",
  to: ["client@example.com"],
  created_at: "2024-01-14T10:00:00.000Z"
}
```

#### Error Response
```javascript
{
  error: {
    message: "Email delivery failed",
    code: "DELIVERY_FAILED"
  }
}
```

---

### Email Testing

#### Test Email Sending
```javascript
// scripts/test-email-delivery.js

const { sendEmail } = require('../utils/email');

async function testEmailDelivery() {
  try {
    await sendEmail('test@example.com', 'consultation_request_received', {
      client_name: 'Test User',
      role_targets: 'Software Engineer',
      package_interest: 'Tier 2',
      country: 'United States',
      employment_status: 'Currently Employed',
      request_id: 'test-123',
      message: 'Test message',
      preferred_slots: [],
      confirmation_message: 'Test confirmation',
      next_steps: 'Test next steps'
    });
    
    console.log('✅ Email sent successfully');
  } catch (error) {
    console.error('❌ Email failed:', error);
  }
}

testEmailDelivery();
```

---

### Email Best Practices

1. **Always use real data** - No placeholders like "{{name}}"
2. **Keep it simple** - Plain text with minimal styling
3. **Include next steps** - Tell client what to expect
4. **Add contact info** - support@applybureau.com
5. **Test before sending** - Use test email addresses
6. **Handle errors gracefully** - Don't fail entire operation if email fails
7. **Log all emails** - Track delivery status
8. **Use consistent format** - All emails look similar

---

## Database Schema

### Complete Database Structure

---

### Core Tables

#### registered_users
Stores all user accounts (clients and admins)

```sql
CREATE TABLE registered_users (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Authentication
  email TEXT UNIQUE NOT NULL,
  passcode_hash TEXT NOT NULL,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  
  -- Profile Information
  full_name TEXT NOT NULL,
  phone TEXT,
  profile_picture_url TEXT,
  
  -- Registration Token System
  registration_token TEXT,
  token_expires_at TIMESTAMPTZ,
  token_used BOOLEAN DEFAULT false,
  token_used_at TIMESTAMPTZ,
  
  -- Payment Tracking
  payment_confirmed BOOLEAN DEFAULT false,
  payment_confirmed_at TIMESTAMPTZ,
  payment_received BOOLEAN DEFAULT false,
  
  -- Profile Status
  profile_unlocked BOOLEAN DEFAULT false,
  profile_unlocked_by UUID,
  profile_unlocked_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_registered_users_email ON registered_users(email);
CREATE INDEX idx_registered_users_role ON registered_users(role);
CREATE INDEX idx_registration_token ON registered_users(registration_token);
```

---

#### consultation_requests
Stores consultation requests from potential clients

```sql
CREATE TABLE consultation_requests (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Client Information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  
  -- Time Slots (JSONB array)
  preferred_slots JSONB DEFAULT '[]'::jsonb,
  
  -- Status Tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  admin_status TEXT DEFAULT 'pending' CHECK (admin_status IN ('pending', 'confirmed', 'rescheduled', 'waitlisted')),
  
  -- Confirmation Details
  confirmed_time TIMESTAMPTZ,
  meeting_link TEXT,
  
  -- Admin Actions
  admin_notes TEXT,
  reschedule_reason TEXT,
  waitlist_reason TEXT,
  admin_action_at TIMESTAMPTZ,
  
  -- Linked User
  user_id UUID REFERENCES registered_users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_consultation_requests_email ON consultation_requests(email);
CREATE INDEX idx_consultation_requests_status ON consultation_requests(status);
CREATE INDEX idx_consultation_requests_admin_status ON consultation_requests(admin_status);
CREATE INDEX idx_consultation_requests_user_id ON consultation_requests(user_id);
```

---

#### client_onboarding_20q
Stores 20-question onboarding responses

```sql
CREATE TABLE client_onboarding_20q (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User Reference
  user_id UUID REFERENCES registered_users(id) UNIQUE NOT NULL,
  
  -- Career Information
  current_salary TEXT,
  target_salary TEXT,
  target_roles TEXT,
  years_of_experience INTEGER,
  education_level TEXT,
  
  -- Online Presence
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  
  -- Location & Mobility
  current_location TEXT,
  willing_to_relocate BOOLEAN DEFAULT false,
  preferred_locations JSONB DEFAULT '[]'::jsonb,
  work_authorization TEXT,
  
  -- Availability
  notice_period TEXT,
  availability_start DATE,
  
  -- Skills & Qualifications
  key_skills JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '[]'::jsonb,
  
  -- Preferences
  preferred_company_size TEXT,
  preferred_industries JSONB DEFAULT '[]'::jsonb,
  additional_notes TEXT,
  
  -- Status Tracking
  execution_status TEXT DEFAULT 'not_started' CHECK (execution_status IN ('not_started', 'in_progress', 'review_required', 'active', 'paused', 'completed')),
  
  -- Approval Tracking
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  -- Confirmation Email Tracking
  confirmation_email_sent BOOLEAN DEFAULT false,
  confirmation_email_sent_by UUID,
  confirmation_email_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_client_onboarding_user_id ON client_onboarding_20q(user_id);
CREATE INDEX idx_client_onboarding_status ON client_onboarding_20q(execution_status);
```

---

#### applications
Stores job application tracking data

```sql
CREATE TABLE applications (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Client Reference
  client_id UUID REFERENCES registered_users(id) NOT NULL,
  
  -- Job Information
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_url TEXT,
  job_description TEXT,
  
  -- Application Status
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'in_review', 'interview_requested', 'interview_completed', 'offer', 'rejected', 'withdrawn')),
  
  -- Dates
  applied_date DATE,
  interview_date TIMESTAMPTZ,
  offer_date DATE,
  
  -- Interview Details
  interview_type TEXT,
  interview_link TEXT,
  
  -- Notes
  notes TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_applications_client_id ON applications(client_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_date ON applications(applied_date);
```

---

#### contact_submissions
Stores public contact form submissions

```sql
CREATE TABLE contact_submissions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Contact Information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  country TEXT,
  position TEXT,
  
  -- Message
  subject TEXT,
  message TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at);
```

---

#### notifications
Stores system notifications for users

```sql
CREATE TABLE notifications (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User Reference
  user_id UUID REFERENCES registered_users(id) NOT NULL,
  
  -- Notification Content
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

---

### Storage Buckets

#### documents
Stores user-uploaded documents (resumes, portfolios, etc.)

```sql
-- Bucket Configuration
{
  "name": "documents",
  "public": false,
  "file_size_limit": 10485760,  -- 10MB
  "allowed_mime_types": [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
  ]
}

-- RLS Policies
-- Users can upload their own documents
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all documents
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM registered_users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

---

#### profile-images
Stores user profile pictures

```sql
-- Bucket Configuration
{
  "name": "profile-images",
  "public": true,
  "file_size_limit": 5242880,  -- 5MB
  "allowed_mime_types": [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp"
  ]
}

-- RLS Policies
-- Users can upload their own profile image
CREATE POLICY "Users can upload own profile image"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can view profile images (public bucket)
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');
```

---

### Row Level Security (RLS)

#### registered_users Policies

```sql
-- Enable RLS
ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON registered_users FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON registered_users FOR UPDATE
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON registered_users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM registered_users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON registered_users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM registered_users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

---

#### consultation_requests Policies

```sql
-- Enable RLS
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert consultation requests (public endpoint)
CREATE POLICY "Anyone can insert consultation requests"
ON consultation_requests FOR INSERT
WITH CHECK (true);

-- Users can view their own consultation requests
CREATE POLICY "Users can view own consultation requests"
ON consultation_requests FOR SELECT
USING (
  email = (SELECT email FROM registered_users WHERE id = auth.uid())
);

-- Admins can view all consultation requests
CREATE POLICY "Admins can view all consultation requests"
ON consultation_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM registered_users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Admins can update all consultation requests
CREATE POLICY "Admins can update all consultation requests"
ON consultation_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM registered_users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

---

#### client_onboarding_20q Policies

```sql
-- Enable RLS
ALTER TABLE client_onboarding_20q ENABLE ROW LEVEL SECURITY;

-- Users can view their own onboarding
CREATE POLICY "Users can view own onboarding"
ON client_onboarding_20q FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own onboarding
CREATE POLICY "Users can insert own onboarding"
ON client_onboarding_20q FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own onboarding
CREATE POLICY "Users can update own onboarding"
ON client_onboarding_20q FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all onboarding
CREATE POLICY "Admins can view all onboarding"
ON client_onboarding_20q FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM registered_users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Admins can update all onboarding
CREATE POLICY "Admins can update all onboarding"
ON client_onboarding_20q FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM registered_users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

---

### Database Functions

#### Update Updated_At Timestamp

```sql
-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_registered_users_updated_at
BEFORE UPDATE ON registered_users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_requests_updated_at
BEFORE UPDATE ON consultation_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_onboarding_20q_updated_at
BEFORE UPDATE ON client_onboarding_20q
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_submissions_updated_at
BEFORE UPDATE ON contact_submissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### Database Relationships

```
registered_users (1) ──────── (many) consultation_requests
       │
       │ (1) ──────── (1) client_onboarding_20q
       │
       │ (1) ──────── (many) applications
       │
       └─ (1) ──────── (many) notifications
```

---

### Database Backup & Maintenance

#### Backup Strategy
```bash
# Daily automated backups (Supabase handles this)
# Manual backup command
pg_dump -h db.uhivvmpljffhbodrklip.supabase.co -U postgres -d postgres > backup.sql
```

#### Maintenance Tasks
```sql
-- Vacuum tables (run weekly)
VACUUM ANALYZE registered_users;
VACUUM ANALYZE consultation_requests;
VACUUM ANALYZE client_onboarding_20q;
VACUUM ANALYZE applications;

-- Reindex tables (run monthly)
REINDEX TABLE registered_users;
REINDEX TABLE consultation_requests;
REINDEX TABLE client_onboarding_20q;
REINDEX TABLE applications;
```

---

## Environment Variables

### Complete Environment Configuration

---

### Required Variables

```env
# ============================================
# SUPABASE CONFIGURATION
# ============================================
SUPABASE_URL=https://uhivvmpljffhbodrklip.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here

# ============================================
# EMAIL SERVICE (RESEND)
# ============================================
RESEND_API_KEY=re_your_resend_api_key_here

# ============================================
# SECURITY
# ============================================
JWT_SECRET=your_very_strong_random_secret_key_here_min_32_chars

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3000
NODE_ENV=development

# ============================================
# FRONTEND CONFIGURATION
# ============================================
FRONTEND_URL=http://localhost:5173

# ============================================
# OPTIONAL: LOGGING
# ============================================
LOG_LEVEL=info
```

---

### Variable Descriptions

#### SUPABASE_URL
- **Purpose:** Supabase project URL
- **Format:** `https://[project-id].supabase.co`
- **Where to find:** Supabase Dashboard → Settings → API
- **Example:** `https://uhivvmpljffhbodrklip.supabase.co`

#### SUPABASE_ANON_KEY
- **Purpose:** Public API key for client-side requests
- **Format:** Long JWT token starting with `eyJ`
- **Where to find:** Supabase Dashboard → Settings → API → anon public
- **Security:** Safe to expose in frontend

#### SUPABASE_SERVICE_KEY
- **Purpose:** Admin API key for server-side operations
- **Format:** Long JWT token starting with `eyJ`
- **Where to find:** Supabase Dashboard → Settings → API → service_role secret
- **Security:** ⚠️ NEVER expose in frontend or commit to git

#### RESEND_API_KEY
- **Purpose:** API key for Resend email service
- **Format:** `re_[random_string]`
- **Where to find:** Resend Dashboard → API Keys
- **Example:** `re_123abc456def789ghi`

#### JWT_SECRET
- **Purpose:** Secret key for signing JWT tokens
- **Format:** Random string, minimum 32 characters
- **Generation:** `openssl rand -base64 32`
- **Example:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`
- **Security:** ⚠️ NEVER expose or commit to git

#### PORT
- **Purpose:** Server port number
- **Default:** `3000`
- **Production:** Usually set by hosting platform

#### NODE_ENV
- **Purpose:** Environment mode
- **Values:** `development`, `production`, `test`
- **Default:** `development`

#### FRONTEND_URL
- **Purpose:** Frontend application URL for CORS and email links
- **Development:** `http://localhost:5173` (Vite default)
- **Production:** `https://yourfrontend.com`

#### LOG_LEVEL
- **Purpose:** Logging verbosity
- **Values:** `error`, `warn`, `info`, `debug`
- **Default:** `info`

---

### Environment Files

#### .env (Development)
```env
# Development environment
SUPABASE_URL=https://uhivvmpljffhbodrklip.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_dev_key_here
JWT_SECRET=dev_secret_key_min_32_chars
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=debug
```

#### .env.production (Production)
```env
# Production environment
SUPABASE_URL=https://your-production-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_prod_key_here
JWT_SECRET=production_secret_key_very_strong_and_random
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://yourfrontend.com
LOG_LEVEL=info
```

#### .env.example (Template)
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key_here

# Security
JWT_SECRET=your_jwt_secret_here_min_32_chars

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Optional: Logging
LOG_LEVEL=info
```

---

### Security Best Practices

#### 1. Never Commit Secrets
```bash
# Add to .gitignore
.env
.env.local
.env.production
.env.*.local
```

#### 2. Use Strong JWT Secret
```bash
# Generate strong secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### 3. Rotate Keys Regularly
- Change JWT_SECRET every 90 days
- Rotate API keys every 6 months
- Update immediately if compromised

#### 4. Use Environment-Specific Keys
- Different keys for dev/staging/production
- Never use production keys in development

#### 5. Validate Environment Variables
```javascript
// server.js
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'RESEND_API_KEY',
  'JWT_SECRET',
  'FRONTEND_URL'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

console.log('✅ All required environment variables are set');
```

---

### Platform-Specific Configuration

#### Vercel
```bash
# Set via Vercel Dashboard or CLI
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add RESEND_API_KEY
vercel env add JWT_SECRET
vercel env add FRONTEND_URL
```

#### Render
```bash
# Set via Render Dashboard
# Environment → Add Environment Variable
```

#### Railway
```bash
# Set via Railway Dashboard
# Variables → Add Variable
```

#### Docker
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - RESEND_API_KEY=${RESEND_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
      - NODE_ENV=production
    env_file:
      - .env.production
```

---

### Troubleshooting

#### Issue: "Missing environment variable"
**Solution:** Check .env file exists and contains all required variables

#### Issue: "Invalid Supabase credentials"
**Solution:** Verify SUPABASE_URL and SUPABASE_SERVICE_KEY are correct

#### Issue: "Email not sending"
**Solution:** Verify RESEND_API_KEY is valid and active

#### Issue: "Token invalid"
**Solution:** Ensure JWT_SECRET is set and consistent across restarts

#### Issue: "CORS error"
**Solution:** Verify FRONTEND_URL matches your frontend domain

---

## Deployment Guide

### Complete Deployment Documentation

---

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database schema applied in Supabase
- [ ] Admin user created
- [ ] Email templates tested
- [ ] All tests passing
- [ ] CORS configured for production domain
- [ ] JWT_SECRET is strong and secure
- [ ] NODE_ENV set to "production"
- [ ] Error logging configured
- [ ] Rate limiting enabled

---

### Deployment to Vercel

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Configure vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/health",
      "dest": "server.js"
    },
    {
      "src": "/api/(.*)",
      "dest": "server.js"
    },
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### Step 4: Set Environment Variables
```bash
# Via Vercel CLI
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_KEY production
vercel env add RESEND_API_KEY production
vercel env add JWT_SECRET production
vercel env add FRONTEND_URL production

# Or via Vercel Dashboard
# Project Settings → Environment Variables
```

#### Step 5: Deploy
```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploy)
git push origin main
```

#### Step 6: Verify Deployment
```bash
# Test health endpoint
curl https://your-backend.vercel.app/health

# Expected response
{
  "status": "healthy",
  "service": "Apply Bureau Backend",
  "database": "connected",
  "email": "operational"
}
```

---

### Deployment to Render

#### Step 1: Create New Web Service
1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository

#### Step 2: Configure Service
```yaml
# Build Command
npm install

# Start Command
npm start

# Environment
Node

# Plan
Starter (or higher)
```

#### Step 3: Set Environment Variables
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
RESEND_API_KEY=your_resend_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://yourfrontend.com
NODE_ENV=production
PORT=3000
```

#### Step 4: Deploy
- Click "Create Web Service"
- Render will automatically build and deploy

#### Step 5: Custom Domain (Optional)
1. Go to Settings → Custom Domain
2. Add your domain
3. Update DNS records

---

### Deployment to Railway

#### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

#### Step 2: Login
```bash
railway login
```

#### Step 3: Initialize Project
```bash
railway init
```

#### Step 4: Set Environment Variables
```bash
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_SERVICE_KEY=your_service_key
railway variables set RESEND_API_KEY=your_resend_key
railway variables set JWT_SECRET=your_jwt_secret
railway variables set FRONTEND_URL=https://yourfrontend.com
railway variables set NODE_ENV=production
```

#### Step 5: Deploy
```bash
railway up
```

---

### Deployment to DigitalOcean App Platform

#### Step 1: Create App
1. Go to DigitalOcean Dashboard
2. Click "Create" → "Apps"
3. Connect GitHub repository

#### Step 2: Configure App
```yaml
name: apply-bureau-backend
region: nyc
services:
  - name: backend
    github:
      repo: your-username/apply-bureau-backend
      branch: main
    build_command: npm install
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 3000
    envs:
      - key: NODE_ENV
        value: production
      - key: SUPABASE_URL
        value: ${SUPABASE_URL}
      - key: SUPABASE_SERVICE_KEY
        value: ${SUPABASE_SERVICE_KEY}
      - key: RESEND_API_KEY
        value: ${RESEND_API_KEY}
      - key: JWT_SECRET
        value: ${JWT_SECRET}
      - key: FRONTEND_URL
        value: ${FRONTEND_URL}
```

#### Step 3: Deploy
- Click "Create Resources"
- App Platform will build and deploy

---

### Deployment to AWS (EC2)

#### Step 1: Launch EC2 Instance
```bash
# Ubuntu 22.04 LTS
# t2.micro or larger
# Security Group: Allow HTTP (80), HTTPS (443), SSH (22)
```

#### Step 2: Connect to Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

#### Step 3: Install Node.js
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Step 4: Clone Repository
```bash
git clone https://github.com/your-username/apply-bureau-backend.git
cd apply-bureau-backend
```

#### Step 5: Install Dependencies
```bash
npm install
```

#### Step 6: Configure Environment
```bash
# Create .env file
nano .env

# Add environment variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
RESEND_API_KEY=your_resend_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://yourfrontend.com
NODE_ENV=production
PORT=3000
```

#### Step 7: Install PM2
```bash
# Install PM2 for process management
sudo npm install -g pm2

# Start application
pm2 start server.js --name apply-bureau-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### Step 8: Configure Nginx (Optional)
```bash
# Install Nginx
sudo apt-get install -y nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/apply-bureau-backend

# Add configuration
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/apply-bureau-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 9: Setup SSL (Let's Encrypt)
```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

### Post-Deployment Tasks

#### 1. Verify Health Endpoint
```bash
curl https://your-backend-url.com/health
```

#### 2. Test API Endpoints
```bash
# Test public consultation endpoint
curl -X POST https://your-backend-url.com/api/public-consultations \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "message": "Test message",
    "preferred_slots": []
  }'
```

#### 3. Create Admin User
```bash
# SSH into server or use Vercel CLI
npm run create-first-admin
```

#### 4. Monitor Logs
```bash
# Vercel
vercel logs

# Render
# View logs in dashboard

# Railway
railway logs

# PM2 (EC2)
pm2 logs apply-bureau-backend
```

#### 5. Setup Monitoring
```bash
# Install monitoring tools
npm install --save @sentry/node

# Configure Sentry (optional)
# Add to server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'your-sentry-dsn' });
```

---

### Continuous Deployment

#### GitHub Actions (Vercel)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### GitHub Actions (General)
```yaml
# .github/workflows/test-and-deploy.yml
name: Test and Deploy

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          # Your deployment script here
```

---

### Rollback Strategy

#### Vercel
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

#### Render
- Go to Dashboard → Deployments
- Click "Rollback" on previous deployment

#### Railway
```bash
# Redeploy previous commit
railway up --commit [commit-hash]
```

#### PM2 (EC2)
```bash
# Pull previous version
git checkout [previous-commit]
npm install
pm2 restart apply-bureau-backend
```

---

### Backup Strategy

#### Database Backup
```bash
# Automated daily backups (Supabase handles this)
# Manual backup
pg_dump -h db.uhivvmpljffhbodrklip.supabase.co -U postgres -d postgres > backup.sql
```

#### Code Backup
```bash
# Git repository (GitHub)
git push origin main

# Create release tags
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

---

### Monitoring & Alerts

#### Health Check Monitoring
```bash
# Use UptimeRobot or similar
# Monitor: https://your-backend-url.com/health
# Alert if down for > 5 minutes
```

#### Error Tracking
```javascript
// Install Sentry
npm install @sentry/node

// Configure in server.js
const Sentry = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

#### Performance Monitoring
```javascript
// Use built-in monitoring
const { SystemMonitor } = require('./utils/monitoring');

// Check system health
app.get('/system-info', (req, res) => {
  const systemInfo = SystemMonitor.getSystemInfo();
  res.json(systemInfo);
});
```

---

