# Invite Email Fix - Complete

## Issue
The send invite email functionality was not working because the endpoint was using an incorrect email template name.

## Root Cause
In `backend/routes/adminDashboardComplete.js` line 74, the code was calling:
```javascript
await sendEmail(email, 'client_registration_invite', { ... })
```

But the template `client_registration_invite.html` does not exist in `backend/emails/templates/`.

## Solution
Changed the template name from `'client_registration_invite'` to `'signup_invite'` which is the correct template that exists at `backend/emails/templates/signup_invite.html`.

## Fixed Code
```javascript
// Line 74 in backend/routes/adminDashboardComplete.js
await sendEmail(email, 'signup_invite', {
  client_name: full_name,
  registration_link: registrationLink,
  token_expiry: '7 days',
  admin_name: req.user.full_name || 'Apply Bureau Team'
});
```

## Template Variables
The `signup_invite.html` template expects:
- `{{client_name}}` - Client's full name ✓
- `{{registration_link}}` - Registration URL with token ✓
- `{{current_year}}` - Auto-provided by email utility ✓

All required variables are being passed correctly.

## Verification
- ✅ Template name corrected
- ✅ All variables match template expectations
- ✅ No syntax errors
- ✅ Other invite endpoints already using correct template
- ✅ Code passes diagnostics

## Affected Endpoint
`POST /api/admin/clients/invite`

## Files Modified
- `backend/routes/adminDashboardComplete.js` (line 74)

## Status
✅ FIXED - Ready for testing
