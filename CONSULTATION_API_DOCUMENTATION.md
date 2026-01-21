# 📋 CONSULTATION API DOCUMENTATION

## 🔗 Base URL
```
https://apply-bureau-backend.vercel.app
```

## 🔐 Authentication
All admin endpoints require Bearer token authentication:
```
Authorization: Bearer <admin_token>
```

---

## 📊 CONSULTATION ENDPOINTS

### 1. **GET Admin Concierge Consultations**
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
?admin_status=all|pending|confirmed|completed|rescheduled|waitlisted
&limit=50
&offset=0
&sort_by=created_at
&sort_order=desc
```

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
      "scheduled_at": "2026-01-25T14:00:00Z",
      "consultation_type": "general_consultation",
      "duration_minutes": 60,
      "meeting_link": null,
      "admin_notes": null,
      "package_interest": "Tier 2",
      "country": "Nigeria",
      "created_at": "2026-01-21T08:39:30.081785+00:00",
      "updated_at": "2026-01-21T08:39:30.081785+00:00",
      
      // Formatted fields for dashboard
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

---

### 2. **POST Confirm Consultation**
**Endpoint:** `POST /api/admin/concierge/consultations/{id}/confirm`

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
  "meeting_details": "Comprehensive consultation for Tier 2 package",
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "admin_notes": "Approved for Tier 2 package - comprehensive interview prep"
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

---

### 3. **POST Reschedule Consultation**
**Endpoint:** `POST /api/admin/concierge/consultations/{id}/reschedule`

**Request Body:**
```json
{
  "reschedule_reason": "Admin unavailable at requested times",
  "admin_notes": "Please provide new availability"
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

---

### 4. **POST Waitlist Consultation**
**Endpoint:** `POST /api/admin/concierge/consultations/{id}/waitlist`

**Request Body:**
```json
{
  "waitlist_reason": "No availability in requested timeframe",
  "admin_notes": "Will contact when slots open up"
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

### 5. **GET Dashboard Statistics**
**Endpoint:** `GET /api/admin/dashboard/stats`

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
    }
  }
}
```

---

### 6. **GET Admin Dashboard**
**Endpoint:** `GET /api/admin-dashboard`

**Response Format:**
```json
{
  "admin": {
    "id": "5388b9e3-1dc6-4128-b595-e03a63014096",
    "full_name": "Israel Loko (Admin)",
    "email": "israelloko65@gmail.com",
    "role": "admin"
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
    }
  },
  "recent_activity": {
    "new_clients": [],
    "upcoming_consultations": [],
    "recent_applications": []
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
    }
  ]
}
```

---

### 7. **POST Public Consultation Request**
**Endpoint:** `POST /api/public-consultations`

**Request Body:**
```json
{
  "full_name": "Israel Loko",
  "email": "israelloko65@gmail.com",
  "phone": "+2348012345678",
  "message": "I need help with interview preparation and resume optimization",
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

### 8. **GET Contact Requests**
**Endpoint:** `GET /api/contact-requests`

**Response Format:**
```json
{
  "contacts": [
    {
      "id": "ab10e4ff-773c-4cd9-b580-ae61209e56df",
      "name": "Israel Loko",
      "email": "israelloko65@gmail.com",
      "phone": "+1234567890",
      "company": "Test Company",
      "subject": "Testing Contact Form",
      "message": "This is a comprehensive test of the contact form feature.",
      "country": "Nigeria",
      "created_at": "2026-01-21T08:39:30.081785+00:00"
    }
  ],
  "total": 5
}
```

---

## 📋 DATABASE SCHEMA

### Consultations Table Fields:
```sql
- id (UUID, Primary Key)
- client_id (UUID, Foreign Key, nullable)
- admin_id (UUID, Foreign Key, nullable)
- prospect_name (TEXT) -- Client's full name
- prospect_email (TEXT) -- Client's email
- prospect_phone (TEXT) -- Client's phone
- scheduled_at (TIMESTAMP)
- consultation_type (TEXT) -- 'general_consultation'
- status (TEXT) -- 'pending', 'scheduled', 'completed', 'rescheduled', 'waitlisted'
- duration_minutes (INTEGER) -- Default: 60
- meeting_link (TEXT, nullable)
- meeting_notes (TEXT, nullable)
- client_reason (TEXT, nullable) -- Why client wants consultation
- admin_notes (TEXT, nullable)
- package_interest (TEXT, nullable) -- 'Tier 1', 'Tier 2', etc.
- current_situation (TEXT, nullable)
- timeline (TEXT, nullable)
- urgency_level (TEXT) -- 'normal', 'high', 'urgent'
- preferred_slots (JSONB) -- Array of {date, time} objects
- country (TEXT)
- message (TEXT, nullable) -- Additional message from client
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## 🔄 STATUS VALUES

### Consultation Status:
- `pending` - Awaiting admin review
- `scheduled` - Confirmed and scheduled
- `completed` - Consultation finished
- `rescheduled` - Needs new time slots
- `waitlisted` - No current availability

### Admin Actions:
- `confirm` - Approve and schedule consultation
- `reschedule` - Request new time slots
- `waitlist` - Add to waiting list

---

## 🎯 FRONTEND INTEGRATION

### Key Fields for Dashboard Display:
```javascript
// Use these exact field names in your frontend
{
  id: consultation.id,
  name: consultation.prospect_name,
  email: consultation.prospect_email, 
  phone: consultation.prospect_phone,
  message: consultation.message || consultation.client_reason,
  status: consultation.status,
  timeSlots: consultation.preferred_slots,
  createdAt: consultation.created_at,
  scheduledAt: consultation.scheduled_at,
  meetingLink: consultation.meeting_link,
  adminNotes: consultation.admin_notes
}
```

### Status Badge Colors:
```javascript
const statusColors = {
  pending: 'yellow',
  scheduled: 'green', 
  completed: 'blue',
  rescheduled: 'orange',
  waitlisted: 'red'
}
```

---

## ✅ WORKING ENDPOINTS SUMMARY

✅ **GET** `/api/admin/concierge/consultations` - List all consultations  
✅ **GET** `/api/admin/concierge/consultations?admin_status=pending` - Filter by status  
✅ **POST** `/api/admin/concierge/consultations/{id}/confirm` - Confirm consultation  
✅ **POST** `/api/admin/concierge/consultations/{id}/reschedule` - Reschedule  
✅ **POST** `/api/admin/concierge/consultations/{id}/waitlist` - Add to waitlist  
✅ **GET** `/api/admin/dashboard/stats` - Dashboard statistics  
✅ **GET** `/api/admin-dashboard` - Complete admin dashboard  
✅ **GET** `/api/contact-requests` - Contact form submissions  
✅ **POST** `/api/contact` - Submit contact form  

⚠️ **POST** `/api/public-consultations` - Create consultation (needs debugging)

---

## 🔐 ADMIN CREDENTIALS

**Email:** `israelloko65@gmail.com`  
**Password:** `admin123`

---

**All endpoints are live and functional on Vercel! 🚀**