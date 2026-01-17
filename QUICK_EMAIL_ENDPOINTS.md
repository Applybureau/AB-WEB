# Quick Email Endpoints Reference

## 🎯 Most Common Dashboard Actions

### 1. Invite Client
```
POST /api/auth/invite
Body: { email, full_name }
Email: signup_invite
```

### 2. Approve Consultation
```
PATCH /api/consultation-requests/:id
Body: { status: "approved", meeting_link }
Email: consultation_approved
```

### 3. Reject Consultation
```
PATCH /api/consultation-requests/:id
Body: { status: "rejected", rejection_reason }
Email: consultation_rejected
```

### 4. Unlock Profile
```
POST /api/admin/onboarding-triggers/:userId/unlock-profile
Email: profile_unlocked
```

### 5. Update Application Status
```
PATCH /api/applications/:id
Body: { status, status_details }
Email: application_status_update
```

### 6. Schedule Meeting
```
POST /api/meetings
Body: { lead_id, scheduled_date, meeting_link, meeting_type }
Email: meeting_scheduled
```

### 7. Confirm Payment
```
POST /api/admin/concierge/payment-confirmation
Body: { client_email, client_name, payment_amount, payment_date }
Email: payment_confirmed_welcome_concierge
```

### 8. Send Message
```
POST /api/admin/messages
Body: { client_id, subject, message }
Email: message_notification
```

---

## 📋 Public Endpoints (No Auth)

### Contact Form
```
POST /api/contact-requests
Body: { firstName, lastName, email, phone, subject, message }
Emails: contact_form_received (client), new_contact_submission (admin)
```

### Consultation Request
```
POST /api/consultation-requests
Body: { full_name, email, phone, preferred_date, message }
Emails: consultation_request_received (client), new_consultation_request (admin)
```

---

## 🔑 Authentication

All admin endpoints require:
```
Authorization: Bearer <admin-token>
```

Get admin token from login:
```
POST /api/auth/login
Body: { email: "admin@applybureau.com", password: "Admin@123456" }
Response: { token: "..." }
```

---

## 🌐 Base URL

**Production**: `https://apply-bureau-backend.vercel.app`  
**Local**: `http://localhost:3000`

---

## 📧 Email Configuration

**Frontend URL**: `http://localhost:5173/`  
**Test Email**: `israelloko65@gmail.com`  
**Email Service**: Resend

---

**For detailed documentation, see**: `DASHBOARD_EMAIL_ENDPOINTS.md`
