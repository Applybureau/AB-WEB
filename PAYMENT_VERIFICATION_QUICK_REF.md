# Payment Verification - Quick Reference

## 🚀 Quick Implementation

### Endpoint
```
PATCH /api/consultation-requests/:id/verify-payment
```

### Required Fields
```javascript
{
  payment_verified: true,        // Always true
  payment_amount: 500.00,        // Number (required)
  payment_method: "interac_etransfer"  // String (required)
}
```

### Optional Fields
```javascript
{
  payment_reference: "ET-2026-01-15-12345",  // Transaction ID
  package_tier: "standard",                   // Package selected
  admin_notes: "Payment received via..."      // Internal notes
}
```

---

## 📋 Payment Methods

```javascript
const paymentMethods = [
  'interac_etransfer',  // Most common in Canada
  'bank_transfer',
  'credit_card',
  'paypal',
  'stripe',
  'cash',
  'cheque',
  'other'
];
```

---

## 📦 Package Tiers

```javascript
const packageTiers = [
  'basic',
  'standard',
  'premium',
  'enterprise'
];
```

---

## 💻 Minimal Modal Form

```jsx
<form onSubmit={handleVerifyPayment}>
  {/* Required */}
  <input 
    type="number" 
    placeholder="Payment Amount" 
    required 
  />
  
  <select required>
    <option value="interac_etransfer">Interac e-Transfer</option>
    <option value="bank_transfer">Bank Transfer</option>
    <option value="credit_card">Credit Card</option>
  </select>
  
  {/* Optional */}
  <input 
    type="text" 
    placeholder="Payment Reference (optional)" 
  />
  
  <select>
    <option value="">Package (optional)</option>
    <option value="standard">Standard</option>
    <option value="premium">Premium</option>
  </select>
  
  <textarea placeholder="Admin notes (optional)" />
  
  <button type="submit">Verify & Send Invite</button>
</form>
```

---

## 🔥 Complete Fetch Example

```javascript
async function verifyPayment(consultationId, paymentData) {
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
        payment_amount: parseFloat(paymentData.amount),
        payment_method: paymentData.method,
        payment_reference: paymentData.reference || null,
        package_tier: paymentData.package || null,
        admin_notes: paymentData.notes || null
      })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return await response.json();
}

// Usage
try {
  const result = await verifyPayment('consultation-id-here', {
    amount: 500.00,
    method: 'interac_etransfer',
    reference: 'ET-12345',
    package: 'standard',
    notes: 'Payment received'
  });
  
  console.log('Success:', result);
  alert('Payment verified and invite sent!');
} catch (error) {
  console.error('Error:', error);
  alert(`Error: ${error.message}`);
}
```

---

## ✅ What Happens After

1. ✅ Status → `payment_verified`
2. ✅ Token generated (7-day expiry)
3. ✅ Email sent to client
4. ✅ Client can register

---

## 📧 Email Template Used

**Template**: `payment_verified_registration`

**Variables**:
- `client_name`
- `payment_amount`
- `payment_method`
- `package_tier`
- `registration_url`
- `token_expiry`
- `admin_name`

---

## 🎯 Minimum Viable Modal

**Must Have**:
- Payment Amount input (number)
- Payment Method dropdown
- Submit button

**Nice to Have**:
- Payment Reference input
- Package Tier dropdown
- Admin Notes textarea

**Auto-filled**:
- Client Name (from consultation)
- Client Email (from consultation)

---

**See Full Guide**: `PAYMENT_VERIFICATION_MODAL_GUIDE.md`
