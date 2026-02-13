# 📱 Client Dashboard Endpoints - Complete Guide

**Base URL**: `https://jellyfish-app-t4m35.ondigitalocean.app`  
**Authentication**: All endpoints require client JWT token  
**Date**: February 9, 2026

---

## 🔐 Authentication

All client endpoints require:
```javascript
headers: {
  'Authorization': `Bearer ${clientToken}`,
  'Content-Type': 'application/json'
}
```

---

## 📊 Complete Client Dashboard Endpoints

### 1. GET /api/client/dashboard
**Get complete dashboard overview with all client data**

**Description**: Returns everything the client needs for their dashboard in one call - progress, 20Q status, strategy call status, file uploads, applications, subscription, and next steps.

**Request**:
```javascript
GET /api/client/dashboard
Headers: {
  'Authorization': 'Bearer <client_token>'
}
```

**Response**:
```json
{
  "client": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "profile_picture_url": "https://...",
    "status": "active",
    "created_at": "2026-01-15T10:00:00Z"
  },
  "progress": {
    "percentage": 75,
    "completed_steps": 3,
    "total_steps": 4,
    "steps": {
      "registration": {
        "completed": true,
        "label": "Account Created",
        "date": "2026-01-15T10:00:00Z"
      },
      "twenty_questions": {
        "completed": true,
        "approved": true,
        "label": "20 Questions Completed",
        "date": "2026-01-20T14:00:00Z"
      },
      "strategy_call": {
        "completed": true,
        "confirmed": true,
        "label": "Strategy Call Scheduled",
        "date": "2026-01-25T10:00:00Z"
      },
      "file_uploads": {
        "completed": false,
        "label": "Upload Documents",
        "resume_uploaded": false,
        "linkedin_added": false
      }
    }
  },
  "twenty_questions": {
    "status": "active",
    "submitted": true,
    "approved": true,
    "submitted_at": "2026-01-20T14:00:00Z",
    "approved_at": "2026-01-21T09:00:00Z",
    "can_view_applications": true
  },
  "strategy_call": {
    "has_booked": true,
    "has_confirmed": true,
    "status": "confirmed",
    "confirmed_time": "2026-02-15T10:00:00Z",
    "communication_method": "whatsapp",
    "whatsapp_number": "+1234567890",
    "meeting_link": null
  },
  "file_uploads": {
    "resume_uploaded": true,
    "resume_filename": "john_doe_resume.pdf",
    "resume_url": "https://storage.supabase.co/...",
    "linkedin_added": true,
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "portfolio_count": 2,
    "portfolio_links": [
      "https://johndoe.com",
      "https://github.com/johndoe"
    ]
  },
  "applications": {
    "total": 15,
    "can_view": true,
    "stats": {
      "applied": 10,
      "interview": 3,
      "offer": 1,
      "rejected": 1
    }
  },
  "subscription": {
    "has_plan": true,
    "plan_name": "TIER 1 — Core Application Support",
    "tier": 1,
    "price_cad": 349,
    "applications_per_week": 5,
    "start_date": "2026-01-15",
    "end_date": "2026-04-15",
    "weeks_remaining": 8
  },
  "next_steps": [
    {
      "action": "upload_resume",
      "title": "Upload Your Resume",
      "description": "Upload your resume to complete your profile",
      "priority": "high",
      "completed": false
    },
    {
      "action": "add_linkedin",
      "title": "Add LinkedIn Profile",
      "description": "Link your LinkedIn profile",
      "priority": "medium",
      "completed": false
    }
  ],
  "notifications": {
    "unread_count": 3,
    "latest": [
      {
        "id": "uuid",
        "title": "Strategy Call Confirmed",
        "message": "Your call is scheduled for Feb 15 at 10:00 AM",
        "type": "strategy_call_confirmed",
        "created_at": "2026-02-09T10:00:00Z",
        "is_read": false
      }
    ]
  }
}
```

---

### 2. GET /api/client/dashboard/onboarding/status
**Get 20 Questions assessment status**

**Description**: Check if client has submitted 20Q and if it's been approved.

**Request**:
```javascript
GET /api/client/dashboard/onboarding/status
```

**Response**:
```json
{
  "status": "active",
  "submitted": true,
  "approved": true,
  "submitted_at": "2026-01-20T14:00:00Z",
  "approved_at": "2026-01-21T09:00:00Z",
  "can_view_applications": true
}
```

**Possible Statuses**:
- `not_started` - Client hasn't submitted 20Q yet
- `pending_approval` - Submitted, waiting for admin approval
- `active` - Approved, client can view applications

---

### 3. POST /api/client/dashboard/onboarding/submit
**Submit 20 Questions assessment**

**Description**: Client submits their 20Q assessment. This is a one-time submission.

**Request**:
```javascript
POST /api/client/dashboard/onboarding/submit

Body: {
  "q1": "Software Engineer, Product Manager",
  "q2": "Data Analyst, UX Designer",
  "q3": "Sales, Marketing",
  "q4": "Remote",
  "q5": "North America",
  "q6": "Toronto, Vancouver, New York",
  "q7": "None",
  "q8": "80000",
  "q8_currency": "CAD",
  "q9": "100000",
  "q9_currency": "CAD",
  "q10": "Yes",
  "q10a": "Minimum 6 months",
  "q11": "Canadian Citizen",
  "q11a": null,
  "q12": "No",
  "q13": "Yes",
  "q14": "No",
  "q14a": null,
  "q15": "None",
  "q16": "Prefer not to say",
  "q17": "No",
  "q18": "Prefer not to say",
  "q19": "Work-life balance, Career growth",
  "q20": "Looking for remote opportunities"
}
```

**Response**:
```json
{
  "success": true,
  "message": "20 Questions submitted successfully",
  "onboarding": {
    "id": "uuid",
    "status": "pending_approval",
    "submitted_at": "2026-02-09T10:00:00Z"
  }
}
```

**Side Effects**:
- Creates `client_onboarding` record
- Updates `clients.onboarding_completed` to true
- Creates notification for admin
- Sends email to admin

---

### 4. GET /api/client/dashboard/uploads/status
**Get file upload status**

**Description**: Check what files the client has uploaded.

**Request**:
```javascript
GET /api/client/dashboard/uploads/status
```

**Response**:
```json
{
  "resume": {
    "uploaded": true,
    "filename": "john_doe_resume.pdf",
    "file_url": "https://storage.supabase.co/...",
    "file_size": 245678,
    "uploaded_at": "2026-01-22T10:00:00Z"
  },
  "linkedin": {
    "added": true,
    "url": "https://linkedin.com/in/johndoe",
    "added_at": "2026-01-22T11:00:00Z"
  },
  "portfolio": {
    "count": 2,
    "links": [
      {
        "url": "https://johndoe.com",
        "added_at": "2026-01-22T12:00:00Z"
      },
      {
        "url": "https://github.com/johndoe",
        "added_at": "2026-01-22T12:05:00Z"
      }
    ]
  },
  "all_complete": false
}
```

---

### 5. POST /api/client/uploads/resume
**Upload resume PDF**

**Description**: Upload resume file (PDF only, max 5MB).

**Request**:
```javascript
POST /api/client/uploads/resume

Content-Type: multipart/form-data

Body (FormData):
{
  "resume": <File>
}
```

**Response**:
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "file": {
    "id": "uuid",
    "filename": "john_doe_resume.pdf",
    "file_url": "https://storage.supabase.co/...",
    "file_size": 245678,
    "uploaded_at": "2026-02-09T10:00:00Z"
  }
}
```

**Validation**:
- File type: PDF only
- Max size: 5MB
- Replaces existing resume if already uploaded

---

### 6. POST /api/client/uploads/linkedin
**Add LinkedIn profile URL**

**Description**: Add LinkedIn profile link.

**Request**:
```javascript
POST /api/client/uploads/linkedin

Body: {
  "linkedin_url": "https://linkedin.com/in/johndoe"
}
```

**Response**:
```json
{
  "success": true,
  "message": "LinkedIn profile added successfully",
  "linkedin": {
    "id": "uuid",
    "url": "https://linkedin.com/in/johndoe",
    "added_at": "2026-02-09T10:00:00Z"
  }
}
```

**Validation**:
- Must be valid LinkedIn URL
- Format: `https://linkedin.com/in/username` or `https://www.linkedin.com/in/username`

---

### 7. POST /api/client/uploads/portfolio
**Add portfolio link**

**Description**: Add portfolio website or GitHub link.

**Request**:
```javascript
POST /api/client/uploads/portfolio

Body: {
  "portfolio_url": "https://johndoe.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Portfolio link added successfully",
  "portfolio": {
    "id": "uuid",
    "url": "https://johndoe.com",
    "added_at": "2026-02-09T10:00:00Z"
  }
}
```

**Notes**:
- Can add multiple portfolio links
- Must be valid URL

---

### 8. POST /api/strategy-calls
**Book strategy call**

**Description**: Client books a strategy call with 1-3 preferred time slots.

**Request**:
```javascript
POST /api/strategy-calls

Body: {
  "preferred_slots": [
    {
      "date": "2026-02-15",
      "time": "10:00"
    },
    {
      "date": "2026-02-16",
      "time": "14:00"
    },
    {
      "date": "2026-02-17",
      "time": "16:00"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Strategy call request submitted",
  "strategy_call": {
    "id": "uuid",
    "status": "pending",
    "preferred_slots": [...],
    "created_at": "2026-02-09T10:00:00Z"
  }
}
```

**Validation**:
- Must provide 1-3 time slots
- Dates must be in future
- Time format: "HH:MM" (24-hour)

**Side Effects**:
- Creates notification for admin
- Sends email to admin

---

### 9. GET /api/strategy-calls/status
**Get strategy call status**

**Description**: Check if client has booked a call and if it's been confirmed.

**Request**:
```javascript
GET /api/strategy-calls/status
```

**Response**:
```json
{
  "has_booked": true,
  "has_confirmed": true,
  "strategy_call": {
    "id": "uuid",
    "status": "confirmed",
    "confirmed_time": "2026-02-15T10:00:00Z",
    "communication_method": "whatsapp",
    "whatsapp_number": "+1234567890",
    "meeting_link": null,
    "created_at": "2026-02-09T10:00:00Z"
  }
}
```

**Possible Statuses**:
- `pending` - Waiting for admin to confirm
- `confirmed` - Admin confirmed, call scheduled
- `completed` - Call finished
- `cancelled` - Call cancelled

---

### 10. GET /api/applications
**Get client's applications (read-only)**

**Description**: View all applications created by admin. Client can only view, not create.

**Request**:
```javascript
GET /api/applications?limit=20&offset=0
```

**Response**:
```json
{
  "applications": [
    {
      "id": "uuid",
      "company_name": "Tech Corp",
      "job_title": "Software Engineer",
      "job_url": "https://techcorp.com/jobs/123",
      "location": "Toronto, ON",
      "work_type": "Remote",
      "salary_range": "$80,000 - $100,000",
      "status": "applied",
      "applied_date": "2026-02-01",
      "notes": "Great fit for your skills",
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-01T10:00:00Z"
    }
  ],
  "total": 15,
  "stats": {
    "applied": 10,
    "interview": 3,
    "offer": 1,
    "rejected": 1
  }
}
```

**Query Parameters**:
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status

**Note**: Client can only VIEW applications. Only admin can create/update applications.

---

### 11. GET /api/client/dashboard/applications/stats
**Get application statistics**

**Description**: Get summary stats of client's applications.

**Request**:
```javascript
GET /api/client/dashboard/applications/stats
```

**Response**:
```json
{
  "total": 15,
  "by_status": {
    "applied": 10,
    "interview": 3,
    "offer": 1,
    "rejected": 1
  },
  "recent_activity": [
    {
      "company_name": "Tech Corp",
      "job_title": "Software Engineer",
      "status": "interview",
      "updated_at": "2026-02-08T10:00:00Z"
    }
  ],
  "this_week": 3,
  "this_month": 12
}
```

---

### 12. GET /api/client/notifications
**Get client notifications**

**Description**: Get all notifications for the client.

**Request**:
```javascript
GET /api/client/notifications?limit=20&unread_only=false
```

**Response**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "title": "Strategy Call Confirmed",
      "message": "Your call is scheduled for Feb 15 at 10:00 AM",
      "type": "strategy_call_confirmed",
      "is_read": false,
      "action_url": "/dashboard",
      "created_at": "2026-02-09T10:00:00Z"
    },
    {
      "id": "uuid",
      "title": "20 Questions Approved",
      "message": "Your assessment has been approved!",
      "type": "onboarding_approved",
      "is_read": true,
      "action_url": "/dashboard",
      "created_at": "2026-02-08T10:00:00Z"
    }
  ],
  "total": 10,
  "unread_count": 3
}
```

**Query Parameters**:
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `unread_only` (optional): Filter unread only (default: false)

---

### 13. PATCH /api/client/notifications/:id/read
**Mark notification as read**

**Description**: Mark a specific notification as read.

**Request**:
```javascript
PATCH /api/client/notifications/:id/read
```

**Response**:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

## 📊 Client Dashboard Flow

### Step 1: Registration
```
Client receives registration link from admin
→ Client creates password
→ Client logs in
```

### Step 2: Dashboard Overview
```
GET /api/client/dashboard
→ See progress (0%)
→ See next steps: "Complete 20 Questions"
```

### Step 3: Complete 20 Questions
```
POST /api/client/dashboard/onboarding/submit
→ Submit all 20 answers
→ Status: "pending_approval"
→ Admin gets notification
```

### Step 4: Book Strategy Call
```
POST /api/strategy-calls
→ Provide 1-3 time slots
→ Status: "pending"
→ Admin gets notification
```

### Step 5: Upload Files
```
POST /api/client/uploads/resume
POST /api/client/uploads/linkedin
POST /api/client/uploads/portfolio
→ Complete profile
```

### Step 6: Admin Actions
```
Admin approves 20Q
→ Client gets notification
→ Client can now view applications

Admin confirms strategy call
→ Client gets notification with details
```

### Step 7: View Applications
```
GET /api/applications
→ See all applications admin created
→ Track status (applied, interview, offer)
```

---

## 🔒 Authentication Example

```javascript
// Login first
const loginResponse = await fetch(
  'https://jellyfish-app-t4m35.ondigitalocean.app/api/auth/login',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'client@example.com',
      password: 'password123'
    })
  }
);

const { token } = await loginResponse.json();

// Use token for all client endpoints
const dashboardResponse = await fetch(
  'https://jellyfish-app-t4m35.ondigitalocean.app/api/client/dashboard',
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

const dashboardData = await dashboardResponse.json();
```

---

## ⚠️ Important Notes

1. **Read-Only Applications**: Clients can only VIEW applications, not create them. Only admin can create applications.

2. **20Q One-Time**: Client can only submit 20 Questions once. After submission, they must wait for admin approval.

3. **Strategy Call**: Client can book one strategy call. After admin confirms, status updates automatically.

4. **File Uploads**: Resume replaces existing if uploaded again. LinkedIn and portfolio can have multiple entries.

5. **Progress Tracking**: Dashboard automatically calculates progress based on completed steps.

---

## 📋 Summary

**Total Client Endpoints**: 13

**Main Dashboard**: 1 endpoint (returns everything)  
**20 Questions**: 2 endpoints (status, submit)  
**File Uploads**: 4 endpoints (status, resume, linkedin, portfolio)  
**Strategy Calls**: 2 endpoints (book, status)  
**Applications**: 2 endpoints (list, stats)  
**Notifications**: 2 endpoints (list, mark read)

---

**Created**: February 9, 2026  
**Status**: Production Ready  
**Base URL**: https://jellyfish-app-t4m35.ondigitalocean.app

