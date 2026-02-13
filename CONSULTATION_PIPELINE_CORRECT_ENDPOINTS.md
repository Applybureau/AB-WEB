# Consultation Pipeline - Correct API Endpoints

## Overview
This document contains the ACTUAL endpoints implemented in the backend for the consultation pipeline stages.

---

## STAGE 1: PENDING → CONFIRMED

### Status Indicators
- Backend status: `pending`
- After confirmation: `scheduled`

### 1. CONFIRM CONSULTATION
**Endpoint**: `POST /api/admin/concierge/consultations/:id/confirm`

**Request Body**:
```json
{
  "selected_slot_index": 0,
  "meeting_details": {
    "meeting_link": "https://meet.google.com/abc-defg-hij",
    "meeting_notes": "Consultation confirmed for 2026-02-14 10:30"
  },
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "admin_notes": "Consultation confirmed"
}
```

**Response**:
```json
{
  "message": "Consultation confirmed successfully",
  "consultation": { /* updated consultation object */ },
  "confirmed_slot": {
    "date": "2026-02-14",
    "time": "10:30"
  },
  "confirmed_time": "2026-02-14T10:30:00.000Z"
}
```

**Email Sent**: `consultation_confirmed_concierge.html`

---

### 2. PROPOSE NEW TIME
**Endpoint**: `POST /api/admin/concierge/consultations/:id/reschedule`

**Request Body**:
```json
{
  "reschedule_reason": "Admin proposed a new time",
  "admin_notes": "Proposed time: Jan 26 at 3:00 PM"
}
```

**Response**:
```json
{
  "message": "Reschedule request sent",
  "consultation": { /* updated consultation object */ }
}
```

**Email Sent**: `consultation_reschedule_request.html`

---

### 3. ADD TO WAITLIST
**Endpoint**: `POST /api/admin/concierge/consultations/:id/waitlist`

**Request Body**:
```json
{
  "waitlist_reason": "Currently at capacity",
  "admin_notes": "Added to waitlist"
}
```

**Response**:
```json
{
  "message": "Consultation waitlisted",
  "consultation": { /* updated consultation object */ }
}
```

**Email Sent**: `consultation_waitlisted.html`

---

## STAGE 2: CONFIRMED → ONBOARDING

### Status Indicators
- Backend status: `scheduled` or `confirmed`
- After payment verification: `onboarding`

### 1. VERIFY PAYMENT & SEND REGISTRATION
**Endpoint**: `POST /api/admin/concierge/payment-confirmation`

**Request Body**:
```json
{
  "consultation_id": "uuid",
  "client_email": "client@example.com",
  "client_name": "John Doe",
  "payment_amount": 500.00,
  "payment_date": "2026-02-12",
  "package_tier": "Premium",
  "package_type": "tier",
  "selected_services": ["Resume Review", "Interview Prep"],
  "payment_method": "interac_etransfer",
  "payment_reference": "Payment-1707753600000",
  "admin_notes": "Payment verified"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment confirmed and registration invite sent successfully",
  "data": {
    "consultation_id": "uuid",
    "client_email": "client@example.com",
    "client_name": "John Doe",
    "payment_amount": 500.00,
    "status": "onboarding",
    "admin_status": "onboarding",
    "registration_token": "jwt-token-here",
    "token_expires_at": "2026-02-19T10:30:00.000Z",
    "registration_url": "https://applybureau.com/register?token=jwt-token-here",
    "email_sent": true
  }
}
```

**Email Sent**: `payment_confirmed_welcome_concierge.html`

**Registration URL Format**: `https://applybureau.com/register?token=<JWT_TOKEN>`

---

## STAGE 3: ONBOARDING → ACTIVE

### Status Indicators
- Backend status: `onboarding`
- After unlock: Client's `profile_unlocked` = true

### 1. UNLOCK CLIENT DASHBOARD
**Endpoint**: `PATCH /api/onboarding-workflow/admin/clients/:client_id/unlock`

**Request Body**:
```json
{
  "profile_unlocked": true,
  "admin_notes": "Dashboard unlocked after onboarding completion"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Client profile unlocked successfully",
  "data": {
    "client_id": "uuid",
    "profile_unlocked": true,
    "profile_unlock_date": "2026-02-12T10:30:00.000Z",
    "onboarding_completed": true
  }
}
```

**Note**: This endpoint requires the client to have completed onboarding first (`onboarding_completed: true`).

---

## IMPORTANT NOTES FOR FRONTEND

### 1. Payment Verification Endpoint
- ✅ **EXISTS**: `/api/admin/concierge/payment-confirmation`
- ✅ **SENDS EMAIL**: Yes, sends `payment_confirmed_welcome_concierge.html`
- ✅ **RETURNS**: `email_sent: true` in response

### 2. Unlock Endpoint
- ✅ **EXISTS**: `/api/onboarding-workflow/admin/clients/:client_id/unlock`
- ⚠️ **METHOD**: Uses `PATCH`, not `POST`
- ⚠️ **PATH**: Different from what frontend expects
- ⚠️ **REQUIREMENT**: Client must have `onboarding_completed: true`

### 3. Frontend Expected vs Actual

| Frontend Expects | Backend Actual | Status |
|-----------------|----------------|--------|
| `POST /api/admin/concierge/payment-confirmation` | `POST /api/admin/concierge/payment-confirmation` | ✅ Match |
| `POST /api/admin/clients/:clientId/unlock` | `PATCH /api/onboarding-workflow/admin/clients/:client_id/unlock` | ❌ Mismatch |

---

## CONSULTATION STATUS FLOW

```
1. CLIENT SUBMITS REQUEST
   ↓
   status: "pending"
   
2. ADMIN CONFIRMS
   ↓
   POST /api/admin/concierge/consultations/:id/confirm
   ↓
   status: "scheduled"
   Email: consultation_confirmed_concierge.html
   
3. ADMIN VERIFIES PAYMENT
   ↓
   POST /api/admin/concierge/payment-confirmation
   ↓
   status: "onboarding"
   Email: payment_confirmed_welcome_concierge.html
   Creates: registration_token (7-day expiry)
   
4. CLIENT COMPLETES REGISTRATION
   ↓
   Uses: /register?token=<JWT_TOKEN>
   ↓
   Client account created
   onboarding_completed: false
   profile_unlocked: false
   
5. CLIENT COMPLETES ONBOARDING (20Q)
   ↓
   onboarding_completed: true
   profile_unlocked: false (still locked)
   
6. ADMIN UNLOCKS DASHBOARD
   ↓
   PATCH /api/onboarding-workflow/admin/clients/:client_id/unlock
   ↓
   profile_unlocked: true
   Client has full dashboard access
```

---

## EMAIL TEMPLATES USED

| Stage | Action | Template | Recipient |
|-------|--------|----------|-----------|
| Pending → Confirmed | Confirm consultation | `consultation_confirmed_concierge.html` | Client |
| Pending → Rescheduled | Propose new time | `consultation_reschedule_request.html` | Client |
| Pending → Waitlisted | Add to waitlist | `consultation_waitlisted.html` | Client |
| Confirmed → Onboarding | Verify payment | `payment_confirmed_welcome_concierge.html` | Client |
| Onboarding → Active | Unlock dashboard | (No email currently) | - |

---

## REQUIRED FIXES FOR FRONTEND

### Option 1: Frontend Changes (Recommended)
Update frontend to use correct endpoint:
```javascript
// Change from:
POST /api/admin/clients/:clientId/unlock

// To:
PATCH /api/onboarding-workflow/admin/clients/:client_id/unlock
```

### Option 2: Backend Changes (Alternative)
Add alias endpoint in `adminConcierge.js`:
```javascript
router.post('/clients/:clientId/unlock', async (req, res) => {
  // Forward to actual unlock endpoint
});
```

---

## TESTING CHECKLIST

- [ ] Confirm consultation sends email
- [ ] Payment verification sends registration email
- [ ] Registration link works and has correct format
- [ ] Client can complete registration
- [ ] Client can complete onboarding (20Q)
- [ ] Unlock endpoint works with correct path/method
- [ ] Client dashboard unlocks after admin action

---

**Last Updated**: February 2026
**Backend Version**: Current production
**Status**: ✅ Payment endpoint working | ⚠️ Unlock endpoint path mismatch
