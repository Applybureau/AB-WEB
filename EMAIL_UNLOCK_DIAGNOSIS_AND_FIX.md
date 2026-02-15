# Email & Unlock Account Issues - Diagnosis & Fix

## 🔍 Problem Summary

Emails work in backend tests but don't send when called from the frontend for:
1. **Unlock Account** - Profile unlock emails not sending
2. **Verify Email** - No endpoint exists to resend verification emails

## ✅ Diagnosis Results

### Email System Status: **WORKING** ✅
- Test email sent successfully to israelloko65@gmail.com
- Email templates exist and are properly configured
- RESEND_API_KEY is valid and functional

### Root Causes Identified:

#### 1. **Multiple Unlock Endpoints** ⚠️
Two different endpoints exist with different requirements:

**Endpoint A:** `POST /api/admin/clients/:id/unlock`
- Location: `backend/routes/admin.js`
- Table: `registered_users`
- Requirements: Client must exist, not already unlocked
- Email: `onboarding_approved`

**Endpoint B:** `PATCH /api/admin/clients/:client_id/unlock`
- Location: `backend/routes/onboardingWorkflow.js`
- Table: `registered_users`
- Requirements: Client must have `onboarding_completed = true`
- Email: `onboarding_approved`

**Issue:** Frontend may be calling the wrong endpoint or using wrong HTTP method.

#### 2. **Client ID Mismatch** ❌
- `registered_users` table has 5 clients
- `clients` table has different clients
- **NO matching IDs between tables!**
- Frontend passing ID from `clients` table → Endpoint looks in `registered_users` → Returns 404

#### 3. **Missing Verify Email Endpoint** ❌
- **NO endpoint exists** for admin to resend verification email
- Frontend calling non-existent endpoint
- Returns 404, no email sent

#### 4. **Constraint Violations**
Clients found:
- 4 clients with `profile_unlocked = false` (can be unlocked)
- 1 client with `profile_unlocked = true` (already unlocked)
- **ALL clients have `onboarding_completed = false`**
  - This means PATCH endpoint will fail!

## 🔧 Solutions

### Solution 1: Fix Client ID Mismatch

**Frontend must:**
1. Get client ID from the correct table (`registered_users`)
2. Ensure the ID exists in `registered_users` table
3. Do NOT use IDs from `clients` table

**Backend fix:**
```javascript
// Ensure client exists in both tables with same ID
// Or update endpoints to check both tables
```

### Solution 2: Standardize Unlock Endpoint

**Recommendation:** Use POST endpoint from `admin.js` as it has fewer constraints.

**Frontend should call:**
```javascript
POST /api/admin/clients/:id/unlock
Headers: {
  Authorization: `Bearer ${adminToken}`
}
Body: {} // Empty body is fine
```

**Requirements:**
- Client must exist in `registered_users` table
- Client must have `role = 'client'`
- Client must have `profile_unlocked = false`

### Solution 3: Create Verify Email Endpoint

**New endpoint needed:**
```javascript
POST /api/admin/clients/:id/resend-verification
```

This endpoint should:
1. Check if client exists
2. Generate verification token
3. Send verification email
4. Return success response

### Solution 4: Fix Onboarding Constraint

**For PATCH endpoint to work:**
- Clients need `onboarding_completed = true`
- Currently ALL clients have `false`

**Options:**
1. Use POST endpoint instead (no onboarding requirement)
2. Update clients to have `onboarding_completed = true`
3. Remove onboarding requirement from PATCH endpoint

## 📋 Frontend Checklist

To fix the frontend calls:

### For Unlock Account:
- [ ] Use `POST /api/admin/clients/:id/unlock` (not PATCH)
- [ ] Get client ID from `registered_users` table
- [ ] Include admin JWT token in Authorization header
- [ ] Check response for `email_sent: true`
- [ ] Handle errors properly (404 = client not found, 400 = already unlocked)

### For Verify Email:
- [ ] Wait for new endpoint to be created
- [ ] Use `POST /api/admin/clients/:id/resend-verification`
- [ ] Include admin JWT token
- [ ] Handle success/error responses

## 🧪 Testing

### Test Unlock with these clients:
```
1. test2@example.com (ID: fb95c293-b93a-45e9-8094-fa53c546893f)
2. test-payment@example.com (ID: 9a70fa1a-2384-4d66-83de-35d19b69b422)
3. test-consultation@example.com (ID: 39638545-3c9c-4e08-96b2-2020c1c1de7a)
4. testclient@applybureau.com (ID: 5833a1c0-3788-4f7b-b3bf-da375cff74c8)
```

All have `profile_unlocked = false` and can be tested.

### Test Command:
```bash
curl -X POST http://localhost:3000/api/admin/clients/fb95c293-b93a-45e9-8094-fa53c546893f/unlock \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

## 🎯 Next Steps

1. **Create missing verify email endpoint** (see implementation below)
2. **Update frontend to use correct endpoint and client IDs**
3. **Test with actual client IDs from registered_users table**
4. **Monitor email sending in production**

## 📝 Implementation: Verify Email Endpoint

See `backend/routes/admin.js` - Add this endpoint:

```javascript
router.post('/clients/:id/resend-verification', async (req, res) => {
  try {
    const { id } = req.params;
    const { sendEmail } = require('../utils/email');
    const jwt = require('jsonwebtoken');

    // Get client details
    const { data: client, error: clientError } = await supabaseAdmin
      .from('registered_users')
      .select('id, full_name, email, email_verified')
      .eq('id', id)
      .eq('role', 'client')
      .single();

    if (clientError || !client) {
      return res.status(404).json({ 
        success: false,
        error: 'Client not found',
        email_sent: false
      });
    }

    if (client.email_verified) {
      return res.status(400).json({ 
        success: false,
        error: 'Email is already verified',
        email_sent: false
      });
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: client.id, email: client.email, type: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Send verification email
    await sendEmail(client.email, 'signup_invite', {
      client_name: client.full_name,
      verification_link: verificationUrl,
      admin_name: req.user.full_name || 'Apply Bureau Team',
      current_year: new Date().getFullYear()
    });

    res.json({
      success: true,
      message: 'Verification email sent successfully',
      email_sent: true,
      sent_to: client.email
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send verification email',
      email_sent: false
    });
  }
});
```

## 🚨 Critical Findings

1. **Email system works perfectly** - Issue is NOT with email sending
2. **Client ID mismatch** - Frontend using wrong table
3. **Missing endpoint** - Verify email endpoint doesn't exist
4. **Constraint issues** - Clients don't meet requirements for PATCH endpoint

## ✅ Conclusion

The backend email system is fully functional. The issues are:
1. Frontend calling wrong endpoints or using wrong client IDs
2. Missing verify email endpoint
3. Data inconsistency between tables

Fix these three issues and emails will send properly from the frontend.
