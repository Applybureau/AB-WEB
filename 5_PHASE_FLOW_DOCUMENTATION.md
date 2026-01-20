# Apply Bureau - 5-Phase Flow Documentation
**Complete Consultation → Active Client Pipeline**

---

## 🎯 FLOW OVERVIEW

This document maps the exact 5-phase flow specification to the backend implementation, showing which endpoints handle each phase and what status changes occur.

---

## 🟡 PHASE 1: The Consultation Request

### User Experience
- Visitor fills out form on dark-mode public site
- Picks 3 preferred time slots (Fri-Sun)
- Selects package tier
- Hits "Confirm Selection"

### Backend Implementation

**Endpoint:** `POST /api/public-consultations`

**Request Body:**
```json
{
  "full_name": "Client Name",
  "email": "client@example.com",
  "phone": "+1234567890",
  "role_targets": "Software Engineer, Senior Developer",
  "package_interest": "Tier 2",
  "employment_status": "Currently Employed",
  "area_of_concern": "Interview preparation",
  "consultation_window": "Weekday evenings",
  "country": "Nigeria",
  "linkedin_url": "https://linkedin.com/in/username",
  "preferred_slots": [
    { "date": "2026-01-17", "time": "18:00" },
    { "date": "2026-01-18", "time": "14:00" },
    { "date": "2026-01-19", "time": "16:00" }
  ]
}
```

**Backend Logic:**
1. Creates record in `consultation_requests` table
2. Sets `status` = `"pending"`
3. Sets `admin_status` = `"pending"`
4. Stores the 3 preferred time slots

**Instant Trigger:**
- Email template: `consultation_request_received.html`
- Sent to: Client email
- Content: "Request is being manually reviewed, check spam"

**Admin View:**
- New card appears in Admin Dashboard
- Visible at: `GET /api/admin/concierge/consultations?admin_status=pending`
- Shows: Name, email, phone, message, 3 time slots

**Status:** ✅ WORKING

---

## 🟡 PHASE 2: Admin Review (The 3-Button Logic)

### Admin Experience
- Opens dashboard to manage new lead
- Sees 3 matured buttons: **Confirm**, **Propose**, **Waitlist**

### Backend Implementation

#### Button 1: [Confirm]

**Endpoint:** `POST /api/admin/concierge/consultations/:id/confirm`

**Request Body:**
```json
{
  "selected_slot_index": 0,
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "meeting_details": "Looking forward to our discussion!",
  "admin_notes": "Approved for Tier 2 package"
}
```

**Backend Logic:**
1. Gets consultation request by ID
2. Selects time slot based on `selected_slot_index` (0, 1, or 2)
3. Updates `admin_status` = `"confirmed"`
4. Updates `status` = `"confirmed"`
5. Saves `confirmed_time` from selected slot
6. Stores meeting link and details

**Email Trigger:**
- Template: `consultation_confirmed_concierge.html`
- Sent to: Client email
- Content: Official calendar invite with Zoom/Google Meet link

**Status:** ⚠️ PARTIALLY WORKING (500 error - needs investigation)

---

#### Button 2: [Propose New]

**Endpoint:** `POST /api/admin/concierge/consultations/:id/reschedule`

**Request Body:**
```json
{
  "reschedule_reason": "Original times don't work, proposing alternative",
  "admin_notes": "Suggested Tuesday 3PM instead"
}
```

**Backend Logic:**
1. Updates `admin_status` = `"rescheduled"`
2. Resets `status` = `"pending"` (waiting for new times)
3. Stores reschedule reason

**Email Trigger:**
- Template: `consultation_reschedule_request.html`
- Sent to: Client email
- Content: Asks if new time works

**Status:** ✅ IMPLEMENTED (not tested)

---

#### Button 3: [Waitlist]

**Endpoint:** `POST /api/admin/concierge/consultations/:id/waitlist`

**Request Body:**
```json
{
  "waitlist_reason": "Calendar fully booked for next 2 weeks",
  "admin_notes": "Will reach out when availability opens"
}
```

**Backend Logic:**
1. Updates `admin_status` = `"waitlisted"`
2. Keeps `status` = `"pending"` (until resolved)
3. Stores waitlist reason

**Email Trigger:**
- Template: `consultation_waitlisted.html`
- Sent to: Client email
- Content: Polite "we are full" message

**Status:** ✅ IMPLEMENTED (not tested)

---

## 🔵 PHASE 3: The Payment Gate (The Bridge)

### Admin Experience
- Meeting completed, client has paid
- Admin clicks **[Verify & Invite]** button

### Backend Implementation

**Endpoint:** `POST /api/admin/concierge/payment/confirm-and-invite`

**Request Body:**
```json
{
  "client_email": "client@example.com",
  "client_name": "Client Name",
  "payment_amount": 500,
  "payment_method": "interac_etransfer",
  "payment_reference": "PAYMENT-12345",
  "admin_notes": "Payment verified - Tier 2 package"
}
```

**Backend Logic:**
1. Generates unique JWT token with 7-day expiry
2. Creates/updates record in `registered_users` table
3. Sets `payment_confirmed` = `true`
4. Sets `payment_confirmed_at` = current timestamp
5. Stores `registration_token` and `token_expires_at`
6. Sets `token_used` = `false`

**Token Generation:**
```javascript
const token = jwt.sign(
  { 
    email: client_email,
    name: client_name,
    type: 'registration',
    payment_confirmed: true
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

**Registration URL:**
```
https://yoursite.com/register?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Email Trigger:**
- Template: `payment_confirmed_welcome_concierge.html`
- Sent to: Client email
- Content: Exclusive registration link (cannot register without it)

**Security:**
- Token is one-time use only
- Expires in 7 days
- Cannot create account without this secret link
- Keeps system exclusive

**Status:** ❌ FAILING (Foreign key constraint issue)

**Fix Required:**
```sql
-- Option 1: Make field nullable
ALTER TABLE registered_users 
ALTER COLUMN payment_confirmed_by DROP NOT NULL;

-- Option 2: Drop foreign key constraint
ALTER TABLE registered_users 
DROP CONSTRAINT registered_users_payment_confirmed_by_fkey;
```

---

## 🟣 PHASE 4: Onboarding & The "Glass" Lock

### Client Experience
- Clicks registration link from email
- Creates password
- Logs in for first time
- Sees dashboard with **BLUR** (Glassmorphism)
- Can see shapes of "Application Tracker" but can't click
- Large button: **[Begin Onboarding]**

### Backend Implementation

#### Step 1: Registration

**Endpoint:** `POST /api/client-registration/register`

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "securepassword123",
  "confirm_password": "securepassword123"
}
```

**Backend Logic:**
1. Validates token (not expired, not used)
2. Decodes token to get email
3. Finds user in `registered_users` table
4. Hashes password with bcrypt
5. Updates `passcode_hash`
6. Sets `token_used` = `true`
7. Sets `is_active` = `true`
8. **CRITICAL:** Sets `profile_unlocked` = `false` (BLUR ACTIVE)

---

#### Step 2: First Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "client@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "token": "JWT_TOKEN",
  "user": {
    "id": "user-id",
    "email": "client@example.com",
    "full_name": "Client Name",
    "role": "client",
    "profile_unlocked": false,
    "onboarding_completed": false
  }
}
```

---

#### Step 3: Client Dashboard (Blurred)

**Endpoint:** `GET /api/client/dashboard`

**Headers:** `Authorization: Bearer JWT_TOKEN`

**Response:**
```json
{
  "user": {
    "profile_unlocked": false,
    "onboarding_completed": false
  },
  "dashboard_locked": true,
  "message": "Complete onboarding to unlock your dashboard"
}
```

**Frontend Logic:**
- If `profile_unlocked` = `false`, apply glassmorphism blur
- Show shapes of Application Tracker (teaser)
- Display large **[Begin Onboarding]** button
- Disable all interactive elements

---

#### Step 4: 20-Question Onboarding

**Endpoint:** `POST /api/client/onboarding-20q/submit`

**Request Body:**
```json
{
  "target_job_titles": ["Software Engineer", "Senior Developer"],
  "target_industries": ["Technology", "Finance"],
  "target_company_sizes": ["Startup", "Mid-size"],
  "target_locations": ["Remote", "Toronto", "Vancouver"],
  "remote_work_preference": "Fully Remote",
  "current_salary_range": "$80k-$100k",
  "target_salary_range": "$120k-$150k",
  "salary_negotiation_comfort": "Comfortable",
  "years_of_experience": "5-7 years",
  "key_technical_skills": ["JavaScript", "React", "Node.js"],
  "soft_skills_strengths": ["Communication", "Leadership"],
  "certifications_licenses": ["AWS Certified"],
  "job_search_timeline": "1-3 months",
  "application_volume_preference": "Quality over quantity",
  "networking_comfort_level": "Comfortable",
  "interview_confidence_level": "Needs improvement",
  "career_goals_short_term": "Senior role at tech company",
  "career_goals_long_term": "Engineering leadership",
  "biggest_career_challenges": ["Interview anxiety", "Resume gaps"],
  "support_areas_needed": ["Interview prep", "Resume optimization"]
}
```

**Backend Logic:**
1. Creates record in `client_onboarding_20q` table
2. Sets `execution_status` = `"pending"` (awaiting admin review)
3. Updates user: `onboarding_completed` = `true`
4. **CRITICAL:** `profile_unlocked` remains `false` (BLUR STILL ACTIVE)

**Admin Notification:**
- Admin gets notification: "New onboarding submission for review"
- Admin can view answers in dashboard

**Status:** ✅ IMPLEMENTED

---

## 🔴 PHASE 5: The Unlock & Active Execution

### Admin Experience
- Reviews 20 onboarding answers
- Verifies all information needed to start applying
- Clicks **[Unlock Profile]** button

### Backend Implementation

**Endpoint:** `POST /api/admin/onboarding-triggers/approve/:userId`

**Request Body:**
```json
{
  "unlock_profile": true,
  "send_welcome_email": true,
  "admin_notes": "All materials reviewed - ready for execution"
}
```

**Backend Logic:**
1. Gets onboarding record from `client_onboarding_20q`
2. Updates `execution_status` = `"active"`
3. Sets `approved_by` = admin ID
4. Sets `approved_at` = current timestamp
5. **CRITICAL:** Updates user: `profile_unlocked` = `true`
6. Sets `profile_unlocked_by` = admin ID
7. Sets `profile_unlocked_at` = current timestamp

**The Magic Moment:**
```javascript
// Before: is_locked: true (blur active)
// After:  is_locked: false (blur vanishes)

await supabaseAdmin
  .from('registered_users')
  .update({
    profile_unlocked: true,
    profile_unlocked_by: req.user.id,
    profile_unlocked_at: new Date().toISOString()
  })
  .eq('id', userId);
```

**Live Change:**
- Client's screen updates instantly (via Supabase Realtime)
- Blur vanishes
- Weekly Accordions become visible and clickable
- Application Tracker fully accessible

**Email Trigger:**
- Template: `profile_unlocked.html`
- Sent to: Client email
- Content: "Your dashboard is now unlocked!"

**Status:** ✅ WORKING

---

### Ongoing Work: Job Applications

#### Admin Adds Job

**Endpoint:** `POST /api/applications`

**Request Body:**
```json
{
  "user_id": "client-user-id",
  "company_name": "Google",
  "role": "Senior Software Engineer",
  "type": "job_application",
  "status": "applied",
  "application_date": "2026-01-15T10:00:00Z",
  "resume_used": "google_senior_swe_resume.pdf",
  "notes": "Applied via LinkedIn"
}
```

**Backend Logic:**
1. Creates record in `applications` table
2. Client sees new entry in Weekly Accordions
3. Grouped by week of application

---

#### Admin Changes Status to "Interview"

**Endpoint:** `PUT /api/applications/:id`

**Request Body:**
```json
{
  "status": "interviewing",
  "interview_date": "2026-01-22T14:00:00Z",
  "notes": "First round technical interview"
}
```

**Backend Logic:**
1. Updates application status
2. **AUTOMATIC TRIGGER:** Detects status change to "interviewing"
3. Sends high-priority "Interview Alert" email

**Email Trigger:**
- Template: `interview_update_enhanced.html`
- Sent to: Client email
- Priority: HIGH
- Content: Interview details, preparation tips

**Status:** ✅ IMPLEMENTED

---

## 📊 FLOW STATUS SUMMARY

| Phase | Feature | Status | Notes |
|-------|---------|--------|-------|
| **Phase 1** | Consultation request | ✅ WORKING | Lead created with PENDING status |
| | Receipt email | ✅ WORKING | Sent immediately |
| | Admin dashboard view | ✅ WORKING | New lead visible |
| **Phase 2** | Admin authentication | ✅ WORKING | JWT tokens |
| | View consultations | ✅ WORKING | Paginated list |
| | [Confirm] button | ⚠️ PARTIAL | 500 error (needs fix) |
| | [Propose New] button | ✅ IMPLEMENTED | Not tested |
| | [Waitlist] button | ✅ IMPLEMENTED | Not tested |
| **Phase 3** | Payment verification | ❌ FAILING | FK constraint issue |
| | Token generation | ✅ IMPLEMENTED | JWT with 7-day expiry |
| | Registration URL | ✅ IMPLEMENTED | Exclusive link system |
| | Email with link | ✅ IMPLEMENTED | Template ready |
| **Phase 4** | Client registration | ✅ IMPLEMENTED | Token-based |
| | Profile lock (blur) | ✅ IMPLEMENTED | is_locked boolean |
| | 20-question onboarding | ✅ IMPLEMENTED | Full form |
| | REVIEW_REQUIRED status | ✅ IMPLEMENTED | Admin notification |
| **Phase 5** | Admin review answers | ✅ IMPLEMENTED | Dashboard view |
| | [Unlock Profile] button | ✅ WORKING | Tested successfully |
| | is_locked flip | ✅ WORKING | true → false |
| | Blur vanishes | ✅ IMPLEMENTED | Frontend integration ready |
| | Job additions | ✅ IMPLEMENTED | Application tracking |
| | Interview alerts | ✅ IMPLEMENTED | Automatic emails |

---

## 🔧 REQUIRED FIXES

### Priority 1: Payment Confirmation FK Constraint

**Issue:** Foreign key constr