# Frontend Email Quick Reference Card

## 🚀 One-Page Guide for Frontend Developers

---

## How Emails Work

```
Frontend API Call → Backend Processes → Email Sent Automatically ✅
```

**You don't manually send emails** - they're triggered automatically when you call the right endpoints.

---

## 📋 Most Common Email Triggers

### 1. User Registration
```javascript
POST /api/auth/register
Body: { email, full_name }
→ Sends signup_invite.html
```

### 2. Consultation Request
```javascript
POST /api/consultations/request
Body: { email, full_name, role_targets, ... }
→ Sends consultation_request_received.html (to user)
→ Sends new_consultation_request.html (to admin)
```

### 3. Application Update
```javascript
POST /api/applications/:id/update
Body: { status, message, next_steps }
→ Sends application_update.html
```

### 4. Contact Form
```javascript
POST /api/contact
Body: { fName, lName, email, subject, message }
→ Sends contact_form_received.html (to user)
→ Sends new_contact_submission.html (to admin)
```

### 5. Onboarding Complete
```javascript
POST /api/client/onboarding/complete
Body: { /* onboarding data */ }
→ Sends onboarding_completion.html
```

---

## 🔐 Authentication

```javascript
// Most endpoints need auth
const token = localStorage.getItem('authToken');

fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Public endpoints (no auth):
// - /api/contact
// - /api/consultations/request
// - /api/leads/submit
```

---

## ✅ User Feedback Pattern

```javascript
const handleSubmit = async () => {
  try {
    const response = await fetch(url, { /* ... */ });
    
    if (!response.ok) throw new Error('Failed');
    
    // ✅ Show success
    toast.success('✅ Email sent! Check your inbox.');
    
  } catch (error) {
    // ❌ Show error
    toast.error('Failed to send. Please try again.');
  }
};
```

---

## 📧 Email Templates Reference

| User Action | Endpoint | Email Sent |
|-------------|----------|------------|
| Sign up | POST /api/auth/register | Signup invite |
| Request consultation | POST /api/consultations/request | Request confirmation |
| Submit contact form | POST /api/contact | Form confirmation |
| Complete onboarding | POST /api/client/onboarding/complete | Welcome email |
| Get approved | POST /api/admin/onboarding/:id/approve | Approval notice |
| Application update | POST /api/applications/:id/update | Status update |
| Interview scheduled | POST /api/admin/interviews/schedule | Interview details |
| Meeting scheduled | POST /api/meetings/schedule | Meeting details |
| Payment processed | POST /api/admin/consultations/:id/payment | Payment confirmation |

---

## 🚨 Common Issues

### Email not received?
1. Check spam folder
2. Verify email address
3. Check API response for errors
4. Wait 1-2 minutes for delivery

### API call failed?
1. Check authentication token
2. Verify request body format
3. Check network tab in DevTools
4. Verify API URL is correct

---

## 🔧 Environment Setup

```javascript
// .env
REACT_APP_API_URL=https://api.applybureau.com

// Usage
const API_URL = process.env.REACT_APP_API_URL;
```

---

## 💡 Best Practices

1. **Always show user feedback** after API calls
2. **Handle errors gracefully** with try/catch
3. **Show loading states** during API calls
4. **Inform users** that email was sent
5. **Don't retry automatically** - let user retry manually

---

## 📞 Need Help?

- Full documentation: `FRONTEND_EMAIL_API_GUIDE.md`
- Technical details: `EMAIL_SYSTEM_ENDPOINTS_COMPLETE.md`
- Backend team: Contact for API issues

---

**API Base URL**: https://api.applybureau.com
**Email Service**: Resend (admin@applybureau.com)
**Last Updated**: December 2024
