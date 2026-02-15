# Complete Email Endpoints Guide - Frontend Integration

## Overview
This document provides EXACT specifications for every email-sending endpoint, including required fields, data formats, and expected responses.

---

## 1. Payment Confirmation & Registration Email

### Endpoint
```
POST /api/admin/concierge/payment-confirmation
```

### Authentication
```
Authorization: Bearer <admin_token>
```

### Required Request Body
```json
{
  "consultation_id": "uuid-string-or-null",
  "client_email": "client@example.com",
  "client_name": "John Doe",
  "payment_amount": "499",
  "payment_date": "2026-02-13",
  "package_tier": "Tier 2",
  "package_type": "tier",
  "selected_services": [],
  "payment_method": "interac_etransfer",
  "payment_reference": "Payment-1234567890",
  "admin_notes": "Payment verified"
}
```

### Field Details
| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `consultation_id` | string/null | No | UUID of consultation if exists | `"550e8400-e29b-41d4-a716-446655440000"` |
| `client_email` | string | **YES** | Client's email address | `"john@example.com"` |
| `client_name` | string | **YES** | Client's full name | `"John Doe"` |
| `payment_amount` | string | **YES** | Payment amount (no $ sign) | `"499"` or `"999"` |
| `payment_date` | string | No | Date in YYYY-MM-DD format | `"2026-02-13"` |
| `package_tier` | string | No | Package name | `"Tier 2"` or `"Premium Package"` |
| `package_type` | string | No | Type of package | `"tier"` or `"custom"` |
| `selected_services` | array | No | Array of service objects | `[]` or `[{"name": "Resume Review"}]` |
| `payment_method` | string | No | Payment method used | `"interac_etransfer"` or `"credit_card"` |
| `payment_reference` | string | No | Payment reference number | `"Payment-1234567890"` |
| `admin_notes` | string | No | Internal admin notes | `"Payment verified"` |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Payment confirmed and invitation sent",
  "email_sent": true,
  "registration_url": "https://www.applybureau.com/register?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "client_email": "john@example.com",
  "client_id": "uuid-string-or-null",
  "data": {
    "consultation_id": "uuid-or-null",
    "client_email": "john@example.com",
    "client_name": "John Doe",
    "payment_amount": "499",
    "payment_date": "2026-02-13",
    "package_tier": "Tier 2",
    "package_type": "tier",
    "selected_services": [],
    "status": "onboarding",
    "admin_status": "onboarding",
    "registration_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_expires_at": "2026-02-20T12:00:00.000Z",
    "registration_url": "https://www.applybureau.com/register?token=..."
  }
}
```

### Error Response (500)
```json
{
  "success": false,
  "error": "Failed to process payment confirmation",
  "email_sent": false,
  "details": "Error message here"
}
```

### Frontend Implementation
```javascript
const verifyPayment = async (formData) => {
  try {
    const response = await axios.post(
      'https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/concierge/payment-confirmation',
      {
        consultation_id: formData.consultationId || null,
        client_email: formData.email,           // REQUIRED
        client_name: formData.name,             // REQUIRED
        payment_amount: formData.amount,        // REQUIRED (no $ sign)
        payment_date: new Date().toISOString().split('T')[0],
        package_tier: formData.packageTier || 'Standard Package',
        package_type: 'tier',
        selected_services: formData.services || [],
        payment_method: formData.paymentMethod || 'interac_etransfer',
        payment_reference: formData.reference || `Payment-${Date.now()}`,
        admin_notes: formData.notes || ''
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Check if email was sent
    if (response.data.email_sent) {
      toast.success('✅ Payment confirmed and registration email sent!');
      console.log('Registration URL:', response.data.registration_url);
    } else {
      toast.warning('⚠️ Payment confirmed but email failed to send');
      // Show manual action option
    }

    return response.data;
  } catch (error) {
    toast.error('❌ Failed to verify payment');
    console.error(error.response?.data);
    throw error;
  }
};
```

### Email Template Used
- **Template**: `payment_confirmed_welcome_concierge.html`
- **Subject**: "Apply Bureau — Payment Confirmed & Next Steps"
- **Contains**: Registration link with 7-day expiry token

---

## 2. Profile Unlock Email

### Endpoint
```
POST /api/admin/clients/:id/unlock
```

### Authentication
```
Authorization: Bearer <admin_token>
```

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | **YES** | Client's UUID from database |

### Request Body
```json
{}
```
(No body required - client ID is in URL)

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Profile unlocked successfully",
  "email_sent": true,
  "profile_unlocked": true
}
```

### Error Responses

**Client Not Found (404)**:
```json
{
  "success": false,
  "error": "Client not found",
  "email_sent": false
}
```

**Already Unlocked (400)**:
```json
{
  "success": false,
  "error": "Profile is already unlocked",
  "email_sent": false
}
```

**Server Error (500)**:
```json
{
  "success": false,
  "error": "Failed to unlock profile",
  "email_sent": false
}
```

### Frontend Implementation
```javascript
const unlockClientProfile = async (clientId) => {
  try {
    const response = await axios.post(
      `https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/clients/${clientId}/unlock`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.email_sent) {
      toast.success('✅ Profile unlocked and notification sent!');
    } else {
      toast.warning('⚠️ Profile unlocked but email failed to send');
    }

    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      toast.error('❌ Client not found');
    } else if (error.response?.status === 400) {
      toast.info('ℹ️ Profile is already unlocked');
    } else {
      toast.error('❌ Failed to unlock profile');
    }
    throw error;
  }
};
```

### Email Template Used
- **Template**: `onboarding_approved.html`
- **Subject**: "Your Apply Bureau Dashboard is Now Active"
- **Contains**: Dashboard access link

---

## 3. Consultation Confirmation Email

### Endpoint
```
POST /api/admin/concierge/consultations/:id/confirm
```

### Authentication
```
Authorization: Bearer <admin_token>
```

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | **YES** | Consultation UUID |

### Required Request Body
```json
{
  "selected_slot_index": 0,
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "admin_notes": "Looking forward to our call"
}
```

### Field Details
| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `selected_slot_index` | number | **YES** | Which time slot to confirm (0, 1, or 2) | `0` |
| `meeting_link` | string | No | Google Meet or Zoom link | `"https://meet.google.com/..."` |
| `admin_notes` | string | No | Additional notes for client | `"Looking forward to our call"` |

### Success Response (200 OK)
```json
{
  "message": "Consultation confirmed successfully",
  "consultation": {
    "id": "uuid",
    "status": "scheduled",
    "scheduled_at": "2026-02-20T14:00:00.000Z",
    "meeting_link": "https://meet.google.com/...",
    "prospect_name": "John Doe",
    "prospect_email": "john@example.com"
  },
  "confirmed_slot": {
    "date": "2026-02-20",
    "time": "14:00"
  },
  "confirmed_time": "2026-02-20T14:00:00.000Z"
}
```

### Frontend Implementation
```javascript
const confirmConsultation = async (consultationId, slotIndex, meetingLink) => {
  try {
    const response = await axios.post(
      `https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/concierge/consultations/${consultationId}/confirm`,
      {
        selected_slot_index: slotIndex,  // REQUIRED: 0, 1, or 2
        meeting_link: meetingLink,       // Optional but recommended
        admin_notes: 'Looking forward to speaking with you!'
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    toast.success('✅ Consultation confirmed and email sent!');
    return response.data;
  } catch (error) {
    toast.error('❌ Failed to confirm consultation');
    throw error;
  }
};
```

### Email Template Used
- **Template**: `consultation_confirmed_concierge.html`
- **Subject**: "Your Consultation is Confirmed"
- **Contains**: Confirmed date, time, and meeting link

---

## 4. Get Client ID for Email Operations

### Problem
Frontend needs the client ID to unlock profiles or perform other operations.

### Solution: Get Client List

#### Endpoint
```
GET /api/admin/clients
```

#### Authentication
```
Authorization: Bearer <admin_token>
```

#### Query Parameters
```
?search=john@example.com
&limit=10
&offset=0
```

#### Response
```json
{
  "clients": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "client",
      "profile_unlocked": false,
      "onboarding_completed": true,
      "created_at": "2026-02-13T10:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

#### Frontend Implementation
```javascript
const getClientByEmail = async (email) => {
  try {
    const response = await axios.get(
      `https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/clients`,
      {
        params: { search: email },
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );

    if (response.data.clients.length > 0) {
      return response.data.clients[0]; // Returns client with ID
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get client:', error);
    return null;
  }
};

// Usage:
const client = await getClientByEmail('john@example.com');
if (client) {
  await unlockClientProfile(client.id);
}
```

---

## Common Patterns

### 1. Check Email Send Status
```javascript
// Always check email_sent flag
if (response.data.email_sent === true) {
  // Email sent successfully
  showSuccess('Email sent!');
} else {
  // Email failed but operation succeeded
  showWarning('Operation completed but email failed');
  // Optionally show manual action
}
```

### 2. Handle Errors Gracefully
```javascript
try {
  const response = await apiCall();
  // Handle success
} catch (error) {
  const status = error.response?.status;
  const data = error.response?.data;
  
  switch (status) {
    case 400:
      showError(data.error || 'Invalid request');
      break;
    case 404:
      showError('Resource not found');
      break;
    case 500:
      showError('Server error');
      // Check if email_sent is false
      if (data.email_sent === false) {
        showInfo('You may need to manually send the email');
      }
      break;
    default:
      showError('An error occurred');
  }
}
```

### 3. Store Registration URL
```javascript
// After payment confirmation
const response = await verifyPayment(formData);

if (response.email_sent) {
  // Email sent - client will receive link
  toast.success('Registration email sent!');
} else {
  // Email failed - show URL to admin
  toast.warning('Email failed. Share this link with client:');
  copyToClipboard(response.registration_url);
}
```

---

## Testing Endpoints

### Test Payment Confirmation
```bash
curl -X POST https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/concierge/payment-confirmation \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_email": "test@example.com",
    "client_name": "Test User",
    "payment_amount": "499",
    "package_tier": "Tier 2",
    "payment_method": "interac_etransfer"
  }'
```

### Test Profile Unlock
```bash
curl -X POST https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/clients/CLIENT_ID/unlock \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Test Get Clients
```bash
curl -X GET "https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/clients?search=test@example.com" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Troubleshooting

### Email Not Sending

1. **Check Response**:
   ```javascript
   if (response.data.email_sent === false) {
     console.log('Email failed to send');
     // Check server logs for details
   }
   ```

2. **Verify Required Fields**:
   - Payment confirmation: `client_email`, `client_name`, `payment_amount` are REQUIRED
   - Profile unlock: `client_id` in URL is REQUIRED

3. **Check Email Address**:
   - Must be valid email format
   - No typos in email address

4. **Verify Token**:
   - Admin token must be valid
   - Token must not be expired

### Client ID Not Found

1. **Search for Client First**:
   ```javascript
   const client = await getClientByEmail(email);
   if (!client) {
     toast.error('Client not found. Payment may not be confirmed yet.');
     return;
   }
   ```

2. **Wait for Payment Confirmation**:
   - Client record is created during payment confirmation
   - Must confirm payment before unlocking profile

---

## Summary

### Key Points
1. ✅ Always check `email_sent` flag in response
2. ✅ Use exact field names as specified
3. ✅ Include admin token in Authorization header
4. ✅ Handle errors gracefully with user-friendly messages
5. ✅ Get client ID before attempting unlock operations

### Required Fields Checklist
- **Payment Confirmation**: `client_email`, `client_name`, `payment_amount`
- **Profile Unlock**: `client_id` (in URL)
- **Consultation Confirm**: `consultation_id` (in URL), `selected_slot_index`

### Email Templates
- Payment: `payment_confirmed_welcome_concierge.html`
- Unlock: `onboarding_approved.html`
- Consultation: `consultation_confirmed_concierge.html`
