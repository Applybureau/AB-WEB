# Email Usage Guide - How to Send Emails with Real Data

## ✅ Configuration Updated

**Frontend URL**: `http://localhost:5173/`  
All email links will now use this URL.

---

## How to Send Emails with Real Data

### Basic Usage

```javascript
const { sendEmail } = require('./utils/email');

// Send email with real data
await sendEmail(
  'client@example.com',           // Recipient email
  'template_name',                 // Template name (without .html)
  {                                // Variables object with REAL data
    client_name: 'David Johnson',  // Use actual client name
    dashboard_link: 'http://localhost:5173/dashboard'
  }
);
```

### ⚠️ Important: Always Pass Real Data

**DON'T DO THIS** (placeholders will show in email):
```javascript
await sendEmail(email, 'client_welcome', {
  client_name: '{{client_name}}',  // ❌ WRONG - This will show as {{client_name}}
  dashboard_link: '{{dashboard_link}}'
});
```

**DO THIS** (real data will show):
```javascript
await sendEmail(email, 'client_welcome', {
  client_name: user.full_name,     // ✅ CORRECT - Real name from database
  dashboard_link: `${process.env.FRONTEND_URL}dashboard`
});
```

---

## Common Email Examples

### 1. Signup Invite
```javascript
// When admin invites a client
await sendEmail(clientEmail, 'signup_invite', {
  client_name: clientFullName,
  registration_link: `${process.env.FRONTEND_URL}complete-registration?token=${registrationToken}`
});
```

### 2. Client Welcome
```javascript
// After client completes registration
await sendEmail(client.email, 'client_welcome', {
  client_name: client.full_name,
  dashboard_link: `${process.env.FRONTEND_URL}dashboard`,
  onboarding_link: `${process.env.FRONTEND_URL}onboarding`
});
```

### 3. Consultation Confirmed
```javascript
// When consultation is confirmed
await sendEmail(client.email, 'consultation_confirmed', {
  client_name: client.full_name,
  consultation_date: 'Monday, January 20, 2026',
  consultation_time: '10:00 AM EST',
  meeting_link: meetingUrl,
  consultant_name: 'Sarah Williams'
});
```

### 4. Profile Unlocked
```javascript
// When admin unlocks client profile
await sendEmail(client.email, 'profile_unlocked', {
  client_name: client.full_name,
  unlock_date: new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }),
  dashboard_link: `${process.env.FRONTEND_URL}dashboard`
});
```

### 5. Application Status Update
```javascript
// When application status changes
await sendEmail(client.email, 'application_status_update', {
  client_name: client.full_name,
  company_name: application.company_name,
  position: application.position,
  status: application.status,
  status_details: 'Your interview has been scheduled for...',
  dashboard_link: `${process.env.FRONTEND_URL}dashboard`
});
```

### 6. Contact Form Received
```javascript
// When contact form is submitted
await sendEmail(contactEmail, 'contact_form_received', {
  client_name: `${firstName} ${lastName}`,
  subject: subject,
  message: message,
  next_steps: 'We will respond within 24 hours.'
});
```

### 7. Onboarding Reminder
```javascript
// Remind client to complete onboarding
await sendEmail(client.email, 'onboarding_reminder', {
  client_name: client.full_name,
  onboarding_link: `${process.env.FRONTEND_URL}onboarding`,
  days_remaining: '3'
});
```

### 8. Meeting Scheduled
```javascript
// When meeting is scheduled
await sendEmail(client.email, 'meeting_scheduled', {
  client_name: client.full_name,
  meeting_date: 'Monday, January 20, 2026',
  meeting_time: '10:00 AM EST',
  meeting_link: meetingUrl,
  meeting_type: 'Initial Consultation'
});
```

---

## Default Variables (Automatically Included)

These variables are automatically added to every email:

```javascript
{
  dashboard_link: 'http://localhost:5173/dashboard',
  contact_email: 'support@applybureau.com',
  company_name: 'Apply Bureau',
  current_year: 2026,
  logo_base64: '<base64-encoded-logo>'
}
```

You can override these by passing them in your variables object.

---

## Building URLs

Always use `process.env.FRONTEND_URL` to build URLs:

```javascript
const { buildUrl } = require('./utils/email');

// Method 1: Using buildUrl helper
const dashboardLink = buildUrl('/dashboard');
// Result: http://localhost:5173/dashboard

// Method 2: Using template literals
const registrationLink = `${process.env.FRONTEND_URL}complete-registration?token=${token}`;
// Result: http://localhost:5173/complete-registration?token=abc123

// Method 3: For complex URLs
const onboardingLink = `${process.env.FRONTEND_URL}onboarding?step=1&client=${clientId}`;
// Result: http://localhost:5173/onboarding?step=1&client=123
```

---

## Getting Real Data from Database

### Example: Send welcome email after registration

```javascript
// In your controller
const { data: client, error } = await supabaseAdmin
  .from('clients')
  .select('id, email, full_name')
  .eq('id', clientId)
  .single();

if (client) {
  await sendEmail(client.email, 'client_welcome', {
    client_name: client.full_name,  // Real name from database
    dashboard_link: `${process.env.FRONTEND_URL}dashboard`,
    onboarding_link: `${process.env.FRONTEND_URL}onboarding`
  });
}
```

### Example: Send consultation confirmation

```javascript
// Get consultation and client data
const { data: consultation } = await supabaseAdmin
  .from('consultations')
  .select(`
    *,
    clients (
      email,
      full_name
    )
  `)
  .eq('id', consultationId)
  .single();

if (consultation) {
  await sendEmail(consultation.clients.email, 'consultation_confirmed', {
    client_name: consultation.clients.full_name,
    consultation_date: new Date(consultation.scheduled_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    consultation_time: new Date(consultation.scheduled_date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }),
    meeting_link: consultation.meeting_link,
    consultant_name: 'Sarah Williams'
  });
}
```

---

## Formatting Dates and Times

### Date Formatting
```javascript
// Full date: "Monday, January 20, 2026"
const formattedDate = new Date(date).toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// Short date: "1/20/2026"
const shortDate = new Date(date).toLocaleDateString('en-US');

// ISO date: "2026-01-20"
const isoDate = new Date(date).toISOString().split('T')[0];
```

### Time Formatting
```javascript
// Time with timezone: "10:00 AM EST"
const formattedTime = new Date(date).toLocaleTimeString('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short'
});

// 24-hour format: "14:00"
const time24 = new Date(date).toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});
```

---

## Testing Emails

### Test with Real Data
```bash
cd backend
node scripts/test-real-email-with-data.js
```

This will send 5 test emails with real data to verify everything works.

### Test All Templates
```bash
node scripts/test-all-email-templates.js
```

This sends all 39 email templates (takes ~2 minutes).

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Using Placeholder Strings
```javascript
// WRONG
await sendEmail(email, 'client_welcome', {
  client_name: '{{client_name}}'  // This will literally show {{client_name}}
});
```

### ✅ Fix: Use Real Data
```javascript
// CORRECT
await sendEmail(email, 'client_welcome', {
  client_name: user.full_name  // Shows actual name like "David Johnson"
});
```

### ❌ Mistake 2: Hardcoding URLs
```javascript
// WRONG
await sendEmail(email, 'signup_invite', {
  registration_link: 'http://localhost:3000/register'  // Wrong URL
});
```

### ✅ Fix: Use Environment Variable
```javascript
// CORRECT
await sendEmail(email, 'signup_invite', {
  registration_link: `${process.env.FRONTEND_URL}register`
});
```

### ❌ Mistake 3: Missing Required Variables
```javascript
// WRONG - Missing client_name
await sendEmail(email, 'client_welcome', {
  dashboard_link: `${process.env.FRONTEND_URL}dashboard`
  // client_name is missing - will show empty in email
});
```

### ✅ Fix: Include All Required Variables
```javascript
// CORRECT
await sendEmail(email, 'client_welcome', {
  client_name: user.full_name,  // Required
  dashboard_link: `${process.env.FRONTEND_URL}dashboard`,
  onboarding_link: `${process.env.FRONTEND_URL}onboarding`
});
```

---

## Required Variables by Template

### Signup Invite
- `client_name` - Client's full name
- `registration_link` - Complete registration URL with token

### Client Welcome
- `client_name` - Client's full name
- `dashboard_link` - Dashboard URL
- `onboarding_link` - Onboarding URL

### Consultation Confirmed
- `client_name` - Client's full name
- `consultation_date` - Formatted date
- `consultation_time` - Formatted time
- `meeting_link` - Meeting URL
- `consultant_name` - Consultant's name

### Profile Unlocked
- `client_name` - Client's full name
- `unlock_date` - Formatted date
- `dashboard_link` - Dashboard URL

### Application Status Update
- `client_name` - Client's full name
- `company_name` - Company name
- `position` - Job position
- `status` - Application status
- `status_details` - Detailed status message
- `dashboard_link` - Dashboard URL

---

## Environment Variables

Make sure these are set in your `.env` file:

```env
FRONTEND_URL=http://localhost:5173/
RESEND_API_KEY=re_DkzYXYAB_DN7Td7bHkh6FFYbT9sLvHib8
```

---

## Troubleshooting

### Problem: Placeholders showing in emails
**Solution**: Make sure you're passing real data, not placeholder strings

### Problem: Wrong URL in emails
**Solution**: Check `FRONTEND_URL` in `.env` file

### Problem: Email not sending
**Solution**: Check `RESEND_API_KEY` is valid

### Problem: Variables not replaced
**Solution**: Check variable names match exactly (case-sensitive)

---

## Summary

✅ **Always use real data** from your database  
✅ **Use `process.env.FRONTEND_URL`** for all links  
✅ **Format dates and times** properly  
✅ **Include all required variables** for each template  
✅ **Test emails** before deploying  

**Current Frontend URL**: `http://localhost:5173/`

All emails will now use this URL for links!
