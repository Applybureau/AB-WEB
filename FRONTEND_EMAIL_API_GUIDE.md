# Frontend Email API Guide

## Quick Reference for Frontend Developers

This guide shows you how to trigger emails from the frontend by calling backend API endpoints. All emails are automatically sent by the backend when you make the appropriate API calls.

---

## 🚀 How It Works

1. Frontend makes API call to backend endpoint
2. Backend processes the request
3. Backend automatically sends email using the appropriate template
4. Email is delivered to recipient

**You don't need to manually trigger emails** - they're sent automatically when you use these endpoints.

---

## 📋 API Endpoints That Trigger Emails

### 1. REGISTRATION & ONBOARDING

#### Send Signup Invitation
```javascript
// POST /api/auth/register
// or POST /api/admin/clients/invite

const response = await fetch(`${API_URL}/api/auth/register`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // For admin invite
  },
  body: JSON.stringify({
    email: 'user@example.com',
    full_name: 'John Doe'
  })
});

// ✅ Automatically sends: signup_invite.html
// Recipient: user@example.com
// Contains: Registration link with token
```

#### Complete Onboarding
```javascript
// POST /api/client/onboarding/complete

const response = await fetch(`${API_URL}/api/client/onboarding/complete`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    // onboarding data
  })
});

// ✅ Automatically sends: onboarding_completion.html
// Recipient: Client email
// Contains: Welcome message and dashboard link
```

#### Approve Onboarding (Admin)
```javascript
// POST /api/admin/onboarding/:id/approve

const response = await fetch(`${API_URL}/api/admin/onboarding/${onboardingId}/approve`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    feedback: 'Great responses! Welcome aboard.'
  })
});

// ✅ Automatically sends: onboarding_approved.html
// Recipient: Client email
// Contains: Approval message, feedback, dashboard link
```

---

### 2. CONSULTATION BOOKING

#### Request Consultation
```javascript
// POST /api/consultations/request

const response = await fetch(`${API_URL}/api/consultations/request`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    full_name: 'John Doe',
    role_targets: 'Software Engineer',
    package_interest: 'Premium',
    current_country: 'USA',
    employment_status: 'Employed',
    area_of_concern: 'Career transition'
  })
});

// ✅ Automatically sends 2 emails:
// 1. consultation_request_received.html → Client
// 2. new_consultation_request.html → Admin
```

#### Schedule Consultation (Admin)
```javascript
// POST /api/admin/consultations/:id/schedule

const response = await fetch(`${API_URL}/api/admin/consultations/${consultationId}/schedule`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    consultation_date: '2024-03-15',
    consultation_time: '2:00 PM EST',
    meeting_link: 'https://meet.google.com/abc-defg-hij'
  })
});

// ✅ Automatically sends: consultation_scheduled.html
// Recipient: Client email
// Contains: Date, time, meeting link
```

#### Confirm Consultation (Admin)
```javascript
// POST /api/admin/consultations/:id/confirm

const response = await fetch(`${API_URL}/api/admin/consultations/${consultationId}/confirm`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    confirmed_time: '2024-03-15T14:00:00Z'
  })
});

// ✅ Automatically sends: consultation_confirmed.html
// Recipient: Client email
// Contains: Confirmed date, time, meeting details
```

#### Cancel Consultation
```javascript
// DELETE /api/consultations/:id

const response = await fetch(`${API_URL}/api/consultations/${consultationId}`, {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    reason: 'Schedule conflict'
  })
});

// ✅ Automatically sends: consultation_cancelled.html
// Recipient: Client email
// Contains: Cancellation reason, reschedule options
```

---

### 3. APPLICATION TRACKING

#### Update Application Status
```javascript
// POST /api/applications/:id/update

const response = await fetch(`${API_URL}/api/applications/${applicationId}/update`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    status: 'interview', // or 'review', 'offer', 'rejected'
    message: 'Great news! Your application has progressed to the interview stage.',
    next_steps: 'The hiring manager will contact you within 2-3 business days.'
  })
});

// ✅ Automatically sends: application_update.html
// Recipient: Client email
// Contains: Company, position, status, message, next steps
// Subject varies by status (interview, offer, etc.)
```

---

### 4. INTERVIEW MANAGEMENT

#### Schedule Interview (Admin)
```javascript
// POST /api/admin/interviews/schedule

const response = await fetch(`${API_URL}/api/admin/interviews/schedule`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    client_id: 'client-uuid',
    company: 'Tech Corp',
    position: 'Software Engineer',
    interview_date: '2024-03-20',
    interview_time: '10:00 AM EST'
  })
});

// ✅ Automatically sends: interview_scheduled.html
// Recipient: Client email
// Contains: Company, position, date, time
```

#### Update Interview Status
```javascript
// POST /api/interviews/:id/update

const response = await fetch(`${API_URL}/api/interviews/${interviewId}/update`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    status: 'completed',
    notes: 'Interview went well'
  })
});

// ✅ Automatically sends: interview_update_enhanced.html
// Recipient: Client email
// Contains: Company, role, status update
```

---

### 5. MEETING SCHEDULING

#### Schedule Meeting
```javascript
// POST /api/meetings/schedule

const response = await fetch(`${API_URL}/api/meetings/schedule`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    lead_id: 'lead-uuid',
    meeting_date: '2024-03-20',
    meeting_time: '10:00 AM EST',
    meeting_link: 'https://meet.google.com/xyz-abcd-efg'
  })
});

// ✅ Automatically sends: meeting_scheduled.html
// Recipient: Lead email
// Contains: Date, time, meeting link
```

#### Schedule Strategy Call
```javascript
// POST /api/strategy-calls/:id/confirm

const response = await fetch(`${API_URL}/api/strategy-calls/${callId}/confirm`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    call_date: '2024-03-25',
    call_time: '3:00 PM EST'
  })
});

// ✅ Automatically sends: strategy_call_confirmed.html
// Recipient: Client email
// Contains: Call date, time
```

---

### 6. CONTACT & MESSAGES

#### Submit Contact Form
```javascript
// POST /api/contact

const response = await fetch(`${API_URL}/api/contact`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fName: 'John',
    lName: 'Doe',
    email: 'john@example.com',
    subject: 'Question about services',
    message: 'I would like to know more about...'
  })
});

// ✅ Automatically sends 2 emails:
// 1. contact_form_received.html → User
// 2. new_contact_submission.html → Admin
```

#### Send Message to Client
```javascript
// POST /api/messages/send

const response = await fetch(`${API_URL}/api/messages/send`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    client_id: 'client-uuid',
    subject: 'Application Update',
    message: 'I wanted to follow up on your recent application...'
  })
});

// ✅ Automatically sends: message_notification.html
// Recipient: Client email
// Contains: Message preview, link to view full message
```

---

### 7. PAYMENT & REGISTRATION

#### Process Payment
```javascript
// POST /api/admin/consultations/:id/payment

const response = await fetch(`${API_URL}/api/admin/consultations/${consultationId}/payment`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    payment_amount: 500,
    tier: 'Premium'
  })
});

// ✅ Automatically sends: payment_received_welcome.html
// Recipient: Client email
// Contains: Payment amount, tier, dashboard link
```

#### Verify Payment & Register
```javascript
// POST /api/onboarding/verify-payment

const response = await fetch(`${API_URL}/api/onboarding/verify-payment`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    consultation_id: 'consultation-uuid',
    payment_verified: true
  })
});

// ✅ Automatically sends: payment_verified_registration.html
// Recipient: Client email
// Contains: Registration link, tier info
```

---

### 8. LEAD MANAGEMENT

#### Submit Lead Profile
```javascript
// POST /api/leads/submit

const response = await fetch(`${API_URL}/api/leads/submit`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    full_name: 'John Doe',
    email: 'john@example.com',
    role_targets: 'Software Engineer'
  })
});

// ✅ Automatically sends: profile_under_review.html
// Recipient: Lead email
// Contains: Review timeline, next steps
```

#### Select Lead (Admin)
```javascript
// POST /api/admin/leads/:id/select

const response = await fetch(`${API_URL}/api/admin/leads/${leadId}/select`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  }
});

// ✅ Automatically sends: lead_selected.html
// Recipient: Lead email
// Contains: Registration link, next steps
```

---

## 🔧 Environment Configuration

Make sure your frontend has the correct API URL:

```javascript
// .env or config file
const API_URL = process.env.REACT_APP_API_URL || 'https://api.applybureau.com';
```

---

## 📧 Email Templates Reference

### Client-Facing Emails

| Template | Trigger | Purpose |
|----------|---------|---------|
| `signup_invite` | Registration/Invite | Send registration link |
| `onboarding_completion` | Onboarding complete | Welcome message |
| `onboarding_approved` | Admin approval | Approval notification |
| `consultation_request_received` | Request submitted | Confirmation |
| `consultation_scheduled` | Admin schedules | Scheduling confirmation |
| `consultation_confirmed` | Admin confirms | Final confirmation |
| `consultation_cancelled` | Cancellation | Cancellation notice |
| `consultation_reminder` | 24hrs before | Reminder |
| `application_update` | Status change | Application updates |
| `interview_scheduled` | Interview booked | Interview details |
| `interview_update_enhanced` | Status change | Interview updates |
| `meeting_scheduled` | Meeting booked | Meeting details |
| `meeting_link_notification` | Link created | Meeting link |
| `strategy_call_confirmed` | Call confirmed | Call details |
| `contact_form_received` | Form submitted | Confirmation |
| `message_notification` | Message sent | New message alert |
| `payment_received_welcome` | Payment received | Welcome message |
| `payment_verified_registration` | Payment verified | Registration link |
| `profile_under_review` | Profile submitted | Review notice |
| `lead_selected` | Lead selected | Selection notice |

### Admin Notification Emails

| Template | Trigger | Purpose |
|----------|---------|---------|
| `new_consultation_request` | Client requests | New request alert |
| `new_consultation_booking` | Booking made | Booking alert |
| `new_contact_submission` | Contact form | New contact alert |
| `admin_onboarding_review_needed` | Onboarding complete | Review needed |
| `admin_meeting_link_notification` | Link created | Link created alert |
| `admin_action_required` | System alert | Action needed |

---

## ✅ Best Practices

### 1. Error Handling
```javascript
try {
  const response = await fetch(`${API_URL}/api/consultations/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit consultation request');
  }
  
  const result = await response.json();
  
  // Show success message to user
  toast.success('Consultation request submitted! Check your email for confirmation.');
  
} catch (error) {
  console.error('Error:', error);
  toast.error('Failed to submit request. Please try again.');
}
```

### 2. User Feedback
Always inform users that an email has been sent:

```javascript
// After successful API call
toast.success('✅ Email sent! Check your inbox for details.');

// Or more specific
toast.success('📧 Consultation confirmation sent to your email');
```

### 3. Loading States
```javascript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  setIsSubmitting(true);
  try {
    await fetch(/* ... */);
    toast.success('Email sent successfully!');
  } catch (error) {
    toast.error('Failed to send email');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 🚨 Common Issues

### Email Not Received
1. Check spam/junk folder
2. Verify email address is correct
3. Check backend logs for errors
4. Verify RESEND_API_KEY is set

### Wrong Email Template
1. Check endpoint documentation
2. Verify you're calling the correct endpoint
3. Check backend logs for template name

### Missing Variables
Backend automatically provides these variables:
- `current_year` - Current year
- `support_email` - Support email
- `company_name` - "Apply Bureau"
- `dashboard_link` - Dashboard URL

You only need to provide user-specific data.

---

## 📞 Support

If emails aren't working:
1. Check browser console for API errors
2. Check network tab for failed requests
3. Verify authentication token is valid
4. Contact backend team with error details

---

## 🔐 Authentication

Most endpoints require authentication:

```javascript
const token = localStorage.getItem('authToken');

const response = await fetch(`${API_URL}/api/endpoint`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

Public endpoints (no auth required):
- `/api/contact`
- `/api/consultations/request`
- `/api/leads/submit`

---

**Last Updated**: December 2024
**Backend API**: https://api.applybureau.com
**Email Service**: Resend (admin@applybureau.com)
