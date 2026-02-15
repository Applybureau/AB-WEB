# Client Actions API - Quick Reference

## Endpoints Overview

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/client-actions/confirm-strategy-call` | POST | Admin | Confirm strategy call and send email |
| `/api/client-actions/unlock-account` | POST | Admin | Unlock client account |
| `/api/client-actions/request-password-reset` | POST | Public | Request password reset email |
| `/api/client-actions/reset-password` | POST | Public | Complete password reset |

---

## 1. Confirm Strategy Call

**Endpoint**: `POST /api/client-actions/confirm-strategy-call`

**Request**:
```json
{
  "strategy_call_id": "uuid",
  "selected_slot_index": 0,
  "meeting_link": "https://meet.google.com/xxx",
  "admin_notes": "Optional notes"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Strategy call confirmed and email sent successfully",
  "strategy_call": { ... },
  "confirmed_slot": { "date": "2024-01-15", "time": "14:00" },
  "email_sent": true
}
```

**Email Template**: `strategy_call_confirmed.html`

---

## 2. Unlock Account

**Endpoint**: `POST /api/client-actions/unlock-account`

**Request**:
```json
{
  "client_id": "uuid",
  "send_notification": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Account unlocked successfully",
  "client": { ... },
  "email_sent": true
}
```

**Email Template**: `onboarding_approved.html`

---

## 3. Request Password Reset

**Endpoint**: `POST /api/client-actions/request-password-reset`

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

**Email Template**: `admin_password_reset.html`

---

## 4. Reset Password

**Endpoint**: `POST /api/client-actions/reset-password`

**Request**:
```json
{
  "token": "jwt_token_from_email",
  "new_password": "NewPassword123!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password."
}
```

---

## Email Templates Used

| Action | Template | Recipient | Subject |
|--------|----------|-----------|---------|
| Strategy Call Confirm | `strategy_call_confirmed.html` | Client | "Strategy Call Confirmed" |
| Account Unlock | `onboarding_approved.html` | Client | "Your Account Has Been Unlocked" |
| Password Reset | `admin_password_reset.html` | User | "Password Reset - Apply Bureau" |

---

## Field Names for Strategy Call Email

When confirming a strategy call, the email template receives:

```javascript
{
  client_name: "John Doe",
  call_date: "2024-01-15",
  call_time: "14:00",
  call_duration: "30 minutes",
  meeting_link: "https://meet.google.com/xxx",
  admin_name: "Admin Name",
  call_purpose: "This call aligns your goals...",
  next_steps: "Please mark this time...",
  user_id: "client-uuid"
}
```

---

## Field Names for Account Unlock Email

When unlocking an account, the email template receives:

```javascript
{
  client_name: "Jane Smith",
  dashboard_url: "https://applybureau.com/dashboard",
  message: "Your account has been unlocked...",
  next_steps: "Log in to your dashboard...",
  user_id: "client-uuid"
}
```

---

## Field Names for Password Reset Email

When requesting password reset, the email template receives:

```javascript
{
  admin_name: "User Name",  // or client_name
  reset_link: "https://applybureau.com/reset-password?token=...",
  reset_url: "https://applybureau.com/reset-password?token=...",
  expiry_time: "1 hour",
  support_email: "applybureau@gmail.com",
  user_id: "user-uuid"
}
```

---

## Frontend Integration Examples

### Confirm Strategy Call
```javascript
const response = await fetch('/api/client-actions/confirm-strategy-call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    strategy_call_id: callId,
    selected_slot_index: 0,
    meeting_link: 'https://meet.google.com/xxx'
  })
});
```

### Unlock Account
```javascript
const response = await fetch('/api/client-actions/unlock-account', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    client_id: clientId,
    send_notification: true
  })
});
```

### Request Password Reset
```javascript
const response = await fetch('/api/client-actions/request-password-reset', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com'
  })
});
```

### Reset Password
```javascript
const response = await fetch('/api/client-actions/reset-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: resetToken,
    new_password: 'NewPassword123!'
  })
});
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Missing or invalid parameters |
| 401 | Unauthorized - Invalid or missing auth token |
| 403 | Forbidden - Not admin or access denied |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error - Server-side error |

---

## Testing Commands

```bash
# Test strategy call confirmation
curl -X POST http://localhost:8080/api/client-actions/confirm-strategy-call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"strategy_call_id":"UUID","selected_slot_index":0}'

# Test account unlock
curl -X POST http://localhost:8080/api/client-actions/unlock-account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"client_id":"UUID","send_notification":true}'

# Test password reset request
curl -X POST http://localhost:8080/api/client-actions/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test password reset completion
curl -X POST http://localhost:8080/api/client-actions/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"JWT_TOKEN","new_password":"NewPass123!"}'
```

---

## Notes

- Strategy call confirmation requires admin authentication
- Account unlock requires admin authentication
- Password reset is public (no auth required)
- All endpoints return JSON responses
- Email sending failures don't fail the request
- Password reset tokens expire in 1 hour
- Passwords must be at least 8 characters
- All actions are logged for security auditing
