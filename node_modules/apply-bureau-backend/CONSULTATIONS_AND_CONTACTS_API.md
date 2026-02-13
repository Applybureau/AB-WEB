# 📞📅 CONSULTATIONS & CONTACTS API DOCUMENTATION

## 🔗 Base URL
```
https://apply-bureau-backend.vercel.app
```

## 🔐 Authentication
Admin endpoints require Bearer token authentication:
```
Authorization: Bearer <admin_token>
```


---

# 📞 CONTACTS SYSTEM

The Contacts system handles general inquiries, questions, and contact form submissions from the website. These are stored in the `contact_requests` table and are completely separate from consultation requests.

## 🌐 Public Contact Endpoints

### 1. **Submit Contact Form**
**Endpoint:** `POST /api/contact`

**Use Case:** Main website contact form submission for general inquiries

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "+1234567890",
  "subject": "General Inquiry about Services",
  "message": "I'm interested in learning more about your career services and pricing options.",
  "company": "Tech Solutions Inc"
}
```

**Alternative Field Names Supported:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "full_name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "+1234567890",
  "subject": "General Inquiry",
  "message": "Your inquiry message here",
  "company": "Optional company name",
  "country": "Optional country",
  "position": "Optional job position"
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
- `400` - Missing required fields (name, email, message) or invalid email
- `500` - Server error

---

## 🔒 Admin Contact Endpoints

### 2. **Get All Contact Requests**
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
?page=1&limit=10&status=pending&search=john
```

**Available Status Values:**
- `pending` - New contact request awaiting review
- `in_progress` - Currently being handled
- `handled` - Completed/responded to
- `archived` - Archived for record keeping

**Response Format:**
```json
{
  "contacts": [
    {
      "id": "e1a19d78-facf-42fb-8bf6-bb8eaf935c5e",
      "name": "John Smith",
      "first_name": "John",
      "last_name": "Smith",
      "email": "john.smith@example.com",
      "phone": "+1234567890",
      "subject": "General Inquiry about Services",
      "message": "I'm interested in learning more about your career services and pricing options.",
      "company": "Tech Solutions Inc",
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
    "total": 10,
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
      "name": "Jane Doe",
      "first_name": "Jane",
      "last_name": "Doe",
      "email": "jane.doe@example.com",
      "phone": "+1987654321",
      "company": "Marketing Agency",
      "message": "Interested in your resume optimization services",
      "subject": "Resume Services Inquiry",
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
  "total": 10,
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
  "admin_notes": "Responded via email with detailed service information and pricing"
}
```

**Response Format:**
```json
{
  "message": "Contact submission updated successfully",
  "contact": {
    "id": "e1a19d78-facf-42fb-8bf6-bb8eaf935c5e",
    "status": "handled",
    "admin_notes": "Responded via email with detailed service information and pricing",
    "updated_at": "2026-01-21T10:30:00.000Z"
  }
}
```

---

# 📅 CONSULTATIONS SYSTEM

The Consultations system handles consultation booking requests where prospects want to schedule a meeting to discuss their career needs. These are stored in the `consultations` table and include time slot preferences.

## 🌐 Public Consultation Endpoints

### 5. **Request Consultation Booking**
**Endpoint:** `POST /api/public-consultations`

**Use Case:** Main website consultation booking form for scheduling meetings

**Request Body (Minimal):**
```json
{
  "full_name": "Sarah Johnson",
  "email": "sarah.johnson@example.com",
  "phone": "+1555123456"
}
```

**Request Body (With Message):**
```json
{
  "full_name": "Sarah Johnson",
  "email": "sarah.johnson@example.com",
  "phone": "+1555123456",
  "message": "I need help with interview preparation and resume optimization for senior software engineer roles."
}
```

**Request Body (Complete with Time Slots):**
```json
{
  "full_name": "Sarah Johnson",
  "email": "sarah.johnson@example.com",
  "phone": "+1555123456",
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

**Time Slot Format:**
- `date`: YYYY-MM-DD format
- `time`: HH:MM format (24-hour)
- Maximum 3 preferred time slots
- Time slots are optional - can submit without them

**Response Format:**
```json
{
  "id": "50f72867-4df4-46cf-bcd6-ef99314d84f8",
  "status": "pending",
  "admin_status": "pending",
  "message": "Request received. We will confirm your consultation shortly.",
  "booking_details": {
    "name": "Sarah Johnson",
    "email": "sarah.johnson@example.com",
    "phone": "+1555123456",
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
  },
  "next_steps": "Our team will review your request and contact you within 24 hours to confirm your consultation time."
}
```

**Status Codes:**
- `201` - Success
- `400` - Missing required fields (full_name, email, phone) or invalid data
- `500` - Server error

---

## 🔒 Admin Consultation Endpoints

### 6. **Get All Consultation Requests**
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
- `all` - All consultation requests
- `pending` - Awaiting admin review/action
- `confirmed` - Approved and scheduled (status: 'scheduled')
- `completed` - Consultation finished
- `rescheduled` - Needs new time slots
- `waitlisted` - No current availability

**Response Format:**
```json
{
  "consultations": [
    {
      "id": "50f72867-4df4-46cf-bcd6-ef99314d84f8",
      "prospect_name": "Sarah Johnson",
      "prospect_email": "sarah.johnson@example.com",
      "prospect_phone": "+1555123456",
      "message": "I need help with interview preparation and resume optimization for senior software engineer roles.",
      "client_reason": "Need comprehensive career guidance",
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
      ],
      "status": "pending",
      "admin_status": "pending",
      "scheduled_at": "2026-01-21T08:39:30.081785+00:00",
      "consultation_type": "general_consultation",
      "duration_minutes": 60,
      "meeting_link": null,
      "admin_notes": null,
      "package_interest": "Tier 2",
      "country": "Not specified",
      "created_at": "2026-01-21T08:39:30.081785+00:00",
      "updated_at": "2026-01-21T08:39:30.081785+00:00",
      
      // Formatted fields for dashboard display
      "name": "Sarah Johnson",
      "email": "sarah.johnson@example.com",
      "phone": "+1555123456",
      "booking_details": {
        "name": "Sarah Johnson",
        "email": "sarah.johnson@example.com",
        "phone": "+1555123456",
        "message": "I need help with interview preparation and resume optimization for senior software engineer roles."
      },
      "time_slots": [
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
      ],
      "has_time_slots": true,
      "display_message": "I need help with interview preparation and resume optimization for senior software engineer roles."
    }
  ],
  "total": 6,
  "offset": 0,
  "limit": 50,
  "status_counts": {
    "pending": 6,
    "confirmed": 0,
    "rescheduled": 0,
    "waitlisted": 0,
    "completed": 0
  },
  "gatekeeper_actions": ["confirm", "reschedule", "waitlist"],
  "dashboard_fields": ["prospect_name", "prospect_email", "prospect_phone", "message", "time_slots", "status"]
}
```

### 7. **Confirm Consultation (Gatekeeper Action)**
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

**Parameters:**
- `selected_slot_index`: Integer (0, 1, or 2) - which of the 3 preferred slots to confirm
- `meeting_details`: String - description of the meeting
- `meeting_link`: String - video call link (optional)
- `admin_notes`: String - internal admin notes (optional)

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

### 8. **Reschedule Consultation (Gatekeeper Action)**
**Endpoint:** `POST /api/admin/concierge/consultations/:id/reschedule`

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
  "reschedule_reason": "Admin unavailable at requested times. Please provide 3 new time slots."
}
```

### 9. **Waitlist Consultation (Gatekeeper Action)**
**Endpoint:** `POST /api/admin/concierge/consultations/:id/waitlist`

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
  "waitlist_reason": "No availability in requested timeframe. Will contact when slots open up."
}
```

---

# 📊 DATABASE SCHEMAS

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
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(id),
  prospect_name TEXT NOT NULL,
  prospect_email TEXT NOT NULL,
  prospect_phone TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  consultation_type TEXT DEFAULT 'general_consultation' CHECK (consultation_type IN ('initial', 'follow_up', 'strategy', 'review', 'general_consultation')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'pending', 'confirmed')),
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT,
  meeting_notes TEXT,
  client_reason TEXT,
  admin_notes TEXT,
  package_interest TEXT,
  current_situation TEXT,
  timeline TEXT,
  urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
  preferred_slots JSONB DEFAULT '[]'::jsonb,
  country TEXT DEFAULT 'Not specified',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
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

# ✅ WORKING ENDPOINTS SUMMARY

## 📞 **CONTACTS (100% Working)**
- ✅ `POST /api/contact` - Submit contact form
- ✅ `GET /api/contact` - List contacts (admin)
- ✅ `GET /api/contact-requests` - Alternative contact list
- ✅ `PATCH /api/contact/:id` - Update contact status

## 📅 **CONSULTATIONS (100% Working)**
- ✅ `POST /api/public-consultations` - Create consultation request
- ✅ `GET /api/admin/concierge/consultations` - List consultations
- ✅ `POST /api/admin/concierge/consultations/:id/confirm` - Confirm consultation
- ✅ `POST /api/admin/concierge/consultations/:id/reschedule` - Reschedule consultation
- ✅ `POST /api/admin/concierge/consultations/:id/waitlist` - Waitlist consultation

---

# 🚀 KEY FEATURES

## ✅ **Data Separation**
- Contacts and consultations are stored in separate tables
- No data mixing between systems
- Independent workflows and status management

## ✅ **Flexible Time Slots**
- Consultations support 0-3 preferred time slots
- Proper date/time format validation
- Admin can select which slot to confirm

## ✅ **Gatekeeper Actions**
- Admins can confirm, reschedule, or waitlist consultations
- Email notifications sent automatically
- Status tracking and admin notes

## ✅ **Email Notifications**
- Automatic confirmation emails to clients
- Admin notification emails
- Status update notifications

## ✅ **Admin Dashboard Integration**
- Real-time status counts
- Filtering and sorting options
- Pagination support

---

**🚀 All endpoints are live and functional on Vercel!**

**Base URL:** `https://apply-bureau-backend.vercel.app`

**Admin Login:** `israelloko65@gmail.com` / `admin123`