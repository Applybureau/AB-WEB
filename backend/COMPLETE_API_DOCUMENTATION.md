# Apply Bureau - Complete API Documentation

## Table of Contents
1. [Authentication System](#authentication-system)
2. [Token Generation & Management](#token-generation--management)
3. [Application Logging System](#application-logging-system)
4. [Client Dashboard](#client-dashboard)
5. [20 Questions Onboarding](#20-questions-onboarding)
6. [Email System](#email-system)
7. [Consultation Engine](#consultation-engine)
8. [Contact Requests](#contact-requests)
9. [Admin Management](#admin-management)
10. [File Upload System](#file-upload-system)
11. [Notifications System](#notifications-system)
12. [WhatsApp Integration](#whatsapp-integration)

---

## Base URL
- **Production**: `https://jellyfish-app-t4m35.ondigitalocean.app`

---

## Application Management Workflow

### How Applications Work

**Admin-Managed Process**:
1. Admin selects a client from the admin dashboard
2. Admin creates an application on behalf of the client
3. System automatically sends email notification to the client
4. Client receives email and can view the application in their dashboard
5. Admin updates application status as it progresses
6. Client receives email notifications for status changes

**Client Access**:
- Clients have **READ-ONLY** access to applications
- Clients can VIEW all applications created for them
- Clients CANNOT create or edit applications themselves
- All application management is done by admins

**Admin Access**:
- Admins can create applications for any client
- Admins can update application status
- Admins can send custom update emails to clients
- Admins can view all applications across all clients

---


## Authentication System

### Login
**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "client|admin|super_admin",
    "full_name": "John Doe"
  }
}
```

### Register Client
**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "client@example.com",
  "password": "securePassword123",
  "full_name": "John Doe",
  "phone": "+1234567890"
}
```

### Verify Email
**Endpoint**: `GET /api/auth/verify-email/:token`

### Password Reset Request
**Endpoint**: `POST /api/auth/forgot-password`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

### Reset Password
**Endpoint**: `POST /api/auth/reset-password/:token`

**Request Body**:
```json
{
  "password": "newPassword123"
}
```

---

## Token Generation & Management

### Generate Secure Token
**Utility Function**: `tokenService.generateSecureToken()`

**Usage**:
```javascript
const { generateSecureToken, verifyToken } = require('./utils/tokenService');

// Generate token
const token = generateSecureToken({
  userId: 'user-uuid',
  email: 'user@example.com',
  purpose: 'email_verification'
}, '24h');

// Verify token
const decoded = verifyToken(token);
```

**Token Types**:
- `email_verification` - Email verification (24h expiry)
- `password_reset` - Password reset (1h expiry)
- `invitation` - Client invitation (7d expiry)
- `onboarding` - Onboarding access (30d expiry)

---

## Application Logging System

### Log Application Activity
**Endpoint**: `POST /api/applications/:applicationId/logs`

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "action": "status_change|document_upload|interview_scheduled|note_added",
  "details": {
    "old_status": "applied",
    "new_status": "interview",
    "notes": "Interview scheduled for next week"
  },
  "metadata": {
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  }
}
```

**Response**:
```json
{
  "success": true,
  "log": {
    "id": "log-uuid",
    "application_id": "app-uuid",
    "action": "status_change",
    "details": {...},
    "created_at": "2026-02-07T10:30:00Z"
  }
}
```

### Get Application Logs
**Endpoint**: `GET /api/applications/:applicationId/logs`

**Query Parameters**:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `action` - Filter by action type

**Response**:
```json
{
  "logs": [
    {
      "id": "log-uuid",
      "action": "status_change",
      "details": {...},
      "performed_by": "admin@example.com",
      "created_at": "2026-02-07T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Get Application Statistics
**Endpoint**: `GET /api/admin/applications/stats`

**Response**:
```json
{
  "total_applications": 150,
  "by_status": {
    "applied": 45,
    "interview": 30,
    "offer": 15,
    "rejected": 60
  },
  "recent_activity": [...]
}
```

---

## Client Dashboard

### Get Dashboard Overview
**Endpoint**: `GET /api/client/dashboard`

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "profile": {
    "id": "client-uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "onboarding_completed": true,
    "tier": "Tier 2"
  },
  "applications": {
    "total": 25,
    "active": 10,
    "interviews": 3,
    "offers": 2
  },
  "upcoming_meetings": [
    {
      "id": "meeting-uuid",
      "title": "Interview with TechCorp",
      "date": "2026-02-10T14:00:00Z",
      "meeting_link": "https://meet.google.com/..."
    }
  ],
  "recent_updates": [...]
}
```

### Get Client Applications (Read-Only)
**Endpoint**: `GET /api/client/applications`

**Note**: Clients can only VIEW applications. Applications are created by admins on behalf of clients.

**Query Parameters**:
- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

**Response**:
```json
{
  "applications": [
    {
      "id": "app-uuid",
      "company_name": "TechCorp Inc.",
      "position_title": "Senior Software Engineer",
      "status": "interview",
      "applied_date": "2026-01-15",
      "last_updated": "2026-02-05",
      "next_steps": "Prepare for technical interview"
    }
  ],
  "pagination": {...}
}
```

### Admin Creates Application for Client
**Endpoint**: `POST /api/admin/applications` or `POST /api/applications` (Admin Only)

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Request Body**:
```json
{
  "client_id": "client-uuid",
  "company_name": "TechCorp Inc.",
  "job_title": "Senior Software Engineer",
  "job_description": "Full stack development role...",
  "job_link": "https://techcorp.com/careers/123",
  "location": "San Francisco, CA",
  "salary_range": "$150k - $200k",
  "job_type": "full-time",
  "application_method": "online",
  "application_strategy": "Applied through company website with tailored resume",
  "admin_notes": "Strong match for client's background"
}
```

**Response**:
```json
{
  "message": "Application created successfully",
  "application": {
    "id": "app-uuid",
    "client_id": "client-uuid",
    "company_name": "TechCorp Inc.",
    "job_title": "Senior Software Engineer",
    "status": "applied",
    "created_at": "2026-02-08T10:00:00Z"
  }
}
```

**Note**: When an admin creates an application, an email notification is automatically sent to the client.

---

## 20 Questions Onboarding

### Get Onboarding Questions
**Endpoint**: `GET /api/client/onboarding/questions`

**Response**:
```json
{
  "questions": [
    {
      "id": 1,
      "question": "What is your current location?",
      "type": "text",
      "required": true,
      "category": "personal"
    },
    {
      "id": 2,
      "question": "What is your target role?",
      "type": "text",
      "required": true,
      "category": "career"
    },
    {
      "id": 3,
      "question": "Years of experience?",
      "type": "number",
      "required": true,
      "category": "career"
    }
    // ... 17 more questions
  ]
}
```

### Submit Onboarding Answers
**Endpoint**: `POST /api/client/onboarding/submit`

**Request Body**:
```json
{
  "answers": {
    "1": "New York, USA",
    "2": "Senior Software Engineer",
    "3": 5,
    "4": ["JavaScript", "Python", "React"],
    "5": "Remote or Hybrid",
    // ... all 20 answers
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "profile_completed": true,
  "next_steps": "Schedule your strategy call"
}
```

### Get Onboarding Status
**Endpoint**: `GET /api/client/onboarding/status`

**Response**:
```json
{
  "completed": true,
  "completed_at": "2026-02-01T15:30:00Z",
  "progress": 100,
  "answers_count": 20
}
```

---

## Email System

### Send Email (Internal Function)
**Utility Function**: `sendEmail(to, templateName, variables)`

**Usage**:
```javascript
const { sendEmail } = require('./utils/email');

await sendEmail(
  'client@example.com',
  'consultation_confirmed',
  {
    client_name: 'John Doe',
    consultation_date: 'Tuesday, March 12, 2026',
    consultation_time: '5:00 PM (EST)',
    meeting_link: 'https://meet.google.com/abc-defg-hij'
  }
);
```

### Available Email Templates
1. **consultation_confirmed** - Consultation booking confirmation
2. **consultation_rescheduled** - Consultation time change
3. **consultation_waitlisted** - Waitlist notification
4. **consultation_rejected** - Consultation declined
5. **consultation_reminder** - Meeting reminder
6. **payment_received_welcome** - Payment confirmation
7. **onboarding_completed** - Onboarding completion
8. **interview_update_enhanced** - Interview status update
9. **strategy_call_confirmed** - Strategy call confirmation
10. **contact_form_received** - Contact form acknowledgment
11. **application_update** - Application status update
12. **admin_welcome** - Admin account creation
13. **admin_password_reset** - Admin password reset
14. **meeting_scheduled** - Meeting scheduled notification
15. **signup_invite** - Client invitation

### Email Template Variables
**Common Variables** (available in all templates):
```javascript
{
  client_name: "John Doe",
  dashboard_url: "https://www.applybureau.com/dashboard",
  support_email: "applybureau@gmail.com",
  company_name: "Apply Bureau",
  current_year: 2026
}
```

**Consultation Templates**:
```javascript
{
  consultation_date: "Tuesday, March 12, 2026",
  consultation_time: "5:00 PM (EST)",
  consultation_duration: "30–45 minutes",
  meeting_link: "https://meet.google.com/...",
  is_whatsapp_call: false,
  client_phone_number: "+1234567890"
}
```

**Application Templates**:
```javascript
{
  company_name: "TechCorp Inc.",
  position_title: "Senior Software Engineer",
  application_status: "interview",
  message: "Your application is progressing well",
  next_steps: "Prepare for technical interview"
}
```

---

## Consultation Engine

### Book Consultation (Public)
**Endpoint**: `POST /api/consultations/book`

**Request Body**:
```json
{
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "client_phone": "+1234567890",
  "preferred_date": "2026-03-12",
  "preferred_time": "17:00",
  "timezone": "EST",
  "consultation_type": "video|whatsapp",
  "package_interest": "Tier 1|Tier 2|Tier 3",
  "current_country": "United States",
  "role_targets": "Software Engineer, Product Manager"
}
```

**Response**:
```json
{
  "success": true,
  "consultation": {
    "id": "consultation-uuid",
    "status": "pending",
    "scheduled_date": "2026-03-12T17:00:00Z",
    "confirmation_sent": true
  },
  "message": "Consultation request received. You'll receive confirmation within 24 hours."
}
```

### Get Consultation Status
**Endpoint**: `GET /api/consultations/:id/status`

**Response**:
```json
{
  "id": "consultation-uuid",
  "status": "confirmed|pending|rejected|completed",
  "scheduled_date": "2026-03-12T17:00:00Z",
  "meeting_link": "https://meet.google.com/...",
  "notes": "Please join 5 minutes early"
}
```

### Admin: Manage Consultations
**Endpoint**: `GET /api/admin/consultations`

**Query Parameters**:
- `status` - Filter by status
- `date_from` - Start date
- `date_to` - End date

**Response**:
```json
{
  "consultations": [
    {
      "id": "consultation-uuid",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "scheduled_date": "2026-03-12T17:00:00Z",
      "status": "confirmed",
      "consultation_type": "video"
    }
  ]
}
```

### Admin: Confirm Consultation
**Endpoint**: `POST /api/admin/consultations/:id/confirm`

**Request Body**:
```json
{
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "notes": "Looking forward to our discussion"
}
```

### Admin: Reschedule Consultation
**Endpoint**: `POST /api/admin/consultations/:id/reschedule`

**Request Body**:
```json
{
  "new_date": "2026-03-15",
  "new_time": "14:00",
  "reason": "Schedule conflict"
}
```

---

## Contact Requests

### Submit Contact Form
**Endpoint**: `POST /api/contact/submit`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subject": "General Inquiry",
  "message": "I'm interested in your services...",
  "preferred_contact_method": "email|phone|whatsapp"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Thank you for contacting us. We'll respond within 24 hours.",
  "reference_id": "contact-uuid"
}
```

### Admin: Get Contact Requests
**Endpoint**: `GET /api/admin/contacts`

**Query Parameters**:
- `status` - new|contacted|resolved
- `page` - Page number
- `limit` - Items per page

**Response**:
```json
{
  "contacts": [
    {
      "id": "contact-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "subject": "General Inquiry",
      "status": "new",
      "created_at": "2026-02-07T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### Admin: Update Contact Status
**Endpoint**: `PATCH /api/admin/contacts/:id`

**Request Body**:
```json
{
  "status": "contacted",
  "notes": "Called and discussed requirements",
  "follow_up_date": "2026-02-10"
}
```

---

## Admin Management

### Get Admin Dashboard
**Endpoint**: `GET /api/admin/dashboard`

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "stats": {
    "total_clients": 150,
    "active_applications": 450,
    "pending_consultations": 12,
    "new_contacts": 8
  },
  "recent_activity": [
    {
      "type": "application_update",
      "client": "John Doe",
      "details": "Status changed to interview",
      "timestamp": "2026-02-07T10:30:00Z"
    }
  ],
  "upcoming_consultations": [...]
}
```

### Create Admin User
**Endpoint**: `POST /api/admin/users/create`

**Headers**:
```
Authorization: Bearer <super_admin_token>
```

**Request Body**:
```json
{
  "email": "admin@applybureau.com",
  "full_name": "Admin User",
  "role": "admin|super_admin",
  "permissions": ["manage_clients", "manage_applications", "view_analytics"]
}
```

### Get All Clients
**Endpoint**: `GET /api/admin/clients`

**Query Parameters**:
- `search` - Search by name or email
- `tier` - Filter by tier
- `status` - active|inactive
- `page` - Page number
- `limit` - Items per page

**Response**:
```json
{
  "clients": [
    {
      "id": "client-uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "tier": "Tier 2",
      "onboarding_completed": true,
      "total_applications": 25,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### Update Client Profile (Admin)
**Endpoint**: `PATCH /api/admin/clients/:id`

**Request Body**:
```json
{
  "tier": "Tier 3",
  "notes": "Premium client - priority support",
  "status": "active"
}
```

---

## File Upload System

### Upload File
**Endpoint**: `POST /api/upload`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data**:
- `file` - File to upload (max 10MB)
- `type` - resume|cover_letter|document|profile_picture
- `application_id` - (optional) Link to application

**Response**:
```json
{
  "success": true,
  "file": {
    "id": "file-uuid",
    "filename": "resume.pdf",
    "url": "https://storage.supabase.co/...",
    "type": "resume",
    "size": 245678,
    "uploaded_at": "2026-02-07T10:30:00Z"
  }
}
```

### Get User Files
**Endpoint**: `GET /api/upload/files`

**Query Parameters**:
- `type` - Filter by file type
- `application_id` - Filter by application

**Response**:
```json
{
  "files": [
    {
      "id": "file-uuid",
      "filename": "resume.pdf",
      "url": "https://storage.supabase.co/...",
      "type": "resume",
      "size": 245678,
      "uploaded_at": "2026-02-07T10:30:00Z"
    }
  ]
}
```

### Delete File
**Endpoint**: `DELETE /api/upload/files/:id`

**Response**:
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

## Notifications System

### Get User Notifications
**Endpoint**: `GET /api/notifications`

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `unread_only` - true|false
- `type` - Filter by notification type
- `page` - Page number
- `limit` - Items per page

**Response**:
```json
{
  "notifications": [
    {
      "id": "notif-uuid",
      "type": "application_update",
      "title": "Application Status Changed",
      "message": "Your application to TechCorp has been updated",
      "read": false,
      "created_at": "2026-02-07T10:30:00Z",
      "data": {
        "application_id": "app-uuid",
        "new_status": "interview"
      }
    }
  ],
  "unread_count": 5,
  "pagination": {...}
}
```

### Mark Notification as Read
**Endpoint**: `PATCH /api/notifications/:id/read`

**Response**:
```json
{
  "success": true,
  "notification": {
    "id": "notif-uuid",
    "read": true,
    "read_at": "2026-02-07T11:00:00Z"
  }
}
```

### Mark All as Read
**Endpoint**: `POST /api/notifications/mark-all-read`

**Response**:
```json
{
  "success": true,
  "marked_count": 12
}
```

### Get Notification Preferences
**Endpoint**: `GET /api/notifications/preferences`

**Response**:
```json
{
  "email_notifications": true,
  "push_notifications": false,
  "notification_types": {
    "application_updates": true,
    "meeting_reminders": true,
    "system_announcements": false
  }
}
```

### Update Notification Preferences
**Endpoint**: `PATCH /api/notifications/preferences`

**Request Body**:
```json
{
  "email_notifications": true,
  "notification_types": {
    "application_updates": true,
    "meeting_reminders": true
  }
}
```

---

## WhatsApp Integration

### Request WhatsApp Consultation
**Endpoint**: `POST /api/consultations/whatsapp`

**Request Body**:
```json
{
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "client_phone": "+1234567890",
  "preferred_date": "2026-03-12",
  "preferred_time": "17:00",
  "timezone": "EST"
}
```

**Response**:
```json
{
  "success": true,
  "consultation": {
    "id": "consultation-uuid",
    "type": "whatsapp",
    "status": "pending",
    "phone_number": "+1234567890"
  },
  "message": "We'll call you on WhatsApp at the scheduled time"
}
```

### WhatsApp Message Utility
**Internal Function**: `sendWhatsAppMessage()`

**Usage**:
```javascript
const { sendWhatsAppMessage } = require('./utils/whatsapp');

await sendWhatsAppMessage(
  '+1234567890',
  'Your consultation is confirmed for March 12 at 5:00 PM EST'
);
```

---

## Data Formats & Schemas

### User Object
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "client|admin|super_admin",
  "phone": "+1234567890",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-02-07T10:30:00Z"
}
```

### Application Object
```json
{
  "id": "uuid",
  "client_id": "uuid",
  "company_name": "TechCorp Inc.",
  "position_title": "Senior Software Engineer",
  "status": "applied|interview|offer|rejected|withdrawn",
  "applied_date": "2026-01-15",
  "job_url": "https://...",
  "location": "San Francisco, CA",
  "salary_range": "$150k - $200k",
  "notes": "Applied through referral",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-02-07T10:30:00Z"
}
```

### Consultation Object
```json
{
  "id": "uuid",
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "client_phone": "+1234567890",
  "scheduled_date": "2026-03-12T17:00:00Z",
  "status": "pending|confirmed|rejected|completed|cancelled",
  "consultation_type": "video|whatsapp",
  "meeting_link": "https://meet.google.com/...",
  "package_interest": "Tier 1|Tier 2|Tier 3",
  "notes": "Client notes",
  "created_at": "2026-02-07T10:00:00Z"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific error details"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` (401) - Invalid or missing authentication token
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request data
- `CONFLICT` (409) - Resource already exists
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

---

## Rate Limiting

- **Public endpoints**: 100 requests per 15 minutes per IP
- **Authenticated endpoints**: 1000 requests per 15 minutes per user
- **Admin endpoints**: 5000 requests per 15 minutes per admin

---

## Pagination

All list endpoints support pagination:

**Query Parameters**:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response Format**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## Webhooks

### Application Status Change
**Event**: `application.status_changed`

**Payload**:
```json
{
  "event": "application.status_changed",
  "timestamp": "2026-02-07T10:30:00Z",
  "data": {
    "application_id": "uuid",
    "client_id": "uuid",
    "old_status": "applied",
    "new_status": "interview",
    "changed_by": "admin@applybureau.com"
  }
}
```

### Consultation Booked
**Event**: `consultation.booked`

**Payload**:
```json
{
  "event": "consultation.booked",
  "timestamp": "2026-02-07T10:30:00Z",
  "data": {
    "consultation_id": "uuid",
    "client_email": "john@example.com",
    "scheduled_date": "2026-03-12T17:00:00Z"
  }
}
```

---

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Email (Resend)
RESEND_API_KEY=re_your_api_key

# Security
JWT_SECRET=your-jwt-secret

# Server
PORT=3000
NODE_ENV=production

# Frontend
FRONTEND_URL=https://www.applybureau.com
BACKEND_URL=https://jellyfish-app-t4m35.ondigitalocean.app

# Admin
ADMIN_EMAIL=applybureau@gmail.com
SUPPORT_EMAIL=support@applybureau.com
```

---

## Testing

### Health Check
**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-07T10:30:00Z",
  "uptime": 86400,
  "version": "1.0.0"
}
```

### API Version
**Endpoint**: `GET /api/version`

**Response**:
```json
{
  "version": "1.0.0",
  "api_version": "v1",
  "environment": "production"
}
```

---

## Support

For API support, contact:
- **Email**: applybureau@gmail.com
- **Documentation**: https://docs.applybureau.com
- **Status Page**: https://status.applybureau.com

---

**Last Updated**: February 7, 2026
**API Version**: 1.0.0
