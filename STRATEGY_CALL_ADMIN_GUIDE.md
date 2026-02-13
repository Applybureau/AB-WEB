# 📞 Strategy Call System - Admin Guide

## How It Works (Admin Side)

---

## 🔄 Complete Flow

### Step 1: Client Books Strategy Call

**Client Action**: Client goes to their dashboard and books a strategy call

**What Client Provides**:
- 1-3 preferred time slots (date + time)
- Example:
  - Slot 1: February 15, 2026 at 10:00 AM
  - Slot 2: February 16, 2026 at 2:00 PM
  - Slot 3: February 17, 2026 at 4:00 PM

**What Happens**:
- System creates strategy call record with status: `pending`
- Admin gets notification: "New strategy call request from [Client Name]"

---

### Step 2: Admin Views Strategy Call Requests

**Admin Dashboard**: Admin logs in and sees strategy calls section

**API Call**:
```javascript
GET /api/admin/strategy-calls?status=pending
```

**What Admin Sees**:
```json
{
  "strategy_calls": [
    {
      "id": "call-123",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "client_phone": "+1234567890",
      "preferred_slots": [
        {
          "date": "2026-02-15",
          "time": "10:00"
        },
        {
          "date": "2026-02-16",
          "time": "14:00"
        },
        {
          "date": "2026-02-17",
          "time": "16:00"
        }
      ],
      "admin_status": "pending",
      "created_at": "2026-02-09T10:00:00Z"
    }
  ],
  "status_counts": {
    "pending": 5,
    "confirmed": 3,
    "completed": 2
  }
}
```

**Admin UI Shows**:
```
┌─────────────────────────────────────────────────────┐
│ Strategy Call Requests                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📞 John Doe (john@example.com)                     │
│ Phone: +1234567890                                  │
│                                                     │
│ Preferred Times:                                    │
│ ○ Slot 1: Feb 15, 2026 at 10:00 AM                │
│ ○ Slot 2: Feb 16, 2026 at 2:00 PM                 │
│ ○ Slot 3: Feb 17, 2026 at 4:00 PM                 │
│                                                     │
│ Status: ⏳ Pending                                  │
│                                                     │
│ [Confirm Call] [Reject]                            │
└─────────────────────────────────────────────────────┘
```

---

### Step 3: Admin Confirms Strategy Call

**Admin Action**: Admin clicks "Confirm Call"

**Admin Must Choose**:

#### Option A: WhatsApp Call
```
┌─────────────────────────────────────────────────────┐
│ Confirm Strategy Call                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Select Time Slot:                                   │
│ ● Slot 1: Feb 15, 2026 at 10:00 AM                │
│ ○ Slot 2: Feb 16, 2026 at 2:00 PM                 │
│ ○ Slot 3: Feb 17, 2026 at 4:00 PM                 │
│                                                     │
│ Communication Method:                               │
│ ● WhatsApp                                          │
│ ○ Meeting Link                                      │
│                                                     │
│ WhatsApp Number:                                    │
│ [+1234567890                    ]                   │
│                                                     │
│ Admin Notes (optional):                             │
│ [Will call via WhatsApp        ]                   │
│                                                     │
│ [Cancel] [Confirm Call]                            │
└─────────────────────────────────────────────────────┘
```

**API Call**:
```javascript
POST /api/admin/strategy-calls/call-123/confirm

Body:
{
  "selected_slot_index": 0,  // 0 = Slot 1, 1 = Slot 2, 2 = Slot 3
  "communication_method": "whatsapp",
  "whatsapp_number": "+1234567890",
  "admin_notes": "Will call via WhatsApp"
}
```

#### Option B: Meeting Link (Zoom/Google Meet)
```
┌─────────────────────────────────────────────────────┐
│ Confirm Strategy Call                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Select Time Slot:                                   │
│ ○ Slot 1: Feb 15, 2026 at 10:00 AM                │
│ ● Slot 2: Feb 16, 2026 at 2:00 PM                 │
│ ○ Slot 3: Feb 17, 2026 at 4:00 PM                 │
│                                                     │
│ Communication Method:                               │
│ ○ WhatsApp                                          │
│ ● Meeting Link                                      │
│                                                     │
│ Meeting Link:                                       │
│ [https://zoom.us/j/123456789   ]                   │
│                                                     │
│ Admin Notes (optional):                             │
│ [Zoom meeting scheduled        ]                   │
│                                                     │
│ [Cancel] [Confirm Call]                            │
└─────────────────────────────────────────────────────┘
```

**API Call**:
```javascript
POST /api/admin/strategy-calls/call-123/confirm

Body:
{
  "selected_slot_index": 1,  // Selected Slot 2
  "communication_method": "meeting_link",
  "meeting_link": "https://zoom.us/j/123456789",
  "admin_notes": "Zoom meeting scheduled"
}
```

---

### Step 4: System Processes Confirmation

**What Happens Automatically**:

1. **Updates Database**:
   - `admin_status`: "pending" → "confirmed"
   - `status`: "pending" → "confirmed"
   - `confirmed_time`: "2026-02-15T10:00:00Z"
   - `communication_method`: "whatsapp" or "meeting_link"
   - `whatsapp_number`: "+1234567890" (if WhatsApp)
   - `meeting_link`: "https://zoom.us/..." (if Meeting Link)
   - `admin_action_by`: admin's user ID
   - `admin_action_at`: current timestamp

2. **Sends Email to Client**:

**If WhatsApp**:
```
Subject: Your Strategy Call is Confirmed

Hi John,

Your strategy call has been confirmed!

📅 Date: February 15, 2026
⏰ Time: 10:00 AM
📞 Method: WhatsApp Call
📱 Number: +1234567890

We will call you on WhatsApp at the scheduled time.

Best regards,
Apply Bureau Team
```

**If Meeting Link**:
```
Subject: Your Strategy Call is Confirmed

Hi John,

Your strategy call has been confirmed!

📅 Date: February 16, 2026
⏰ Time: 2:00 PM
💻 Method: Video Call
🔗 Meeting Link: https://zoom.us/j/123456789

Click the link above to join at the scheduled time.

Best regards,
Apply Bureau Team
```

3. **Creates Notification for Client**:
   - Title: "Strategy Call Confirmed"
   - Message: "Your strategy call has been confirmed for Feb 15 at 10:00 AM"
   - Shows in client dashboard

---

### Step 5: Admin Manages Call Status

**After the call happens**, admin can update status:

**API Call**:
```javascript
PATCH /api/admin/strategy-calls/call-123/status

Body:
{
  "status": "completed"
}
```

**Status Options**:
- `pending` - Waiting for admin to confirm
- `confirmed` - Admin confirmed, waiting for call
- `completed` - Call finished
- `cancelled` - Call cancelled

---

## 📊 Admin Dashboard View

### Strategy Calls List

```
┌─────────────────────────────────────────────────────────────────┐
│ Strategy Calls Management                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Filter: [All ▼] [Pending ▼] [Confirmed ▼] [Completed ▼]       │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ⏳ PENDING (5)                                              │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │                                                             │ │
│ │ 📞 John Doe                                                 │ │
│ │ john@example.com | +1234567890                             │ │
│ │ Requested: Feb 9, 2026                                      │ │
│ │ Slots: Feb 15 10:00 AM, Feb 16 2:00 PM, Feb 17 4:00 PM    │ │
│ │ [Confirm] [Reject]                                         │ │
│ │                                                             │ │
│ │ 📞 Jane Smith                                               │ │
│ │ jane@example.com | +0987654321                             │ │
│ │ Requested: Feb 8, 2026                                      │ │
│ │ Slots: Feb 14 9:00 AM, Feb 15 11:00 AM                    │ │
│ │ [Confirm] [Reject]                                         │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✅ CONFIRMED (3)                                            │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │                                                             │ │
│ │ 📞 Mike Johnson                                             │ │
│ │ mike@example.com                                            │ │
│ │ Confirmed: Feb 12, 2026 at 3:00 PM                         │ │
│ │ Method: 💻 Zoom (https://zoom.us/j/123...)                │ │
│ │ [Mark Completed] [Reschedule]                              │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✔️ COMPLETED (2)                                            │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │                                                             │ │
│ │ 📞 Sarah Williams                                           │ │
│ │ sarah@example.com                                           │ │
│ │ Completed: Feb 8, 2026 at 10:00 AM                         │ │
│ │ Method: 📱 WhatsApp (+1234567890)                          │ │
│ │ [View Details]                                             │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed View

When admin clicks on a strategy call:

```
┌─────────────────────────────────────────────────────────────────┐
│ Strategy Call Details                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Client Information:                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Name: John Doe                                                  │
│ Email: john@example.com                                         │
│ Phone: +1234567890                                              │
│                                                                 │
│ Call Details:                                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Status: ✅ Confirmed                                            │
│ Confirmed Time: February 15, 2026 at 10:00 AM                  │
│ Communication: 📱 WhatsApp                                      │
│ WhatsApp Number: +1234567890                                    │
│                                                                 │
│ Preferred Slots (Client Requested):                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ✓ Slot 1: Feb 15, 2026 at 10:00 AM (SELECTED)                 │
│ ○ Slot 2: Feb 16, 2026 at 2:00 PM                             │
│ ○ Slot 3: Feb 17, 2026 at 4:00 PM                             │
│                                                                 │
│ Admin Notes:                                                    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Will call via WhatsApp                                          │
│                                                                 │
│ Timeline:                                                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ • Requested: Feb 9, 2026 at 10:00 AM                           │
│ • Confirmed: Feb 9, 2026 at 11:30 AM by Admin Name             │
│                                                                 │
│ Actions:                                                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ [Mark as Completed] [Reschedule] [Cancel Call]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Frontend Integration Example

### 1. Get All Strategy Calls

```javascript
const getStrategyCalls = async (status = 'all') => {
  const response = await fetch(
    `https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/strategy-calls?status=${status}`,
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  return data;
};
```

### 2. Confirm Strategy Call with WhatsApp

```javascript
const confirmCallWithWhatsApp = async (callId, slotIndex, whatsappNumber) => {
  const response = await fetch(
    `https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/strategy-calls/${callId}/confirm`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        selected_slot_index: slotIndex,
        communication_method: 'whatsapp',
        whatsapp_number: whatsappNumber,
        admin_notes: 'Will call via WhatsApp'
      })
    }
  );
  
  const data = await response.json();
  return data;
};
```

### 3. Confirm Strategy Call with Meeting Link

```javascript
const confirmCallWithMeetingLink = async (callId, slotIndex, meetingLink) => {
  const response = await fetch(
    `https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/strategy-calls/${callId}/confirm`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        selected_slot_index: slotIndex,
        communication_method: 'meeting_link',
        meeting_link: meetingLink,
        admin_notes: 'Zoom meeting scheduled'
      })
    }
  );
  
  const data = await response.json();
  return data;
};
```

### 4. Update Call Status

```javascript
const updateCallStatus = async (callId, status) => {
  const response = await fetch(
    `https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/strategy-calls/${callId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    }
  );
  
  const data = await response.json();
  return data;
};
```

---

## 🎯 Key Points

1. **Client Flexibility**: Client provides 1-3 time slots, admin picks the best one
2. **Communication Choice**: Admin decides WhatsApp OR Meeting Link
3. **Automatic Notifications**: Client gets email + dashboard notification
4. **Status Tracking**: pending → confirmed → completed
5. **Admin Control**: Full control over scheduling and communication method

---

## 📊 Database Fields

**strategy_calls table**:
```sql
- id (UUID)
- client_id (UUID)
- client_name (TEXT)
- client_email (TEXT)
- client_phone (TEXT)
- preferred_slots (JSONB) -- Array of {date, time}
- admin_status (TEXT) -- pending, confirmed, completed, cancelled
- status (TEXT) -- Same as admin_status
- confirmed_time (TIMESTAMP) -- Selected time slot
- communication_method (TEXT) -- 'whatsapp' or 'meeting_link'
- whatsapp_number (TEXT) -- If WhatsApp selected
- meeting_link (TEXT) -- If Meeting Link selected
- admin_notes (TEXT) -- Optional notes
- admin_action_by (UUID) -- Which admin confirmed
- admin_action_at (TIMESTAMP) -- When confirmed
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

**Created**: February 9, 2026  
**Status**: Production Ready  
**Endpoints**: All Live

