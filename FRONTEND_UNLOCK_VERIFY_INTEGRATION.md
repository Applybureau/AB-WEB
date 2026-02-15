# Frontend Integration Guide: Unlock & Verify Email

## 🎯 Overview

This guide shows the frontend team exactly how to call the unlock and verify email endpoints correctly.

## 📍 Endpoints

### 1. Unlock Account
```
POST /api/admin/clients/:id/unlock
```

### 2. Resend Verification Email
```
POST /api/admin/clients/:id/resend-verification
```

## ⚠️ Critical Requirements

### 1. Use Correct Client ID
**IMPORTANT:** You MUST use the client ID from the `registered_users` table, NOT the `clients` table.

```javascript
// ❌ WRONG - Don't use this
const clientId = clientFromClientsTable.id;

// ✅ CORRECT - Use this
const clientId = clientFromRegisteredUsersTable.id;
```

### 2. Use POST Method
Both endpoints require POST method (not GET, not PATCH).

### 3. Include Admin Token
Must include valid admin JWT token in Authorization header.

## 📝 Frontend Implementation

### React/TypeScript Example

```typescript
// api/adminClient.ts

interface UnlockResponse {
  success: boolean;
  message: string;
  email_sent: boolean;
  profile_unlocked: boolean;
  client_email?: string;
}

interface VerifyEmailResponse {
  success: boolean;
  message: string;
  email_sent: boolean;
  sent_to?: string;
}

// Unlock client account
export async function unlockClientAccount(clientId: string): Promise<UnlockResponse> {
  try {
    const token = localStorage.getItem('adminToken'); // or however you store it
    
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/api/admin/clients/${clientId}/unlock`,
      {
        method: 'POST', // MUST be POST
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Empty body is fine
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unlock account');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Unlock account error:', error);
    throw error;
  }
}

// Resend verification email
export async function resendVerificationEmail(clientId: string): Promise<VerifyEmailResponse> {
  try {
    const token = localStorage.getItem('adminToken');
    
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/api/admin/clients/${clientId}/resend-verification`,
      {
        method: 'POST', // MUST be POST
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Empty body is fine
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send verification email');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Resend verification error:', error);
    throw error;
  }
}
```

### Using in Components

```typescript
// components/ClientManagement.tsx

import { unlockClientAccount, resendVerificationEmail } from '../api/adminClient';

function ClientManagement() {
  const [loading, setLoading] = useState(false);
  
  const handleUnlockAccount = async (clientId: string) => {
    setLoading(true);
    try {
      const result = await unlockClientAccount(clientId);
      
      if (result.success && result.email_sent) {
        toast.success(`Account unlocked! Email sent to ${result.client_email}`);
      } else if (result.success && !result.email_sent) {
        toast.warning('Account unlocked but email failed to send');
      }
      
      // Refresh client data
      await refreshClientList();
      
    } catch (error) {
      toast.error(error.message || 'Failed to unlock account');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendVerification = async (clientId: string) => {
    setLoading(true);
    try {
      const result = await resendVerificationEmail(clientId);
      
      if (result.success && result.email_sent) {
        toast.success(`Verification email sent to ${result.sent_to}`);
      } else {
        toast.warning('Failed to send verification email');
      }
      
    } catch (error) {
      toast.error(error.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {/* Your UI */}
      <button 
        onClick={() => handleUnlockAccount(client.id)}
        disabled={loading || client.profile_unlocked}
      >
        {client.profile_unlocked ? 'Already Unlocked' : 'Unlock Account'}
      </button>
      
      <button 
        onClick={() => handleResendVerification(client.id)}
        disabled={loading || client.email_verified}
      >
        {client.email_verified ? 'Email Verified' : 'Resend Verification'}
      </button>
    </div>
  );
}
```

### Axios Example

```javascript
// api/adminClient.js

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Create axios instance with auth
const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to all requests
adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unlock client account
export async function unlockClientAccount(clientId) {
  try {
    const response = await adminApi.post(
      `/api/admin/clients/${clientId}/unlock`,
      {} // Empty body
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

// Resend verification email
export async function resendVerificationEmail(clientId) {
  try {
    const response = await adminApi.post(
      `/api/admin/clients/${clientId}/resend-verification`,
      {} // Empty body
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}
```

## 🔍 Getting the Correct Client ID

### From Client List
```typescript
// When fetching clients, make sure you're getting from registered_users
const fetchClients = async () => {
  const response = await fetch('/api/admin/clients');
  const data = await response.json();
  
  // The ID in this response should be from registered_users table
  // Use this ID for unlock/verify operations
  return data.clients;
};
```

### From Client Details
```typescript
// When viewing a specific client
const fetchClientDetails = async (clientId: string) => {
  const response = await fetch(`/api/admin/clients/${clientId}`);
  const data = await response.json();
  
  // Use data.client.id for unlock/verify operations
  return data.client;
};
```

## ⚠️ Error Handling

### Common Errors and Solutions

#### 404 - Client Not Found
```typescript
// Error: Client not found
// Cause: Using ID from wrong table or client doesn't exist
// Solution: Verify you're using ID from registered_users table

if (error.status === 404) {
  console.error('Client not found. Check if using correct ID from registered_users table');
}
```

#### 400 - Already Unlocked/Verified
```typescript
// Error: Profile is already unlocked
// Cause: Trying to unlock already unlocked account
// Solution: Check client status before calling

if (error.status === 400) {
  if (error.error.includes('already unlocked')) {
    toast.info('This account is already unlocked');
  } else if (error.error.includes('already verified')) {
    toast.info('This email is already verified');
  }
}
```

#### 401 - Unauthorized
```typescript
// Error: Admin access required
// Cause: Missing or invalid JWT token
// Solution: Ensure admin is logged in and token is valid

if (error.status === 401) {
  console.error('Admin authentication required');
  // Redirect to login or refresh token
}
```

#### 500 - Server Error
```typescript
// Error: Failed to unlock profile / Failed to send email
// Cause: Backend error (database, email service, etc.)
// Solution: Check backend logs for details

if (error.status === 500) {
  console.error('Server error:', error.details);
  toast.error('Something went wrong. Please try again or contact support.');
}
```

## 🧪 Testing

### Manual Testing Steps

1. **Open Browser DevTools** (F12)
2. **Go to Network tab**
3. **Click unlock/verify button in your UI**
4. **Check the request:**
   - Method should be POST
   - URL should be `/api/admin/clients/{id}/unlock` or `/resend-verification`
   - Headers should include `Authorization: Bearer {token}`
   - Status should be 200 (success) or error code

### Console Logging for Debugging

```typescript
const handleUnlockAccount = async (clientId: string) => {
  console.log('🔓 Unlocking account for client:', clientId);
  console.log('API URL:', process.env.REACT_APP_API_URL);
  console.log('Token exists:', !!localStorage.getItem('adminToken'));
  
  try {
    const result = await unlockClientAccount(clientId);
    console.log('✅ Unlock result:', result);
    
    if (result.email_sent) {
      console.log('📧 Email sent to:', result.client_email);
    } else {
      console.warn('⚠️ Email was not sent');
    }
  } catch (error) {
    console.error('❌ Unlock failed:', error);
  }
};
```

## 📋 Checklist

Before deploying, verify:

- [ ] Using POST method (not GET or PATCH)
- [ ] Using client ID from registered_users table
- [ ] Including Authorization header with admin token
- [ ] Handling all error cases (404, 400, 401, 500)
- [ ] Showing success message when email_sent is true
- [ ] Showing warning when email_sent is false
- [ ] Disabling button when already unlocked/verified
- [ ] Refreshing client data after successful operation
- [ ] Testing in browser DevTools Network tab

## 🚀 Environment Variables

Make sure these are set in your frontend:

```env
# .env or .env.production
REACT_APP_API_URL=https://jellyfish-app-t4m35.ondigitalocean.app
```

Or for Next.js:
```env
NEXT_PUBLIC_API_URL=https://jellyfish-app-t4m35.ondigitalocean.app
```

## 📞 Support

If emails still don't send after following this guide:

1. Check browser Network tab for actual request details
2. Check backend logs for error messages
3. Verify client exists in registered_users table
4. Verify admin token is valid
5. Test endpoints directly with curl or Postman

### Test with curl:
```bash
curl -X POST \
  https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/clients/CLIENT_ID/unlock \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## ✅ Summary

The backend is working correctly. The issue is in how the frontend calls these endpoints. Follow this guide exactly and emails will send properly.

Key points:
1. Use POST method
2. Use correct client ID (from registered_users)
3. Include admin JWT token
4. Check response.email_sent to confirm email was sent
