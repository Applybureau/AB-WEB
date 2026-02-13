# Consultation Engine Button Endpoints Documentation

## Base URL
- **Production**: `https://apply-bureau-backend.vercel.app`
- **Local Development**: `http://localhost:3001`

## Authentication
All admin endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Admin Credentials (Production)
- **Email**: `applybureau@gmail.com`
- **Password**: `Admin123@#`

---

## ✅ CONSULTATION MANAGEMENT BUTTONS

### 1. **CONFIRM CONSULTATION** ✅
- **Endpoint**: `POST /api/admin/concierge/consultations/:id/confirm`
- **Authentication**: Required (Admin)
- **Description**: Confirm a consultation request by selecting one of the 3 preferred time slots
- **Button Action**: "Confirm" button in consultation dashboard
- **Request Body**:
```json
{
  "selected_slot_index": 0,
  "meeting_details": "Your consultation has been confirmed",
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "admin_notes": "Confirmed first available slot"
}
```
- **Response**:
```json
{
  "message": "Consultation confirmed successfully",
  "consultation": {
    "id": "consultation_id",
    "status": "scheduled",
    "scheduled_at": "2024-01-15T14:00:00Z",
    "meeting_link": "https://meet.google.com/abc-defg-hij"
  },
  "confirmed_slot": {
    "date": "2024-01-15",
    "time": "14:00"
  },
  "confirmed_time": "2024-01-15T14:00:00Z"
}
```

### 2. **RESCHEDULE CONSULTATION** ✅
- **Endpoint**: `POST /api/admin/concierge/consultations/:id/reschedule`
- **Authentication**: Required (Admin)
- **Description**: Request client to provide new availability
- **Button Action**: "Reschedule" button in consultation dashboard
- **Request Body**:
```json
{
  "reschedule_reason": "Schedule conflict - need new availability",
  "admin_notes": "Original times not available"
}
```
- **Response**:
```json
{
  "message": "Reschedule request sent successfully",
  "consultation": {
    "id": "consultation_id",
    "status": "rescheduled",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "reschedule_reason": "Schedule conflict - need new availability"
}
```

### 3. **WAITLIST CONSULTATION** ✅
- **Endpoint**: `POST /api/admin/concierge/consultations/:id/waitlist`
- **Authentication**: Required (Admin)
- **Description**: Add consultation to waitlist
- **Button Action**: "Waitlist" button in consultation dashboard
- **Request Body**:
```json
{
  "waitlist_reason": "No availability in requested timeframe",
  "admin_notes": "Added to waitlist for next opening"
}
```
- **Response**:
```json
{
  "message": "Consultation added to waitlist successfully",
  "consultation": {
    "id": "consultation_id",
    "status": "waitlisted",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "waitlist_reason": "No availability in requested timeframe"
}
```

### 4. **VERIFY & INVITE** (Payment Confirmation) ✅
- **Endpoint**: `POST /api/admin/concierge/payment-confirmation`
- **Authentication**: Required (Admin)
- **Description**: Confirm payment and send registration invite to client
- **Button Action**: "Verify & Invite" button in consultation dashboard
- **Request Body**:
```json
{
  "consultation_id": "consultation_id",
  "client_email": "client@example.com",
  "client_name": "John Doe",
  "payment_amount": "$2,500",
  "payment_date": "2024-01-01",
  "package_tier": "Premium Package",
  "package_type": "tier",
  "selected_services": ["Resume Optimization", "Interview Coaching"],
  "payment_method": "interac_etransfer",
  "payment_reference": "REF123456",
  "admin_notes": "Payment verified via e-transfer"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Payment confirmed and registration invite sent successfully",
  "data": {
    "consultation_id": "consultation_id",
    "client_email": "client@example.com",
    "client_name": "John Doe",
    "payment_amount": "$2,500",
    "status": "onboarding",
    "admin_status": "onboarding",
    "registration_token": "jwt_token_here",
    "token_expires_at": "2024-01-08T00:00:00Z",
    "registration_url": "https://app.applybureau.com/register?token=jwt_token_here",
    "email_sent": true
  }
}
```

---

## ✅ CONSULTATION LISTING & MANAGEMENT

### 5. **GET ALL CONSULTATIONS** ✅
- **Endpoint**: `GET /api/admin/concierge/consultations`
- **Authentication**: Required (Admin)
- **Description**: List all consultation requests with filtering
- **Query Parameters**:
  - `admin_status`: string (all, pending, confirmed, completed, rescheduled, waitlisted)
  - `limit`: number (default: 50)
  - `offset`: number (default: 0)
  - `sort_by`: string (created_at, updated_at)
  - `sort_order`: string (asc, desc)
- **Response**:
```json
{
  "consultations": [
    {
      "id": "consultation_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "admin_status": "pending",
      "booking_details": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "message": "Looking for career guidance"
      },
      "time_slots": [
        {"date": "2024-01-15", "time": "14:00"},
        {"date": "2024-01-16", "time": "10:00"},
        {"date": "2024-01-17", "time": "16:00"}
      ],
      "has_time_slots": true,
      "display_message": "Looking for career guidance",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 25,
  "status_counts": {
    "pending": 10,
    "confirmed": 8,
    "rescheduled": 3,
    "waitlisted": 2,
    "completed": 2
  },
  "gatekeeper_actions": ["confirm", "reschedule", "waitlist"]
}
```

### 6. **UPDATE CONSULTATION STATUS** ✅
- **Endpoint**: `PATCH /api/consultation-management/:id`
- **Authentication**: Required (Admin)
- **Description**: Update consultation status and details
- **Request Body**:
```json
{
  "status": "confirmed",
  "admin_notes": "Consultation confirmed for Monday",
  "admin_message": "Looking forward to our meeting",
  "scheduled_at": "2024-01-15T14:00:00Z",
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "selected_time_slot": 0
}
```
- **Response**:
```json
{
  "message": "Consultation updated successfully",
  "consultation": {
    "id": "consultation_id",
    "status": "confirmed",
    "scheduled_at": "2024-01-15T14:00:00Z",
    "meeting_link": "https://meet.google.com/abc-defg-hij",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## ✅ ADVANCED CONSULTATION ACTIONS

### 7. **CONFIRM SPECIFIC TIME SLOT** ✅
- **Endpoint**: `POST /api/consultation-management/:id/confirm-time`
- **Authentication**: Required (Admin)
- **Description**: Confirm a specific time slot from preferred slots
- **Request Body**:
```json
{
  "selected_time_slot": 1,
  "meeting_details": "Consultation confirmed for Tuesday",
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "meeting_type": "video_call",
  "admin_notes": "Second slot selected"
}
```
- **Response**:
```json
{
  "message": "Consultation time confirmed successfully",
  "consultation": {
    "id": "consultation_id",
    "status": "confirmed",
    "scheduled_at": "2024-01-16T10:00:00Z",
    "meeting_link": "https://meet.google.com/abc-defg-hij",
    "selected_slot": {
      "date": "2024-01-16",
      "time": "10:00"
    }
  }
}
```

### 8. **REQUEST NEW AVAILABILITY** ✅
- **Endpoint**: `POST /api/consultation-management/:id/request-new-times`
- **Authentication**: Required (Admin)
- **Description**: Request client to provide new availability
- **Request Body**:
```json
{
  "admin_message": "We need to reschedule your consultation",
  "reason": "Schedule conflict with existing appointments"
}
```
- **Response**:
```json
{
  "message": "New availability requested successfully",
  "consultation": {
    "id": "consultation_id",
    "status": "awaiting_new_times",
    "admin_message": "We need to reschedule your consultation"
  }
}
```

### 9. **REJECT/CANCEL CONSULTATION** ✅
- **Endpoint**: `DELETE /api/consultation-management/:id`
- **Authentication**: Required (Admin)
- **Description**: Reject or cancel a consultation request
- **Request Body**:
```json
{
  "reason": "Unable to accommodate request",
  "admin_message": "Unfortunately, we cannot schedule this consultation"
}
```
- **Response**:
```json
{
  "message": "Consultation rejected successfully",
  "consultation": {
    "id": "consultation_id",
    "status": "rejected",
    "reason": "Unable to accommodate request"
  }
}
```

---

## ✅ ONBOARDING APPROVAL BUTTONS

### 10. **APPROVE ONBOARDING** ✅
- **Endpoint**: `POST /api/admin/concierge/onboarding/:id/approve`
- **Authentication**: Required (Admin)
- **Description**: Approve client's 20Q onboarding and unlock their profile
- **Button Action**: "Approve" button in onboarding dashboard
- **Request Body**:
```json
{
  "admin_notes": "Onboarding completed successfully - profile approved"
}
```
- **Response**:
```json
{
  "message": "Onboarding approved and profile unlocked successfully",
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "execution_status": "active",
  "profile_unlocked": true,
  "approved_by": "Admin Name",
  "approved_at": "2024-01-01T00:00:00Z"
}
```

---

## ✅ CONSULTATION COMPLETION & FEEDBACK

### 11. **MARK CONSULTATION COMPLETE** ✅
- **Endpoint**: `POST /api/consultations/:id/complete`
- **Authentication**: Required (Admin)
- **Description**: Mark consultation as completed with details
- **Request Body**:
```json
{
  "actual_duration": 65,
  "notes": "Great consultation, client is ready for job search",
  "action_items": [
    "Update resume with new experience",
    "Practice interview questions",
    "Apply to 5 target companies"
  ],
  "recording_url": "https://recordings.com/consultation123",
  "follow_up_required": true,
  "follow_up_notes": "Schedule follow-up in 2 weeks",
  "internal_rating": 5,
  "billable_hours": 1.5,
  "hourly_rate": 150
}
```
- **Response**:
```json
{
  "message": "Consultation marked as completed",
  "consultation": {
    "id": "consultation_id",
    "status": "completed",
    "actual_duration": 65,
    "total_cost": 225,
    "follow_up_required": true
  }
}
```

### 12. **CLIENT FEEDBACK SUBMISSION** ✅
- **Endpoint**: `POST /api/consultations/:id/feedback`
- **Authentication**: Required (Client)
- **Description**: Client provides feedback on consultation
- **Request Body**:
```json
{
  "satisfaction_rating": 5,
  "client_feedback": "Excellent consultation, very helpful guidance"
}
```
- **Response**:
```json
{
  "message": "Feedback submitted successfully",
  "consultation": {
    "id": "consultation_id",
    "satisfaction_rating": 5,
    "client_feedback": "Excellent consultation, very helpful guidance"
  }
}
```

---

## 🔄 CONSULTATION STATUS FLOW

The consultation engine follows this status flow:

1. **pending** → Initial submission
2. **scheduled/confirmed** → Admin confirms time slot
3. **rescheduled** → Admin requests new times
4. **waitlisted** → Added to waitlist
5. **onboarding** → Payment verified, registration sent
6. **completed** → Consultation finished
7. **rejected** → Request declined

---

## 📧 EMAIL NOTIFICATIONS

Each button action triggers appropriate email notifications:

- **Confirm**: `consultation_confirmed_concierge`
- **Reschedule**: `consultation_reschedule_request`
- **Waitlist**: `consultation_waitlisted`
- **Verify & Invite**: `payment_confirmed_welcome_concierge`
- **Approve Onboarding**: `profile_unlocked_tracker_active`
- **Complete**: `consultation_completed`
- **Reject**: `consultation_rejected`

---

## 🎯 BUTTON MAPPING

| Dashboard Button | Endpoint | Status Change |
|------------------|----------|---------------|
| **Confirm** | `POST /consultations/:id/confirm` | `pending` → `scheduled` |
| **Reschedule** | `POST /consultations/:id/reschedule` | `pending` → `rescheduled` |
| **Waitlist** | `POST /consultations/:id/waitlist` | `pending` → `waitlisted` |
| **Verify & Invite** | `POST /payment-confirmation` | `scheduled` → `onboarding` |
| **Approve** | `POST /onboarding/:id/approve` | `pending_approval` → `active` |
| **Complete** | `POST /consultations/:id/complete` | `scheduled` → `completed` |
| **Reject** | `DELETE /consultation-management/:id` | `any` → `rejected` |

---

## ⚡ QUICK TEST COMMANDS

Test the consultation buttons with these curl commands:

```bash
# Get all consultations
curl -H "Authorization: Bearer $TOKEN" \
  "https://apply-bureau-backend.vercel.app/api/admin/concierge/consultations"

# Confirm consultation (select first time slot)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"selected_slot_index":0,"meeting_link":"https://meet.google.com/test"}' \
  "https://apply-bureau-backend.vercel.app/api/admin/concierge/consultations/CONSULTATION_ID/confirm"

# Verify & Invite
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"client_email":"test@example.com","client_name":"Test User","payment_amount":"$2500"}' \
  "https://apply-bureau-backend.vercel.app/api/admin/concierge/payment-confirmation"
```

All consultation engine button endpoints are **✅ WORKING** and ready for production use!