# 💳🔄 PAYMENT VERIFICATION & RESCHEDULE - DATA FORMATS

## 🔗 Base URL
```
https://apply-bureau-backend.vercel.app
```

## 🔐 Authentication
All endpoints require admin authentication:
```json
{
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
```

---

# 💳 PAYMENT VERIFICATION ENDPOINTS

## **1. Primary Payment Verification**
**Endpoint:** `POST /api/admin/concierge/payment-confirmation`

### **Required Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

### **Request Body Format:**
```json
{
  "consultation_id": "string (UUID) - REQUIRED",
  "client_email": "string (email) - REQUIRED", 
  "client_name": "string - REQUIRED",
  "payment_amount": "string (decimal) - REQUIRED",
  "payment_date": "string (YYYY-MM-DD) - OPTIONAL",
  "package_tier": "string - OPTIONAL",
  "package_type": "string - OPTIONAL", 
  "selected_services": "array of strings - OPTIONAL",
  "payment_method": "string - OPTIONAL",
  "payment_reference": "string - OPTIONAL",
  "admin_notes": "string - OPTIONAL"
}
```

### **Example Request:**
```json
{
  "consultation_id": "6d55bb6d-326a-424d-9757-95a4f996ec3f",
  "client_email": "john.doe@example.com",
  "client_name": "John Doe",
  "payment_amount": "750.00",
  "payment_date": "2026-01-21",
  "package_tier": "Premium Package",
  "package_type": "tier",
  "selected_services": [
    "Resume Review",
    "Interview Preparation", 
    "LinkedIn Optimization",
    "Mock Interview Sessions"
  ],
  "payment_method": "interac_etransfer",
  "payment_reference": "REF-ABC123456",
  "admin_notes": "Payment verified via Interac e-Transfer. Premium package confirmed."
}
```

### **Success Response (200):**
```json
{
  "success": true,
  "message": "Payment confirmed and registration invite sent successfully",
  "data": {
    "consultation_id": "6d55bb6d-326a-424d-9757-95a4f996ec3f",
    "client_email": "john.doe@example.com",
    "client_name": "John Doe",
    "payment_amount": "750.00",
    "payment_date": "2026-01-21",
    "package_tier": "Premium Package",
    "package_type": "tier",
    "selected_services": [
      "Resume Review",
      "Interview Preparation",
      "LinkedIn Optimization", 
      "Mock Interview Sessions"
    ],
    "status": "onboarding",
    "admin_status": "onboarding",
    "registration_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwibmFtZSI6IkpvaG4gRG9lIiwidHlwZSI6InJlZ2lzdHJhdGlvbiIsInBheW1lbnRfY29uZmlybWVkIjp0cnVlLCJjb25zdWx0YXRpb25faWQiOiI2ZDU1YmI2ZC0zMjZhLTQyNGQtOTc1Ny05NWE0Zjk5NmVjM2YiLCJpYXQiOjE3Mzc0NjE3MDQsImV4cCI6MTczODA2NjUwNH0.example",
    "token_expires_at": "2026-01-28T13:05:04.000Z",
    "registration_url": "https://apply-bureau-backend.vercel.app/register?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "email_sent": true
  }
}
```

### **Error Response (400):**
```json
{
  "error": "Missing required fields: client_email, client_name, payment_amount"
}
```

### **Error Response (500):**
```json
{
  "error": "Failed to update consultation status",
  "details": "Database constraint violation or server error"
}
```

---

## **2. Alternative Payment Verification**
**Endpoint:** `POST /api/admin/concierge/payment/confirm-and-invite`

### **Request Body Format:**
```json
{
  "client_email": "string (email) - REQUIRED",
  "client_name": "string - REQUIRED", 
  "payment_amount": "string (decimal) - REQUIRED",
  "payment_date": "string (YYYY-MM-DD) - OPTIONAL",
  "package_tier": "string - OPTIONAL",
  "package_type": "string - OPTIONAL",
  "selected_services": "array of strings - OPTIONAL",
  "payment_method": "string - OPTIONAL", 
  "payment_reference": "string - OPTIONAL",
  "admin_notes": "string - OPTIONAL"
}
```

### **Example Request:**
```json
{
  "client_email": "jane.smith@example.com",
  "client_name": "Jane Smith",
  "payment_amount": "500.00",
  "payment_date": "2026-01-21",
  "package_tier": "Standard Package",
  "package_type": "tier",
  "selected_services": [
    "Resume Review",
    "Interview Preparation"
  ],
  "payment_method": "bank_transfer",
  "payment_reference": "TXN-789012345",
  "admin_notes": "Bank transfer confirmed. Standard package enrollment."
}
```

### **Success Response (200):**
```json
{
  "message": "Payment confirmed and registration invite sent successfully",
  "client_email": "jane.smith@example.com",
  "client_name": "Jane Smith", 
  "payment_amount": "500.00",
  "payment_date": "2026-01-21",
  "package_tier": "Standard Package",
  "package_type": "tier",
  "selected_services": [
    "Resume Review",
    "Interview Preparation"
  ],
  "registration_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_expires_at": "2026-01-28T13:05:04.000Z",
  "registration_url": "https://apply-bureau-backend.vercel.app/register?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

# 🔄 CONSULTATION RESCHEDULE ENDPOINT

## **Reschedule Consultation**
**Endpoint:** `POST /api/admin/concierge/consultations/:id/reschedule`

### **URL Parameters:**
- `:id` - UUID of the consultation to reschedule

### **Request Body Format:**
```json
{
  "reschedule_reason": "string - REQUIRED",
  "admin_notes": "string - OPTIONAL"
}
```

### **Example Request:**
```json
{
  "reschedule_reason": "Admin unavailable at requested times. Please provide 3 new time slots that work better for your schedule.",
  "admin_notes": "Original slots conflicted with existing appointments. Client will be contacted for new availability."
}
```

### **Success Response (200):**
```json
{
  "message": "Reschedule request sent successfully",
  "consultation": {
    "id": "6d55bb6d-326a-424d-9757-95a4f996ec3f",
    "client_id": null,
    "admin_id": null,
    "scheduled_at": "2026-01-21T13:05:01.79+00:00",
    "consultation_type": "general_consultation",
    "status": "rescheduled",
    "duration_minutes": 60,
    "meeting_link": null,
    "meeting_notes": null,
    "client_reason": "Original consultation request message",
    "admin_notes": "Original slots conflicted with existing appointments. Client will be contacted for new availability.",
    "prospect_name": "John Doe",
    "prospect_email": "john.doe@example.com", 
    "prospect_phone": "+1234567890",
    "package_interest": null,
    "current_situation": null,
    "timeline": null,
    "urgency_level": "normal",
    "preferred_slots": [
      {
        "date": "2026-01-25",
        "time": "14:00"
      },
      {
        "date": "2026-01-26", 
        "time": "15:00"
      },
      {
        "date": "2026-01-27",
        "time": "16:00"
      }
    ],
    "country": "Not specified",
    "message": "Original consultation request message",
    "created_at": "2026-01-21T13:05:01.79+00:00",
    "updated_at": "2026-01-21T13:05:04.172554+00:00"
  },
  "reschedule_reason": "Admin unavailable at requested times. Please provide 3 new time slots that work better for your schedule."
}
```

### **Error Response (400):**
```json
{
  "error": "reschedule_reason is required"
}
```

### **Error Response (404):**
```json
{
  "error": "Consultation request not found"
}
```

---

# 📋 FIELD SPECIFICATIONS

## **Payment Verification Fields**

| Field | Type | Required | Format | Example | Notes |
|-------|------|----------|--------|---------|-------|
| `consultation_id` | String (UUID) | Yes* | UUID v4 | `"6d55bb6d-326a-424d-9757-95a4f996ec3f"` | *Required for primary endpoint only |
| `client_email` | String | Yes | Valid email | `"john.doe@example.com"` | Must be valid email format |
| `client_name` | String | Yes | Text | `"John Doe"` | Full name of client |
| `payment_amount` | String | Yes | Decimal | `"750.00"` | Always as string with 2 decimal places |
| `payment_date` | String | No | YYYY-MM-DD | `"2026-01-21"` | Defaults to current date if not provided |
| `package_tier` | String | No | Text | `"Premium Package"` | Package name or tier |
| `package_type` | String | No | Text | `"tier"` | Type classification |
| `selected_services` | Array | No | String array | `["Resume Review", "Interview Prep"]` | List of services included |
| `payment_method` | String | No | Text | `"interac_etransfer"` | Payment method used |
| `payment_reference` | String | No | Text | `"REF-ABC123456"` | Transaction reference |
| `admin_notes` | String | No | Text | `"Payment verified via..."` | Internal admin notes |

## **Reschedule Fields**

| Field | Type | Required | Format | Example | Notes |
|-------|------|----------|--------|---------|-------|
| `reschedule_reason` | String | Yes | Text | `"Admin unavailable at requested times..."` | Reason for rescheduling |
| `admin_notes` | String | No | Text | `"Schedule conflict with existing appointments"` | Internal admin notes |

## **Common Payment Methods**
- `"interac_etransfer"`
- `"bank_transfer"`
- `"credit_card"`
- `"paypal"`
- `"cash"`
- `"cheque"`
- `"wire_transfer"`

## **Common Package Tiers**
- `"Basic Package"`
- `"Standard Package"`
- `"Premium Package"`
- `"Enterprise Package"`
- `"Custom Package"`

## **Common Services**
- `"Resume Review"`
- `"Interview Preparation"`
- `"LinkedIn Optimization"`
- `"Mock Interview Sessions"`
- `"Cover Letter Writing"`
- `"Salary Negotiation"`
- `"Career Coaching"`
- `"Job Search Strategy"`

---

# 🔗 RELATED ENDPOINTS

## **Get Consultation Details**
**Endpoint:** `GET /api/admin/concierge/consultations`

**Response includes consultation data needed for payment verification:**
```json
{
  "consultations": [
    {
      "id": "6d55bb6d-326a-424d-9757-95a4f996ec3f",
      "prospect_name": "John Doe",
      "prospect_email": "john.doe@example.com",
      "prospect_phone": "+1234567890",
      "status": "pending",
      "preferred_slots": [
        {
          "date": "2026-01-25",
          "time": "14:00"
        }
      ]
    }
  ]
}
```

## **Confirm Consultation**
**Endpoint:** `POST /api/admin/concierge/consultations/:id/confirm`

**Request Body:**
```json
{
  "selected_slot_index": 0,
  "meeting_details": "Consultation confirmed for premium package",
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "admin_notes": "Confirmed for slot 1 - premium package consultation"
}
```

## **Waitlist Consultation**
**Endpoint:** `POST /api/admin/concierge/consultations/:id/waitlist`

**Request Body:**
```json
{
  "waitlist_reason": "No availability in requested timeframe. Will contact when slots open up.",
  "admin_notes": "High demand period - added to priority waitlist"
}
```

---

# 🧪 TESTING EXAMPLES

## **Frontend JavaScript Examples**

### **Payment Verification:**
```javascript
const verifyPayment = async (consultationId, paymentData) => {
  const response = await fetch('/api/admin/concierge/payment-confirmation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      consultation_id: consultationId,
      client_email: paymentData.email,
      client_name: paymentData.name,
      payment_amount: paymentData.amount,
      payment_date: paymentData.date,
      package_tier: paymentData.package,
      selected_services: paymentData.services,
      payment_method: paymentData.method,
      payment_reference: paymentData.reference,
      admin_notes: paymentData.notes
    })
  });
  
  return await response.json();
};
```

### **Reschedule Consultation:**
```javascript
const rescheduleConsultation = async (consultationId, reason, notes) => {
  const response = await fetch(`/api/admin/concierge/consultations/${consultationId}/reschedule`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reschedule_reason: reason,
      admin_notes: notes
    })
  });
  
  return await response.json();
};
```

---

# ⚠️ VALIDATION RULES

## **Email Validation:**
- Must be valid email format
- Required for all payment verification endpoints

## **Payment Amount:**
- Must be string format with decimal places
- Example: `"750.00"` not `750` or `750.0`
- Required field

## **Date Format:**
- Must be YYYY-MM-DD format
- Example: `"2026-01-21"`
- Optional - defaults to current date

## **UUID Format:**
- Must be valid UUID v4 format
- Example: `"6d55bb6d-326a-424d-9757-95a4f996ec3f"`
- Required for consultation_id

## **Array Format:**
- Services must be array of strings
- Example: `["Service 1", "Service 2"]`
- Can be empty array `[]`

---

**🚀 All endpoints are live at:** `https://apply-bureau-backend.vercel.app`

**🔐 Admin Login:** `israelloko65@gmail.com` / `admin123`