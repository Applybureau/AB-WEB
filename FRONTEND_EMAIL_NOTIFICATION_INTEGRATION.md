# Frontend Integration Guide - Email Notification Endpoints

## Quick Reference

Both email notification endpoints now return an `email_sent` flag that the frontend should check.

---

## 1. Payment Verification Endpoint

### Endpoint
```
POST /api/admin/concierge/payment-confirmation
```

### Request Example
```javascript
const verifyPayment = async (paymentData) => {
  try {
    const response = await axios.post(
      '/api/admin/concierge/payment-confirmation',
      {
        consultation_id: consultationId,
        client_email: 'client@example.com',
        client_name: 'John Doe',
        payment_amount: '499',
        payment_date: '2026-02-13',
        package_tier: 'Tier 2',
        package_type: 'tier',
        selected_services: [],
        payment_method: 'interac_etransfer',
        payment_reference: 'REF-12345',
        admin_notes: 'Payment verified'
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );

    // Check email_sent flag
    if (response.data.email_sent) {
      showSuccessNotification('Payment confirmed and invitation email sent!');
      console.log('Registration URL:', response.data.registration_url);
    } else {
      showWarningNotification('Payment confirmed but email failed to send');
    }

    return response.data;
  } catch (error) {
    showErrorNotification('Failed to verify payment');
    console.error(error.response?.data);
  }
};
```

### Response Structure
```typescript
interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  email_sent: boolean;  // ⭐ Check this flag
  registration_url: string;
  client_email: string;
  client_id: string | null;
  data: {
    consultation_id: string;
    client_email: string;
    client_name: string;
    payment_amount: string;
    payment_date: string;
    package_tier: string;
    package_type: string;
    selected_services: any[];
    status: string;
    admin_status: string;
    registration_token: string;
    token_expires_at: string;
    registration_url: string;
  };
}
```

---

## 2. Profile Unlock Endpoint

### Endpoint
```
POST /api/admin/clients/:id/unlock
```

### Request Example
```javascript
const unlockClientProfile = async (clientId) => {
  try {
    const response = await axios.post(
      `/api/admin/clients/${clientId}/unlock`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );

    // Check email_sent flag
    if (response.data.email_sent) {
      showSuccessNotification('Profile unlocked and notification email sent!');
    } else {
      showWarningNotification('Profile unlocked but email failed to send');
    }

    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      showErrorNotification('Client not found');
    } else if (error.response?.status === 400) {
      showWarningNotification('Profile is already unlocked');
    } else {
      showErrorNotification('Failed to unlock profile');
    }
    console.error(error.response?.data);
  }
};
```

### Response Structure
```typescript
interface ProfileUnlockResponse {
  success: boolean;
  message: string;
  email_sent: boolean;  // ⭐ Check this flag
  profile_unlocked: boolean;
}
```

---

## React Component Example

```jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const PaymentVerificationForm = ({ consultationId }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_email: '',
    client_name: '',
    payment_amount: '',
    package_tier: 'Tier 2',
    payment_method: 'interac_etransfer',
    payment_reference: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/admin/concierge/payment-confirmation', {
        consultation_id: consultationId,
        ...formData,
        payment_date: new Date().toISOString().split('T')[0]
      });

      // Check email_sent flag
      if (response.data.email_sent) {
        toast.success('✅ Payment confirmed and invitation email sent!');
        
        // Show registration URL to admin
        console.log('Registration URL:', response.data.registration_url);
        
        // Optionally copy to clipboard
        navigator.clipboard.writeText(response.data.registration_url);
        toast.info('📋 Registration link copied to clipboard');
      } else {
        toast.warning('⚠️ Payment confirmed but email failed to send');
        toast.info('Please manually send the registration link to the client');
      }

      // Refresh consultation list or redirect
      onSuccess();
    } catch (error) {
      toast.error('❌ Failed to verify payment');
      console.error(error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Verify & Send Invite'}
      </button>
    </form>
  );
};

const ProfileUnlockButton = ({ clientId, clientName }) => {
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!confirm(`Unlock profile for ${clientName}?`)) return;

    setLoading(true);

    try {
      const response = await api.post(`/admin/clients/${clientId}/unlock`);

      // Check email_sent flag
      if (response.data.email_sent) {
        toast.success('✅ Profile unlocked and notification sent!');
      } else {
        toast.warning('⚠️ Profile unlocked but email failed to send');
      }

      // Refresh client data
      onSuccess();
    } catch (error) {
      if (error.response?.status === 400) {
        toast.info('ℹ️ Profile is already unlocked');
      } else {
        toast.error('❌ Failed to unlock profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleUnlock} disabled={loading}>
      {loading ? 'Unlocking...' : 'Unlock Profile'}
    </button>
  );
};

export { PaymentVerificationForm, ProfileUnlockButton };
```

---

## Error Handling Best Practices

### 1. Always Check `email_sent` Flag
```javascript
if (response.data.email_sent) {
  // Email sent successfully
  showSuccess('Operation completed and email sent!');
} else {
  // Operation succeeded but email failed
  showWarning('Operation completed but email failed to send');
  // Optionally show manual action required
}
```

### 2. Handle Different Error Scenarios
```javascript
try {
  const response = await api.post(endpoint, data);
  // Handle success
} catch (error) {
  const status = error.response?.status;
  const errorData = error.response?.data;

  switch (status) {
    case 400:
      showError(errorData.error || 'Invalid request');
      break;
    case 404:
      showError('Resource not found');
      break;
    case 500:
      showError('Server error. Please try again.');
      // Check if email_sent is false in error response
      if (errorData.email_sent === false) {
        showInfo('You may need to manually send the email');
      }
      break;
    default:
      showError('An unexpected error occurred');
  }
}
```

### 3. Provide Fallback Actions
```javascript
if (!response.data.email_sent) {
  // Show manual action button
  showManualEmailButton({
    email: response.data.client_email,
    registrationUrl: response.data.registration_url
  });
}
```

---

## Testing Checklist

- [ ] Payment verification shows success when `email_sent: true`
- [ ] Payment verification shows warning when `email_sent: false`
- [ ] Profile unlock shows success when `email_sent: true`
- [ ] Profile unlock shows warning when `email_sent: false`
- [ ] Error messages are user-friendly
- [ ] Loading states work correctly
- [ ] Registration URLs are displayed/copied correctly
- [ ] Email failures don't block the operation
- [ ] Manual fallback actions are available

---

## API Response Examples

### Success with Email Sent
```json
{
  "success": true,
  "message": "Payment confirmed and invitation sent",
  "email_sent": true,
  "registration_url": "https://www.applybureau.com/register?token=abc123",
  "client_email": "client@example.com"
}
```

### Success but Email Failed
```json
{
  "success": true,
  "message": "Payment confirmed and invitation sent",
  "email_sent": false,
  "registration_url": "https://www.applybureau.com/register?token=abc123",
  "client_email": "client@example.com"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Failed to process payment confirmation",
  "email_sent": false,
  "details": "Database connection error"
}
```

---

## Support

If you encounter issues:
1. Check the `email_sent` flag in the response
2. Verify admin authentication token is valid
3. Check browser console for detailed error messages
4. Contact backend team with error details
