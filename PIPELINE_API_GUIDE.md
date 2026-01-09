# Consultation-to-Client Pipeline API Guide

## Overview

The Apply Bureau Pipeline system manages a 4-stage lead lifecycle that transforms website visitors into registered clients. This document covers all new API endpoints, features, and integration details.

## Pipeline Stages

```
┌─────────┐    ┌──────────────┐    ┌──────────┐    ┌────────┐
│  LEAD   │ -> │ UNDER_REVIEW │ -> │ APPROVED │ -> │ CLIENT │
└─────────┘    └──────────────┘    └──────────┘    └────────┘
     │               │                   │              │
  Submit         Email #1            Email #2      Welcome
  Form        (No dashboard)    (Registration     Email
                                    link)
```

## Database Tables

| Table | Purpose |
|-------|---------|
| `consultation_requests` | Leads with pipeline status tracking |
| `contact_requests` | General website inquiries |
| `client_meetings` | Scheduled meetings with leads/clients |
| `registered_users` | Converted clients with passcode auth |

---

## API Endpoints

### Lead Pipeline Endpoints

#### 1. Submit Lead (Public)
```
POST /api/leads
Content-Type: multipart/form-data
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "role_targets": "Senior Software Engineer",
  "location_preferences": "Remote, NYC",
  "minimum_salary": "$150,000",
  "target_market": "Tech",
  "employment_status": "employed",
  "package_interest": "premium",
  "area_of_concern": "Career transition to management",
  "consultation_window": "Next 2 weeks"
}
```

**Alternative Format (Contact Form Style):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "subject": "Career Consultation",
  "message": "I need help with my job search"
}
```

**File Upload:** Include `resume` field for PDF upload

**Response:**
```json
{
  "id": "uuid",
  "status": "lead",
  "message": "Lead submitted successfully",
  "pdf_url": "https://storage.supabase.co/..."
}
```

---

#### 2. Get All Leads (Admin)
```
GET /api/leads
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status (pending, under_review, approved, etc.) |
| `pipeline_status` | string | Filter by pipeline stage (lead, under_review, approved, client, rejected) |
| `search` | string | Search by name or email |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50) |
| `sort` | string | Sort field (default: created_at) |
| `order` | string | Sort order: asc/desc (default: desc) |

**Response:**
```json
{
  "data": [...leads],
  "total": 100,
  "page": 1,
  "limit": 50,
  "totalPages": 2
}
```

---

#### 3. Get Lead Details (Admin)
```
GET /api/leads/:id
Authorization: Bearer <token>
```

**Response:** Full lead object including `pdf_url` for resume viewing

---

#### 4. Mark Lead Under Review (Admin)
```
PATCH /api/leads/:id/review
Authorization: Bearer <token>
```

**Actions:**
- Updates `pipeline_status` to `under_review`
- Sets `reviewed_at` and `reviewed_by`
- **Triggers Email #1** - "Profile Under Review" (NO dashboard link)

**Response:**
```json
{
  "message": "Lead marked as under review",
  "lead": {...}
}
```

---

#### 5. Approve Lead (Admin)
```
PATCH /api/leads/:id/approve
Authorization: Bearer <token>
```

**Actions:**
- Updates `pipeline_status` to `approved`
- Generates JWT registration token (72h expiry)
- Sets `approved_at`, `approved_by`, `registration_token`, `token_expires_at`
- **Triggers Email #2** - "You've Been Selected" (WITH registration link + RED warning)

**Response:**
```json
{
  "message": "Lead approved successfully",
  "lead": {...},
  "registration_url": "https://yoursite.com/register?token=..."
}
```

---

#### 6. Reject Lead (Admin)
```
PATCH /api/leads/:id/reject
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Does not meet current criteria"
}
```

**Response:**
```json
{
  "message": "Lead rejected",
  "lead": {...}
}
```

---

### Registration Endpoints

#### 7. Verify Registration Token (Public)
```
GET /api/register/verify?token=<jwt_token>
```

**Response (Valid):**
```json
{
  "valid": true,
  "email": "john@example.com",
  "full_name": "John Doe",
  "consultation_id": "uuid"
}
```

**Response (Invalid/Expired):**
```json
{
  "error": "Token has expired"
}
```

---

#### 8. Complete Registration (Public)
```
POST /api/register/complete
Content-Type: multipart/form-data
```

**Request Body:**
```json
{
  "token": "<jwt_token>",
  "passcode": "minimum8chars",
  "full_name": "John Doe",
  "age": 30,
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "current_job": "Software Engineer at Google",
  "target_job": "Engineering Manager",
  "country": "United States",
  "location": "San Francisco, CA",
  "years_of_experience": 8,
  "phone": "+1234567890"
}
```

**File Uploads:**
- `profile_pic` - Profile picture
- `resume` - Updated resume PDF

**Response:**
```json
{
  "message": "Registration completed successfully",
  "user_id": "uuid",
  "status": "client"
}
```

---

### Contact Request Endpoints

#### 9. Submit Contact Request (Public)
```
POST /api/contact-requests
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "subject": "General Inquiry",
  "message": "I have a question about your services"
}
```

---

#### 10. Get Contact Requests (Admin)
```
GET /api/contact-requests
Authorization: Bearer <token>
```

**Query Parameters:** Same as leads (status, search, page, limit, sort, order)

---

#### 11. Update Contact Request (Admin)
```
PATCH /api/contact-requests/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "handled",
  "admin_notes": "Responded via email"
}
```

---

### Meeting Endpoints

#### 12. Schedule Meeting (Admin)
```
POST /api/meetings
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "lead_id": "uuid",
  "meeting_date": "2025-01-15",
  "meeting_time": "14:00",
  "meeting_link": "https://meet.google.com/xxx-xxxx-xxx",
  "notes": "Initial consultation call"
}
```

**Actions:**
- Creates meeting record
- **Triggers Email** - Meeting scheduled notification

---

#### 13. Get All Meetings (Admin)
```
GET /api/meetings
Authorization: Bearer <token>
```

---

#### 14. Update Meeting (Admin)
```
PATCH /api/meetings/:id
Authorization: Bearer <token>
```

---

#### 15. Cancel Meeting (Admin)
```
DELETE /api/meetings/:id
Authorization: Bearer <token>
```

---

## Email Templates

| Template | Trigger | Contains Dashboard Link |
|----------|---------|------------------------|
| `profile_under_review` | Mark as Under Review | ❌ NO |
| `lead_selected` | Approve Lead | ✅ YES (Registration link + RED warning) |
| `meeting_scheduled` | Schedule Meeting | ✅ YES |
| `consultation_rejected` | Reject Lead | ❌ NO |
| `onboarding_completion` | Complete Registration | ✅ YES |

---

## Frontend Integration Examples

### Submit Lead Form
```javascript
const submitLead = async (formData) => {
  const form = new FormData();
  form.append('full_name', formData.name);
  form.append('email', formData.email);
  form.append('phone', formData.phone);
  form.append('role_targets', formData.roleTargets);
  if (formData.resume) {
    form.append('resume', formData.resume);
  }

  const response = await fetch('/api/leads', {
    method: 'POST',
    body: form
  });
  return response.json();
};
```

### Registration Flow
```javascript
// 1. Verify token from URL
const verifyToken = async (token) => {
  const response = await fetch(`/api/register/verify?token=${token}`);
  return response.json();
};

// 2. Complete registration
const completeRegistration = async (data) => {
  const form = new FormData();
  form.append('token', data.token);
  form.append('passcode', data.passcode);
  form.append('full_name', data.fullName);
  // ... other fields

  const response = await fetch('/api/register/complete', {
    method: 'POST',
    body: form
  });
  return response.json();
};
```

### Admin: Manage Leads
```javascript
// Get leads by pipeline status
const getLeadsByStatus = async (pipelineStatus, token) => {
  const response = await fetch(
    `/api/leads?pipeline_status=${pipelineStatus}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.json();
};

// Approve a lead
const approveLead = async (leadId, token) => {
  const response = await fetch(`/api/leads/${leadId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
};
```

---

## Status Values

### Pipeline Status
| Value | Description |
|-------|-------------|
| `lead` | Initial submission |
| `under_review` | Being reviewed by admin |
| `approved` | Approved, awaiting registration |
| `client` | Registered client |
| `rejected` | Application rejected |

### Contact Request Status
| Value | Description |
|-------|-------------|
| `new` | New submission |
| `in_progress` | Being handled |
| `handled` | Completed |
| `archived` | Archived |

---

## Token Security

- Registration tokens are JWT-signed
- 72-hour expiration
- Single-use (invalidated after registration)
- Contains: `consultation_id`, `email`, `full_name`

---

## Files Changed

| File | Purpose |
|------|---------|
| `controllers/leadController.js` | Lead pipeline logic |
| `controllers/contactRequestController.js` | Contact form handling |
| `controllers/meetingController.js` | Meeting scheduling |
| `utils/tokenService.js` | JWT token generation/verification |
| `routes/leads.js` | Lead API routes |
| `routes/registration.js` | Registration routes |
| `routes/contactRequests.js` | Contact request routes |
| `routes/meetings.js` | Meeting routes |
| `emails/templates/profile_under_review.html` | Email #1 template |
| `emails/templates/lead_selected.html` | Email #2 template |
| `PIPELINE_SCHEMA.sql` | Database schema |
