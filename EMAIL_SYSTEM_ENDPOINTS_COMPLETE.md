# Email System - Complete Endpoints & Triggers Documentation

## 🎯 Executive Summary

**Status**: ⚠️ Partially Functional - 7 critical templates created, 23 still missing

- **Working Emails**: 31 templates with active triggers
- **Created Today**: 7 critical missing templates
- **Still Missing**: 23 templates (mostly feature-specific)
- **Unused Templates**: 7 templates without triggers
- **Total Trigger Points**: 91 locations in codebase

---

## 📧 EMAIL SENDING ARCHITECTURE

### Core Email Functions

Located in `backend/utils/email.js`:

```javascript
// Main email sending function
sendEmail(to, templateName, variables)

// Simple text email
sendSimpleEmail(to, subject, message, userId)

// Specialized application update
sendApplicationUpdateEmail(clientEmail, applicationData, options)
```

### Email Configuration

- **Service**: Resend API
- **From Address**: `admin@applybureau.com`
- **Reply-To**: Configurable per email
- **Testing Mode**: Controlled by `EMAIL_TESTING_MODE` env variable
- **Test Redirect**: `israelloko65@gmail.com`

---

## 🔄 COMPLETE EMAIL FLOW DOCUMENTATION

### 1. REGISTRATION & ONBOARDING FLOW

#### Step 1: Signup Invite
**Endpoint**: `POST /api/auth/register` or `POST /api/admin/clients/invite`
**Template**: `signup_invite.html`
**Trigger**: When admin invites new client
**Variables**:
```javascript
{
  client_name: "John Doe",
  registration_link: "https://applybureau.com/complete-registration?token=...",
  current_year: 2024
}
```
**Code Locations**:
- `controllers/adminController.js:74`
- `controllers/authController.js:59`
- `routes/adminDashboardComplete.js:74`
- `routes/auth.js:68`

#### Step 2: Onboarding Completion
**Endpoint**: `POST /api/client/onboarding/complete`
**Template**: `onboarding_completion.html`
**Trigger**: When client completes onboarding
**Variables**:
```javascript
{
  client_name: "John Doe",
  dashboard_url: "https://applybureau.com/dashboard",
  current_year: 2024
}
```
**Code Locations**:
- `controllers/clientController.js:82`
- `controllers/leadController.js:566`

#### Step 3: Onboarding Approved ✅ NEW
**Endpoint**: `POST /api/admin/onboarding/:id/approve`
**Template**: `onboarding_approved.html`
**Trigger**: When admin approves onboarding
**Variables**:
```javascript
{
  client_name: "John Doe",
  admin_name: "Admin Name",
  feedback: "Great responses!",
  dashboard_url: "https://applybureau.com/dashboard",
  current_year: 2024
}
```
**Code Locations**:
- `routes/adminDashboardComplete.js:716`
- `routes/adminEnhancedFeatures.js:76`

---

### 2. CONSULTATION BOOKING FLOW

#### Step 1: Consultation Request Received ✅ NEW
**Endpoint**: `POST /api/consultations/request`
**Template**: `consultation_request_received.html`
**Trigger**: When client submits consultation request
**Variables**:
```javascript
{
  client_name: "John Doe",
  current_year: 2024
}
```
**Code Locations**:
- `routes/consultationRequests.js:110`
- `routes/publicConsultations.js:79`

#### Step 2: Admin Notification
**Endpoint**: Same as above
**Template**: `new_consultation_request.html`
**Trigger**: Notify admin of new request
**Recipient**: Admin email
**Variables**:
```javascript
{
  client_name: "John Doe",
  client_email: "john@example.com",
  role_targets: "Software Engineer",
  package_interest: "Premium",
  current_country: "USA",
  employment_status: "Employed",
  area_of_concern: "Career transition",
  resume_uploaded: true,
  admin_dashboard_url: "https://applybureau.com/admin/dashboard",
  current_year: 2024
}
```

#### Step 3: Consultation Scheduled ✅ NEW
**Endpoint**: `POST /api/admin/consultations/:id/schedule`
**Template**: `consultation_scheduled.html`
**Trigger**: When admin schedules consultation
**Variables**:
```javascript
{
  client_name: "John Doe",
  consultation_date: "Monday, March 15, 2024",
  consultation_time: "2:00 PM EST",
  meeting_link: "https://meet.google.com/abc-defg-hij",
  current_year: 2024
}
```
**Code Locations**:
- `controllers/webhookController.js:66`
- `routes/consultationRequests.js:342`
- `routes/consultations.js:161, 377`
- `routes/public.js:83`

#### Step 4: Consultation Confirmed
**Endpoint**: `POST /api/admin/consultations/:id/confirm`
**Template**: `consultation_confirmed.html`
**Trigger**: When consultation time is confirmed
**Variables**:
```javascript
{
  client_name: "John Doe",
  consultation_date: "Monday, March 15, 2024",
  consultation_time: "2:00 PM EST",
  meeting_link: "https://meet.google.com/abc-defg-hij",
  current_year: 2024
}
```
**Code Locations**:
- `routes/adminConsultations.js:166`
- `routes/consultationManagement.js:183, 341, 620`

#### Step 5: Consultation Reminder
**Endpoint**: Automated (cron job)
**Template**: `consultation_reminder.html`
**Trigger**: 24 hours before consultation
**Variables**:
```javascript
{
  client_name: "John Doe",
  meeting_date: "Monday, March 15, 2024",
  meeting_time: "2:00 PM EST",
  current_year: 2024
}
```
**Code Location**: `utils/applyBureauHelpers.js:352`

#### Step 6: Consultation Completed
**Endpoint**: `POST /api/admin/consultations/:id/complete`
**Template**: `consultation_completed.html`
**Trigger**: After consultation ends
**Variables**:
```javascript
{
  client_name: "John Doe",
  admin_message: "Thank you for the consultation",
  next_steps: "We will send you a proposal within 24 hours",
  current_year: 2024
}
```
**Code Location**: `routes/consultationManagement.js:213`

---

### 3. PAYMENT & REGISTRATION FLOW

#### Payment Received
**Endpoint**: `POST /api/admin/consultations/:id/payment`
**Template**: `payment_received_welcome.html`
**Trigger**: When payment is received
**Variables**:
```javascript
{
  client_name: "John Doe",
  tier: "Premium",
  dashboard_url: "https://applybureau.com/dashboard",
  current_year: 2024
}
```
**Code Location**: `routes/adminConsultations.js:433`

#### Payment Verified Registration
**Endpoint**: `POST /api/onboarding/verify-payment`
**Template**: `payment_verified_registration.html`
**Trigger**: After payment verification
**Variables**:
```javascript
{
  client_name: "John Doe",
  tier_name: "Premium Package",
  registration_link: "https://applybureau.com/register?token=...",
  current_year: 2024
}
```
**Code Location**: `routes/onboardingWorkflow.js:392`

#### Payment Confirmed (Concierge)
**Endpoint**: `POST /api/admin/concierge/payment`
**Template**: `payment_confirmed_welcome_concierge.html`
**Trigger**: Concierge payment confirmation
**Variables**:
```javascript
{
  client_name: "John Doe",
  tier_name: "Concierge Service",
  registration_link: "https://applybureau.com/register?token=...",
  current_year: 2024
}
```
**Code Locations**:
- `routes/adminConcierge.js:513, 683`
- `routes/consultationManagement.js:222`

---

### 4. APPLICATION TRACKING FLOW

#### Application Update
**Endpoint**: `POST /api/applications/:id/update`
**Template**: `application_update.html`
**Trigger**: When application status changes
**Variables**:
```javascript
{
  client_name: "John Doe",
  company_name: "Tech Corp",
  position_title: "Senior Software Engineer",
  application_status: "interview", // or "review", "offer", "rejected"
  message: "Great news! Your application has progressed.",
  next_steps: "The hiring manager will contact you soon.",
  dashboard_url: "https://applybureau.com/dashboard",
  current_year: 2024
}
```
**Code Locations**:
- `controllers/adminController.js:309`
- `routes/applications.js:300`
- `utils/email.js:333` (specialized function)

**Status-Specific Subjects**:
- `review`: "Your Application is Under Review"
- `interview`: "Interview Scheduled - Application Update"
- `offer`: "🎉 Great News About Your Application!"
- `rejected`: "Application Status Update"
- `withdrawn`: "Application Withdrawal Confirmed"

---

### 5. INTERVIEW MANAGEMENT FLOW

#### Interview Scheduled ✅ NEW
**Endpoint**: `POST /api/admin/interviews/schedule`
**Template**: `interview_scheduled.html`
**Trigger**: When interview is scheduled
**Variables**:
```javascript
{
  client_name: "John Doe",
  company: "Tech Corp",
  position: "Software Engineer",
  interview_date: "March 20, 2024",
  interview_time: "10:00 AM EST",
  current_year: 2024
}
```
**Code Location**: `routes/adminInterviews.js:295`

#### Interview Update
**Endpoint**: `POST /api/interviews/:id/update`
**Template**: `interview_update_enhanced.html`
**Trigger**: When interview status changes
**Variables**:
```javascript
{
  client_name: "John Doe",
  role_title: "Software Engineer",
  company_name: "Tech Corp",
  current_year: 2024
}
```
**Code Locations**:
- `controllers/interviewController.js:243, 348`
- `routes/applications.js:396`

---

### 6. MEETING MANAGEMENT FLOW

#### Meeting Scheduled
**Endpoint**: `POST /api/meetings/schedule`
**Template**: `meeting_scheduled.html`
**Trigger**: When meeting is scheduled
**Variables**:
```javascript
{
  client_name: "John Doe",
  meeting_date: "Friday, March 20, 2024",
  meeting_time: "10:00 AM EST",
  meeting_link: "https://meet.google.com/xyz-abcd-efg",
  current_year: 2024
}
```
**Code Location**: `controllers/meetingController.js:63`

#### Meeting Link Notification
**Endpoint**: Automated (when Google Meet link created)
**Template**: `meeting_link_notification.html`
**Trigger**: When meeting link is generated
**Variables**:
```javascript
{
  client_name: "John Doe",
  meeting_date: "Friday, March 20, 2024",
  meeting_time: "10:00 AM EST",
  meeting_link: "https://meet.google.com/xyz-abcd-efg",
  current_year: 2024
}
```
**Code Location**: `utils/googleMeet.js:158`

#### Admin Meeting Link Notification
**Endpoint**: Same as above
**Template**: `admin_meeting_link_notification.html`
**Trigger**: Notify admin of meeting link creation
**Recipient**: Admin email
**Code Location**: `utils/googleMeet.js:176`

#### Strategy Call Confirmed
**Endpoint**: `POST /api/strategy-calls/:id/confirm`
**Template**: `strategy_call_confirmed.html`
**Trigger**: When strategy call is confirmed
**Variables**:
```javascript
{
  client_name: "John Doe",
  call_date: "March 25, 2024",
  call_time: "3:00 PM EST",
  current_year: 2024
}
```
**Code Locations**:
- `routes/adminDashboardComplete.js:258`
- `routes/strategyCalls.js:247`

---

### 7. CONTACT & COMMUNICATION FLOW

#### Contact Form Received
**Endpoint**: `POST /api/contact`
**Template**: `contact_form_received.html`
**Trigger**: When contact form is submitted
**Variables**:
```javascript
{
  client_name: "John Doe",
  current_year: 2024
}
```
**Code Location**: `controllers/contactRequestController.js:69`

#### New Contact Submission (Admin)
**Endpoint**: Same as above
**Template**: `new_contact_submission.html`
**Trigger**: Notify admin of contact submission
**Recipient**: Admin email
**Variables**:
```javascript
{
  sender_name: "John Doe",
  sender_email: "john@example.com",
  subject: "Question about services",
  message: "I would like to know more...",
  admin_dashboard_url: "https://applybureau.com/admin/dashboard",
  current_year: 2024
}
```
**Code Location**: `controllers/contactRequestController.js:81`

#### Message Notification
**Endpoint**: `POST /api/messages/send`
**Template**: `message_notification.html`
**Trigger**: When message is sent
**Variables**:
```javascript
{
  recipient_name: "John Doe",
  sender_name: "Admin Name",
  message_preview: "I wanted to follow up on...",
  message_url: "https://applybureau.com/messages/123",
  current_year: 2024
}
```
**Code Locations**:
- `controllers/adminController.js:431, 888`

#### Client Message Notification
**Endpoint**: `POST /api/client/messages/send`
**Template**: `client_message_notification.html`
**Trigger**: When client sends message to advisor
**Recipient**: Advisor email
**Variables**:
```javascript
{
  advisor_name: "Advisor Name",
  client_name: "John Doe",
  message_preview: "I have a question about...",
  dashboard_url: "https://applybureau.com/admin/dashboard",
  current_year: 2024
}
```
**Code Location**: `controllers/clientController.js:279`

---

### 8. LEAD MANAGEMENT FLOW

#### Profile Under Review ✅ NEW
**Endpoint**: `POST /api/leads/submit`
**Template**: `profile_under_review.html`
**Trigger**: When lead profile is submitted
**Variables**:
```javascript
{
  client_name: "John Doe",
  role_targets: "Software Engineer",
  current_year: 2024
}
```
**Code Location**: `controllers/leadController.js:241`

#### Lead Selected
**Endpoint**: `POST /api/admin/leads/:id/select`
**Template**: `lead_selected.html`
**Trigger**: When lead is selected
**Variables**:
```javascript
{
  client_name: "John Doe",
  registration_url: "https://applybureau.com/register?token=...",
  current_year: 2024
}
```
**Code Location**: `controllers/leadController.js:323`

---

### 9. ADMIN MANAGEMENT FLOW

#### Admin Welcome
**Endpoint**: `POST /api/admin/users/create`
**Template**: `admin_welcome.html`
**Trigger**: When new admin is created
**Variables**:
```javascript
{
  admin_name: "Admin Name",
  admin_email: "admin@example.com",
  login_url: "https://applybureau.com/admin/login",
  current_year: 2024
}
```
**Code Location**: `routes/adminManagement.js:379`

#### Admin Action Required
**Endpoint**: Automated (system alerts)
**Template**: `admin_action_required.html`
**Trigger**: When admin action is needed
**Recipient**: Admin email
**Variables**:
```javascript
{
  admin_name: "Admin Name",
  admin_email: "admin@example.com",
  admin_status: "pending_review",
  action_reason: "New client requires approval",
  suspend_url: "https://applybureau.com/admin/suspend/123",
  delete_url: "https://applybureau.com/admin/delete/123",
  dashboard_url: "https://applybureau.com/admin/dashboard",
  current_year: 2024
}
```
**Code Location**: `routes/adminManagement.js:474`

#### Admin Onboarding Review Needed ✅ NEW
**Endpoint**: `POST /api/client/onboarding/submit`
**Template**: `admin_onboarding_review_needed.html`
**Trigger**: When onboarding needs review
**Recipient**: Admin email
**Variables**:
```javascript
{
  client_name: "John Doe",
  client_email: "john@example.com",
  admin_dashboard_url: "https://applybureau.com/admin/dashboard",
  current_year: 2024
}
```
**Code Location**: `routes/onboardingWorkflow.js:146`

---

## ⚠️ MISSING TEMPLATES (Still Need Creation)

### High Priority (User-Facing)
1. `consultation_proceeding.html` - Consultation proceeding notification
2. `consultation_completed_no_proceed.html` - Consultation completed without proceeding
3. `request_new_consultation_times.html` - Request new consultation times
4. `profile_unlocked.html` - Profile unlock notification
5. `profile_unlocked_tracker_active.html` - Tracker activation
6. `onboarding_submitted_pending_approval.html` - Pending approval status
7. `onboarding_completed_needs_approval.html` - Needs approval status
8. `onboarding_submitted_secure.html` - Secure submission confirmation

### Medium Priority (Admin Notifications)
9. `admin_onboarding_review_required.html` - Review required alert
10. `new_consultation_request_concierge.html` - Concierge request
11. `new_times_received.html` - New times received
12. `client_updated_consultation_times_concierge.html` - Updated times
13. `new_strategy_call_request.html` - Strategy call request (admin)
14. `strategy_call_requested.html` - Strategy call request (client)

### Low Priority (Feature-Specific)
15. `mock_session_scheduled.html` - Mock session scheduling
16. `new_mock_session_request.html` - Mock session request (admin)
17. `mock_session_confirmed.html` - Mock session confirmation
18. `mock_session_cancelled.html` - Mock session cancellation
19. `mock_session_feedback.html` - Mock session feedback

---

## 🔧 UNUSED TEMPLATES (Need Triggers)

These templates exist but are never called:

1. `admin_account_deleted.html` - Should trigger when admin account is deleted
2. `admin_account_reactivated.html` - Should trigger when admin account is reactivated
3. `admin_account_suspended.html` - Should trigger when admin account is suspended
4. `admin_password_reset.html` - Should trigger on password reset
5. `consultation_rescheduled.html` - Should trigger when consultation is rescheduled
6. `interview_update_concierge.html` - Concierge interview update
7. `new_consultation_request_with_times.html` - Request with specific times

**Recommendation**: Either add triggers for these or remove them.

---

## 🧪 TESTING EMAILS

### Test Script
```bash
cd backend
node test-sample-emails-final.js
```

### Manual Testing
```javascript
const { sendEmail } = require('./utils/email');

await sendEmail('test@example.com', 'consultation_confirmed', {
  client_name: 'Test User',
  consultation_date: 'Monday, March 15, 2024',
  consultation_time: '2:00 PM EST',
  meeting_link: 'https://meet.google.com/test',
  current_year: 2024
});
```

### Environment Variables
```env
RESEND_API_KEY=your_api_key
FRONTEND_URL=https://applybureau.com
ADMIN_EMAIL=admin@applybureau.com
EMAIL_TESTING_MODE=false  # Set to true to redirect all emails to test address
```

---

## 📊 STATISTICS

- **Total Email Templates**: 45 (38 existing + 7 created today)
- **Working Templates**: 38
- **Missing Templates**: 23
- **Unused Templates**: 7
- **Total Trigger Locations**: 91
- **Controllers with Email**: 8
- **Routes with Email**: 22
- **Utility Functions**: 3

---

## ✅ NEXT STEPS

1. **Create remaining 23 templates** (prioritize user-facing)
2. **Add triggers for 7 unused templates** or remove them
3. **Test all email flows** end-to-end
4. **Verify email delivery** in production
5. **Monitor email sending** for failures
6. **Document email variables** for each template
7. **Create email preview system** for testing

---

**Last Updated**: December 2024
**Status**: ⚠️ Partially Complete - 7 critical templates created, 23 remaining
**Priority**: HIGH - Complete missing templates before production deployment
