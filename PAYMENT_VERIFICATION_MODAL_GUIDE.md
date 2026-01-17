# Payment Verification Modal - Data Requirements

## 🎯 Overview

When an admin clicks the **"Verify & Invite"** or **"Verify Payment"** button, a modal should open where they input payment information to confirm the client has paid and send them a registration invite.

---

## 📋 Two Endpoints Available

### Option 1: Consultation Request Payment Verification
**Endpoint**: `PATCH /api/consultation-requests/:id/verify-payment`  
**Use Case**: When verifying payment for a consultation request

### Option 2: Direct Payment Confirmation & Invite
**Endpoint**: `POST /api/admin/concierge/payment/confirm-and-invite`  
**Use Case**: When manually confirming payment and sending invite (no consultation request)

---

## 🔍 Option 1: Consultation Request Payment Verification

### Endpoint Details
```
PATCH /api/consultation-requests/:id/verify-payment
Authorization: Bearer <admin-token>
Content-Type: application/json
```

### Required Data Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `payment_verified` | boolean | ✅ Yes | Set to `true` to verify payment |
| `payment_amount` | number | ✅ Yes | Amount paid (e.g., 500.00) |
| `payment_method` | string | ✅ Yes | Payment method used |
| `payment_reference` | string | ❌ No | Transaction reference/ID |
| `package_tier` | string | ❌ No | Package selected (e.g., "standard", "premium") |
| `admin_notes` | string | ❌ No | Internal notes about payment |

### Payment Method Options
- `interac_etransfer` - Interac e-Transfer (most common in Canada)
- `bank_transfer` - Direct bank transfer
- `credit_card` - Credit card payment
- `paypal` - PayPal
- `stripe` - Stripe payment
- `cash` - Cash payment
- `cheque` - Cheque payment
- `other` - Other payment method

### Package Tier Options
- `basic` - Basic package
- `standard` - Standard package
- `premium` - Premium package
- `enterprise` - Enterprise package

### Request Example
```json
{
  "payment_verified": true,
  "payment_amount": 500.00,
  "payment_method": "interac_etransfer",
  "payment_reference": "ET-2026-01-15-12345",
  "package_tier": "standard",
  "admin_notes": "Payment received via Interac e-Transfer on Jan 15, 2026"
}
```

### Response Example
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "consultation_request": {
    "id": "uuid-here",
    "status": "payment_verified",
    "payment_verified": true,
    "payment_verification_date": "2026-01-15T10:00:00Z",
    "registration_token": "Generated"
  }
}
```

### What Happens After Verification
1. ✅ Consultation request status updated to `payment_verified`
2. ✅ Registration token generated (7-day expiry)
3. ✅ Email sent to client with registration link
4. ✅ Client can now register and create account

---

## 🔍 Option 2: Direct Payment Confirmation & Invite

### Endpoint Details
```
POST /api/admin/concierge/payment/confirm-and-invite
Authorization: Bearer <admin-token>
Content-Type: application/json
```

### Required Data Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `client_email` | string | ✅ Yes | Client's email address |
| `client_name` | string | ✅ Yes | Client's full name |
| `payment_amount` | string/number | ✅ Yes | Amount paid (e.g., "299") |
| `payment_date` | string | ❌ No | Payment date (YYYY-MM-DD format) |
| `package_tier` | string | ❌ No | Package name (e.g., "Tier 2") |
| `package_type` | string | ❌ No | Package type (e.g., "tier") |
| `selected_services` | array | ❌ No | Array of selected services (default: []) |
| `payment_method` | string | ❌ No | Payment method (default: "interac_etransfer") |
| `payment_reference` | string | ❌ No | Transaction reference/ID |
| `admin_notes` | string | ❌ No | Internal notes about payment |

### Request Example
```json
{
  "client_email": "client@example.com",
  "client_name": "John Doe",
  "payment_amount": "299",
  "payment_date": "2026-01-15",
  "package_tier": "Tier 2",
  "package_type": "tier",
  "selected_services": []
}
```

### Response Example
```json
{
  "message": "Payment confirmed and registration invite sent successfully",
  "client_email": "client@example.com",
  "client_name": "John Doe",
  "payment_amount": "299",
  "payment_date": "2026-01-15",
  "package_tier": "Tier 2",
  "package_type": "tier",
  "selected_services": [],
  "registration_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_expires_at": "2026-01-22T10:00:00Z",
  "registration_url": "http://localhost:5173/register?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### What Happens After Confirmation
1. ✅ User record created/updated in database
2. ✅ Payment marked as confirmed
3. ✅ Registration token generated (7-day expiry)
4. ✅ Welcome email sent with registration link
5. ✅ Notification created for admin dashboard

---

## 🎨 Modal UI Design Recommendations

### Modal Title
```
"Verify Payment & Send Invite"
```

### Form Fields

#### 1. Client Information (Read-only if from consultation)
```
Full Name: [Pre-filled from consultation]
Email: [Pre-filled from consultation]
```

#### 2. Payment Details (Required)
```
Payment Amount: [$___.__] (number input, required)
Payment Method: [Dropdown] (required)
  - Interac e-Transfer
  - Bank Transfer
  - Credit Card
  - PayPal
  - Stripe
  - Cash
  - Cheque
  - Other

Payment Reference: [Text input] (optional)
  Placeholder: "e.g., ET-2026-01-15-12345"
```

#### 3. Package Selection (Optional)
```
Package Tier: [Dropdown] (optional)
  - Basic
  - Standard
  - Premium
  - Enterprise
```

#### 4. Admin Notes (Optional)
```
Admin Notes: [Textarea] (optional)
  Placeholder: "Internal notes about this payment..."
```

### Action Buttons
```
[Cancel]  [Verify Payment & Send Invite]
```

---

## 💻 Frontend Implementation Example

### React Component
```jsx
import React, { useState } from 'react';

function PaymentVerificationModal({ consultationId, clientName, clientEmail, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    payment_amount: '',
    payment_method: 'interac_etransfer',
    payment_reference: '',
    package_tier: 'standard',
    admin_notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(
        `/api/consultation-requests/${consultationId}/verify-payment`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            payment_verified: true,
            payment_amount: parseFloat(formData.payment_amount),
            payment_method: formData.payment_method,
            payment_reference: formData.payment_reference || null,
            package_tier: formData.package_tier || null,
            admin_notes: formData.admin_notes || null
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify payment');
      }

      // Success!
      alert('Payment verified and invite sent successfully!');
      onSuccess(data);
      onClose();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Verify Payment & Send Invite</h2>
        
        {error && (
          <div className="error-message">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Client Info (Read-only) */}
          <div className="form-section">
            <h3>Client Information</h3>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={clientName} disabled />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={clientEmail} disabled />
            </div>
          </div>

          {/* Payment Details */}
          <div className="form-section">
            <h3>Payment Details</h3>
            
            <div className="form-group">
              <label>Payment Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="500.00"
                value={formData.payment_amount}
                onChange={(e) => setFormData({...formData, payment_amount: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Payment Method *</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                required
              >
                <option value="interac_etransfer">Interac e-Transfer</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Payment Reference (Optional)</label>
              <input
                type="text"
                placeholder="e.g., ET-2026-01-15-12345"
                value={formData.payment_reference}
                onChange={(e) => setFormData({...formData, payment_reference: e.target.value})}
              />
            </div>
          </div>

          {/* Package Selection */}
          <div className="form-section">
            <h3>Package Selection (Optional)</h3>
            <div className="form-group">
              <label>Package Tier</label>
              <select
                value={formData.package_tier}
                onChange={(e) => setFormData({...formData, package_tier: e.target.value})}
              >
                <option value="">-- Select Package --</option>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="form-section">
            <h3>Admin Notes (Optional)</h3>
            <div className="form-group">
              <label>Internal Notes</label>
              <textarea
                rows="3"
                placeholder="Internal notes about this payment..."
                value={formData.admin_notes}
                onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary">
              {loading ? 'Processing...' : 'Verify Payment & Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentVerificationModal;
```

### Usage Example
```jsx
// In your admin dashboard
const [showModal, setShowModal] = useState(false);
const [selectedConsultation, setSelectedConsultation] = useState(null);

const handleVerifyClick = (consultation) => {
  setSelectedConsultation(consultation);
  setShowModal(true);
};

return (
  <div>
    {/* Consultation list */}
    {consultations.map(consultation => (
      <div key={consultation.id}>
        <h3>{consultation.full_name}</h3>
        <button onClick={() => handleVerifyClick(consultation)}>
          Verify & Invite
        </button>
      </div>
    ))}

    {/* Modal */}
    {showModal && selectedConsultation && (
      <PaymentVerificationModal
        consultationId={selectedConsultation.id}
        clientName={selectedConsultation.full_name}
        clientEmail={selectedConsultation.email}
        onClose={() => setShowModal(false)}
        onSuccess={(data) => {
          console.log('Payment verified:', data);
          // Refresh consultation list
        }}
      />
    )}
  </div>
);
```

---

## 📧 Email Sent to Client

After payment verification, the client receives an email with:
- **Template**: `payment_verified_registration` or `payment_confirmed_welcome_concierge`
- **Contains**:
  - Welcome message
  - Payment confirmation details
  - Registration link (valid for 7 days)
  - Next steps instructions

---

## 🔐 Security Notes

1. **Admin Authentication Required** - Only authenticated admins can verify payments
2. **Token Expiry** - Registration tokens expire after 7 days
3. **One-time Use** - Registration tokens can only be used once
4. **Email Validation** - Email addresses are validated before sending
5. **Audit Trail** - All payment verifications are logged with admin ID

---

## ✅ Validation Rules

### Frontend Validation
- Payment amount must be > 0
- Payment amount must be a valid number
- Payment method must be selected
- Email format must be valid

### Backend Validation
- Consultation request must exist
- Admin must have proper permissions
- Payment amount must be provided
- Client email must be valid

---

## 🎯 Summary

**Modal Should Collect**:
1. ✅ Payment Amount (required)
2. ✅ Payment Method (required)
3. ❌ Payment Reference (optional)
4. ❌ Package Tier (optional)
5. ❌ Admin Notes (optional)

**What Happens**:
1. Payment marked as verified
2. Registration token generated
3. Email sent to client with registration link
4. Client can register within 7 days

---

**Last Updated**: January 15, 2026  
**Related Files**:
- `backend/routes/onboardingWorkflow.js` - Consultation payment verification
- `backend/routes/adminConcierge.js` - Direct payment confirmation
- `backend/DASHBOARD_EMAIL_ENDPOINTS.md` - Email triggers
