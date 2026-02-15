# Client Actions API Documentation

Complete documentation for strategy call confirmation, account unlock, and password reset endpoints.

## Base URL
```
Production: https://your-app.ondigitalocean.app/api/client-actions
Development: http://localhost:8080/api/client-actions
```

---

## 1. Confirm Strategy Call

Confirms a strategy call booking and sends confirmation email to the client.

### Endpoint
```
POST /api/client-actions/confirm-strategy-call
```

### Authentication
- **Required**: Yes (Admin only)
- **Header**: `Authorization: Bearer <admin_jwt_token>`

### Request Body
```json
{
  "strategy_call_id": "uuid-of-strategy-call",
  "selected_slot_index": 0,
  "meeting_link": "https://meet.google.com/xxx-yyyy-zzz",
  "admin_notes": "Looking forward to discussing your career goals"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `strategy_call_id` | string (UUID) | Yes | ID of the strategy call request |
| `selected_slot_index` | integer | Yes | Index of the selected time slot (0, 1, or 2) |
| `meeting_link` | string (URL) | No | Google Meet or Zoom link for the call |
| `admin_notes` | string | No | Internal notes from admin |

### Response (Success - 200)
```json
{
  "success": true,
  "message": "Strategy call confirmed and email sent successfully",
  "strategy_call": {
    "id": "uuid",
    "status": "confirmed",
    "admin_status": "confirmed",
    "confirmed_time": "2024-01-15T14:00:00.000Z",
    "meeting_link": "https://meet.google.com/xxx-yyyy-zzz",
    "client_name": "John Doe",
    "client_email": "john@example.com"
  },
  "confirmed_slot": {
    "date": "2024-01-15",
    "time": "14:00"
  },
  "email_sent": true
}
```

### Email Triggered
- **Template**: `strategy_call_confirmed.html`
- **Recipient**: Client email
- **Subject**: "Strategy Call Confirmed"
- **Variables**:
  - `client_name`: Client's full name
  - `call_date`: Selected date (e.g., "2024-01-15")
  - `call_time`: Selected time (e.g., "14:00")
  - `call_duration`: "30 minutes"
  - `meeting_link`: Google Meet/Zoom link or contact message
  - `admin_name`: Admin's name who confirmed
  - `call_purpose`: Purpose of the call
  - `next_steps`: Instructions for the client

### Error Responses

**400 Bad Request**
```json
{
  "error": "strategy_call_id is required"
}
```

**400 Bad Request**
```json
{
  "error": "selected_slot_index must be 0, 1, or 2"
}
```

**404 Not Found**
```json
{
  "error": "Strategy call request not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to confirm strategy call"
}
```

### Example Usage

**cURL**
```bash
curl -X POST https://your-app.ondigitalocean.app/api/client-actions/confirm-strategy-call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "strategy_call_id": "123e4567-e89b-12d3-a456-426614174000",
    "selected_slot_index": 1,
    "meeting_link": "https://meet.google.com/abc-defg-hij",
    "admin_notes": "Client is interested in tech roles"
  }'
```

**JavaScript (Fetch)**
```javascript
const response = await fetch('https://your-app.ondigitalocean.app/api/client-actions/confirm-strategy-call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    strategy_call_id: '123e4567-e89b-12d3-a456-426614174000',
    selected_slot_index: 1,
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    admin_notes: 'Client is interested in tech roles'
  })
});

const data = await response.json();
console.log(data);
```

---

## 2. Unlock Client Account

Unlocks a client account by setting `onboarding_complete` to `true` and optionally sends a notification email.

### Endpoint
```
POST /api/client-actions/unlock-account
```

### Authentication
- **Required**: Yes (Admin only)
- **Header**: `Authorization: Bearer <admin_jwt_token>`

### Request Body
```json
{
  "client_id": "uuid-of-client",
  "send_notification": true
}
```

### Field Descriptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `client_id` | string (UUID) | Yes | - | ID of the client to unlock |
| `send_notification` | boolean | No | true | Whether to send email notification |

### Response (Success - 200)
```json
{
  "success": true,
  "message": "Account unlocked successfully",
  "client": {
    "id": "uuid",
    "email": "client@example.com",
    "full_name": "Jane Smith",
    "onboarding_complete": true
  },
  "email_sent": true,
  "unlocked_by": "admin-uuid",
  "unlocked_at": "2024-01-15T10:30:00.000Z"
}
```

### Email Triggered (if send_notification = true)
- **Template**: `onboarding_approved.html`
- **Recipient**: Client email
- **Subject**: "Your Account Has Been Unlocked"
- **Variables**:
  - `client_name`: Client's full name
  - `dashboard_url`: Link to client dashboard
  - `message`: Unlock confirmation message
  - `next_steps`: Instructions for next steps

### Error Responses

**400 Bad Request**
```json
{
  "error": "client_id is required"
}
```

**404 Not Found**
```json
{
  "error": "Client not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to unlock account"
}
```

### Example Usage

**cURL**
```bash
curl -X POST https://your-app.ondigitalocean.app/api/client-actions/unlock-account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "client_id": "123e4567-e89b-12d3-a456-426614174000",
    "send_notification": true
  }'
```

**JavaScript (Fetch)**
```javascript
const response = await fetch('https://your-app.ondigitalocean.app/api/client-actions/unlock-account', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    client_id: '123e4567-e89b-12d3-a456-426614174000',
    send_notification: true
  })
});

const data = await response.json();
console.log(data);
```

### Notes
- Works with both `registered_users` and `clients` tables
- Sets `onboarding_completed` to `true` in `registered_users`
- Sets `onboarding_complete` to `true` in `clients`
- Also sets `is_active` to `true` for registered users

---

## 3. Request Password Reset

Initiates a password reset flow by sending a reset link to the user's email.

### Endpoint
```
POST /api/client-actions/request-password-reset
```

### Authentication
- **Required**: No (Public endpoint)

### Request Body
```json
{
  "email": "user@example.com"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string (email) | Yes | Email address of the user |

### Response (Success - 200)
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

### Development Response (NODE_ENV=development)
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent.",
  "dev_info": {
    "reset_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "reset_url": "http://localhost:3000/reset-password?token=...",
    "user_id": "uuid"
  }
}
```

### Email Triggered
- **Template**: `admin_password_reset.html`
- **Recipient**: User's email
- **Subject**: "Password Reset - Apply Bureau"
- **Variables**:
  - `admin_name` / `client_name`: User's full name
  - `reset_link`: Password reset URL with token
  - `reset_url`: Same as reset_link
  - `expiry_time`: "1 hour"
  - `support_email`: "applybureau@gmail.com"

### Token Details
- **Type**: JWT
- **Expiration**: 1 hour
- **Payload**:
  ```json
  {
    "userId": "uuid",
    "email": "user@example.com",
    "type": "password_reset",
    "source": "registered_users|clients|admins",
    "exp": 1234567890
  }
  ```

### Error Responses

**400 Bad Request**
```json
{
  "error": "email is required"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to send password reset email"
}
```

### Example Usage

**cURL**
```bash
curl -X POST https://your-app.ondigitalocean.app/api/client-actions/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**JavaScript (Fetch)**
```javascript
const response = await fetch('https://your-app.ondigitalocean.app/api/client-actions/request-password-reset', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com'
  })
});

const data = await response.json();
console.log(data);
```

### Security Notes
- Always returns success message to prevent email enumeration
- Checks `registered_users`, `clients`, and `admins` tables
- Token expires in 1 hour
- Only shows token details in development mode

---

## 4. Reset Password

Completes the password reset process using the token from the reset email.

### Endpoint
```
POST /api/client-actions/reset-password
```

### Authentication
- **Required**: No (Uses token from email)

### Request Body
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "new_password": "NewSecurePassword123!"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string (JWT) | Yes | Reset token from email |
| `new_password` | string | Yes | New password (min 8 characters) |

### Response (Success - 200)
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password."
}
```

### Error Responses

**400 Bad Request**
```json
{
  "error": "token and new_password are required"
}
```

**400 Bad Request**
```json
{
  "error": "Password must be at least 8 characters long"
}
```

**400 Bad Request**
```json
{
  "error": "Invalid or expired password reset token"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to reset password"
}
```

### Example Usage

**cURL**
```bash
curl -X POST https://your-app.ondigitalocean.app/api/client-actions/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "new_password": "NewSecurePassword123!"
  }'
```

**JavaScript (Fetch)**
```javascript
const response = await fetch('https://your-app.ondigitalocean.app/api/client-actions/reset-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: resetToken,
    new_password: 'NewSecurePassword123!'
  })
});

const data = await response.json();
console.log(data);
```

### Password Requirements
- Minimum 8 characters
- Hashed with bcrypt (12 rounds)

### Security Notes
- Token must be valid and not expired
- Token type must be `password_reset`
- Updates password in appropriate table based on user source
- Password is hashed with bcrypt before storage

---

## Complete Frontend Integration Example

### Strategy Call Confirmation Flow

```javascript
// Admin confirms strategy call
async function confirmStrategyCall(strategyCallId, slotIndex, meetingLink) {
  try {
    const response = await fetch('/api/client-actions/confirm-strategy-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify({
        strategy_call_id: strategyCallId,
        selected_slot_index: slotIndex,
        meeting_link: meetingLink,
        admin_notes: 'Confirmed via admin dashboard'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    console.log('Strategy call confirmed:', data);
    
    // Show success message
    alert(`Strategy call confirmed for ${data.confirmed_slot.date} at ${data.confirmed_slot.time}`);
    
    return data;
  } catch (error) {
    console.error('Error confirming strategy call:', error);
    alert('Failed to confirm strategy call: ' + error.message);
  }
}
```

### Account Unlock Flow

```javascript
// Admin unlocks client account
async function unlockClientAccount(clientId) {
  try {
    const response = await fetch('/api/client-actions/unlock-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify({
        client_id: clientId,
        send_notification: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    console.log('Account unlocked:', data);
    
    // Show success message
    alert(`Account unlocked for ${data.client.full_name}. Email sent: ${data.email_sent}`);
    
    return data;
  } catch (error) {
    console.error('Error unlocking account:', error);
    alert('Failed to unlock account: ' + error.message);
  }
}
```

### Password Reset Flow

```javascript
// Step 1: Request password reset
async function requestPasswordReset(email) {
  try {
    const response = await fetch('/api/client-actions/request-password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    console.log('Password reset requested:', data);
    
    // Show success message
    alert('If an account exists with this email, a password reset link has been sent.');
    
    return data;
  } catch (error) {
    console.error('Error requesting password reset:', error);
    alert('Failed to request password reset: ' + error.message);
  }
}

// Step 2: Reset password with token
async function resetPassword(token, newPassword) {
  try {
    const response = await fetch('/api/client-actions/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        new_password: newPassword
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    console.log('Password reset successful:', data);
    
    // Redirect to login
    alert('Password reset successfully! You can now log in with your new password.');
    window.location.href = '/login';
    
    return data;
  } catch (error) {
    console.error('Error resetting password:', error);
    alert('Failed to reset password: ' + error.message);
  }
}

// Usage in reset password page
const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get('token');

document.getElementById('resetForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPassword = document.getElementById('newPassword').value;
  await resetPassword(resetToken, newPassword);
});
```

---

## Database Tables Used

### strategy_calls
- `id` (UUID, primary key)
- `client_id` (UUID, foreign key)
- `client_name` (text)
- `client_email` (text)
- `preferred_slots` (jsonb array)
- `status` (text)
- `admin_status` (text)
- `confirmed_time` (timestamp)
- `meeting_link` (text)
- `admin_notes` (text)
- `admin_action_by` (UUID)
- `admin_action_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### registered_users
- `id` (UUID, primary key)
- `email` (text)
- `full_name` (text)
- `passcode_hash` (text)
- `role` (text)
- `is_active` (boolean)
- `onboarding_completed` (boolean)
- `updated_at` (timestamp)

### clients
- `id` (UUID, primary key)
- `email` (text)
- `full_name` (text)
- `password` (text)
- `role` (text)
- `onboarding_complete` (boolean)
- `updated_at` (timestamp)

### admins
- `id` (UUID, primary key)
- `email` (text)
- `full_name` (text)
- `password` (text)
- `role` (text)
- `is_active` (boolean)
- `updated_at` (timestamp)

---

## Testing

### Test Strategy Call Confirmation
```bash
# Get a strategy call ID from the database first
# Then confirm it
curl -X POST http://localhost:8080/api/client-actions/confirm-strategy-call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "strategy_call_id": "YOUR_STRATEGY_CALL_ID",
    "selected_slot_index": 0,
    "meeting_link": "https://meet.google.com/test-link"
  }'
```

### Test Account Unlock
```bash
curl -X POST http://localhost:8080/api/client-actions/unlock-account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "send_notification": true
  }'
```

### Test Password Reset
```bash
# Step 1: Request reset
curl -X POST http://localhost:8080/api/client-actions/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'

# Step 2: Use token from email to reset
curl -X POST http://localhost:8080/api/client-actions/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_FROM_EMAIL",
    "new_password": "NewPassword123!"
  }'
```

---

## Summary

All three endpoints are now implemented and documented:

1. **Confirm Strategy Call** - Admin confirms booking and triggers email
2. **Unlock Account** - Admin unlocks client account with optional notification
3. **Password Reset** - Complete password reset flow with email trigger

Each endpoint includes proper error handling, logging, and email notifications.
