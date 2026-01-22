# 💳🔄 PAYMENT VERIFICATION & RESCHEDULE - DATA FORMATS

## 🔗 Base URL
```
https://apply-bureau-backend.vercel.app
```

## 🔐 Authentication
```json
{
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
```

---

# 💳 PAYMENT VERIFICATION ENDPOINTS

## **1. Payment Confirmation**
**Endpoint:** `POST /api/admin/concierge/payment-confirmation`

### **Request Body:**
```json
{
  "consultation_id": "6d55bb6d-326a-424d-9757-95a4f996ec3f",
  "client_email": "john.doe@example.com",
  "client_name": "John Doe",
  "payment_amount": "750.00",
  "payment_date": "2026-01-21",
  "package_tier": "Premium Package",
  "package_type": "tier",
  "selected_services": ["Resume Review", "Interview Preparation"],
  "payment_method": "interac_etransfer",
  "payment_reference": "REF-ABC123456",
  "admin_notes": "Payment verified via Interac e-Transfer"
}
```

### **Response (200):**
```json
{
  "success": true,
  "message": "Payment confirmed and registration invite sent successfully",
  "data": {
    "consultation_id": "6d55bb6d-326a-424d-9757-95a4f996ec3f",
    "client_email": "john.doe@example.com",
    "client_name": "John Doe",
    "payment_amount": "750.00",
    "status": "onboarding",
    "registration_url": "https://apply-bureau-backend.vercel.app/register?token=...",
    "email_sent": true
  }
}
```

## **2. Direct Payment Confirmation**
**Endpoint:** `POST /api/admin/concierge/payment/confirm-and-invite`

### **Request Body:**
```json
{
  "client_email": "jane.smith@example.com",
  "client_name": "Jane Smith",
  "payment_amount": "500.00",
  "payment_date": "2026-01-21",
  "package_tier": "Standard Package",
  "selected_services": ["Resume Review", "Interview Preparation"],
  "payment_method": "bank_transfer",
  "payment_reference": "TXN-789012345"
}
```

### **Response (200):**
```json
{
  "message": "Payment confirmed and registration invite sent successfully",
  "client_email": "jane.smith@example.com",
  "registration_url": "https://apply-bureau-backend.vercel.app/register?token=..."
}
```

---

# 🔄 CONSULTATION RESCHEDULE ENDPOINT

## **Reschedule Consultation**
**Endpoint:** `POST /api/admin/concierge/consultations/:id/reschedule`

### **Request Body:**
```json
{
  "reschedule_reason": "Admin unavailable at requested times. Please provide 3 new time slots.",
  "admin_notes": "Original slots conflicted with existing appointments."
}
```

### **Response (200):**
```json
{
  "message": "Reschedule request sent successfully",
  "consultation": {
    "id": "6d55bb6d-326a-424d-9757-95a4f996ec3f",
    "status": "rescheduled",
    "prospect_name": "John Doe",
    "prospect_email": "john.doe@example.com"
  },
  "reschedule_reason": "Admin unavailable at requested times. Please provide 3 new time slots."
}
```

---

# 📋 FIELD SPECIFICATIONS

## **Payment Verification Fields**

| Field | Type | Required | Format | Example |
|-------|------|----------|--------|---------|
| `client_email` | String | ✅ Yes | Valid email | `"john.doe@example.com"` |
| `client_name` | String | ✅ Yes | Text | `"John Doe"` |
| `payment_amount` | String | ✅ Yes | Decimal | `"750.00"` |
| `consultation_id` | String (UUID) | No* | UUID v4 | `"6d55bb6d-326a-424d-9757-95a4f996ec3f"` |
| `payment_date` | String | No | YYYY-MM-DD | `"2026-01-21"` |
| `package_tier` | String | No | Text | `"Premium Package"` |
| `selected_services` | Array | No | String array | `["Resume Review", "Interview Prep"]` |
| `payment_method` | String | No | Text | `"interac_etransfer"` |
| `payment_reference` | String | No | Text | `"REF-ABC123456"` |
| `admin_notes` | String | No | Text | `"Payment verified via..."` |

*Required for primary endpoint only

## **Reschedule Fields**

| Field | Type | Required | Format | Example |
|-------|------|----------|--------|---------|
| `reschedule_reason` | String | ✅ Yes | Text | `"Admin unavailable at requested times..."` |
| `admin_notes` | String | No | Text | `"Schedule conflict with existing appointments"` |

