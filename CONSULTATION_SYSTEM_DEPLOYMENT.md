# Consultation Request System - Deployment Guide

## Current Status

✅ **Completed:**
- Created consultation request routes (`/routes/consultationsCombined.js`)
- Created contact form routes (`/routes/contact.js`) 
- Created database schema (`WEBSITE_CONSULTATION_SCHEMA.sql`)
- Created email templates for all consultation workflows
- Updated server.js with new route configurations
- Created comprehensive test scripts

❌ **Pending:**
- Database schema needs to be applied to Supabase
- Code needs to be deployed to Render
- Routes need to be tested on production

## Required API Endpoints (User Specification)

### 1. POST /api/consultations (PUBLIC)
**Purpose:** Accept consultation requests from website
**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "role_targets": "Senior Software Engineer, Product Manager",
  "location_preferences": "Toronto, Remote",
  "minimum_salary": "$120,000 CAD",
  "target_market": "Technology",
  "employment_status": "Currently Employed",
  "package_interest": "Tier 2",
  "area_of_concern": "Interview preparation",
  "consultation_window": "Morning (9 AM - 12 PM EST)"
}
```
**Response:**
```json
{
  "id": 123,
  "status": "pending",
  "message": "Consultation request received"
}
```

### 2. GET /api/consultations (ADMIN AUTH REQUIRED)
**Purpose:** Return consultation requests for admin
**Response:**
```json
[
  {
    "id": 123,
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "role_targets": "Senior Software Engineer",
    "location_preferences": "Toronto, Remote",
    "minimum_salary": "$120,000 CAD",
    "target_market": "Technology",
    "employment_status": "Currently Employed",
    "package_interest": "Tier 2",
    "area_of_concern": "Interview preparation",
    "consultation_window": "Morning (9 AM - 12 PM EST)",
    "status": "pending",
    "created_at": "2026-01-07T13:30:00Z"
  }
]
```

### 3. PATCH /api/consultations/:id (ADMIN AUTH REQUIRED)
**Purpose:** Update consultation status
**Request Body:**
```json
{
  "status": "approved", // or "rejected", "scheduled"
  "admin_notes": "Optional notes"
}
```

### 4. POST /api/contact (PUBLIC)
**Purpose:** Handle contact form submissions
**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subject": "General inquiry",
  "message": "Hello, I have a question..."
}
```

## Deployment Steps

### Step 1: Apply Database Schema
Run this SQL in your Supabase SQL Editor:

```sql
-- Copy the entire content of WEBSITE_CONSULTATION_SCHEMA.sql
-- This creates the consultation_requests and contact_submissions tables
```

### Step 2: Deploy Code Changes
The following files have been updated and need to be deployed:

**New Files:**
- `routes/consultationsCombined.js` - Main consultation endpoints
- `routes/contact.js` - Contact form endpoint
- `emails/templates/consultation_approved.html`
- `emails/templates/consultation_rejected.html`
- `emails/templates/contact_form_received.html`
- `emails/templates/new_contact_submission.html`

**Updated Files:**
- `server.js` - Updated route registrations

### Step 3: Test Endpoints
Use the test script: `node scripts/test-consultation-requests.js`

## Current Route Configuration

```javascript
// In server.js
app.use('/api/consultations', consultationsCombinedRoutes); // NEW: Public POST + Admin GET
app.use('/api/contact', contactRoutes); // NEW: Public contact form
app.use('/api/consultation-management', consultationRoutes); // OLD: Admin-only internal consultations
```

## Email Templates Created

1. **consultation_request_received.html** - Sent to client when request is submitted
2. **new_consultation_request.html** - Sent to admin when new request arrives
3. **consultation_approved.html** - Sent to client when request is approved
4. **consultation_rejected.html** - Sent to client when request is rejected
5. **consultation_confirmed.html** - Sent to client when consultation is scheduled
6. **contact_form_received.html** - Sent to client when contact form is submitted
7. **new_contact_submission.html** - Sent to admin when contact form is received

## Authentication

- **Admin Email:** admin@applybureau.com
- **Admin Password:** admin123
- **Public Endpoints:** POST /api/consultations, POST /api/contact
- **Protected Endpoints:** GET /api/consultations, PATCH /api/consultations/:id

## Next Steps

1. **Apply the database schema** in Supabase SQL Editor
2. **Deploy the code changes** to Render (commit and push to trigger deployment)
3. **Test the endpoints** using the provided test scripts
4. **Verify email delivery** is working correctly

## Testing Commands

```bash
# Test the consultation request system
node scripts/test-consultation-requests.js

# Debug current deployed routes
node scripts/debug-deployed-routes.js

# Test current deployed version
node scripts/test-current-deployed.js
```

## Database Tables Created

### consultation_requests
- Stores website consultation requests
- Fields match the user's API specification exactly
- Includes status tracking and admin processing

### contact_submissions  
- Stores contact form submissions
- Includes admin processing and status tracking

Both tables have proper RLS policies for admin access and audit trails.