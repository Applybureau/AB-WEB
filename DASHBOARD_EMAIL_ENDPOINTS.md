# Dashboard Email Trigger Endpoints

This document maps all admin dashboard buttons/actions to their corresponding API endpoints that trigger email notifications.

---

## 🎯 Admin Dashboard Actions

### 1. Invite Client (Send Signup Invite)
**Button**: "Invite Client" / "Send Invitation"  
**Email**: `signup_invite`  
**Endpoint**: `POST /api/auth/invite`  
**File**: `backend/controllers/authController.js`

```http
POST /api/auth/invite
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "client@example.com",
  "full_name": "David Johnson"
}
```

**Email Sent To**: Client  
**Email Contains**: Registration link with token

---

### 2. Approve Consultation Request
**Button**: "Approve" / "Confirm"  
**Email**: `consultation_approved`  
**Endpoint**: `PATCH /api/consultation-requests/:id`  
**File**: `backend/routes/consultationRequests.js`

```http
PATCH /api/consultation-requests/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "approved",
  "meeting_link": "https://meet.google.com/abc-defg-hij"
}
```

**Email Sent To**: Client  
**Email Contains**: Approval confirmation, meeting link

---

### 3. Reject Consultation Request
**Button**: "Reject" / "Decline"  
**Email**: `consultation_rejected`  
**Endpoint**: `PATCH /api/consultation-requests/:id`  
**File**: `backend/routes/consultationRequests.js`

```http
PATCH /api/consultation-requests/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "rejected",
  "rejection_reason": "Unfortunately, we are fully booked..."
}
```

**Email Sent To**: Client  
**Email Contains**: Rejection reason, alternative actions

---

### 4. Confirm Consultation (Concierge)
**Button**: "Confirm Consultation"  
**Email**: `consultation_confirmed_concierge`  
**Endpoint**: `POST /api/admin/concierge/consultations/:id/confirm`  
**File**: `backend/routes/adminConcierge.js`

```http
POST /api/admin/concierge/consultations/:id/confirm
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "selected_slot": "slot_1",
  "meeting_link": "https://zoom.us/j/123456789",
  "zoom_link": "https://zoom.us/j/123456789"
}
```

**Email Sent To**: Client  
**Email Contains**: Confirmed date/time, meeting link, Zoom link

---

### 5. Schedule Meeting
**Button**: "Schedule Meeting"  
**Email**: `meeting_scheduled`  
**Endpoint**: `POST /api/meetings`  
**File**: `backend/controllers/meetingController.js`

```http
POST /api/meetings
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "lead_id": "uuid",
  "scheduled_date": "2026-01-20T10:00:00Z",
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "meeting_type": "Initial Consultation"
}
```

**Email Sent To**: Client  
**Email Contains**: Meeting date, time, link, type

---

### 6. Mark Lead as "Under Review"
**Button**: "Review Profile"  
**Email**: `profile_under_review`  
**Endpoint**: `PATCH /api/leads/:id/review`  
**File**: `backend/controllers/leadController.js`

```http
PATCH /api/leads/:id/review
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "under_review"
}
```

**Email Sent To**: Client  
**Email Contains**: Review timeline, what to expect

---

### 7. Select Lead (Approve)
**Button**: "Select Lead" / "Approve"  
**Email**: `lead_selected`  
**Endpoint**: `PATCH /api/leads/:id/select`  
**File**: `backend/controllers/leadController.js`

```http
PATCH /api/leads/:id/select
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "selected"
}
```

**Email Sent To**: Client  
**Email Contains**: Selection confirmation, registration link, next steps

---

### 8. Unlock Client Profile
**Button**: "Unlock Profile"  
**Email**: `profile_unlocked`  
**Endpoint**: `POST /api/admin/onboarding-triggers/:userId/unlock-profile`  
**File**: `backend/routes/adminOnboardingTriggers.js`

```http
POST /api/admin/onboarding-triggers/:userId/unlock-profile
Authorization: Bearer <admin-token>
```

**Email Sent To**: Client  
**Email Contains**: Unlock confirmation, dashboard access

---

### 9. Confirm Payment
**Button**: "Confirm Payment"  
**Email**: `payment_confirmed_welcome_concierge`  
**Endpoint**: `POST /api/admin/concierge/payment-confirmation`  
**File**: `backend/routes/adminConcierge.js`

```http
POST /api/admin/concierge/payment-confirmation
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "client_email": "client@example.com",
  "client_name": "David Johnson",
  "payment_amount": "$500",
  "payment_date": "2026-01-15"
}
```

**Email Sent To**: Client  
**Email Contains**: Payment confirmation, registration link

---

### 10. Update Application Status
**Button**: "Update Status" (in Application Tracker)  
**Email**: `application_status_update`  
**Endpoint**: `PATCH /api/applications/:id`  
**File**: `backend/routes/applications.js`

```http
PATCH /api/applications/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "interview_scheduled",
  "status_details": "Your interview is scheduled for..."
}
```

**Email Sent To**: Client  
**Email Contains**: Company, position, new status, details

---

### 11. Send Message to Client
**Button**: "Send Message"  
**Email**: `message_notification`  
**Endpoint**: `POST /api/admin/messages`  
**File**: `backend/controllers/adminController.js`

```http
POST /api/admin/messages
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "client_id": "uuid",
  "subject": "Update on your application",
  "message": "Hi David, I wanted to follow up..."
}
```

**Email Sent To**: Client  
**Email Contains**: Message preview, link to view full message

---

## 📧 Automatic Email Triggers (No Button)

### 12. Contact Form Submission (Public)
**Trigger**: User submits contact form  
**Emails**: 
- `contact_form_received` (to client)
- `new_contact_submission` (to admin)

**Endpoint**: `POST /api/contact-requests`  
**File**: `backend/controllers/contactRequestController.js`

```http
POST /api/contact-requests
Content-Type: application/json

{
  "firstName": "David",
  "lastName": "Johnson",
  "email": "david@example.com",
  "phone": "+1234567890",
  "subject": "General Inquiry",
  "message": "I have a question..."
}
```

---

### 13. Consultation Request Submission (Public)
**Trigger**: User submits consultation request  
**Emails**:
- `consultation_request_received` (to client)
- `new_consultation_request` (to admin)

**Endpoint**: `POST /api/consultation-requests`  
**File**: `backend/routes/consultationRequests.js`

```http
POST /api/consultation-requests
Content-Type: application/json

{
  "full_name": "David Johnson",
  "email": "david@example.com",
  "phone": "+1234567890",
  "preferred_date": "2026-01-20",
  "message": "I would like to discuss..."
}
```

---

### 14. Client Completes Onboarding
**Trigger**: Client submits onboarding form  
**Email**: `onboarding_completion`  
**Endpoint**: `POST /api/client/onboarding`  
**File**: `backend/controllers/clientController.js`

```http
POST /api/client/onboarding
Authorization: Bearer <client-token>
Content-Type: application/json

{
  "answers": { ... },
  "resume_url": "https://..."
}
```

---

### 15. Client Completes Registration
**Trigger**: Client completes registration with token  
**Email**: `client_welcome`  
**Endpoint**: `POST /api/auth/complete-registration`  
**File**: `backend/controllers/authController.js`

```http
POST /api/auth/complete-registration
Content-Type: application/json

{
  "token": "registration-token",
  "password": "SecurePass123!",
  "full_name": "David Johnson"
}
```

---

## 🔔 Scheduled/Automated Emails

### 16. Consultation Reminder (24 hours before)
**Trigger**: Automated cron job  
**Email**: `consultation_reminder`  
**Function**: `sendConsultationReminders()`  
**File**: `backend/utils/applyBureauHelpers.js`

**Runs**: Daily at scheduled time  
**Checks**: Consultations scheduled for next 24 hours

---

### 17. Onboarding Reminder
**Trigger**: Automated cron job  
**Email**: `onboarding_reminder`  
**Function**: `sendOnboardingReminders()`  
**File**: `backend/utils/applyBureauHelpers.js`

**Runs**: Daily at scheduled time  
**Checks**: Clients with incomplete onboarding

---

## 📊 Complete Endpoint Reference

### Admin Actions (Require Admin Auth)

| Action | Method | Endpoint | Email Template |
|--------|--------|----------|----------------|
| Invite Client | POST | `/api/auth/invite` | `signup_invite` |
| Approve Consultation | PATCH | `/api/consultation-requests/:id` | `consultation_approved` |
| Reject Consultation | PATCH | `/api/consultation-requests/:id` | `consultation_rejected` |
| Confirm Consultation | POST | `/api/admin/concierge/consultations/:id/confirm` | `consultation_confirmed_concierge` |
| Schedule Meeting | POST | `/api/meetings` | `meeting_scheduled` |
| Review Profile | PATCH | `/api/leads/:id/review` | `profile_under_review` |
| Select Lead | PATCH | `/api/leads/:id/select` | `lead_selected` |
| Unlock Profile | POST | `/api/admin/onboarding-triggers/:userId/unlock-profile` | `profile_unlocked` |
| Confirm Payment | POST | `/api/admin/concierge/payment-confirmation` | `payment_confirmed_welcome_concierge` |
| Update Application | PATCH | `/api/applications/:id` | `application_status_update` |
| Send Message | POST | `/api/admin/messages` | `message_notification` |

### Public Actions (No Auth Required)

| Action | Method | Endpoint | Email Template |
|--------|--------|----------|----------------|
| Submit Contact Form | POST | `/api/contact-requests` | `contact_form_received`, `new_contact_submission` |
| Request Consultation | POST | `/api/consultation-requests` | `consultation_request_received`, `new_consultation_request` |

### Client Actions (Require Client Auth)

| Action | Method | Endpoint | Email Template |
|--------|--------|----------|----------------|
| Complete Onboarding | POST | `/api/client/onboarding` | `onboarding_completion` |
| Complete Registration | POST | `/api/auth/complete-registration` | `client_welcome` |
| Send Message to Admin | POST | `/api/client/messages` | `client_message_notification` |

---

## 🔧 Testing Endpoints

### Test Invite Client
```bash
curl -X POST https://apply-bureau-backend.vercel.app/api/auth/invite \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "israelloko65@gmail.com",
    "full_name": "Test Client"
  }'
```

### Test Approve Consultation
```bash
curl -X PATCH https://apply-bureau-backend.vercel.app/api/consultation-requests/123 \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "meeting_link": "https://meet.google.com/test"
  }'
```

### Test Contact Form (Public)
```bash
curl -X POST https://apply-bureau-backend.vercel.app/api/contact-requests \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "israelloko65@gmail.com",
    "subject": "Test",
    "message": "Testing email"
  }'
```

---

## 📝 Notes

1. **All admin endpoints require authentication**: Include `Authorization: Bearer <token>` header
2. **Frontend URL**: All email links use `http://localhost:5173/` (configured in `.env`)
3. **Email service**: Using Resend API
4. **Test email**: All test emails go to `israelloko65@gmail.com`
5. **Rate limiting**: 100 requests per 15 minutes per IP

---

## 🎯 Quick Reference for Frontend Developers

When building dashboard buttons, use these endpoints:

```javascript
// Invite Client Button
const inviteClient = async (email, fullName) => {
  await fetch('/api/auth/invite', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, full_name: fullName })
  });
};

// Approve Consultation Button
const approveConsultation = async (consultationId, meetingLink) => {
  await fetch(`/api/consultation-requests/${consultationId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      status: 'approved',
      meeting_link: meetingLink
    })
  });
};

// Unlock Profile Button
const unlockProfile = async (userId) => {
  await fetch(`/api/admin/onboarding-triggers/${userId}/unlock-profile`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
};

// Update Application Status Button
const updateApplicationStatus = async (appId, status, details) => {
  await fetch(`/api/applications/${appId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      status,
      status_details: details
    })
  });
};
```

---

**Last Updated**: January 15, 2026  
**Backend URL**: https://apply-bureau-backend.vercel.app  
**Frontend URL**: http://localhost:5173/
