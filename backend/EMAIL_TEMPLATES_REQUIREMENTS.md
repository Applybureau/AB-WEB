# Email Templates Requirements - Apply Bureau

## Email Templates to Update

### ✅ REQUIRED EMAILS:

1. **Consultation Confirmed** - `consultation_confirmed.html`
2. **Consultation Rescheduled** - `consultation_rescheduled.html`
3. **Consultation Waitlisted** - `consultation_waitlisted.html`
4. **Payment Confirmed Welcome** - `payment_received_welcome.html`
5. **Onboarding Completed** (Admin-triggered) - `onboarding_completed.html`
6. **Interview Update** - `interview_update_enhanced.html`
7. **Strategy Call Confirmed** - `strategy_call_confirmed.html`
8. **Meeting Reminder** - `consultation_reminder.html`
9. **Contact Form Received** - `contact_form_received.html`

### ❌ EMAILS TO REMOVE/DISABLE:

1. ~~Consultation Request Received~~ - NO EMAIL (on-screen message only)
2. ~~Profile Unlocked~~ - NOT NEEDED
3. ~~Application Status Update~~ - NOT NEEDED (dashboard only)
4. ~~Client Welcome~~ - NOT NEEDED
5. ~~Profile Under Review~~ - NOT NEEDED
6. ~~Strategy Call Requested~~ - NOT NEEDED (auto-confirmed)

## Template Variables Required:

### Common Variables:
- `{{client_name}}` - Client's first name
- `{{current_year}}` - Current year for footer

### Consultation Confirmed:
- `{{consultation_date}}` - e.g., "Tuesday, March 12"
- `{{consultation_time}}` - e.g., "5:00 PM (EST)"
- `{{consultation_duration}}` - e.g., "30–45 minutes"
- `{{meeting_link}}` - Google Meet URL

### Consultation Rescheduled:
- `{{new_date}}` - e.g., "Saturday, March 16"
- `{{new_time}}` - e.g., "11:30 AM (EST)"

### Payment Confirmed:
- `{{tier}}` - e.g., "Tier 2"
- `{{dashboard_url}}` - Client dashboard URL

### Interview Update:
- `{{role_title}}` - e.g., "Senior Software Engineer"
- `{{company_name}}` - e.g., "TechCorp Inc."

### Strategy Call Confirmed:
- `{{call_date}}` - e.g., "Tuesday, March 12"
- `{{call_time}}` - e.g., "5:00 PM (EST)"
- `{{call_duration}}` - e.g., "30 minutes"

### Meeting Reminder:
- `{{meeting_date}}` - e.g., "Tuesday, March 12"
- `{{meeting_time}}` - e.g., "5:00 PM (EST)"

## Email Sending Logic:

1. **Consultation Confirmed** - Sent when admin confirms consultation
2. **Consultation Rescheduled** - Sent when admin reschedules
3. **Consultation Waitlisted** - Sent when admin adds to waitlist
4. **Payment Confirmed** - Sent automatically after payment verification
5. **Onboarding Completed** - Sent when admin clicks "Send onboarding confirmation"
6. **Interview Update** - Sent automatically when status = "Interview Request"
7. **Strategy Call Confirmed** - Sent immediately after client books call
8. **Meeting Reminder** - Sent 24 hours before meeting
9. **Contact Form** - Sent immediately after form submission

## Brand Guidelines:

- **From**: Apply Bureau <admin@applybureau.com>
- **Reply-To**: applybureau@gmail.com
- **Color**: Teal (#0D9488)
- **Tone**: Professional, warm, concise
- **Signature**: Team name (varies by email type)
