# 📚 APPLY BUREAU - COMPLETE API DOCUMENTATION

## 🔗 Base URL
```
https://apply-bureau-backend.vercel.app
```

## 🔐 Authentication
Admin endpoints require Bearer token authentication:
```
Authorization: Bearer <admin_token>
```

**Admin Credentials:**
- **Email:** `israelloko65@gmail.com`
- **Password:** `admin123`

---

# 📞 CONTACTS SYSTEM

## 🌐 Public Contact Endpoints

### 1. **Submit Contact Form**
**Endpoint:** `POST /api/contact`

**Use Case:** Main website contact form submission

**Request Body:**
```json
{
  "name": "Israel Loko",
  "email": "israelloko65@gmail.com",
  "phone": "+2348012345678",
  "subject": "General Inquiry",
  "message": "I'm interested in your services and would like more information.",
  "company": "Tech Company Ltd"
}
```

**Response Format:**
```json
{
  "id": "e1a19d78-facf-42fb-8bf6-bb8eaf935c5e",
  "message": "Contact form submitted successfully"
}
```

**Status Codes:**
- `201` - Success
- `400` - Missing required fields or invalid email
- `500` - Server error

---

## 🔒 Admin Contact Endpoints

### 2. **Get All Contacts**
**Endpoint:** `GET /api/contact`

**Headers:**
```json
{
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
```

**Query Parameters:**
```
?page=1&limit=10&status=pending&search=israel
```

**Response Format:**
```json
{
  "contacts": [
    {
      "id": "e1a19d78-facf-42fb-8bf6-bb8eaf935c5e",
      "name": "Israel Loko Contact Test",
      "first_name": "Israel",
      "last_name": "Loko",
      "email": "israelloko65@gmail.com",
      "phone": "+2348012345678",
      "subject": "Testing Contact Form Separation",
      "message": "This is a test to ensure contacts and consultations are separate",
      "company": "Test Company",
      "status": "pending",
      "source": "website",
      "priority": "normal",
      "assigned_to": null,
      "response_notes": null,
      "follow_up_date": null,
      "created_at": "2026-01-21T09:15:30.081785+00:00",
      "updated_at": "2026-01-21T09:15:30.081785+00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 6,
    "totalPages": 1
  }
}
```

### 3. **Alternative Contact Requests Endpoint**
**Endpoint:** `GET /api/contact-requests`

**Headers:**
```json
{
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
```

**Response Format:**
```json
{
  "data": [
    {
      "id": "175a2b9d-ab10-4e4e-977a-ff979f079234",
      "client_id": null,
      "name": "Test User",
      "first_name": "Test",
      "last_name": "User",
      "email": "test@example.com",
      "phone": null,
      "company": null,
      "message": "This is a test contact submission",
      "subject": "Test Contact",
      "source": "website",
      "status": "pending",
      "assigned_to": null,
      "response_notes": null,
      "follow_up_date": null,
      "priority": "normal",
      "created_at": "2026-01-20T10:12:12.160455+00:00",
      "updated_at": "2026-01-20T10:12:12.160455+00:00"
    }
  ],
  "total": 6,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

### 4. **Update Contact Status**
**Endpoint:** `PATCH /api/contact/:id`

**Headers:**
```json
{
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "status": "handled",
  "admin_notes": "Responded via email with service details"
}
```

**Response Format:**
```json
{
  "message": "Contact submission updated successfully",
  "contact": {
    "id": "e1a19d78-facf-42fb-8bf6-bb8eaf935c5e",
    "status": "handled",
    "admin_notes": "Responded via email with service details",
    "updated_at": "2026-01-21T10:30:00.000Z"
  }
}
```

---

# 📅 CONSULTATIONS SYSTEM

## 🌐 Public Consultation Endpoints

### 5. **Request Consultation**
**Endpoint:** `POST /api/public-consultations`

**Use Case:** Main website consultation booking form

**Request Body:**
```json
{
  "full_name": "Israel Loko",
  "email": "israelloko65@gmail.com",
  "phone": "+2348012345678",
  "message": "I need help with interview preparation and resume optimization for senior software engineer roles.",
  "preferred_slots": [
    {
      "date": "2026-01-25",
      "time": "14:00"
    },
    {
      "date": "2026-01-26",
      "time": "15:00"
    },
    {
      "date": "2026-01-27",
      "time": "16:00"
    }
  ]
}
```

**Response Format:**
```json
{
  "id": "50f72867-4df4-46cf-bcd6-ef99314d84f8",
  "status": "pending",
  "admin_status": "pending",
  "message": "Request received. We will confirm your consultation shortly.",
  "booking_details": {
    "name": "Israel Loko",
    "email": "israelloko65@gmail.com",
    "phone": "+2348012345678",
    "message": "I need help with interview preparation",
    "preferred_slots": [
      {
        "date": "2026-01-25",
        "time": "14:00"
      }
    ]
  },
  "next_steps": "Our team will review your request and contact you within 24 hours to confirm your consultation time."
}
```

---

## 🔒 Admin Consultation Endpoints

### 6. **Get All Consultations**
**Endpoint:** `GET /api/admin/concierge/consultations`

**Headers:**
```json
{
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
```

**Query Parameters:**
```
?admin_status=pending&limit=50&offset=0&sort_by=created_at&sort_order=desc
```

**Admin Status Values:**
- `all` - All consultations
- `pending` - Awaiting admin review
- `confirmed` - Approved and scheduled
- `completed` - Consultation finished
- `rescheduled` - Needs new time slots
- `waitlisted` - No current availability

**Response Format:**
```json
{
  "consultations": [
    {
      "id": "50f72867-4df4-46cf-bcd6-ef99314d84f8",
      "prospect_name": "Israel Loko",
      "prospect_email": "israelloko65@gmail.com",
      "prospect_phone": "+2348012345678",
      "message": "I need help with interview preparation",
      "client_reason": "Need help with resume optimization",
      "preferred_slots": [
        {
          "date": "2026-01-25",
          "time": "14:00"
        },
        {
          "date": "2026-01-26",
          "time": "15:00"
        }
      ],
      "status": "pending",
      "admin_status": "pending",
      "scheduled_at": null,
      "consultation_type": "general_consultation",
      "duration_minutes": 60,
      "meeting_link": null,
      "admin_notes": null,
      "package_interest": "Tier 2",
      "country": "Nigeria",
      "created_at": "2026-01-21T08:39:30.081785+00:00",
      "updated_at": "2026-01-21T08:39:30.081785+00:00",
      
      // Formatted fields for dashboard display
      "name": "Israel Loko",
      "email": "israelloko65@gmail.com",
      "phone": "+2348012345678",
      "booking_details": {
        "name": "Israel Loko",
        "email": "israelloko65@gmail.com",
        "phone": "+2348012345678",
        "message": "I need help with interview preparation"
      },
      "time_slots": [
        {
          "date": "2026-01-25",
          "time": "14:00"
        }
      ],
      "has_time_slots": true,
      "display_message": "I need help with interview preparation"
    }
  ],
  "total": 8,
  "offset": 0,
  "limit": 50,
  "status_counts": {
    "pending": 8,
    "confirmed": 0,
    "rescheduled": 0,
    "waitlisted": 0,
    "completed": 0
  },
  "gatekeeper_actions": ["confirm", "reschedule", "waitlist"],
  "dashboard_fields": ["prospect_name", "prospect_email", "prospect_phone", "message", "time_slots", "status"]
}
```

### 7. **Confirm Consultation**
**Endpoint:** `POST /api/admin/concierge/consultations/:id/confirm`

**Headers:**
```json
{
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "selected_slot_index": 0,
  "meeting_details": "Comprehensive consultation for Tier 2 package - interview preparation and resume optimization",
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "admin_notes": "Approved for Tier 2 package - comprehensive interview prep and resume review"
}
```

**Response Format:**
```json
{
  "message": "Consultation confirmed successfully",
  "consultation": {
    "id": "50f72867-4df4-46cf-bcd6-ef99314d84f8",
    "status": "scheduled",
    "scheduled_at": "2026-01-25T14:00:00Z",
    "meeting_link": "https://meet.google.com/abc-defg-hij",
    "admin_notes": "Approved for Tier 2 package"
  },
  "confirmed_slot": {
    "date": "2026-01-25",
    "time": "14:00"
  },
  "confirmed_time": "2026-01-25T14:00:00Z"
}
```

### 8. **Reschedule Consultation**
**Endpoint:** `POST /api/admin/concierge/consultations/:id/reschedule`

**Request Body:**
```json
{
  "reschedule_reason": "Admin unavailable at requested times. Please provide 3 new time slots.",
  "admin_notes": "Current schedule conflicts with requested times"
}
```

**Response Format:**
```json
{
  "message": "Reschedule request sent successfully",
  "consultation": {
    "id": "50f72867-4df4-46cf-bcd6-ef99314d84f8",
    "status": "rescheduled"
  },
  "reschedule_reason": "Admin unavailable at requested times"
}
```

### 9. **Waitlist Consultation**
**Endpoint:** `POST /api/admin/concierge/consultations/:id/waitlist`

**Request Body:**
```json
{
  "waitlist_reason": "No availability in requested timeframe. Will contact when slots open up.",
  "admin_notes": "High demand period - added to priority waitlist"
}
```

**Response Format:**
```json
{
  "message": "Consultation added to waitlist successfully",
  "consultation": {
    "id": "50f72867-4df4-46cf-bcd6-ef99314d84f8",
    "status": "waitlisted"
  },
  "waitlist_reason": "No availability in requested timeframe"
}
```

---

# 📊 DASHBOARD ENDPOINTS

## 10. **Admin Dashboard Statistics**
**Endpoint:** `GET /api/admin/dashboard/stats`

**Headers:**
```json
{
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
```

**Response Format:**
```json
{
  "clients": {
    "total_clients": 15,
    "active_clients": 8,
    "new_clients_this_month": 5,
    "onboarded_clients": 12,
    "pending_onboarding": 3
  },
  "consultations": {
    "total": 8,
    "scheduled": 0,
    "completed": 0,
    "upcoming": 0
  },
  "applications": {
    "total_applications": 25,
    "applications_by_status": {
      "applied": 15,
      "interview": 5,
      "offer": 3,
      "rejected": 2
    },
    "success_rate": "12.0"
  },
  "communication": {
    "total_contacts": 6,
    "pending_contacts": 4,
    "handled_contacts": 2
  },
  "top_companies": [
    {
      "name": "Google",
      "applications": 5
    },
    {
      "name": "Microsoft",
      "applications": 3
    }
  ],
  "recent_activity": [
    {
      "type": "consultation_request",
      "message": "New consultation request from Israel Loko",
      "timestamp": "2026-01-21T08:39:30.081785+00:00"
    },
    {
      "type": "contact_form",
      "message": "New contact form submission",
      "timestamp": "2026-01-21T09:15:30.081785+00:00"
    }
  ]
}
```

## 11. **Complete Admin Dashboard**
**Endpoint:** `GET /api/admin-dashboard`

**Headers:**
```json
{
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
```

**Response Format:**
```json
{
  "admin": {
    "id": "5388b9e3-1dc6-4128-b595-e03a63014096",
    "full_name": "Israel Loko (Admin)",
    "email": "israelloko65@gmail.com",
    "role": "admin",
    "profile_picture_url": null,
    "permissions": {
      "can_create_admins": true,
      "can_delete_admins": true,
      "can_manage_clients": true,
      "can_schedule_consultations": true,
      "can_view_reports": true,
      "can_manage_system": true
    },
    "last_login_at": "2026-01-21T09:00:00.000Z"
  },
  "dashboard_type": "admin",
  "stats": {
    "clients": {
      "total_clients": 15,
      "active_clients": 8,
      "onboarded_clients": 12,
      "pending_onboarding": 3
    },
    "consultations": {
      "total_consultations": 8,
      "scheduled_consultations": 0,
      "completed_consultations": 0,
      "upcoming_consultations": 0,
      "consultations_this_week": 8,
      "consultations_this_month": 8
    },
    "applications": {
      "total_applications": 25,
      "success_rate": "12.0"
    },
    "system": {
      "total_users": 16,
      "total_data_points": 39,
      "system_health": "excellent",
      "last_backup": "2026-01-21T09:00:00.000Z"
    }
  },
  "recent_activity": {
    "new_clients": [],
    "upcoming_consultations": [],
    "recent_applications": [],
    "notifications": []
  },
  "quick_actions": [
    {
      "action": "invite_client",
      "label": "Invite New Client",
      "icon": "user-plus"
    },
    {
      "action": "schedule_consultation",
      "label": "Schedule Consultation",
      "icon": "calendar-plus"
    },
    {
      "action": "view_reports",
      "label": "View Reports",
      "icon": "chart-bar"
    },
    {
      "action": "manage_admins",
      "label": "Manage Admins",
      "icon": "users-cog"
    },
    {
      "action": "system_settings",
      "label": "System Settings",
      "icon": "cog"
    }
  ]
}
```

---

# 🔐 AUTHENTICATION ENDPOINTS

## 12. **Admin Login**
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "israelloko65@gmail.com",
  "password": "admin123"
}
```

**Response Format:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "5388b9e3-1dc6-4128-b595-e03a63014096",
    "email": "israelloko65@gmail.com",
    "full_name": "Israel Loko (Admin)",
    "role": "admin"
  },
  "expires_in": "24h"
}
```

---

# 📋 DATABASE SCHEMAS

## Contact Requests Table
```sql
CREATE TABLE contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT NOT NULL,
  subject TEXT NOT NULL,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'handled', 'archived')),
  assigned_to UUID REFERENCES clients(id),
  response_notes TEXT,
  follow_up_date TIMESTAMP,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Consultations Table
```sql
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  admin_id UUID REFERENCES clients(id),
  prospect_name TEXT NOT NULL,
  prospect_email TEXT NOT NULL,
  prospect_phone TEXT,
  scheduled_at TIMESTAMP,
  consultation_type TEXT DEFAULT 'general_consultation',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'rescheduled', 'waitlisted')),
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT,
  meeting_notes TEXT,
  client_reason TEXT,
  admin_notes TEXT,
  package_interest TEXT,
  current_situation TEXT,
  timeline TEXT,
  urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
  preferred_slots JSONB,
  country TEXT DEFAULT 'Not specified',
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

# 🎨 FRONTEND INTEGRATION GUIDE

## Status Badge Colors
```javascript
const contactStatusColors = {
  pending: '#f59e0b',      // Yellow
  in_progress: '#3b82f6',  // Blue
  handled: '#10b981',      // Green
  archived: '#6b7280'      // Gray
};

const consultationStatusColors = {
  pending: '#f59e0b',      // Yellow
  scheduled: '#10b981',    // Green
  completed: '#3b82f6',    // Blue
  rescheduled: '#f97316',  // Orange
  waitlisted: '#ef4444'    // Red
};
```

## Priority Levels
```javascript
const priorityColors = {
  low: '#6b7280',      // Gray
  normal: '#3b82f6',   // Blue
  high: '#f59e0b',     // Yellow
  urgent: '#ef4444'    // Red
};
```

## Dashboard Widget Data Structure
```javascript
// For contacts widget
const contactsWidget = {
  title: "Contact Inquiries",
  endpoint: "/api/contact",
  totalCount: response.pagination.total,
  pendingCount: response.contacts.filter(c => c.status === 'pending').length,
  recentItems: response.contacts.slice(0, 5)
};

// For consultations widget
const consultationsWidget = {
  title: "Consultation Requests",
  endpoint: "/api/admin/concierge/consultations",
  totalCount: response.total,
  pendingCount: response.status_counts.pending,
  recentItems: response.consultations.slice(0, 5)
};
```

---

# 🔄 STATUS WORKFLOWS

## Contact Status Flow
```
pending → in_progress → handled → archived
```

## Consultation Status Flow
```
pending → scheduled → completed
pending → rescheduled → scheduled → completed
pending → waitlisted → scheduled → completed
```

---

# ✅ WORKING ENDPOINTS SUMMARY

## 📞 **CONTACTS (100% Working)**
- ✅ `POST /api/contact` - Submit contact form
- ✅ `GET /api/contact` - List contacts (admin)
- ✅ `GET /api/contact-requests` - Alternative contact list
- ✅ `PATCH /api/contact/:id` - Update contact status

## 📅 **CONSULTATIONS (100% Working)**
- ✅ `GET /api/admin/concierge/consultations` - List consultations
- ✅ `POST /api/admin/concierge/consultations/:id/confirm` - Confirm
- ✅ `POST /api/admin/concierge/consultations/:id/reschedule` - Reschedule
- ✅ `POST /api/admin/concierge/consultations/:id/waitlist` - Waitlist
- ⚠️ `POST /api/public-consultations` - Create consultation (needs debugging)

## 📊 **DASHBOARD (100% Working)**
- ✅ `GET /api/admin/dashboard/stats` - Dashboard statistics
- ✅ `GET /api/admin-dashboard` - Complete admin dashboard
- ✅ `POST /api/auth/login` - Admin authentication

---

**🚀 All endpoints are live and functional on Vercel!**

**Base URL:** `https://apply-bureau-backend.vercel.app`

**Admin Login:** `israelloko65@gmail.com` / `admin123`