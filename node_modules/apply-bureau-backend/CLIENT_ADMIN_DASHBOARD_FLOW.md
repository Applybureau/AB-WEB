# Client Dashboard & Admin Dashboard - Complete Flow Explanation

## 🎯 Overview

The system has **TWO separate dashboards** that work together:

1. **Client Dashboard** - Where clients manage their job search
2. **Admin Dashboard** - Where admins manage clients and applications

They share the same database but have different views and permissions.

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         DATABASE                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   clients    │  │ applications │  │ strategy_calls│      │
│  │              │  │              │  │              │      │
│  │ - id         │  │ - client_id  │  │ - client_id  │      │
│  │ - email      │  │ - status     │  │ - status     │      │
│  │ - role       │  │ - company    │  │ - confirmed  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │client_       │  │client_files  │  │subscription_ │      │
│  │onboarding    │  │              │  │plans         │      │
│  │              │  │ - resume     │  │              │      │
│  │ - q1 to q20  │  │ - linkedin   │  │ - tier 1,2,3 │      │
│  │ - status     │  │ - portfolio  │  │ - features   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │ CLIENT DASHBOARD  │       │ ADMIN DASHBOARD   │
    │                   │       │                   │
    │ Role: "client"    │       │ Role: "admin"     │
    │ READ-ONLY view    │       │ FULL CONTROL      │
    └───────────────────┘       └───────────────────┘
```

---

## 🔄 Complete Client Journey Flow

### Phase 1: Initial Setup (Admin Side)

```
1. ADMIN creates client account
   ↓
   POST /api/admin/clients/invite
   {
     "email": "client@example.com",
     "full_name": "John Doe"
   }
   ↓
2. System creates client record in database
   - role: "client"
   - profile_unlocked: false
   - payment_confirmed: false
   ↓
3. Client receives invitation email
   - Contains registration link
  
```

### Phase 2: Client Onboarding (Client Side)

```
1. CLIENT logs in
   ↓
   POST /api/auth/login
   {
     "email": "client@example.com",
     "password": "jjjj"
   }
   ↓
   Returns JWT token with role: "client"
   ↓
2. CLIENT accesses dashboard
   ↓
   GET /api/client/dashboard
   Headers: { Authorization: "Bearer <token>" }
   ↓
   Returns:
   {
     "status": "onboarding_in_progress",
     "message": "Book your strategy call to begin",
     "progress_percentage": 0,
     "next_steps": [
       {
         "title": "Book Strategy Call",
         "action": "book_strategy_call"
       }
     ]
   }
```

### Phase 3: Strategy Call Booking (Client → Admin)

```
CLIENT SIDE:
1. Client books strategy call
   ↓
   POST /api/strategy-calls
   {
     "time_slots": [
       "2026-01-25T15:00:00Z",
       "2026-01-26T10:00:00Z",
       "2026-01-27T14:00:00Z"
     ]
   }
   ↓
2. Record created in strategy_calls table
   - client_id: <client_id>
   - status: "pending"
   - admin_status: "pending"
   ↓
3. Admin receives notification email

ADMIN SIDE:
4. Admin views strategy call requests
   ↓
   GET /api/admin/strategy-calls
   ↓
   Returns list of pending calls
   ↓
5. Admin confirms call
   ↓
   POST /api/admin/strategy-calls/:id/confirm
   {
     "selected_slot_index": 0,
     "meeting_link": "https://zoom.us/j/123456789"
   }
   ↓
6. Record updated in strategy_calls table
   - admin_status: "confirmed"
   - confirmed_time: "2026-01-25T15:00:00Z"
   - meeting_link: "https://zoom.us/j/123456789"
   ↓
7. Client receives confirmation email

CLIENT SIDE:
8. Client sees updated status
   ↓
   GET /api/client/dashboard
   ↓
   Returns:
   {
     "strategy_call": {
       "has_booked": true,
       "has_confirmed": true,
       "scheduled_time": "2026-01-25T15:00:00Z",
       "meeting_link": "https://zoom.us/j/123456789"
     },
     "next_steps": [
       {
         "title": "Complete 20 Questions Assessment",
         "action": "complete_20q"
       }
     ]
   }
```

### Phase 4: 20 Questions Assessment (Client → Admin)

```
CLIENT SIDE:
1. Client completes 20Q assessment
   ↓
   POST /api/client/dashboard/onboarding/submit
   {
     "q1": "Software Engineer, Full Stack Developer",
     "q2": "DevOps Engineer",
     "q3": "Sales, Marketing",
     "q4": "remote",
     "q5": "country_wide",
     ... (all 20 questions)
   }
   ↓
2. Record created in client_onboarding table
   - client_id: <client_id>
   - status: "pending_approval"
   - submitted_at: <timestamp>
   - q1 to q20: <answers>
   ↓
3. clients table updated
   - onboarding_completed: true
   ↓
4. Admin receives notification

ADMIN SIDE:
5. Admin views client's 20Q responses
   ↓
   GET /api/admin/clients/:id/onboarding
   ↓
   Returns all 20 questions and answers
   ↓
6. Admin reviews and approves
   ↓
   POST /api/admin/onboarding/:id/approve
   ↓
7. Record updated in client_onboarding table
   - status: "active"
   - approved_at: <timestamp>
   - approved_by: <admin_id>
   ↓
8. clients table updated
   - onboarding_approved: true
   ↓
9. Client receives approval email

CLIENT SIDE:
10. Client sees updated status
    ↓
    GET /api/client/dashboard
    ↓
    Returns:
    {
      "status": "active",
      "message": "Your account is active",
      "twenty_questions": {
        "status": "active",
        "display_status": "Active & Approved"
      },
      "applications": {
        "can_view": true
      }
    }
```

### Phase 5: Application Management (Admin → Client)

```
ADMIN SIDE:
1. Admin creates applications for client
   ↓
   POST /api/admin/applications
   {
     "client_id": "<client_id>",
     "company": "Tech Corp",
     "job_title": "Senior Software Engineer",
     "job_link": "https://techcorp.com/careers/123",
     "status": "applied"
   }
   ↓
2. Record created in applications table
   - client_id: <client_id>
   - company: "Tech Corp"
   - status: "applied"
   - applied_by_admin: true
   ↓
3. Client receives notification email

CLIENT SIDE:
4. Client views applications (READ-ONLY)
   ↓
   GET /api/applications
   ↓
   Returns list of applications
   ↓
5. Client sees application stats
   ↓
   GET /api/client/dashboard/applications/stats
   ↓
   Returns:
   {
     "total_count": 25,
     "active_count": 15,
     "interview_count": 3,
     "offer_count": 1
   }

ADMIN SIDE:
6. Admin updates application status
   ↓
   PATCH /api/admin/applications/:id/status
   {
     "status": "interview"
   }
   ↓
7. Record updated in applications table
   ↓
8. Client receives status update email

CLIENT SIDE:
9. Client sees updated status in dashboard
```

---

## 🔐 Authentication & Authorization

### How It Works:

```javascript
// 1. User logs in
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// 2. Backend checks database
const user = await supabase
  .from('clients')
  .select('*')
  .eq('email', email)
  .single();

// 3. Backend generates JWT token
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role  // "client" or "admin"
  },
  JWT_SECRET
);

// 4. Frontend stores token
localStorage.setItem('authToken', token);

// 5. Frontend sends token with every request
GET /api/client/dashboard
Headers: {
  Authorization: "Bearer <token>"
}

// 6. Backend middleware checks token
const decoded = jwt.verify(token, JWT_SECRET);
// decoded = { id: "123", email: "user@example.com", role: "client" }

// 7. Backend checks role
if (decoded.role !== 'client') {
  return res.status(403).json({ error: 'Access denied' });
}

// 8. Backend allows access
```

### Middleware Flow:

```javascript
// All client routes protected by:
router.use(authenticateToken);  // Checks JWT token
router.use(requireClient);      // Checks role === "client"

// All admin routes protected by:
router.use(authenticateToken);  // Checks JWT token
router.use(requireAdmin);       // Checks role === "admin"
```

---

## 📋 Data Flow Examples

### Example 1: Client Views Dashboard

```
CLIENT BROWSER
    │
    │ GET /api/client/dashboard
    │ Headers: { Authorization: "Bearer <client_token>" }
    │
    ▼
BACKEND (clientDashboardNew.js)
    │
    │ 1. authenticateToken middleware
    │    - Verifies JWT token
    │    - Extracts user: { id, email, role: "client" }
    │
    │ 2. requireClient middleware
    │    - Checks role === "client"
    │    - Allows access
    │
    │ 3. Route handler
    │    - Gets client_id from token
    │    - Queries database:
    │
    ▼
DATABASE
    │
    │ SELECT * FROM clients WHERE id = <client_id>
    │ SELECT * FROM client_onboarding WHERE client_id = <client_id>
    │ SELECT * FROM strategy_calls WHERE client_id = <client_id>
    │ SELECT * FROM client_files WHERE client_id = <client_id>
    │ SELECT * FROM applications WHERE client_id = <client_id>
    │ SELECT * FROM client_subscriptions WHERE client_id = <client_id>
    │
    ▼
BACKEND
    │
    │ 4. Combines all data
    │ 5. Calculates progress
    │ 6. Generates next steps
    │ 7. Returns JSON response
    │
    ▼
CLIENT BROWSER
    │
    │ Receives complete dashboard data
    │ Displays to user
```

### Example 2: Admin Views Client's 20Q

```
ADMIN BROWSER
    │
    │ GET /api/admin/clients/123/onboarding
    │ Headers: { Authorization: "Bearer <admin_token>" }
    │
    ▼
BACKEND (admin routes - TO BE IMPLEMENTED)
    │
    │ 1. authenticateToken middleware
    │    - Verifies JWT token
    │    - Extracts user: { id, email, role: "admin" }
    │
    │ 2. requireAdmin middleware
    │    - Checks role === "admin"
    │    - Allows access
    │
    │ 3. Route handler
    │    - Gets client_id from URL params
    │    - Queries database:
    │
    ▼
DATABASE
    │
    │ SELECT * FROM client_onboarding WHERE client_id = '123'
    │ SELECT * FROM clients WHERE id = '123'
    │
    ▼
BACKEND
    │
    │ 4. Combines client info + 20Q answers
    │ 5. Returns JSON response
    │
    ▼
ADMIN BROWSER
    │
    │ Receives client's 20Q data
    │ Displays all questions and answers
    │ Shows approve/reject buttons
```

---

## 🎨 Dashboard Comparison

### Client Dashboard Features:

| Feature | Access | Description |
|---------|--------|-------------|
| View Progress | ✅ READ | See onboarding progress percentage |
| View 20Q Status | ✅ READ | See if assessment is pending/approved |
| Submit 20Q | ✅ WRITE | Submit 20 questions assessment |
| Upload Files | ✅ WRITE | Upload resume, add LinkedIn, portfolio |
| Book Strategy Call | ✅ WRITE | Request strategy call with time slots |
| View Applications | ✅ READ | See applications submitted by admin |
| View Subscription | ✅ READ | See current plan and features |
| View Next Steps | ✅ READ | See what to do next |

### Admin Dashboard Features:

| Feature | Access | Description |
|---------|--------|-------------|
| View All Clients | ✅ READ | See list of all clients |
| View Client Details | ✅ READ | See complete client profile |
| View 20Q Responses | ✅ READ | See all 20 questions answers |
| Approve 20Q | ✅ WRITE | Approve client's assessment |
| View Strategy Calls | ✅ READ | See all strategy call requests |
| Confirm Strategy Call | ✅ WRITE | Confirm call with time and link |
| Create Applications | ✅ WRITE | Submit applications for clients |
| Update Application Status | ✅ WRITE | Change status (applied → interview → offer) |
| View Client Files | ✅ READ | See uploaded resumes, LinkedIn, etc. |
| Assign Subscription | ✅ WRITE | Assign Tier 1, 2, or 3 plan |

---

## 🔄 Real-Time Updates

### How Changes Sync:

```
ADMIN makes change
    ↓
Database updated
    ↓
CLIENT refreshes dashboard
    ↓
Sees updated data
```

**Example**:
1. Admin approves 20Q assessment
2. `client_onboarding.status` changes from "pending_approval" to "active"
3. Client refreshes dashboard
4. Dashboard shows "Active & Approved" status
5. Applications section becomes visible

---

## 📊 Database Relationships

```sql
-- Client has ONE onboarding record
clients (1) ←→ (1) client_onboarding

-- Client has MANY strategy calls
clients (1) ←→ (∞) strategy_calls

-- Client has MANY files
clients (1) ←→ (∞) client_files

-- Client has MANY applications
clients (1) ←→ (∞) applications

-- Client has ONE active subscription
clients (1) ←→ (1) client_subscriptions
                    ↓
                    (∞) subscription_plans
```

---

## 🎯 Key Differences

### Client Dashboard:
- **Purpose**: Self-service portal for clients
- **Access**: Only their own data
- **Permissions**: Read applications, write onboarding/files
- **URL**: `/client/dashboard`
- **Role**: `client`

### Admin Dashboard:
- **Purpose**: Management portal for admins
- **Access**: All clients' data
- **Permissions**: Full CRUD on everything
- **URL**: `/admin/dashboard`
- **Role**: `admin`

---

## 🚀 Summary

The system works like this:

1. **Admin creates client account** → Client receives invitation
2. **Client logs in** → Gets JWT token with role: "client"
3. **Client books strategy call** → Admin sees request
4. **Admin confirms call** → Client sees confirmation
5. **Client completes 20Q** → Admin sees responses
6. **Admin approves 20Q** → Client account becomes active
7. **Admin creates applications** → Client sees applications
8. **Admin updates status** → Client sees updates

**Both dashboards read from the same database, but:**
- Clients can only see/edit their own data
- Admins can see/edit all clients' data
- Authentication middleware enforces these rules
- JWT tokens contain the user's role

This creates a secure, role-based system where clients and admins have appropriate access levels!
