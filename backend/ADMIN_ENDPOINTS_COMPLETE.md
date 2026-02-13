# Admin Dashboard Endpoints - Complete Documentation

**Status**: ✅ ALL ENDPOINTS IMPLEMENTED AND TESTED  
**Date**: February 9, 2026

---

## 📋 Complete Endpoint List

All endpoints require:
- Authentication: `Authorization: Bearer <admin_token>`
- Admin role verification

---

## 1. Strategy Calls Management

### GET /api/admin/strategy-calls
Get all strategy call requests with filtering and pagination.

**Query Parameters**:
- `status` (optional): Filter by status - 'all', 'pending', 'confirmed', 'completed', 'cancelled'
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "strategy_calls": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "preferred_slots": [
        { "date": "2026-02-15", "time": "10:00" },
        { "date": "2026-02-16", "time": "14:00" }
      ],
      "admin_status": "pending",
      "communication_method": null,
      "whatsapp_number": null,
      "meeting_link": null,
      "confirmed_time": null,
      "created_at": "2026-02-09T10:00:00Z"
    }
  ],
  "total": 10,
  "status_counts": {
    "pending": 5,
    "confirmed": 3,
    "completed": 2,
    "cancelled": 0
  },
  "offset": 0,
  "limit": 50
}
```

---

### POST /api/admin/strategy-calls/:id/confirm
Confirm a strategy call with communication method.

**URL Parameters**:
- `id`: Strategy call ID

**Request Body**:
```json
{
  "selected_slot_index": 0,
  "communication_method": "whatsapp",
  "whatsapp_number": "+1234567890",
  "admin_notes": "Optional notes"
}
```

OR

```json
{
  "selected_slot_index": 1,
  "communication_method": "meeting_link",
  "meeting_link": "https://zoom.us/j/123456789",
  "admin_notes": "Optional notes"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Strategy call confirmed successfully",
  "strategy_call": {
    "id": "uuid",
    "admin_status": "confirmed",
    "confirmed_time": "2026-02-15T10:00:00Z",
    "communication_method": "whatsapp",
    "whatsapp_number": "+1234567890"
  }
}
```

---

### PATCH /api/admin/strategy-calls/:id/status
Update strategy call status.

**URL Parameters**:
- `id`: Strategy call ID

**Request Body**:
```json
{
  "status": "completed"
}
```

**Valid statuses**: `pending`, `confirmed`, `completed`, `cancelled`

**Response**:
```json
{
  "success": true,
  "message": "Status updated successfully",
  "strategy_call": { ... }
}
```

---

## 2. 20 Questions Management

### GET /api/admin/onboarding/pending ⭐ NEW
Get all pending 20Q submissions awaiting approval.

**Query Parameters**:
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "pending_submissions": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "clients": {
        "id": "uuid",
        "email": "client@example.com",
        "full_name": "Jane Smith",
        "phone": "+1234567890",
        "profile_picture_url": "https://..."
      },
      "q1": "Software Engineer, Product Manager",
      "q2": "Data Analyst, UX Designer",
      "status": "pending_approval",
      "submitted_at": "2026-02-09T10:00:00Z"
    }
  ],
  "total": 5,
  "offset": 0,
  "limit": 50
}
```

---

### GET /api/admin/clients/:id/onboarding
Get a specific client's 20Q responses.

**URL Parameters**:
- `id`: Client ID

**Response**:
```json
{
  "client": {
    "id": "uuid",
    "email": "client@example.com",
    "full_name": "Jane Smith",
    "onboarding_completed": true,
    "onboarding_approved": false
  },
  "onboarding": {
    "id": "uuid",
    "client_id": "uuid",
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
    "q20": "Looking for remote opportunities",
    "status": "pending_approval",
    "submitted_at": "2026-02-09T10:00:00Z",
    "approved_at": null,
    "approved_by": null
  }
}
```

---

### POST /api/admin/onboarding/:id/approve
Approve a client's 20Q assessment.

**URL Parameters**:
- `id`: Onboarding record ID (not client ID)

**Response**:
```json
{
  "success": true,
  "message": "Onboarding approved successfully"
}
```

**Side Effects**:
- Updates `client_onboarding.status` to 'active'
- Updates `client_onboarding.approved_at` to current timestamp
- Updates `client_onboarding.approved_by` to admin ID
- Updates `clients.onboarding_approved` to true
- Updates `clients.status` to 'active'
- Sends approval email to client
- Creates notification for client

---

## 3. Client Files Management

### GET /api/admin/clients/:id/files
Get all files uploaded by a client.

**URL Parameters**:
- `id`: Client ID

**Response**:
```json
{
  "files": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "file_type": "resume",
      "filename": "john_doe_resume.pdf",
      "file_url": "https://storage.supabase.co/...",
      "file_size": 245678,
      "uploaded_at": "2026-02-09T10:00:00Z",
      "is_active": true
    },
    {
      "id": "uuid",
      "client_id": "uuid",
      "file_type": "linkedin",
      "url": "https://linkedin.com/in/johndoe",
      "created_at": "2026-02-09T10:00:00Z",
      "is_active": true
    }
  ],
  "summary": {
    "resume_uploaded": true,
    "linkedin_added": true,
    "portfolio_added": false,
    "total_files": 2
  }
}
```

---

## 4. Subscription Management

### POST /api/admin/clients/:id/subscription
Assign a subscription plan to a client.

**URL Parameters**:
- `id`: Client ID

**Request Body**:
```json
{
  "plan_id": "uuid",
  "start_date": "2026-02-09"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Subscription assigned successfully",
  "subscription": {
    "id": "uuid",
    "client_id": "uuid",
    "plan_id": "uuid",
    "plan_name": "TIER 1 — Core Application Support",
    "price_cad": 349,
    "start_date": "2026-02-09",
    "end_date": "2026-04-30",
    "status": "active",
    "assigned_by": "admin_uuid",
    "assigned_at": "2026-02-09T10:00:00Z"
  }
}
```

**Side Effects**:
- Deactivates any existing active subscriptions for the client
- Creates notification for client

---

## 5. Complete Client Card

### GET /api/admin/clients/:id/complete
Get ALL client data in a single request (client card).

**URL Parameters**:
- `id`: Client ID

**Response**:
```json
{
  "basic_info": {
    "id": "uuid",
    "full_name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "profile_picture_url": "https://...",
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
    "roles_wanted": "Software Engineer, Product Manager",
    "roles_open_to": "Data Analyst, UX Designer",
    "roles_to_avoid": "Sales, Marketing",
    "work_type": "Remote",
    "location_scope": "North America",
    "target_cities": "Toronto, Vancouver, New York",
    "locations_to_exclude": "None",
    "minimum_salary": "80000",
    "minimum_salary_currency": "CAD",
    "ideal_salary": "100000",
    "ideal_salary_currency": "CAD",
    "contract_roles": "Yes",
    "contract_conditions": "Minimum 6 months",
    "work_authorization": "Canadian Citizen",
    "work_authorization_details": null,
    "visa_sponsorship": "No",
    "willing_to_relocate": "Yes",
    "drivers_license_required": "No",
    "license_type_held": null,
    "industries_to_avoid": "None",
    "disability_status": "Prefer not to say",
    "veteran_status": "No",
    "demographic_self_id": "Prefer not to say",
    "priorities": "Work-life balance, Career growth",
    "additional_notes": "Looking for remote opportunities",
    "status": "active",
    "submitted_at": "2026-02-09T10:00:00Z",
    "approved_at": "2026-02-09T11:00:00Z",
    "approved_by": "admin_uuid"
  },
  "strategy_calls": {
    "total": 2,
    "latest": {
      "id": "uuid",
      "admin_status": "confirmed",
      "confirmed_time": "2026-02-15T10:00:00Z",
      "communication_method": "whatsapp",
      "whatsapp_number": "+1234567890"
    },
    "all": [ ... ]
  },
  "files": {
    "resume": {
      "filename": "jane_smith_resume.pdf",
      "url": "https://storage.supabase.co/...",
      "size": 245678,
      "uploaded_at": "2026-02-09T10:00:00Z"
    },
    "linkedin": {
      "url": "https://linkedin.com/in/janesmith",
      "added_at": "2026-02-09T10:00:00Z"
    },
    "portfolio": [
      {
        "url": "https://janesmith.com",
        "added_at": "2026-02-09T10:00:00Z"
      }
    ],
    "all_files": [ ... ]
  },
  "applications": {
    "stats": {
      "total": 15,
      "applied": 10,
      "interview": 3,
      "offer": 1,
      "rejected": 1
    },
    "recent": [ ... ],
    "total_count": 15
  },
  "subscription": {
    "plan_name": "TIER 1 — Core Application Support",
    "tier": 1,
    "price_cad": 349,
    "duration_weeks": 12,
    "applications_per_week": 5,
    "features": ["Feature 1", "Feature 2"],
    "start_date": "2026-02-09",
    "end_date": "2026-04-30",
    "status": "active",
    "assigned_by": "admin_uuid",
    "assigned_at": "2026-02-09T10:00:00Z"
  },
  "career_profile": {
    "current_job_title": "Software Engineer",
    "current_company": "Tech Corp",
    "years_experience": 5,
    "target_role": "Senior Software Engineer",
    "target_salary_min": 80000,
    "target_salary_max": 100000,
    "preferred_locations": ["Toronto", "Vancouver"],
    "career_goals": "Career growth and leadership",
    "job_search_timeline": "3-6 months"
  }
}
```

---

## 6. Dashboard Statistics

### GET /api/admin/dashboard/stats
Get real-time dashboard statistics.

**Response**:
```json
{
  "clients": {
    "total": 50,
    "active": 35,
    "pending_registration": 5,
    "onboarding_pending": 10
  },
  "strategy_calls": {
    "total": 25,
    "pending": 8,
    "confirmed": 12,
    "completed": 5
  },
  "applications": {
    "total": 500,
    "applied": 350,
    "interview": 100,
    "offer": 50
  },
  "timestamp": "2026-02-09T10:00:00Z"
}
```

---

## 7. Notifications

### GET /api/admin/notifications
Get admin notifications.

**Query Parameters**:
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `unread_only` (optional): Filter unread only - 'true' or 'false'

**Response**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "admin_uuid",
      "user_type": "admin",
      "title": "New Client Registration",
      "message": "Jane Smith has completed registration",
      "type": "client_registered",
      "is_read": false,
      "action_url": "/admin/clients/uuid",
      "created_at": "2026-02-09T10:00:00Z",
      "read_at": null
    }
  ],
  "total": 10,
  "unread_count": 5
}
```

---

### PATCH /api/admin/notifications/:id/read
Mark a notification as read.

**URL Parameters**:
- `id`: Notification ID

**Response**:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

## 8. Client Invitation

### POST /api/admin/clients/invite
Send registration link to a new client.

**Request Body**:
```json
{
  "email": "newclient@example.com",
  "full_name": "New Client",
  "phone": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Registration link sent successfully",
  "client": {
    "id": "uuid",
    "email": "newclient@example.com",
    "full_name": "New Client",
    "registration_link": "https://www.applybureau.com/register?token=abc123..."
  }
}
```

**Side Effects**:
- Creates client record with registration token
- Token expires in 7 days
- Sends registration email
- Creates notification for admin

---

## 🔒 Authentication

All endpoints require:

**Headers**:
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Admin Token Requirements**:
- Valid JWT token
- User role must be 'admin' or 'super_admin'
- Token must not be expired

---

## ⚠️ Error Responses

All endpoints return consistent error responses:

**400 Bad Request**:
```json
{
  "error": "Validation error",
  "details": "Email and full name are required"
}
```

**401 Unauthorized**:
```json
{
  "error": "Invalid token",
  "message": "Authentication failed"
}
```

**403 Forbidden**:
```json
{
  "error": "Access denied",
  "message": "Admin role required"
}
```

**404 Not Found**:
```json
{
  "error": "Client not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal server error",
  "errorId": "abc123..."
}
```

---

## ✅ Testing

All endpoints have been tested and verified:

**Run tests**:
```bash
node backend/test-all-admin-endpoints.js
```

**Expected output**: ✅ ALL ENDPOINT TESTS PASSED!

---

## 📊 Summary

**Total Endpoints**: 13  
**Status**: ✅ ALL IMPLEMENTED  
**Tested**: ✅ ALL PASSING  
**Production Ready**: ✅ YES

---

**Created**: February 9, 2026  
**Last Updated**: February 9, 2026  
**Status**: Production Ready

