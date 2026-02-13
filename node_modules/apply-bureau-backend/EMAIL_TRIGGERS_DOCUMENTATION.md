# Email System - Complete Triggers Documentation

## Status Report

### Summary
- **Total Templates**: 38 existing
- **Templates with Triggers**: 31 working
- **Missing Templates**: 30 templates referenced but not created
- **Unused Templates**: 7 templates created but never triggered
- **Total Trigger Locations**: 91 places in code

---

## ❌ CRITICAL ISSUES FOUND

### Missing Templates (30)
These templates are called in the code but don't exist:

1. `profile_under_review.html` - Lead profile review notification
2. `consultation_scheduled.html` - Consultation scheduling confirmation
3. `profile_unlocked_tracker_active.html` - Profile unlock notification
4. `request_new_consultation_times.html` - Request new times
5. `consultation_proceeding.html` - Consultation proceeding notification
6. `consultation_completed_no_proceed.html` - Consultation completed without proceeding
7. `onboarding_approved.html` - Onboarding approval notification
8. `interview_scheduled.html` - Interview scheduling notification
9. `onboarding_submitted_pending_approval.html` - Onboarding pending approval
10. `onboarding_completed_needs_approval.html` - Onboarding needs approval
11. `consultation_request_received.html` - Consultation request confirmation
12. `consultation_cancelled.html` - Consultation cancellation
13. `mock_session_scheduled.html` - Mock session scheduling
14. `new_mock_session_request.html` - New mock session request (admin)
15. `mock_session_confirmed.html` - Mock session confirmation
16. `mock_session_cancelled.html` - Mock session cancellation
17. `mock_session_feedback.html` - Mock session feedback
18. `admin_onboarding_review_needed.html` - Admin onboarding review alert
19. `profile_unlocked.html` - Profile unlock notification
20. `new_consultation_request_concierge.html` - Concierge consultation request
21. `new_times_received.html` - New times received confirmation
22. `client_updated_consultation_times_concierge.html` - Client updated times
23. `onboarding_submitted_secure.html` - Secure onboarding submission
24. `admin_onboarding_review_required.html` - Admin review required
25. `strategy_call_requested.html` - Strategy call request confirmation
26. `new_strategy_call_request.html` - New strategy call request (admin)

### Unused Templates (7)
These templates exist but are never triggered:

1. `admin_account_deleted.html`
2. `admin_account_reactivated.html`
3. `admin_account_suspended.html`
4. `admin_password_reset.html`
5. `consultation_rescheduled.html`
6. `interview_update_concierge.html`
7. `new_consultation_request_with_times.html`

---

## ✅ WORKING EMAIL TRIGGERS

### Authentication & Registration

#### 1. Signup Invite
- **Template**: `signup_invite.html`
- **Triggered by**: 
  - `controllers/adminController.js:74`
  - `controllers/authController.js:59`
  - `routes/adminDashboardComplete.js:74`
  - `routes/auth.js:68`
  - `utils/applyBureauHelpers.js:61`
- **Recipient**: New user email
- **Purpose**: Send registration invitation link
- **Variables**: `client_name`, `registration_link`, `current_year`

#### 2. Admin Welcome
- **Template**: `admin_welcome.html`
- **Triggered by**: `routes/adminManagement.js:379`
- **Recipient**: New admin email
- **Purpose**: Welcome new admin user
- **Variables**: `admin_name`, `admin_email`, `login_url`, `current_year`

---

### Consultation Management

#### 3. Consultation Confirmed
- **Template**: `consultation_confirmed.html`
- **Triggered by**:
  - `routes/adminConsultations.js:166`
  - `routes/consultationManagement.js:183, 341, 620`
  - `routes/consultationRequests.js:331`
- **Recipient**: Client email
- **Purpose**: Confirm consultation booking
- **Variables**: `client_name`, `consultation_date`, `consultation_time`, `meeting_link`, `current_year`

#### 4. Consultation Confirmed (Concierge)
- **Template**: `consultation_confirmed_concierge.html`
- **Triggered by**: `routes/adminConcierge.js:206`
- **Recipient**: Prospect email
- **Purpose**: Concierge-style consultation confirmation
- **Variables**: `client_name`, `confirmed_date`, `confirmed_time`, `meeting_link`, `meeting_details`, `next_steps`, `admin_name`

#### 5. Consultation Reminder
- **Template**: `consultation_reminder.html`
- **Triggered by**: `utils/applyBureauHelpers.js:352`
- **Recipient**: Client email
- **Purpose**: Remind client of upcoming consultation
- **Variables**: `client_name`, `meeting_date`, `meeting_time`, `current_year`

#### 6. Consultation Reschedule Request
- **Template**: `consultation_reschedule_request.html`
- **Triggered by**:
  - `routes/adminConcierge.js:285`
  - `routes/consultationManagement.js:201, 408`
- **Recipient**: Client email
- **Purpose**: Request consultation rescheduling
- **Variables**: `client_name`, `admin_message`, `reason`, `new_proposed_times`, `reschedule_link`, `current_year`

#### 7. Consultation Rejected
- **Template**: `consultation_rejected.html`
- **Triggered by**:
  - `controllers/leadController.js:393`
  - `routes/consultationManagement.js:473`
  - `routes/consultationRequests.js:337`
- **Recipient**: Client/Lead email
- **Purpose**: Notify of consultation rejection
- **Variables**: `client_name`, `reason`, `admin_message`, `current_year`

#### 8. Consultation Waitlisted
- **Template**: `consultation_waitlisted.html`
- **Triggered by**: `routes/adminConcierge.js:357`
- **Recipient**: Prospect email
- **Purpose**: Notify client they're waitlisted
- **Variables**: `client_name`, `current_year`

#### 9. Consultation Completed
- **Template**: `consultation_completed.html`
- **Triggered by**: `routes/consultationManagement.js:213`
- **Recipient**: Client email
- **Purpose**: Consultation completion notification
- **Variables**: `client_name`, `admin_message`, `next_steps`, `current_year`

#### 10. New Consultation Request (Admin)
- **Template**: `new_consultation_request.html`
- **Triggered by**: `routes/consultationRequests.js:131`
- **Recipient**: Admin email
- **Purpose**: Notify admin of new consultation request
- **Variables**: `client_name`, `client_email`, `role_targets`, `package_interest`, `current_country`, `employment_status`, `area_of_concern`, `resume_uploaded`, `admin_dashboard_url`, `current_year`

#### 11. New Consultation Booking (Admin)
- **Template**: `new_consultation_booking.html`
- **Triggered by**: `routes/public.js:102`
- **Recipient**: Admin email
- **Purpose**: Notify admin of new booking
- **Variables**: `client_name`, `client_email`, `consultation_type`, `preferred_date`, `admin_dashboard_url`, `current_year`

---

### Onboarding & Registration

#### 12. Onboarding Completion
- **Template**: `onboarding_completion.html`
- **Triggered by**:
  - `controllers/clientController.js:82`
  - `controllers/leadController.js:566`
  - `controllers/webhookController.js:105`
- **Recipient**: Client email
- **Purpose**: Welcome after onboarding completion
- **Variables**: `client_name`, `dashboard_url`, `current_year`

#### 13. Onboarding Completed
- **Template**: `onboarding_completed.html`
- **Triggered by**:
  - `routes/clientOnboarding.js:205`
  - `routes/onboardingWorkflow.js:134`
- **Recipient**: User email
- **Purpose**: Onboarding completion confirmation
- **Variables**: `client_name`, `current_year`

#### 14. Onboarding Completed (Secure)
- **Template**: `onboarding_completed_secure.html`
- **Triggered by**: `routes/clientRegistration.js:259`
- **Recipient**: User email
- **Purpose**: Secure onboarding completion
- **Variables**: `client_name`, `current_year`

#### 15. Onboarding Complete Confirmation
- **Template**: `onboarding_complete_confirmation.html`
- **Triggered by**:
  - `routes/adminOnboardingTriggers.js:42, 228`
- **Recipient**: User email
- **Purpose**: Confirm onboarding completion
- **Variables**: `client_name`, `current_year`

#### 16. Onboarding Reminder
- **Template**: `onboarding_reminder.html`
- **Triggered by**: `utils/applyBureauHelpers.js:382`
- **Recipient**: Client email
- **Purpose**: Remind to complete onboarding
- **Variables**: `client_name`, `dashboard_url`, `current_year`

---

### Payment & Registration

#### 17. Payment Received Welcome
- **Template**: `payment_received_welcome.html`
- **Triggered by**: `routes/adminConsultations.js:433`
- **Recipient**: Client email
- **Purpose**: Welcome after payment received
- **Variables**: `client_name`, `tier`, `dashboard_url`, `current_year`

#### 18. Payment Verified Registration
- **Template**: `payment_verified_registration.html`
- **Triggered by**: `routes/onboardingWorkflow.js:392`
- **Recipient**: Client email
- **Purpose**: Registration after payment verification
- **Variables**: `client_name`, `tier_name`, `registration_link`, `current_year`

#### 19. Payment Confirmed Welcome (Concierge)
- **Template**: `payment_confirmed_welcome_concierge.html`
- **Triggered by**:
  - `routes/adminConcierge.js:513, 683`
  - `routes/consultationManagement.js:222`
- **Recipient**: Client email
- **Purpose**: Concierge-style payment confirmation
- **Variables**: `client_name`, `tier_name`, `registration_link`, `current_year`

---

### Application Tracking

#### 20. Application Update
- **Template**: `application_update.html`
- **Triggered by**:
  - `controllers/adminController.js:309`
  - `routes/applications.js:300`
  - `utils/email.js:333`
- **Recipient**: Client email
- **Purpose**: Update on application status
- **Variables**: `client_name`, `company_name`, `position_title`, `application_status`, `message`, `next_steps`, `dashboard_url`, `current_year`

---

### Interview Management

#### 21. Interview Update Enhanced
- **Template**: `interview_update_enhanced.html`
- **Triggered by**:
  - `controllers/interviewController.js:243, 348`
  - `routes/applications.js:396`
- **Recipient**: Client email
- **Purpose**: Interview status update
- **Variables**: `client_name`, `role_title`, `company_name`, `current_year`

---

### Meeting Management

#### 22. Meeting Scheduled
- **Template**: `meeting_scheduled.html`
- **Triggered by**: `controllers/meetingController.js:63`
- **Recipient**: Lead email
- **Purpose**: Meeting scheduling confirmation
- **Variables**: `client_name`, `meeting_date`, `meeting_time`, `meeting_link`, `current_year`

#### 23. Meeting Link Notification
- **Template**: `meeting_link_notification.html`
- **Triggered by**: `utils/googleMeet.js:158`
- **Recipient**: Client email
- **Purpose**: Send meeting link
- **Variables**: `client_name`, `meeting_date`, `meeting_time`, `meeting_link`, `current_year`

#### 24. Admin Meeting Link Notification
- **Template**: `admin_meeting_link_notification.html`
- **Triggered by**: `utils/googleMeet.js:176`
- **Recipient**: Admin email
- **Purpose**: Notify admin of meeting link creation
- **Variables**: `client_name`, `meeting_date`, `meeting_time`, `meeting_link`, `current_year`

#### 25. Strategy Call Confirmed
- **Template**: `strategy_call_confirmed.html`
- **Triggered by**:
  - `routes/adminDashboardComplete.js:258`
  - `routes/strategyCalls.js:247`
- **Recipient**: Client email
- **Purpose**: Confirm strategy call booking
- **Variables**: `client_name`, `call_date`, `call_time`, `current_year`

---

### Contact & Communication

#### 26. Contact Form Received
- **Template**: `contact_form_received.html`
- **Triggered by**: `controllers/contactRequestController.js:69`
- **Recipient**: User email
- **Purpose**: Confirm contact form submission
- **Variables**: `client_name`, `current_year`

#### 27. New Contact Submission (Admin)
- **Template**: `new_contact_submission.html`
- **Triggered by**: `controllers/contactRequestController.js:81`
- **Recipient**: Admin email
- **Purpose**: Notify admin of new contact submission
- **Variables**: `sender_name`, `sender_email`, `subject`, `message`, `admin_dashboard_url`, `current_year`

#### 28. Message Notification
- **Template**: `message_notification.html`
- **Triggered by**:
  - `controllers/adminController.js:431, 888`
- **Recipient**: Client email
- **Purpose**: Notify of new message
- **Variables**: `recipient_name`, `sender_name`, `message_preview`, `message_url`, `current_year`

#### 29. Client Message Notification
- **Template**: `client_message_notification.html`
- **Triggered by**: `controllers/clientController.js:279`
- **Recipient**: Advisor email
- **Purpose**: Notify advisor of client message
- **Variables**: `advisor_name`, `client_name`, `message_preview`, `dashboard_url`, `current_year`

---

### Lead Management

#### 30. Lead Selected
- **Template**: `lead_selected.html`
- **Triggered by**: `controllers/leadController.js:323`
- **Recipient**: Lead email
- **Purpose**: Notify lead they've been selected
- **Variables**: `client_name`, `registration_url`, `current_year`

---

### Admin Management

#### 31. Admin Action Required
- **Template**: `admin_action_required.html`
- **Triggered by**: `routes/adminManagement.js:474`
- **Recipient**: Admin email
- **Purpose**: Alert admin of required action
- **Variables**: `admin_name`, `admin_email`, `admin_status`, `action_reason`, `suspend_url`, `delete_url`, `dashboard_url`, `current_year`

---

## 🔧 HOW TO FIX MISSING EMAILS

### Priority 1: Critical User-Facing Emails
1. `consultation_scheduled.html` - Used in 5 locations
2. `consultation_request_received.html` - Used in 2 locations
3. `profile_under_review.html` - Lead management
4. `onboarding_approved.html` - Used in 2 locations

### Priority 2: Admin Notifications
1. `admin_onboarding_review_needed.html`
2. `admin_onboarding_review_required.html`
3. `new_consultation_request_concierge.html`
4. `new_strategy_call_request.html`
5. `new_mock_session_request.html`

### Priority 3: Feature-Specific
1. Mock session templates (4 templates)
2. Strategy call templates (2 templates)
3. Profile unlock templates (3 templates)
4. Consultation flow templates (5 templates)

---

## 📋 ENDPOINT MAPPING

### Email Sending Endpoints

All emails are sent through:
- `utils/email.js` - Main email utility
  - `sendEmail(to, templateName, variables)`
  - `sendSimpleEmail(to, subject, message)`
  - `sendApplicationUpdateEmail(clientEmail, applicationData)`

### Controllers That Send Emails

1. **adminController.js** - Admin operations, invites, messages
2. **authController.js** - Registration, authentication
3. **clientController.js** - Client onboarding, messages
4. **contactRequestController.js** - Contact form handling
5. **interviewController.js** - Interview updates
6. **leadController.js** - Lead management, selection
7. **meetingController.js** - Meeting scheduling
8. **webhookController.js** - External webhooks (Calendly, etc.)

### Routes That Send Emails

1. **routes/adminConsultations.js** - Admin consultation management
2. **routes/adminConcierge.js** - Concierge service
3. **routes/adminDashboardComplete.js** - Admin dashboard operations
4. **routes/adminEnhancedFeatures.js** - Enhanced admin features
5. **routes/adminInterviews.js** - Interview management
6. **routes/adminManagement.js** - Admin user management
7. **routes/adminOnboardingTriggers.js** - Onboarding triggers
8. **routes/applications.js** - Application tracking
9. **routes/auth.js** - Authentication
10. **routes/clientOnboarding.js** - Client onboarding
11. **routes/clientOnboarding20Q.js** - 20 Questions onboarding
12. **routes/clientRegistration.js** - Client registration
13. **routes/consultationManagement.js** - Consultation management
14. **routes/consultationRequests.js** - Consultation requests
15. **routes/consultations.js** - Consultation operations
16. **routes/contact.js** - Contact form
17. **routes/mockSessions.js** - Mock interview sessions
18. **routes/onboardingWorkflow.js** - Onboarding workflow
19. **routes/public.js** - Public endpoints
20. **routes/publicConsultations.js** - Public consultation booking
21. **routes/secureOnboarding.js** - Secure onboarding
22. **routes/strategyCalls.js** - Strategy call booking

---

## 🚨 IMMEDIATE ACTION REQUIRED

### Fix Missing Templates
Create the 30 missing templates to prevent email sending failures

### Connect Unused Templates
Add triggers for the 7 unused templates or remove them

### Test All Email Flows
1. Registration flow
2. Consultation booking flow
3. Onboarding flow
4. Application tracking flow
5. Interview scheduling flow
6. Payment flow
7. Meeting scheduling flow

---

## 📝 NEXT STEPS

1. Create missing email templates
2. Test all email triggers
3. Verify email delivery
4. Check variable replacement
5. Test in multiple email clients
6. Document all email flows
7. Create email testing suite

---

**Last Updated**: December 2024
**Status**: ⚠️ NEEDS ATTENTION - 30 missing templates
