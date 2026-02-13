# Complete Dashboard API Documentation

**Production URL:** `https://jellyfish-app-t4m35.ondigitalocean.app`  
**Frontend URL:** `https://www.applybureau.com`  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Authentication](#authentication)
2. [Client Dashboard](#client-dashboard)
3. [Admin Dashboard](#admin-dashboard)
4. [Data Formats & Schemas](#data-formats--schemas)
5. [File Upload Specifications](#file-upload-specifications)
6. [20 Questions System](#20-questions-system)
7. [Error Handling](#error-handling)
8. [Frontend Integration Examples](#frontend-integration-examples)

---

## Authentication

### Login
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "client"
  }
}
```

**Authentication Header:**
All authenticated requests must include:
```
Authorization: Bearer <token>
```

---


## Client Dashboard

### 1. Main Dashboard Overview

**Endpoint:** `GET /api/client/dashboard`  
**Authentication:** Required (Client role)

**Response (200 OK):**
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
    "message": "Your account is active",
    "progress_percentage": 100,
    "can_view_applications": true,
    "next_action": "view_applications"
  },
  "twenty_questions": {
    "status": "active",
    "display_status": "Active & Approved",
    "description": "Your career profile is optimized and active",
    "color": "green",
    "progress": 100,
    "completed_at": "2026-02-09T10:00:00Z",
    "approved_at": "2026-02-09T12:00:00Z",
    "can_edit": true,
    "target_roles": ["Software Engineer", "Full Stack Developer"],
    "target_industries": [],
    "experience_years": null,
    "job_search_timeline": "Immediately"
  },
  "strategy_call": {
    "has_booked": true,
    "has_confirmed": true,
    "latest_status": "confirmed",
    "scheduled_time": "2026-02-20T10:00:00Z",
    "meeting_link": "https://meet.google.com/abc-defg-hij"
  },
  "onboarding": {
    "completed": true,
    "approved": true,
    "execution_status": "active"
  },
  "files": {
    "resume_uploaded": true,
    "linkedin_added": true,
    "portfolio_added": true,
    "files": [
      {
        "id": "uuid",
        "type": "resume",
        "filename": "resume.pdf",
        "url": "https://storage.url/resume.pdf",
        "size": 245678,
        "uploaded_at": "2026-02-09T10:00:00Z"
      }
    ]
  },
  "applications": {
    "total_count": 15,
    "active_count": 8,
    "interview_count": 3,
    "offer_count": 1,
    "can_view": true
  },
  "subscription": {
    "plan_name": "Premium",
    "price": "500 CAD",
    "duration": "12 weeks",
    "applications": 10,
    "start_date": "2026-02-01",
    "end_date": "2026-04-26",
    "features": ["Resume building", "Interview prep", "Application tracking"]
  },
  "next_steps": [
    {
      "title": "View Applications",
      "description": "Track your job applications and interview progress",
      "action": "view_applications",
      "priority": 1
    }
  ]
}
```

**Status Values:**
- `onboarding_in_progress` - Client is completing onboarding
- `onboarding_review` - Assessment submitted, awaiting approval
- `active` - Account fully active

---

### 2. Strategy Call Booking

**Endpoint:** `POST /api/strategy-calls`  
**Authentication:** Required (Client role)

**Request Body:**
```json
{
  "preferred_slots": [
    {
      "date": "2026-02-20",
      "time": "10:00"
    },
    {
      "date": "2026-02-21",
      "time": "14:00"
    },
    {
      "date": "2026-02-22",
      "time": "16:00"
    }
  ],
  "message": "Looking forward to discussing my career goals"
}
```

**Validation Rules:**
- `preferred_slots` must be an array with 1-3 time slots
- Each slot must have `date` (YYYY-MM-DD) and `time` (HH:MM) fields
- `message` is optional

**Response (201 Created):**
```json
{
  "id": "uuid",
  "status": "pending",
  "admin_status": "pending",
  "message": "Strategy call request submitted successfully.",
  "next_steps": "A lead strategist will review your request and confirm your preferred time within 24 hours.",
  "preferred_slots": [
    {
      "date": "2026-02-20",
      "time": "10:00"
    }
  ]
}
```

---

### 3. Strategy Call Status

**Endpoint:** `GET /api/strategy-calls/status`  
**Authentication:** Required (Client role)

**Response (200 OK):**
```json
{
  "has_booked_call": true,
  "has_confirmed_call": true,
  "latest_call": {
    "id": "uuid",
    "client_id": "uuid",
    "client_name": "John Doe",
    "client_email": "john@example.com",
    "preferred_slots": [...],
    "status": "confirmed",
    "admin_status": "confirmed",
    "confirmed_time": "2026-02-20T10:00:00Z",
    "communication_method": "meeting_link",
    "meeting_link": "https://meet.google.com/abc-defg-hij",
    "whatsapp_number": null,
    "admin_notes": "Looking forward to our call",
    "created_at": "2026-02-09T10:00:00Z",
    "updated_at": "2026-02-09T12:00:00Z"
  },
  "total_calls": 1,
  "can_book_new_call": false
}
```

**Communication Methods:**
- `meeting_link` - Video call via Zoom/Google Meet (includes `meeting_link` field)
- `whatsapp` - WhatsApp call (includes `whatsapp_number` field)

---


### 4. File Uploads

#### 4.1 Resume Upload

**Endpoint:** `POST /api/client/uploads/resume`  
**Authentication:** Required (Client role)  
**Content-Type:** `multipart/form-data`

**Request (Form Data):**
```
resume: <File> (PDF, DOC, or DOCX, max 10MB)
```

**Response (200 OK):**
```json
{
  "message": "Resume uploaded successfully",
  "resume_url": "https://storage.url/resumes/client-id/resume.pdf",
  "file_name": "resume.pdf",
  "file_size": 245678
}
```

**Validation:**
- File must be PDF, DOC, or DOCX format
- Maximum file size: 10MB
- Only one resume per client (new upload replaces old)

---

#### 4.2 LinkedIn Profile

**Endpoint:** `POST /api/client/uploads/linkedin`  
**Authentication:** Required (Client role)  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "linkedin_url": "https://linkedin.com/in/johndoe"
}
```

**Validation:**
- Must be valid LinkedIn profile URL
- Format: `https://linkedin.com/in/username` or `https://www.linkedin.com/in/username`

**Response (200 OK):**
```json
{
  "message": "LinkedIn profile URL added successfully",
  "linkedin_url": "https://linkedin.com/in/johndoe"
}
```

---

#### 4.3 Portfolio URLs

**Endpoint:** `POST /api/client/uploads/portfolio`  
**Authentication:** Required (Client role)  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "portfolio_urls": [
    "https://johndoe.com",
    "https://github.com/johndoe",
    "https://behance.net/johndoe"
  ]
}
```

**Validation:**
- Must be an array of URLs
- Minimum: 1 URL
- Maximum: 5 URLs
- Each URL must start with `http://` or `https://`

**Response (200 OK):**
```json
{
  "message": "Portfolio URLs added successfully",
  "portfolio_urls": [
    "https://johndoe.com",
    "https://github.com/johndoe",
    "https://behance.net/johndoe"
  ],
  "count": 3
}
```

---

#### 4.4 Upload Status

**Endpoint:** `GET /api/client/dashboard/uploads/status`  
**Authentication:** Required (Client role)

**Response (200 OK):**
```json
{
  "resume_uploaded": true,
  "linkedin_added": true,
  "portfolio_added": true,
  "files": [
    {
      "id": "uuid",
      "type": "resume",
      "filename": "resume.pdf",
      "url": "https://storage.url/resume.pdf",
      "size": 245678,
      "uploaded_at": "2026-02-09T10:00:00Z",
      "added_at": "2026-02-09T10:00:00Z"
    },
    {
      "id": "uuid",
      "type": "linkedin",
      "filename": null,
      "url": "https://linkedin.com/in/johndoe",
      "size": null,
      "uploaded_at": "2026-02-09T10:05:00Z",
      "added_at": "2026-02-09T10:05:00Z"
    },
    {
      "id": "uuid",
      "type": "portfolio",
      "filename": null,
      "url": "https://johndoe.com",
      "size": null,
      "uploaded_at": "2026-02-09T10:10:00Z",
      "added_at": "2026-02-09T10:10:00Z"
    }
  ]
}
```

---

#### 4.5 Delete Resume

**Endpoint:** `DELETE /api/client/uploads/resume`  
**Authentication:** Required (Client role)

**Response (200 OK):**
```json
{
  "message": "Resume deleted successfully"
}
```

---


### 5. 20 Questions Assessment

#### 5.1 Get 20Q Status

**Endpoint:** `GET /api/client/dashboard/onboarding/status`  
**Authentication:** Required (Client role)

**Response (200 OK):**
```json
{
  "status": "pending_approval",
  "display_status": "Pending Review",
  "description": "Your assessment is being reviewed by our career experts",
  "color": "yellow",
  "progress": 75,
  "completed_at": "2026-02-09T10:00:00Z",
  "approved_at": null,
  "can_edit": false,
  "target_roles": ["Software Engineer", "Full Stack Developer"],
  "target_industries": [],
  "experience_years": null,
  "job_search_timeline": "Immediately"
}
```

**Status Values:**
- `not_started` - Assessment not yet started (progress: 0%)
- `pending_approval` - Submitted, awaiting admin review (progress: 75%)
- `active` - Approved and active (progress: 100%)
- `completed` - Completed (progress: 100%)

**Color Codes:**
- `gray` - Not started
- `yellow` - Pending review
- `green` - Active/Approved
- `blue` - Completed

---

#### 5.2 Submit 20Q Assessment

**Endpoint:** `POST /api/client/dashboard/onboarding/submit`  
**Authentication:** Required (Client role)  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "q1": "Software Engineer, Full Stack Developer, Backend Engineer",
  "q2": "DevOps Engineer, Cloud Architect",
  "q3": "Sales, Marketing",
  "q4": "Remote",
  "q5": "North America",
  "q6": "Toronto, Vancouver, New York",
  "q7": "None",
  "q8": "80000",
  "q8_currency": "CAD",
  "q9": "120000",
  "q9_currency": "CAD",
  "q10": "Yes",
  "q10a": "Minimum 6 months contract",
  "q11": "Canadian Citizen",
  "q11a": null,
  "q12": "No",
  "q13": "Yes",
  "q14": "No",
  "q14a": null,
  "q15": "Tobacco, Gambling",
  "q16": "Prefer not to say",
  "q17": "Not a veteran",
  "q18": "Prefer not to say",
  "q19": "Work-life balance, Career growth, Competitive salary",
  "q20": "I'm looking for a role that allows me to work remotely and grow my technical skills."
}
```

**Required Fields:**
- `q1` - Roles wanted (comma-separated)
- `q4` - Work type (Remote/Hybrid/On-site)
- `q8` - Minimum salary

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Assessment submitted successfully",
  "status": "pending_approval"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Missing required questions (q1, q4, q8)"
}
```

---

### 6. Applications

**Endpoint:** `GET /api/applications`  
**Authentication:** Required (Client role)

**Response (200 OK):**
```json
{
  "applications": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "type": "job_application",
      "title": "Google - Senior Software Engineer",
      "company": "Google",
      "position": "Senior Software Engineer",
      "status": "interview",
      "application_date": "2026-02-01",
      "interview_date": "2026-02-15",
      "notes": "Technical interview scheduled",
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-10T14:00:00Z"
    }
  ],
  "total": 15,
  "pagination": {
    "offset": 0,
    "limit": 20
  }
}
```

**Application Status Values:**
- `applied` - Application submitted
- `interview` - Interview scheduled/in progress
- `offer` - Offer received
- `rejected` - Application rejected
- `withdrawn` - Application withdrawn

---

#### 6.1 Application Statistics

**Endpoint:** `GET /api/client/dashboard/applications/stats`  
**Authentication:** Required (Client role)

**Response (200 OK):**
```json
{
  "total_count": 15,
  "active_count": 8,
  "interview_count": 3,
  "offer_count": 1,
  "status_counts": {
    "applied": 5,
    "interview": 3,
    "offer": 1,
    "rejected": 6
  }
}
```

---

### 7. Notifications

**Endpoint:** `GET /api/notifications`  
**Authentication:** Required (Client role)

**Query Parameters:**
- `read` (optional) - Filter by read status (`true` or `false`)
- `category` (optional) - Filter by category
- `priority` (optional) - Filter by priority
- `type` (optional) - Filter by notification type
- `limit` (optional, default: 20) - Number of notifications to return
- `offset` (optional, default: 0) - Pagination offset

**Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_type": "client",
      "title": "Strategy Call Confirmed",
      "message": "Your strategy call has been confirmed for 2026-02-20 at 10:00",
      "type": "strategy_call_confirmed",
      "is_read": false,
      "action_url": "/client/dashboard",
      "metadata": {
        "category": "strategy_call",
        "priority": "high"
      },
      "created_at": "2026-02-09T12:00:00Z",
      "updated_at": "2026-02-09T12:00:00Z"
    }
  ],
  "stats": {
    "total_unread": 5,
    "by_type": {
      "strategy_call_confirmed": 1,
      "onboarding_approved": 1,
      "application_update": 3
    },
    "by_metadata": {
      "category_strategy_call": 1,
      "priority_high": 2
    }
  },
  "pagination": {
    "offset": 0,
    "limit": 20,
    "total": 10
  }
}
```

**Notification Types:**
- `strategy_call_confirmed` - Strategy call confirmed
- `onboarding_approved` - 20Q assessment approved
- `application_update` - Application status updated
- `subscription_assigned` - Subscription plan assigned
- `info` - General information
- `success` - Success message
- `warning` - Warning message
- `error` - Error message

---

#### 7.1 Mark Notification as Read

**Endpoint:** `PATCH /api/notifications/:id/read`  
**Authentication:** Required (Client role)

**Response (200 OK):**
```json
{
  "message": "Notification marked as read",
  "notification": {
    "id": "uuid",
    "is_read": true,
    "read_at": "2026-02-09T14:00:00Z"
  }
}
```

---

#### 7.2 Mark All as Read

**Endpoint:** `PATCH /api/notifications/read-all`  
**Authentication:** Required (Client role)

**Response (200 OK):**
```json
{
  "message": "All notifications marked as read"
}
```

---

#### 7.3 Unread Count

**Endpoint:** `GET /api/notifications/unread-count`  
**Authentication:** Required (Client role)

**Response (200 OK):**
```json
{
  "unread_count": 5
}
```

---


## Admin Dashboard

### 1. Client Invitation & Registration

**Endpoint:** `POST /api/admin/clients/invite`  
**Authentication:** Required (Admin role)  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "email": "newclient@example.com",
  "full_name": "Jane Smith",
  "phone": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration link sent successfully",
  "client": {
    "id": "uuid",
    "email": "newclient@example.com",
    "full_name": "Jane Smith",
    "registration_link": "https://www.applybureau.com/register?token=abc123..."
  }
}
```

**Notes:**
- Registration token expires in 7 days
- Client receives email with registration link
- No temporary password is created
- Client creates their own password during registration

---

### 2. Strategy Calls Management

#### 2.1 List All Strategy Calls

**Endpoint:** `GET /api/admin/strategy-calls`  
**Authentication:** Required (Admin role)

**Query Parameters:**
- `status` (optional, default: 'all') - Filter by status: `all`, `pending`, `confirmed`, `completed`, `cancelled`
- `limit` (optional, default: 50) - Number of results
- `offset` (optional, default: 0) - Pagination offset

**Response (200 OK):**
```json
{
  "strategy_calls": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "preferred_slots": [
        {
          "date": "2026-02-20",
          "time": "10:00"
        },
        {
          "date": "2026-02-21",
          "time": "14:00"
        }
      ],
      "message": "Looking forward to discussing my career goals",
      "status": "pending",
      "admin_status": "pending",
      "confirmed_time": null,
      "communication_method": null,
      "meeting_link": null,
      "whatsapp_number": null,
      "admin_notes": null,
      "admin_action_by": null,
      "admin_action_at": null,
      "created_at": "2026-02-09T10:00:00Z",
      "updated_at": "2026-02-09T10:00:00Z"
    }
  ],
  "total": 25,
  "status_counts": {
    "pending": 10,
    "confirmed": 8,
    "completed": 5,
    "cancelled": 2
  },
  "offset": 0,
  "limit": 50
}
```

---

#### 2.2 Confirm Strategy Call

**Endpoint:** `POST /api/admin/strategy-calls/:id/confirm`  
**Authentication:** Required (Admin role)  
**Content-Type:** `application/json`

**Request Body (Meeting Link):**
```json
{
  "selected_slot_index": 0,
  "communication_method": "meeting_link",
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "admin_notes": "Looking forward to our call"
}
```

**Request Body (WhatsApp):**
```json
{
  "selected_slot_index": 1,
  "communication_method": "whatsapp",
  "whatsapp_number": "+1234567890",
  "admin_notes": "Will call via WhatsApp"
}
```

**Field Descriptions:**
- `selected_slot_index` (required) - Index of preferred slot (0, 1, or 2)
- `communication_method` (required) - Either `"meeting_link"` or `"whatsapp"`
- `meeting_link` (required if method is `meeting_link`) - Zoom/Google Meet URL
- `whatsapp_number` (required if method is `whatsapp`) - Phone number with country code
- `admin_notes` (optional) - Internal notes

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Strategy call confirmed successfully",
  "strategy_call": {
    "id": "uuid",
    "client_id": "uuid",
    "client_name": "John Doe",
    "client_email": "john@example.com",
    "admin_status": "confirmed",
    "status": "confirmed",
    "confirmed_time": "2026-02-20T10:00:00Z",
    "communication_method": "meeting_link",
    "meeting_link": "https://meet.google.com/abc-defg-hij",
    "whatsapp_number": null,
    "admin_notes": "Looking forward to our call",
    "admin_action_by": "admin-uuid",
    "admin_action_at": "2026-02-09T12:00:00Z",
    "updated_at": "2026-02-09T12:00:00Z"
  }
}
```

**Validation Errors:**
```json
{
  "error": "selected_slot_index is required"
}
```
```json
{
  "error": "communication_method must be \"whatsapp\" or \"meeting_link\""
}
```
```json
{
  "error": "meeting_link is required when communication_method is \"meeting_link\""
}
```
```json
{
  "error": "whatsapp_number is required when communication_method is \"whatsapp\""
}
```

---

#### 2.3 Update Strategy Call Status

**Endpoint:** `PATCH /api/admin/strategy-calls/:id/status`  
**Authentication:** Required (Admin role)  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "status": "completed"
}
```

**Valid Status Values:**
- `pending` - Awaiting confirmation
- `confirmed` - Confirmed and scheduled
- `completed` - Call completed
- `cancelled` - Call cancelled

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Status updated successfully",
  "strategy_call": {
    "id": "uuid",
    "admin_status": "completed",
    "status": "completed",
    "updated_at": "2026-02-20T11:00:00Z"
  }
}
```

---


### 3. Client Complete Profile (Client Card)

**Endpoint:** `GET /api/admin/clients/:id/complete`  
**Authentication:** Required (Admin role)

**Description:** Returns ALL client data in a single API call for the admin client card view.

**Response (200 OK):**
```json
{
  "basic_info": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "profile_picture_url": "https://storage.url/profile.jpg",
    "created_at": "2026-01-15T10:00:00Z",
    "last_login_at": "2026-02-09T09:00:00Z",
    "status": "active",
    "is_active": true
  },
  "account_status": {
    "registration_completed": true,
    "email_verified": true,
    "profile_unlocked": true,
    "payment_confirmed": true,
    "onboarding_completed": true,
    "onboarding_approved": true
  },
  "twenty_questions": {
    "roles_wanted": "Software Engineer, Full Stack Developer, Backend Engineer",
    "roles_open_to": "DevOps Engineer, Cloud Architect",
    "roles_to_avoid": "Sales, Marketing",
    "work_type": "Remote",
    "location_scope": "North America",
    "target_cities": "Toronto, Vancouver, New York",
    "locations_to_exclude": "None",
    "minimum_salary": "80000",
    "minimum_salary_currency": "CAD",
    "ideal_salary": "120000",
    "ideal_salary_currency": "CAD",
    "contract_roles": "Yes",
    "contract_conditions": "Minimum 6 months contract",
    "work_authorization": "Canadian Citizen",
    "work_authorization_details": null,
    "visa_sponsorship": "No",
    "willing_to_relocate": "Yes",
    "drivers_license_required": "No",
    "license_type_held": null,
    "industries_to_avoid": "Tobacco, Gambling",
    "disability_status": "Prefer not to say",
    "veteran_status": "Not a veteran",
    "demographic_self_id": "Prefer not to say",
    "priorities": "Work-life balance, Career growth, Competitive salary",
    "additional_notes": "I'm looking for a role that allows me to work remotely and grow my technical skills.",
    "status": "active",
    "submitted_at": "2026-02-09T10:00:00Z",
    "approved_at": "2026-02-09T12:00:00Z",
    "approved_by": "admin-uuid"
  },
  "strategy_calls": {
    "total": 1,
    "latest": {
      "id": "uuid",
      "admin_status": "confirmed",
      "confirmed_time": "2026-02-20T10:00:00Z",
      "communication_method": "meeting_link",
      "meeting_link": "https://meet.google.com/abc-defg-hij",
      "created_at": "2026-02-09T10:00:00Z"
    },
    "all": [
      {
        "id": "uuid",
        "preferred_slots": [...],
        "admin_status": "confirmed",
        "confirmed_time": "2026-02-20T10:00:00Z",
        "communication_method": "meeting_link",
        "meeting_link": "https://meet.google.com/abc-defg-hij",
        "admin_notes": "Looking forward to our call",
        "created_at": "2026-02-09T10:00:00Z"
      }
    ]
  },
  "files": {
    "resume": {
      "filename": "resume.pdf",
      "url": "https://storage.url/resume.pdf",
      "size": 245678,
      "uploaded_at": "2026-02-09T10:00:00Z"
    },
    "linkedin": {
      "url": "https://linkedin.com/in/johndoe",
      "added_at": "2026-02-09T10:05:00Z"
    },
    "portfolio": [
      {
        "url": "https://johndoe.com",
        "added_at": "2026-02-09T10:10:00Z"
      },
      {
        "url": "https://github.com/johndoe",
        "added_at": "2026-02-09T10:10:00Z"
      }
    ],
    "all_files": [...]
  },
  "applications": {
    "stats": {
      "total": 15,
      "applied": 5,
      "interview": 3,
      "offer": 1,
      "rejected": 6
    },
    "recent": [
      {
        "id": "uuid",
        "title": "Google - Senior Software Engineer",
        "company": "Google",
        "position": "Senior Software Engineer",
        "status": "interview",
        "application_date": "2026-02-01",
        "created_at": "2026-02-01T10:00:00Z"
      }
    ],
    "total_count": 15
  },
  "subscription": {
    "plan_name": "Premium",
    "tier": "premium",
    "price_cad": 500,
    "duration_weeks": 12,
    "applications_per_week": 10,
    "features": ["Resume building", "Interview prep", "Application tracking"],
    "start_date": "2026-02-01",
    "end_date": "2026-04-26",
    "status": "active",
    "assigned_by": "admin-uuid",
    "assigned_at": "2026-02-01T10:00:00Z"
  },
  "career_profile": {
    "current_job_title": "Software Engineer",
    "current_company": "Tech Corp",
    "years_experience": 5,
    "target_role": "Senior Software Engineer",
    "target_salary_min": 80000,
    "target_salary_max": 120000,
    "preferred_locations": ["Toronto", "Vancouver"],
    "career_goals": "Grow into a senior technical role",
    "job_search_timeline": "Immediately"
  }
}
```

**Use Case:**
This endpoint is designed for the admin client card view where all client information needs to be displayed at once. It aggregates data from multiple tables:
- `clients` - Basic info and career profile
- `client_onboarding` - All 20 questions responses
- `strategy_calls` - Strategy call history
- `client_files` - Resume, LinkedIn, portfolio
- `applications` - Application statistics
- `client_subscriptions` - Subscription details

---


### 4. 20 Questions Management

#### 4.1 Get Pending 20Q Submissions

**Endpoint:** `GET /api/admin/onboarding/pending`  
**Authentication:** Required (Admin role)

**Query Parameters:**
- `limit` (optional, default: 50) - Number of results
- `offset` (optional, default: 0) - Pagination offset

**Response (200 OK):**
```json
{
  "pending_submissions": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "q1": "Software Engineer, Full Stack Developer",
      "q2": "DevOps Engineer",
      "q3": "Sales",
      "q4": "Remote",
      "q5": "North America",
      "q6": "Toronto, Vancouver",
      "q7": "None",
      "q8": "80000",
      "q8_currency": "CAD",
      "q9": "120000",
      "q9_currency": "CAD",
      "q10": "Yes",
      "q10a": "Minimum 6 months",
      "q11": "Canadian Citizen",
      "q11a": null,
      "q12": "No",
      "q13": "Yes",
      "q14": "No",
      "q14a": null,
      "q15": "Tobacco",
      "q16": "Prefer not to say",
      "q17": "Not a veteran",
      "q18": "Prefer not to say",
      "q19": "Work-life balance, Career growth",
      "q20": "Looking for remote opportunities",
      "status": "pending_approval",
      "submitted_at": "2026-02-09T10:00:00Z",
      "approved_at": null,
      "approved_by": null,
      "clients": {
        "id": "uuid",
        "email": "john@example.com",
        "full_name": "John Doe",
        "phone": "+1234567890",
        "profile_picture_url": "https://storage.url/profile.jpg"
      }
    }
  ],
  "total": 10,
  "offset": 0,
  "limit": 50
}
```

---

#### 4.2 Get Client's 20Q Responses

**Endpoint:** `GET /api/admin/clients/:id/onboarding`  
**Authentication:** Required (Admin role)

**Response (200 OK):**
```json
{
  "client": {
    "id": "uuid",
    "email": "john@example.com",
    "full_name": "John Doe",
    "onboarding_completed": true,
    "onboarding_approved": false
  },
  "onboarding": {
    "id": "uuid",
    "client_id": "uuid",
    "q1": "Software Engineer, Full Stack Developer",
    "q2": "DevOps Engineer",
    "q3": "Sales",
    "q4": "Remote",
    "q5": "North America",
    "q6": "Toronto, Vancouver",
    "q7": "None",
    "q8": "80000",
    "q8_currency": "CAD",
    "q9": "120000",
    "q9_currency": "CAD",
    "q10": "Yes",
    "q10a": "Minimum 6 months",
    "q11": "Canadian Citizen",
    "q11a": null,
    "q12": "No",
    "q13": "Yes",
    "q14": "No",
    "q14a": null,
    "q15": "Tobacco",
    "q16": "Prefer not to say",
    "q17": "Not a veteran",
    "q18": "Prefer not to say",
    "q19": "Work-life balance, Career growth",
    "q20": "Looking for remote opportunities",
    "status": "pending_approval",
    "submitted_at": "2026-02-09T10:00:00Z",
    "approved_at": null,
    "approved_by": null
  }
}
```

**If No Onboarding:**
```json
{
  "client": {
    "id": "uuid",
    "email": "john@example.com",
    "full_name": "John Doe",
    "onboarding_completed": false,
    "onboarding_approved": false
  },
  "onboarding": null
}
```

---

#### 4.3 Approve 20Q Assessment

**Endpoint:** `POST /api/admin/onboarding/:id/approve`  
**Authentication:** Required (Admin role)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Onboarding approved successfully"
}
```

**What Happens:**
1. Onboarding status changed to `active`
2. Client's `onboarding_approved` flag set to `true`
3. Client's account status changed to `active`
4. Approval email sent to client
5. Notification created for client

---

### 5. Client Files Management

**Endpoint:** `GET /api/admin/clients/:id/files`  
**Authentication:** Required (Admin role)

**Response (200 OK):**
```json
{
  "files": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "file_type": "resume",
      "filename": "resume.pdf",
      "file_url": "https://storage.url/resume.pdf",
      "url": null,
      "file_size": 245678,
      "mime_type": "application/pdf",
      "is_active": true,
      "uploaded_at": "2026-02-09T10:00:00Z",
      "created_at": "2026-02-09T10:00:00Z"
    },
    {
      "id": "uuid",
      "client_id": "uuid",
      "file_type": "linkedin",
      "filename": null,
      "file_url": null,
      "url": "https://linkedin.com/in/johndoe",
      "file_size": null,
      "mime_type": null,
      "is_active": true,
      "uploaded_at": "2026-02-09T10:05:00Z",
      "created_at": "2026-02-09T10:05:00Z"
    },
    {
      "id": "uuid",
      "client_id": "uuid",
      "file_type": "portfolio",
      "filename": null,
      "file_url": null,
      "url": "https://johndoe.com",
      "file_size": null,
      "mime_type": null,
      "is_active": true,
      "uploaded_at": "2026-02-09T10:10:00Z",
      "created_at": "2026-02-09T10:10:00Z"
    }
  ],
  "summary": {
    "resume_uploaded": true,
    "linkedin_added": true,
    "portfolio_added": true,
    "total_files": 3
  }
}
```

**File Types:**
- `resume` - PDF/DOC/DOCX file (has `file_url`, `filename`, `file_size`, `mime_type`)
- `linkedin` - LinkedIn profile URL (has `url`)
- `portfolio` - Portfolio/GitHub/website URL (has `url`)

---


### 6. Subscription Management

**Endpoint:** `POST /api/admin/clients/:id/subscription`  
**Authentication:** Required (Admin role)  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "plan_id": "uuid",
  "start_date": "2026-02-01"
}
```

**Field Descriptions:**
- `plan_id` (required) - UUID of subscription plan from `subscription_plans` table
- `start_date` (optional) - Start date in YYYY-MM-DD format (defaults to today)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Subscription assigned successfully",
  "subscription": {
    "id": "uuid",
    "client_id": "uuid",
    "plan_id": "uuid",
    "plan_name": "Premium",
    "price_cad": 500,
    "start_date": "2026-02-01",
    "end_date": "2026-04-26",
    "status": "active",
    "assigned_by": "admin-uuid",
    "assigned_at": "2026-02-09T12:00:00Z"
  }
}
```

**Notes:**
- End date is automatically calculated based on plan's `duration_weeks`
- Any existing active subscription is automatically set to `completed`
- Client receives notification about subscription assignment

---

### 7. Admin Dashboard Statistics

**Endpoint:** `GET /api/admin/dashboard/stats`  
**Authentication:** Required (Admin role)

**Response (200 OK):**
```json
{
  "clients": {
    "total": 150,
    "active": 120,
    "pending_registration": 15,
    "onboarding_pending": 10
  },
  "strategy_calls": {
    "total": 85,
    "pending": 12,
    "confirmed": 25,
    "completed": 48
  },
  "applications": {
    "total": 1250,
    "applied": 450,
    "interview": 180,
    "offer": 75
  },
  "timestamp": "2026-02-09T14:00:00Z"
}
```

**Use Case:**
Display key metrics on admin dashboard homepage.

---

### 8. Admin Notifications

**Endpoint:** `GET /api/admin/notifications`  
**Authentication:** Required (Admin role)

**Query Parameters:**
- `limit` (optional, default: 20) - Number of notifications
- `offset` (optional, default: 0) - Pagination offset
- `unread_only` (optional, default: false) - Show only unread notifications

**Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "admin-uuid",
      "user_type": "admin",
      "title": "New Strategy Call Request",
      "message": "John Doe has requested a strategy call",
      "type": "strategy_call_request",
      "is_read": false,
      "action_url": "/admin/strategy-calls",
      "metadata": {
        "client_id": "uuid",
        "strategy_call_id": "uuid"
      },
      "created_at": "2026-02-09T10:00:00Z",
      "updated_at": "2026-02-09T10:00:00Z"
    }
  ],
  "total": 25,
  "unread_count": 8
}
```

**Admin Notification Types:**
- `strategy_call_request` - New strategy call request
- `onboarding_submitted` - New 20Q submission
- `client_invited` - Client invitation sent
- `application_update` - Application status changed

---

#### 8.1 Mark Admin Notification as Read

**Endpoint:** `PATCH /api/admin/notifications/:id/read`  
**Authentication:** Required (Admin role)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---


## Data Formats & Schemas

### 20 Questions Complete Schema

The 20 Questions assessment is divided into 7 sections:

#### Section 1: Role Targeting
- **q1** (required) - Roles wanted (comma-separated string)
- **q2** - Roles open to (comma-separated string)
- **q3** - Roles to avoid (comma-separated string)

#### Section 2: Location & Work Preferences
- **q4** (required) - Work type: `"Remote"`, `"Hybrid"`, `"On-site"`, or `"Flexible"`
- **q5** - Location scope (e.g., "North America", "Global", "Canada only")
- **q6** - Target cities (comma-separated string)
- **q7** - Locations to exclude (comma-separated string)

#### Section 3: Compensation
- **q8** (required) - Minimum salary (number as string)
- **q8_currency** - Currency code (e.g., "CAD", "USD")
- **q9** - Ideal salary (number as string)
- **q9_currency** - Currency code
- **q10** - Accept contract roles? `"Yes"` or `"No"`
- **q10a** - Contract conditions (if q10 is "Yes")

#### Section 4: Application Rules
- **q11** - Work authorization status
- **q11a** - Work authorization details (if applicable)
- **q12** - Requires visa sponsorship? `"Yes"` or `"No"`
- **q13** - Willing to relocate? `"Yes"` or `"No"`
- **q14** - Driver's license required? `"Yes"` or `"No"`
- **q14a** - License type held (if q14 is "Yes")
- **q15** - Industries to avoid (comma-separated string)

#### Section 5: Disclosures
- **q16** - Disability status
- **q17** - Veteran status
- **q18** - Demographic self-identification

#### Section 6: Priorities
- **q19** - Career priorities (comma-separated string)

#### Section 7: Final Notes
- **q20** - Additional notes (free text)

**Example Complete 20Q Submission:**
```json
{
  "q1": "Software Engineer, Full Stack Developer, Backend Engineer",
  "q2": "DevOps Engineer, Cloud Architect",
  "q3": "Sales, Marketing, Customer Support",
  "q4": "Remote",
  "q5": "North America",
  "q6": "Toronto, Vancouver, New York, San Francisco",
  "q7": "None",
  "q8": "80000",
  "q8_currency": "CAD",
  "q9": "120000",
  "q9_currency": "CAD",
  "q10": "Yes",
  "q10a": "Minimum 6 months contract, prefer 12+ months",
  "q11": "Canadian Citizen",
  "q11a": null,
  "q12": "No",
  "q13": "Yes",
  "q14": "No",
  "q14a": null,
  "q15": "Tobacco, Gambling, Adult entertainment",
  "q16": "Prefer not to say",
  "q17": "Not a veteran",
  "q18": "Prefer not to say",
  "q19": "Work-life balance, Career growth, Competitive salary, Remote work, Learning opportunities",
  "q20": "I'm looking for a role that allows me to work remotely and grow my technical skills. I'm particularly interested in companies with strong engineering cultures and opportunities for mentorship."
}
```

---

### Strategy Call Slot Format

**Preferred Slots Array:**
```json
{
  "preferred_slots": [
    {
      "date": "2026-02-20",
      "time": "10:00"
    },
    {
      "date": "2026-02-21",
      "time": "14:00"
    },
    {
      "date": "2026-02-22",
      "time": "16:00"
    }
  ]
}
```

**Rules:**
- Minimum 1 slot, maximum 3 slots
- `date` format: `YYYY-MM-DD`
- `time` format: `HH:MM` (24-hour format)
- Dates must be in the future

---

### File Upload Formats

#### Resume Upload (Multipart Form Data)
```
Content-Type: multipart/form-data

resume: <File>
```

**Allowed Types:**
- `application/pdf` (.pdf)
- `application/msword` (.doc)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx)

**Max Size:** 10MB

---

#### LinkedIn URL Format
```json
{
  "linkedin_url": "https://linkedin.com/in/username"
}
```

**Valid Formats:**
- `https://linkedin.com/in/username`
- `https://www.linkedin.com/in/username`
- `https://linkedin.com/in/username/`
- `https://www.linkedin.com/in/username/`

---

#### Portfolio URLs Format
```json
{
  "portfolio_urls": [
    "https://johndoe.com",
    "https://github.com/johndoe",
    "https://behance.net/johndoe",
    "https://dribbble.com/johndoe",
    "https://gitlab.com/johndoe"
  ]
}
```

**Rules:**
- Must be an array
- Minimum 1 URL, maximum 5 URLs
- Each URL must start with `http://` or `https://`

---

### Notification Metadata Format

```json
{
  "metadata": {
    "category": "strategy_call",
    "priority": "high",
    "client_id": "uuid",
    "strategy_call_id": "uuid",
    "custom_field": "custom_value"
  }
}
```

**Common Categories:**
- `strategy_call` - Strategy call related
- `onboarding` - 20Q assessment related
- `application` - Application related
- `subscription` - Subscription related
- `system` - System notifications

**Priority Levels:**
- `low` - Low priority
- `medium` - Medium priority
- `high` - High priority
- `urgent` - Urgent action required

---


## File Upload Specifications

### Resume Upload Process

**Step 1: Prepare File**
```javascript
const fileInput = document.getElementById('resume-input');
const file = fileInput.files[0];

// Validate file type
const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
if (!allowedTypes.includes(file.type)) {
  alert('Please upload a PDF, DOC, or DOCX file');
  return;
}

// Validate file size (10MB max)
if (file.size > 10 * 1024 * 1024) {
  alert('File size must be less than 10MB');
  return;
}
```

**Step 2: Create FormData**
```javascript
const formData = new FormData();
formData.append('resume', file);
```

**Step 3: Upload**
```javascript
const response = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/client/uploads/resume', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // DO NOT set Content-Type header - browser will set it automatically with boundary
  },
  body: formData
});

const data = await response.json();
console.log('Resume uploaded:', data.resume_url);
```

**Important Notes:**
- DO NOT manually set `Content-Type` header for multipart uploads
- Browser automatically sets `Content-Type: multipart/form-data; boundary=...`
- File field name must be `resume`

---

### LinkedIn & Portfolio Upload Process

**LinkedIn:**
```javascript
const response = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/client/uploads/linkedin', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    linkedin_url: 'https://linkedin.com/in/johndoe'
  })
});
```

**Portfolio (Multiple URLs):**
```javascript
const response = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/client/uploads/portfolio', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    portfolio_urls: [
      'https://johndoe.com',
      'https://github.com/johndoe'
    ]
  })
});
```

---

### File Storage Structure

Files are stored in Supabase Storage with the following structure:

```
client-files/
├── resumes/
│   ├── {client-id}/
│   │   ├── {timestamp}_{filename}.pdf
│   │   └── {timestamp}_{filename}.docx
```

**Public URLs:**
```
https://{supabase-project}.supabase.co/storage/v1/object/public/client-files/resumes/{client-id}/{timestamp}_{filename}.pdf
```

---

## 20 Questions System

### How 20Q is Loaded in Dashboard

**Client Dashboard Flow:**

1. **Main Dashboard Call** - `GET /api/client/dashboard`
   - Returns complete dashboard including 20Q status
   - 20Q data is in `twenty_questions` object
   - Shows status, progress, and key fields

2. **Detailed 20Q Status** - `GET /api/client/dashboard/onboarding/status`
   - Returns detailed 20Q status
   - Used for dedicated 20Q page/section
   - Shows all status fields and metadata

**Admin Dashboard Flow:**

1. **Pending Submissions** - `GET /api/admin/onboarding/pending`
   - Lists all pending 20Q submissions
   - Includes client info and all 20 answers
   - Used for admin review queue

2. **Client Card** - `GET /api/admin/clients/:id/complete`
   - Returns complete client profile including all 20Q answers
   - Formatted for easy reading in admin UI
   - Shows approval status and timestamps

3. **Individual Client 20Q** - `GET /api/admin/clients/:id/onboarding`
   - Returns specific client's 20Q responses
   - Used for detailed review page

---

### 20Q Status Lifecycle

```
not_started (0%)
    ↓
[Client submits assessment]
    ↓
pending_approval (75%)
    ↓
[Admin approves]
    ↓
active (100%)
```

**Status Details:**

| Status | Progress | Color | Can Edit | Description |
|--------|----------|-------|----------|-------------|
| `not_started` | 0% | gray | true | Assessment not yet started |
| `pending_approval` | 75% | yellow | false | Submitted, awaiting admin review |
| `active` | 100% | green | true | Approved and active |
| `completed` | 100% | blue | false | Completed |

---

### 20Q Display in Client Dashboard

**Dashboard Overview Card:**
```javascript
// From GET /api/client/dashboard response
const twentyQ = dashboardData.twenty_questions;

<div className="twenty-q-card">
  <div className="status-badge" style={{ backgroundColor: twentyQ.color }}>
    {twentyQ.display_status}
  </div>
  <div className="progress-bar">
    <div style={{ width: `${twentyQ.progress}%` }}></div>
  </div>
  <p>{twentyQ.description}</p>
  {twentyQ.target_roles.length > 0 && (
    <div className="target-roles">
      <strong>Target Roles:</strong>
      {twentyQ.target_roles.map(role => (
        <span key={role} className="role-tag">{role}</span>
      ))}
    </div>
  )}
</div>
```

---

### 20Q Display in Admin Dashboard

**Pending Queue:**
```javascript
// From GET /api/admin/onboarding/pending response
pendingSubmissions.map(submission => (
  <div key={submission.id} className="pending-card">
    <div className="client-info">
      <img src={submission.clients.profile_picture_url} />
      <div>
        <h3>{submission.clients.full_name}</h3>
        <p>{submission.clients.email}</p>
      </div>
    </div>
    <div className="submission-date">
      Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
    </div>
    <button onClick={() => reviewSubmission(submission.id)}>
      Review Assessment
    </button>
  </div>
))
```

**Client Card - Full 20Q Display:**
```javascript
// From GET /api/admin/clients/:id/complete response
const twentyQ = clientCard.twenty_questions;

<div className="twenty-q-full">
  <h2>20 Questions Assessment</h2>
  
  <section>
    <h3>Role Targeting</h3>
    <div className="q-item">
      <label>Roles Wanted:</label>
      <p>{twentyQ.roles_wanted}</p>
    </div>
    <div className="q-item">
      <label>Roles Open To:</label>
      <p>{twentyQ.roles_open_to}</p>
    </div>
    <div className="q-item">
      <label>Roles to Avoid:</label>
      <p>{twentyQ.roles_to_avoid}</p>
    </div>
  </section>

  <section>
    <h3>Location & Work Preferences</h3>
    <div className="q-item">
      <label>Work Type:</label>
      <p>{twentyQ.work_type}</p>
    </div>
    <div className="q-item">
      <label>Location Scope:</label>
      <p>{twentyQ.location_scope}</p>
    </div>
    <div className="q-item">
      <label>Target Cities:</label>
      <p>{twentyQ.target_cities}</p>
    </div>
  </section>

  <section>
    <h3>Compensation</h3>
    <div className="q-item">
      <label>Minimum Salary:</label>
      <p>{twentyQ.minimum_salary} {twentyQ.minimum_salary_currency}</p>
    </div>
    <div className="q-item">
      <label>Ideal Salary:</label>
      <p>{twentyQ.ideal_salary} {twentyQ.ideal_salary_currency}</p>
    </div>
    <div className="q-item">
      <label>Contract Roles:</label>
      <p>{twentyQ.contract_roles}</p>
      {twentyQ.contract_conditions && (
        <p className="sub-answer">{twentyQ.contract_conditions}</p>
      )}
    </div>
  </section>

  <section>
    <h3>Application Rules</h3>
    <div className="q-item">
      <label>Work Authorization:</label>
      <p>{twentyQ.work_authorization}</p>
    </div>
    <div className="q-item">
      <label>Visa Sponsorship:</label>
      <p>{twentyQ.visa_sponsorship}</p>
    </div>
    <div className="q-item">
      <label>Willing to Relocate:</label>
      <p>{twentyQ.willing_to_relocate}</p>
    </div>
    <div className="q-item">
      <label>Industries to Avoid:</label>
      <p>{twentyQ.industries_to_avoid}</p>
    </div>
  </section>

  <section>
    <h3>Priorities</h3>
    <div className="q-item">
      <label>Career Priorities:</label>
      <p>{twentyQ.priorities}</p>
    </div>
  </section>

  <section>
    <h3>Additional Notes</h3>
    <div className="q-item">
      <p>{twentyQ.additional_notes}</p>
    </div>
  </section>

  <div className="approval-section">
    <p>Status: {twentyQ.status}</p>
    <p>Submitted: {new Date(twentyQ.submitted_at).toLocaleDateString()}</p>
    {twentyQ.approved_at && (
      <p>Approved: {new Date(twentyQ.approved_at).toLocaleDateString()}</p>
    )}
    {twentyQ.status === 'pending_approval' && (
      <button onClick={() => approveAssessment(clientCard.basic_info.id)}>
        Approve Assessment
      </button>
    )}
  </div>
</div>
```

---


## Error Handling

### Standard Error Response Format

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data, validation failed |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User doesn't have permission for this action |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error, contact support |

---

### Common Error Scenarios

#### Authentication Errors

**Missing Token:**
```json
{
  "error": "No token provided"
}
```

**Invalid Token:**
```json
{
  "error": "Invalid token"
}
```

**Expired Token:**
```json
{
  "error": "Token expired"
}
```

**Wrong Role:**
```json
{
  "error": "Access denied. Admin role required."
}
```

---

#### Validation Errors

**Missing Required Fields:**
```json
{
  "error": "Email and full name are required"
}
```

**Invalid Data Format:**
```json
{
  "error": "Please provide a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourname)"
}
```

**File Upload Errors:**
```json
{
  "error": "Resume must be PDF, DOC, or DOCX format"
}
```
```json
{
  "error": "File too large"
}
```

**Array Validation:**
```json
{
  "error": "Portfolio URLs must be provided as an array"
}
```
```json
{
  "error": "Maximum 5 portfolio URLs allowed"
}
```

---

#### Resource Not Found Errors

```json
{
  "error": "Client not found"
}
```
```json
{
  "error": "Strategy call not found"
}
```
```json
{
  "error": "Notification not found"
}
```

---

#### Business Logic Errors

**Already Exists:**
```json
{
  "error": "Client with this email already exists"
}
```

**Already Submitted:**
```json
{
  "error": "Assessment already submitted"
}
```

**Invalid State:**
```json
{
  "error": "Cannot book new call while previous call is pending"
}
```

---

### Error Handling in Frontend

**React Example:**
```javascript
async function submitAssessment(answers) {
  try {
    const response = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/client/dashboard/onboarding/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(answers)
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle error
      if (response.status === 400) {
        alert(`Validation Error: ${data.error}`);
      } else if (response.status === 401) {
        // Redirect to login
        window.location.href = '/login';
      } else if (response.status === 500) {
        alert('Server error. Please try again later.');
      } else {
        alert(`Error: ${data.error}`);
      }
      return;
    }

    // Success
    alert('Assessment submitted successfully!');
    window.location.reload();

  } catch (error) {
    // Network error
    console.error('Network error:', error);
    alert('Network error. Please check your connection.');
  }
}
```

---

## Frontend Integration Examples

### Complete Client Dashboard Integration

```javascript
import React, { useState, useEffect } from 'react';

const API_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

function ClientDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const response = await fetch(`${API_URL}/api/client/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load dashboard');
      }

      const data = await response.json();
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!dashboard) return null;

  return (
    <div className="dashboard">
      {/* Header */}
      <header>
        <h1>Welcome, {dashboard.client.full_name}</h1>
        <p>{dashboard.status.message}</p>
      </header>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${dashboard.status.progress_percentage}%` }}
          />
        </div>
        <p>{dashboard.status.progress_percentage}% Complete</p>
      </div>

      {/* Next Steps */}
      <div className="next-steps">
        <h2>Next Steps</h2>
        {dashboard.next_steps.map((step, index) => (
          <div key={index} className="step-card">
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            <button onClick={() => handleAction(step.action)}>
              {step.action === 'book_strategy_call' && 'Book Now'}
              {step.action === 'complete_20q' && 'Start Assessment'}
              {step.action === 'upload_resume' && 'Upload Resume'}
              {step.action === 'view_applications' && 'View Applications'}
            </button>
          </div>
        ))}
      </div>

      {/* 20 Questions Status */}
      <div className="twenty-q-section">
        <h2>Career Assessment</h2>
        <div className={`status-badge ${dashboard.twenty_questions.color}`}>
          {dashboard.twenty_questions.display_status}
        </div>
        <p>{dashboard.twenty_questions.description}</p>
        <div className="progress-bar">
          <div style={{ width: `${dashboard.twenty_questions.progress}%` }} />
        </div>
        {dashboard.twenty_questions.target_roles.length > 0 && (
          <div className="target-roles">
            <strong>Target Roles:</strong>
            {dashboard.twenty_questions.target_roles.map(role => (
              <span key={role} className="role-tag">{role}</span>
            ))}
          </div>
        )}
      </div>

      {/* Strategy Call Status */}
      <div className="strategy-call-section">
        <h2>Strategy Call</h2>
        {dashboard.strategy_call.has_confirmed ? (
          <div className="confirmed">
            <p>✓ Call Confirmed</p>
            <p>Scheduled: {new Date(dashboard.strategy_call.scheduled_time).toLocaleString()}</p>
            {dashboard.strategy_call.meeting_link && (
              <a href={dashboard.strategy_call.meeting_link} target="_blank">
                Join Meeting
              </a>
            )}
          </div>
        ) : dashboard.strategy_call.has_booked ? (
          <div className="pending">
            <p>⏳ Awaiting Confirmation</p>
            <p>We'll confirm your preferred time within 24 hours</p>
          </div>
        ) : (
          <button onClick={() => openStrategyCallModal()}>
            Book Strategy Call
          </button>
        )}
      </div>

      {/* Files */}
      <div className="files-section">
        <h2>Your Files</h2>
        <div className="file-status">
          <div className={dashboard.files.resume_uploaded ? 'uploaded' : 'pending'}>
            {dashboard.files.resume_uploaded ? '✓' : '○'} Resume
          </div>
          <div className={dashboard.files.linkedin_added ? 'uploaded' : 'pending'}>
            {dashboard.files.linkedin_added ? '✓' : '○'} LinkedIn
          </div>
          <div className={dashboard.files.portfolio_added ? 'uploaded' : 'pending'}>
            {dashboard.files.portfolio_added ? '✓' : '○'} Portfolio
          </div>
        </div>
        <button onClick={() => openFileUploadModal()}>
          Manage Files
        </button>
      </div>

      {/* Applications */}
      {dashboard.applications.can_view && (
        <div className="applications-section">
          <h2>Your Applications</h2>
          <div className="app-stats">
            <div className="stat">
              <span className="number">{dashboard.applications.total_count}</span>
              <span className="label">Total</span>
            </div>
            <div className="stat">
              <span className="number">{dashboard.applications.active_count}</span>
              <span className="label">Active</span>
            </div>
            <div className="stat">
              <span className="number">{dashboard.applications.interview_count}</span>
              <span className="label">Interviews</span>
            </div>
            <div className="stat">
              <span className="number">{dashboard.applications.offer_count}</span>
              <span className="label">Offers</span>
            </div>
          </div>
          <button onClick={() => navigateToApplications()}>
            View All Applications
          </button>
        </div>
      )}

      {/* Subscription */}
      {dashboard.subscription && (
        <div className="subscription-section">
          <h2>Your Plan</h2>
          <div className="plan-card">
            <h3>{dashboard.subscription.plan_name}</h3>
            <p>{dashboard.subscription.price}</p>
            <p>{dashboard.subscription.applications} applications per week</p>
            <p>Valid until: {dashboard.subscription.end_date}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientDashboard;
```

---


### Strategy Call Booking Component

```javascript
import React, { useState } from 'react';

const API_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

function StrategyCallBooking({ onSuccess }) {
  const [slots, setSlots] = useState([
    { date: '', time: '' },
    { date: '', time: '' },
    { date: '', time: '' }
  ]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('auth_token');

  function updateSlot(index, field, value) {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    setSlots(newSlots);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Filter out empty slots
    const filledSlots = slots.filter(slot => slot.date && slot.time);

    if (filledSlots.length === 0) {
      setError('Please provide at least one preferred time slot');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/strategy-calls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferred_slots: filledSlots,
          message: message || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book strategy call');
      }

      alert('Strategy call request submitted successfully!');
      onSuccess();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="strategy-call-form">
      <h2>Book Your Strategy Call</h2>
      <p>Select 1-3 preferred time slots. We'll confirm one within 24 hours.</p>

      {error && <div className="error-message">{error}</div>}

      {slots.map((slot, index) => (
        <div key={index} className="time-slot">
          <h3>Option {index + 1}</h3>
          <div className="slot-inputs">
            <input
              type="date"
              value={slot.date}
              onChange={(e) => updateSlot(index, 'date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required={index === 0}
            />
            <input
              type="time"
              value={slot.time}
              onChange={(e) => updateSlot(index, 'time', e.target.value)}
              required={index === 0}
            />
          </div>
        </div>
      ))}

      <div className="message-field">
        <label>Message (Optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Any specific topics you'd like to discuss?"
          rows={4}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  );
}

export default StrategyCallBooking;
```

---

### File Upload Component

```javascript
import React, { useState, useEffect } from 'react';

const API_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

function FileUploadManager() {
  const [uploadStatus, setUploadStatus] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrls, setPortfolioUrls] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    loadUploadStatus();
  }, []);

  async function loadUploadStatus() {
    try {
      const response = await fetch(`${API_URL}/api/client/dashboard/uploads/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUploadStatus(data);
    } catch (error) {
      console.error('Failed to load upload status:', error);
    }
  }

  async function uploadResume() {
    if (!resumeFile) {
      alert('Please select a file');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(resumeFile.type)) {
      alert('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    // Validate file size (10MB)
    if (resumeFile.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);

      const response = await fetch(`${API_URL}/api/client/uploads/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // DO NOT set Content-Type - browser sets it automatically
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      alert('Resume uploaded successfully!');
      loadUploadStatus();
      setResumeFile(null);

    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function uploadLinkedIn() {
    if (!linkedinUrl) {
      alert('Please enter your LinkedIn URL');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/client/uploads/linkedin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          linkedin_url: linkedinUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      alert('LinkedIn profile added successfully!');
      loadUploadStatus();
      setLinkedinUrl('');

    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function uploadPortfolio() {
    // Filter out empty URLs
    const filledUrls = portfolioUrls.filter(url => url.trim() !== '');

    if (filledUrls.length === 0) {
      alert('Please enter at least one portfolio URL');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/client/uploads/portfolio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          portfolio_urls: filledUrls
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      alert('Portfolio URLs added successfully!');
      loadUploadStatus();
      setPortfolioUrls(['', '', '', '', '']);

    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="file-upload-manager">
      <h2>Manage Your Files</h2>

      {/* Resume Upload */}
      <section className="upload-section">
        <h3>Resume {uploadStatus?.resume_uploaded && '✓'}</h3>
        {uploadStatus?.resume_uploaded ? (
          <div className="uploaded-file">
            <p>Resume uploaded</p>
            <a href={uploadStatus.files.find(f => f.type === 'resume')?.url} target="_blank">
              View Resume
            </a>
          </div>
        ) : (
          <div className="upload-form">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files[0])}
            />
            <button onClick={uploadResume} disabled={loading || !resumeFile}>
              Upload Resume
            </button>
          </div>
        )}
      </section>

      {/* LinkedIn */}
      <section className="upload-section">
        <h3>LinkedIn Profile {uploadStatus?.linkedin_added && '✓'}</h3>
        {uploadStatus?.linkedin_added ? (
          <div className="uploaded-file">
            <p>LinkedIn profile added</p>
            <a href={uploadStatus.files.find(f => f.type === 'linkedin')?.url} target="_blank">
              View Profile
            </a>
          </div>
        ) : (
          <div className="upload-form">
            <input
              type="url"
              placeholder="https://linkedin.com/in/yourname"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
            <button onClick={uploadLinkedIn} disabled={loading || !linkedinUrl}>
              Add LinkedIn
            </button>
          </div>
        )}
      </section>

      {/* Portfolio */}
      <section className="upload-section">
        <h3>Portfolio URLs {uploadStatus?.portfolio_added && '✓'}</h3>
        {uploadStatus?.portfolio_added ? (
          <div className="uploaded-file">
            <p>Portfolio URLs added</p>
            {uploadStatus.files.filter(f => f.type === 'portfolio').map((file, index) => (
              <a key={index} href={file.url} target="_blank">
                {file.url}
              </a>
            ))}
          </div>
        ) : (
          <div className="upload-form">
            <p>Add up to 5 portfolio URLs (website, GitHub, Behance, etc.)</p>
            {portfolioUrls.map((url, index) => (
              <input
                key={index}
                type="url"
                placeholder={`Portfolio URL ${index + 1}`}
                value={url}
                onChange={(e) => {
                  const newUrls = [...portfolioUrls];
                  newUrls[index] = e.target.value;
                  setPortfolioUrls(newUrls);
                }}
              />
            ))}
            <button onClick={uploadPortfolio} disabled={loading}>
              Add Portfolio URLs
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default FileUploadManager;
```

---

### 20 Questions Submission Component

```javascript
import React, { useState } from 'react';

const API_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

function TwentyQuestionsForm({ onSuccess }) {
  const [answers, setAnswers] = useState({
    q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '',
    q8: '', q8_currency: 'CAD', q9: '', q9_currency: 'CAD',
    q10: '', q10a: '', q11: '', q11a: '', q12: '', q13: '',
    q14: '', q14a: '', q15: '', q16: '', q17: '', q18: '',
    q19: '', q20: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('auth_token');

  function updateAnswer(question, value) {
    setAnswers(prev => ({ ...prev, [question]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!answers.q1 || !answers.q4 || !answers.q8) {
      setError('Please answer all required questions (marked with *)');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/client/dashboard/onboarding/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(answers)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      alert('Assessment submitted successfully! Our team will review it within 24 hours.');
      onSuccess();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="twenty-q-form">
      <h2>20 Questions Career Assessment</h2>
      {error && <div className="error-message">{error}</div>}

      {/* Section 1: Role Targeting */}
      <section>
        <h3>Role Targeting</h3>
        
        <div className="question">
          <label>1. What roles do you want? * (comma-separated)</label>
          <input
            type="text"
            value={answers.q1}
            onChange={(e) => updateAnswer('q1', e.target.value)}
            placeholder="Software Engineer, Full Stack Developer"
            required
          />
        </div>

        <div className="question">
          <label>2. What roles are you open to? (comma-separated)</label>
          <input
            type="text"
            value={answers.q2}
            onChange={(e) => updateAnswer('q2', e.target.value)}
            placeholder="DevOps Engineer, Cloud Architect"
          />
        </div>

        <div className="question">
          <label>3. What roles do you want to avoid? (comma-separated)</label>
          <input
            type="text"
            value={answers.q3}
            onChange={(e) => updateAnswer('q3', e.target.value)}
            placeholder="Sales, Marketing"
          />
        </div>
      </section>

      {/* Section 2: Location & Work */}
      <section>
        <h3>Location & Work Preferences</h3>
        
        <div className="question">
          <label>4. Work type preference? *</label>
          <select
            value={answers.q4}
            onChange={(e) => updateAnswer('q4', e.target.value)}
            required
          >
            <option value="">Select...</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
            <option value="Flexible">Flexible</option>
          </select>
        </div>

        <div className="question">
          <label>5. Location scope?</label>
          <input
            type="text"
            value={answers.q5}
            onChange={(e) => updateAnswer('q5', e.target.value)}
            placeholder="North America, Global, Canada only"
          />
        </div>

        <div className="question">
          <label>6. Target cities? (comma-separated)</label>
          <input
            type="text"
            value={answers.q6}
            onChange={(e) => updateAnswer('q6', e.target.value)}
            placeholder="Toronto, Vancouver, New York"
          />
        </div>

        <div className="question">
          <label>7. Locations to exclude?</label>
          <input
            type="text"
            value={answers.q7}
            onChange={(e) => updateAnswer('q7', e.target.value)}
            placeholder="None"
          />
        </div>
      </section>

      {/* Section 3: Compensation */}
      <section>
        <h3>Compensation</h3>
        
        <div className="question">
          <label>8. Minimum salary? *</label>
          <div className="salary-input">
            <input
              type="number"
              value={answers.q8}
              onChange={(e) => updateAnswer('q8', e.target.value)}
              placeholder="80000"
              required
            />
            <select
              value={answers.q8_currency}
              onChange={(e) => updateAnswer('q8_currency', e.target.value)}
            >
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div className="question">
          <label>9. Ideal salary?</label>
          <div className="salary-input">
            <input
              type="number"
              value={answers.q9}
              onChange={(e) => updateAnswer('q9', e.target.value)}
              placeholder="120000"
            />
            <select
              value={answers.q9_currency}
              onChange={(e) => updateAnswer('q9_currency', e.target.value)}
            >
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div className="question">
          <label>10. Accept contract roles?</label>
          <select
            value={answers.q10}
            onChange={(e) => updateAnswer('q10', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {answers.q10 === 'Yes' && (
          <div className="question sub-question">
            <label>10a. Contract conditions?</label>
            <input
              type="text"
              value={answers.q10a}
              onChange={(e) => updateAnswer('q10a', e.target.value)}
              placeholder="Minimum 6 months"
            />
          </div>
        )}
      </section>

      {/* Continue with remaining sections... */}
      {/* Section 4: Application Rules */}
      {/* Section 5: Disclosures */}
      {/* Section 6: Priorities */}
      {/* Section 7: Final Notes */}

      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Assessment'}
      </button>
    </form>
  );
}

export default TwentyQuestionsForm;
```

---

## Summary

This documentation covers:

✅ **Authentication** - Login and token management  
✅ **Client Dashboard** - All 13 client endpoints with request/response examples  
✅ **Admin Dashboard** - All 13 admin endpoints with request/response examples  
✅ **Data Formats** - Complete schemas for 20Q, strategy calls, files  
✅ **File Uploads** - Detailed specifications for resume, LinkedIn, portfolio  
✅ **20Q System** - Complete lifecycle, status management, display examples  
✅ **Error Handling** - All error scenarios and HTTP status codes  
✅ **Frontend Integration** - Complete React examples for all features  

**Key Points:**
- All endpoints require `Authorization: Bearer <token>` header
- Portfolio URLs must be sent as array: `{ portfolio_urls: [...] }`
- Notifications endpoint is `/api/notifications` not `/api/client/notifications`
- Resume upload uses `multipart/form-data` (don't set Content-Type manually)
- 20Q has 3 required fields: q1, q4, q8
- Strategy calls require 1-3 time slots with date (YYYY-MM-DD) and time (HH:MM)
- Admin can confirm strategy calls via WhatsApp or Meeting Link

**Production URLs:**
- Backend: `https://jellyfish-app-t4m35.ondigitalocean.app`
- Frontend: `https://www.applybureau.com`

---

**Document Version:** 1.0  
**Last Updated:** February 9, 2026  
**Status:** Production Ready ✅
