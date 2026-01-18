# 🔧 **COMPLETE ADMIN DASHBOARD GUIDE**
## **Every Single Detail, Button, and Action**

---

## 📋 **TABLE OF CONTENTS**
1. [Authentication & Access](#authentication--access)
2. [Main Dashboard Overview](#main-dashboard-overview)
3. [Admin Management System](#admin-management-system)
4. [Client Management](#client-management)
5. [Consultation Management](#consultation-management)
6. [Contact Management](#contact-management)
7. [Application Tracking](#application-tracking)
8. [Analytics & Reports](#analytics--reports)
9. [Email Action Buttons](#email-action-buttons)
10. [System Settings](#system-settings)
11. [API Endpoints Reference](#api-endpoints-reference)

---

## 🔐 **AUTHENTICATION & ACCESS**

### **Login Credentials**
```
Email: admin@applybureau.com
Password: admin123
```

### **Authentication Flow**
```javascript
// 1. Login Request
POST https://apply-bureau-backend.vercel.app/api/auth/login
{
  "email": "admin@applybureau.com",
  "password": "admin123"
}

// 2. Response
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "688b3986-0398-4c00-8aa9-0f14a411b378",
    "email": "admin@applybureau.com",
    "full_name": "Admin User",
    "role": "admin",
    "dashboard_type": "admin"
  }
}

// 3. Use Token in Headers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Permission Levels**
- **Super Admin** (`admin@applybureau.com`): Full system access
- **Regular Admin**: Limited admin functions
- **Client**: No admin access

---

## 🏠 **MAIN DASHBOARD OVERVIEW**

### **Endpoint**
```
GET /api/admin-dashboard
Headers: Authorization: Bearer <token>
```

### **Dashboard Sections**

#### **1. Admin Profile Card**
```json
{
  "admin": {
    "id": "uuid",
    "full_name": "Admin User",
    "email": "admin@applybureau.com",
    "role": "admin",
    "profile_picture_url": "https://...",
    "permissions": {
      "can_create_admins": true,
      "can_delete_admins": true,
      "can_manage_clients": true,
      "can_schedule_consultations": true,
      "can_view_reports": true,
      "can_manage_system": true
    },
    "last_login_at": "2026-01-17T10:00:00Z"
  }
}
```

#### **2. Statistics Cards**
```json
{
  "stats": {
    "clients": {
      "total_clients": 150,
      "active_clients": 120,
      "new_clients_this_month": 25,
      "onboarded_clients": 100,
      "pending_onboarding": 20
    },
    "consultations": {
      "total_consultations": 200,
      "scheduled_consultations": 15,
      "completed_consultations": 180,
      "upcoming_consultations": 8,
      "consultations_this_week": 12,
      "consultations_this_month": 45
    },
    "applications": {
      "total_applications": 2500,
      "applications_by_status": {
        "applied": 1200,
        "interview": 300,
        "offer": 100,
        "rejected": 800,
        "withdrawn": 100
      },
      "applications_this_week": 150,
      "applications_this_month": 600,
      "success_rate": "4.0"
    },
    "system": {
      "total_users": 151,
      "total_data_points": 2850,
      "system_health": "excellent",
      "last_backup": "2026-01-17T16:00:00Z"
    }
  }
}
```

#### **3. Quick Action Buttons**
```json
{
  "quick_actions": [
    {
      "action": "invite_client",
      "label": "Invite New Client",
      "icon": "user-plus",
      "endpoint": "POST /api/admin/clients/invite"
    },
    {
      "action": "schedule_consultation",
      "label": "Schedule Consultation",
      "icon": "calendar-plus",
      "endpoint": "POST /api/admin/consultations/schedule"
    },
    {
      "action": "view_reports",
      "label": "View Reports",
      "icon": "chart-bar",
      "endpoint": "GET /api/admin-dashboard/analytics"
    },
    {
      "action": "manage_admins",
      "label": "Manage Admins",
      "icon": "users-cog",
      "endpoint": "GET /api/admin-management/admins"
    },
    {
      "action": "system_settings",
      "label": "System Settings",
      "icon": "cog",
      "endpoint": "GET /api/admin-management/settings"
    }
  ]
}
```

#### **4. Recent Activity Feed**
```json
{
  "recent_activity": {
    "new_clients": [
      {
        "id": "uuid",
        "full_name": "John Doe",
        "email": "john@example.com",
        "created_at": "2026-01-17T10:00:00Z",
        "onboarding_complete": false
      }
    ],
    "upcoming_consultations": [
      {
        "id": "uuid",
        "client_name": "Jane Smith",
        "scheduled_at": "2026-01-20T14:00:00Z",
        "status": "scheduled",
        "type": "initial"
      }
    ],
    "recent_applications": [
      {
        "id": "uuid",
        "job_title": "Software Engineer",
        "company": "Tech Corp",
        "status": "applied",
        "created_at": "2026-01-17T09:00:00Z"
      }
    ],
    "notifications": [
      {
        "id": "uuid",
        "title": "New Contact Submission",
        "message": "New contact form submitted",
        "type": "contact",
        "is_read": false,
        "created_at": "2026-01-17T08:00:00Z"
      }
    ]
  }
}
```

---

## 👥 **ADMIN MANAGEMENT SYSTEM**

### **Super Admin Features** (admin@applybureau.com only)

#### **1. View All Admins**
```
GET /api/admin-management/admins
```

**Response:**
```json
{
  "admins": [
    {
      "id": "uuid",
      "full_name": "Admin User",
      "email": "admin@applybureau.com",
      "role": "admin",
      "profile_picture_url": "https://...",
      "phone": "+1234567890",
      "is_active": true,
      "is_super_admin": true,
      "can_be_modified": false,
      "last_login_at": "2026-01-17T10:00:00Z",
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "uuid2",
      "full_name": "Regular Admin",
      "email": "admin2@applybureau.com",
      "role": "admin",
      "is_active": true,
      "is_super_admin": false,
      "can_be_modified": true,
      "created_at": "2026-01-15T00:00:00Z"
    }
  ]
}
```

#### **2. Create New Admin Button**
```
POST /api/admin-management/admins
Content-Type: multipart/form-data
```

**Form Fields:**
```javascript
{
  full_name: "New Admin Name",
  email: "newadmin@applybureau.com",
  password: "securepassword123",
  phone: "+1234567890",
  profile_picture: File // Optional image file
}
```

**Action Buttons in UI:**
- 📝 **Create Admin** - Opens form modal
- 📤 **Upload Photo** - File picker for profile picture
- ✅ **Save Admin** - Submits form
- ❌ **Cancel** - Closes modal

#### **3. Admin Action Buttons** (Per Admin Row)

##### **🔴 Suspend Admin Button**
```
PUT /api/admin-management/admins/:id/suspend
{
  "reason": "Policy violation"
}
```

**UI Elements:**
- ⚠️ **Suspend** button (red)
- Modal with reason input field
- Confirmation dialog
- Email notification sent automatically

##### **🟢 Reactivate Admin Button**
```
PUT /api/admin-management/admins/:id/reactivate
```

**UI Elements:**
- ✅ **Reactivate** button (green)
- Confirmation dialog
- Status update in real-time

##### **🔑 Reset Password Button**
```
PUT /api/admin-management/admins/:id/reset-password
{
  "new_password": "newpassword123"
}
```

**UI Elements:**
- 🔑 **Reset Password** button
- Password generator option
- Show/hide password toggle
- Copy to clipboard button

##### **🗑️ Delete Admin Button**
```
DELETE /api/admin-management/admins/:id
{
  "reason": "Account no longer needed"
}
```

**UI Elements:**
- 🗑️ **Delete** button (red, dangerous)
- Double confirmation required
- Reason input field
- Warning about permanent action

#### **4. Admin Profile Management**

##### **View Own Profile**
```
GET /api/admin-management/profile
```

**Profile Card Elements:**
- Profile picture with upload button
- Name and email display
- Role and permissions list
- Last login timestamp
- Account creation date
- Recent activity log

##### **Edit Profile Button**
```
PUT /api/admin-management/profile
```

**Editable Fields:**
- Full name
- Phone number
- Profile picture
- Password (with current password verification)

---

## 👤 **CLIENT MANAGEMENT**

### **1. Client List View**
```
GET /api/admin-dashboard/clients?status=active&limit=50&search=john
```

**Filter Buttons:**
- 🟢 **All Clients** - No filter
- 🔵 **Active** - `status=active`
- 🟡 **Pending** - `status=pending`
- 🔴 **Inactive** - `status=inactive`

**Search Bar:**
- Real-time search by name or email
- Debounced input (300ms delay)

**Client Row Actions:**
- 👁️ **View Details** - Opens client profile
- ✏️ **Edit Client** - Edit client information
- 📧 **Send Message** - Compose message
- 📅 **Schedule Consultation** - Book meeting
- 📊 **View Applications** - Application history

### **2. Client Details Modal**
```
GET /api/admin/clients/:id
```

**Tabs in Modal:**
1. **Profile Tab**
   - Personal information
   - Contact details
   - Onboarding status
   - Profile picture

2. **Applications Tab**
   - Application history
   - Status tracking
   - Success metrics

3. **Consultations Tab**
   - Past consultations
   - Scheduled meetings
   - Notes and outcomes

4. **Messages Tab**
   - Communication history
   - Unread messages
   - Quick reply

### **3. Invite New Client Button**
```
POST /api/admin/clients/invite
```

**Form Fields:**
```json
{
  "email": "client@example.com",
  "full_name": "Client Name",
  "phone": "+1234567890",
  "consultation_notes": "Initial consultation notes"
}
```

**Action Flow:**
1. 📝 **Invite Client** button
2. Form modal opens
3. Fill client details
4. ✅ **Send Invitation** button
5. Email sent automatically
6. Client added to system

---

## 📞 **CONSULTATION MANAGEMENT**

### **1. Consultation Requests List**
```
GET /api/consultation-requests?page=1&limit=20&status=pending
```

**Current Data (7 consultations):**
```json
{
  "success": true,
  "data": [
    {
      "id": "1d97a76c-b533-4d28-9b2e-7ccf5814842d",
      "fullName": "Iretioluwa Akinwale",
      "email": "ainaakinwale@gmail.com",
      "phone": "22298564355854",
      "message": "I want to test this",
      "preferredSlots": [
        {"date": "2026-01-22", "time": "18:00"},
        {"date": "2026-01-23", "time": "10:30"},
        {"date": "2026-01-17", "time": "10:30"}
      ],
      "consultation_type": "initial",
      "urgency_level": "medium",
      "status": "pending",
      "created_at": "2026-01-17T09:57:33.712Z"
    }
  ],
  "pagination": {
    "total": 7,
    "page": 1,
    "limit": 20,
    "has_next": false
  }
}
```

### **2. Consultation Action Buttons** (Per Row)

#### **✅ Approve Consultation**
```
PATCH /api/consultation-requests/:id
{
  "status": "confirmed",
  "admin_notes": "Consultation approved",
  "confirmedSlot": "2026-01-22 18:00"
}
```

#### **📅 Schedule Meeting**
```
PATCH /api/consultation-requests/:id
{
  "status": "scheduled",
  "scheduled_datetime": "2026-01-22T18:00:00Z",
  "google_meet_link": "https://meet.google.com/abc-def-ghi"
}
```

#### **📋 Add to Waitlist**
```
PATCH /api/consultation-requests/:id
{
  "status": "waitlisted",
  "admin_notes": "Added to waitlist - no slots available"
}
```

#### **❌ Reject Consultation**
```
PATCH /api/consultation-requests/:id
{
  "status": "rejected",
  "admin_notes": "Does not meet criteria"
}
```

#### **📝 Add Notes**
```
PATCH /api/consultation-requests/:id
{
  "admin_notes": "Client has specific requirements for remote work"
}
```

### **3. Consultation Status Filters**
- 🟡 **Pending** - `status=pending`
- ✅ **Confirmed** - `status=confirmed`
- 📅 **Scheduled** - `status=scheduled`
- 📋 **Waitlisted** - `status=waitlisted`
- ❌ **Rejected** - `status=rejected`

---

## 📧 **CONTACT MANAGEMENT**

### **1. Contact Submissions List**
```
GET /api/contact?page=1&limit=10&status=new
```

**Current Data (2 contacts):**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "subject": "General Inquiry",
      "message": "I need help with my application",
      "company": "Tech Corp",
      "country": "USA",
      "position": "Software Engineer",
      "status": "new",
      "created_at": "2026-01-15T10:00:00Z",
      "admin_notes": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

### **2. Contact Action Buttons** (Per Row)

#### **👁️ View Contact Details**
- Opens modal with full contact information
- Shows message content
- Displays contact metadata

#### **📝 Update Status**
```
PATCH /api/contact/:id
{
  "status": "in_progress",
  "admin_notes": "Following up with client"
}
```

**Status Options:**
- 🆕 **New** - `new`
- 🔄 **In Progress** - `in_progress`
- ✅ **Resolved** - `resolved`

#### **📧 Reply to Contact**
- Opens email composition modal
- Pre-fills recipient information
- Sends response and updates status

#### **📋 Add Notes**
```
PATCH /api/contact/:id
{
  "admin_notes": "Client interested in premium package"
}
```

### **3. Contact Filters**
- 🆕 **New** - `status=new`
- 🔄 **In Progress** - `status=in_progress`
- ✅ **Resolved** - `status=resolved`
- 🔍 **Search** - By name, email, or subject

---

## 📊 **APPLICATION TRACKING**

### **1. Create Application for Client**
```
POST /api/admin/applications
```

**Form Fields:**
```json
{
  "client_id": "uuid",
  "job_title": "Software Engineer",
  "company": "Tech Corp",
  "job_description": "Full stack development role",
  "job_url": "https://company.com/jobs/123",
  "salary_range": "$80,000 - $120,000",
  "location": "San Francisco, CA",
  "job_type": "full-time",
  "application_method": "online",
  "application_strategy": "Direct application with referral",
  "admin_notes": "Strong match for client skills"
}
```

### **2. Application Status Updates**
```
PATCH /api/admin/applications/:id/status
```

**Status Buttons:**
- 📤 **Applied** - `applied`
- 👀 **Under Review** - `under_review`
- 📞 **Interview Scheduled** - `interview_scheduled`
- 🎉 **Offer Received** - `offer_received`
- ❌ **Rejected** - `rejected`
- 🚫 **Withdrawn** - `withdrawn`

### **3. Interview Management**
```json
{
  "status": "interview_scheduled",
  "interview_scheduled_at": "2026-01-25T14:00:00Z",
  "interview_type": "video",
  "interview_notes": "Technical interview with team lead"
}
```

### **4. Offer Management**
```json
{
  "status": "offer_received",
  "offer_salary": "$95,000",
  "offer_benefits": "Health, dental, 401k, remote work",
  "offer_deadline": "2026-02-01T17:00:00Z"
}
```

---

## 📈 **ANALYTICS & REPORTS**

### **1. Dashboard Analytics**
```
GET /api/admin-dashboard/analytics?period=30d
```

**Time Period Buttons:**
- 📅 **7 Days** - `period=7d`
- 📅 **30 Days** - `period=30d`
- 📅 **90 Days** - `period=90d`

### **2. Chart Data**
```json
{
  "period": "30d",
  "client_growth": [
    {"date": "2026-01-15", "count": 3},
    {"date": "2026-01-16", "count": 5}
  ],
  "consultation_trends": [
    {"date": "2026-01-15", "count": 8}
  ],
  "application_trends": [
    {"date": "2026-01-15", "count": 25}
  ],
  "success_metrics": {
    "onboarding_rate": "85.5",
    "consultation_completion_rate": "92.3",
    "application_success_rate": "4.2"
  }
}
```

### **3. Export Buttons**
- 📊 **Export to Excel** - Downloads XLSX file
- 📄 **Export to PDF** - Generates PDF report
- 📋 **Copy to Clipboard** - Copies data as text

---

## 📧 **EMAIL ACTION BUTTONS**

### **1. Consultation Email Actions**

#### **✅ Confirm Consultation Button** (In Email)
```
GET /api/email-actions/consultation/:id/confirm/:token
```

**Email Button HTML:**
```html
<a href="https://apply-bureau-backend.vercel.app/api/email-actions/consultation/{{consultation_id}}/confirm/{{token}}" 
   style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
   ✅ Confirm Consultation
</a>
```

#### **📋 Add to Waitlist Button** (In Email)
```
GET /api/email-actions/consultation/:id/waitlist/:token
```

**Email Button HTML:**
```html
<a href="https://apply-bureau-backend.vercel.app/api/email-actions/consultation/{{consultation_id}}/waitlist/{{token}}" 
   style="background: #ffc107; color: black; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
   📋 Join Waitlist
</a>
```

### **2. Admin Management Email Actions**

#### **⚠️ Suspend Admin Button** (In Email)
```
GET /api/email-actions/admin/:adminId/suspend/:token
```

**Email Button HTML:**
```html
<a href="https://apply-bureau-backend.vercel.app/api/email-actions/admin/{{admin_id}}/suspend/{{token}}" 
   style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
   ⚠️ Suspend Admin
</a>
```

#### **🗑️ Delete Admin Button** (In Email)
```
GET /api/email-actions/admin/:adminId/delete/:token
```

**Email Button HTML:**
```html
<a href="https://apply-bureau-backend.vercel.app/api/email-actions/admin/{{admin_id}}/delete/{{token}}" 
   style="background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
   🗑️ Delete Admin
</a>
```

### **3. Email Action Security**
- **Token Generation**: `Buffer.from(id-email).toString('base64').slice(0, 16)`
- **Token Validation**: Prevents unauthorized actions
- **Super Admin Protection**: Cannot suspend/delete super admin
- **Action Logging**: All actions are logged for audit

---

## ⚙️ **SYSTEM SETTINGS**

### **1. System Settings** (Super Admin Only)
```
GET /api/admin-management/settings
```

**Settings Panel:**
```json
{
  "settings": {
    "super_admin_email": "admin@applybureau.com",
    "system_status": "active",
    "admin_creation_enabled": true,
    "email_notifications_enabled": true,
    "password_reset_enabled": true,
    "account_suspension_enabled": true,
    "last_updated": "2026-01-17T16:00:00Z"
  }
}
```

### **2. System Control Buttons**
- 🔧 **System Maintenance** - Enable/disable maintenance mode
- 📧 **Email Settings** - Configure email templates and settings
- 🔐 **Security Settings** - Password policies, session timeouts
- 📊 **Backup Settings** - Database backup configuration
- 🔄 **Cache Management** - Clear system cache

### **3. Admin System Health**
```
GET /api/health
```

**Health Status:**
```json
{
  "status": "healthy",
  "service": "Apply Bureau Backend",
  "database": "connected",
  "email_service": "operational",
  "storage": "available",
  "timestamp": "2026-01-17T16:00:00Z"
}
```

---

## 🔗 **API ENDPOINTS REFERENCE**

### **Authentication**
```
POST /api/auth/login              - Admin login
GET  /api/auth/me                 - Get current admin info
POST /api/auth/logout             - Admin logout
```

### **Main Dashboard**
```
GET  /api/admin-dashboard         - Main dashboard data
GET  /api/admin-dashboard/clients - Client list
GET  /api/admin-dashboard/analytics - Analytics data
```

### **Admin Management** (Super Admin Only)
```
GET    /api/admin-management/profile     - Get admin profile
GET    /api/admin-management/admins      - List all admins
POST   /api/admin-management/admins      - Create new admin
PUT    /api/admin-management/admins/:id/suspend    - Suspend admin
PUT    /api/admin-management/admins/:id/reactivate - Reactivate admin
PUT    /api/admin-management/admins/:id/reset-password - Reset password
DELETE /api/admin-management/admins/:id  - Delete admin
GET    /api/admin-management/settings    - System settings
```

### **Client Management**
```
POST  /api/admin/clients/invite    - Invite new client
GET   /api/admin/clients           - Get all clients
GET   /api/admin/clients/:id       - Get client details
```

### **Consultation Management**
```
GET   /api/consultation-requests   - List consultation requests
PATCH /api/consultation-requests/:id - Update consultation status
POST  /api/admin/consultations/schedule - Schedule consultation
```

### **Contact Management**
```
GET   /api/contact                 - List contact submissions
PATCH /api/contact/:id             - Update contact status
```

### **Application Management**
```
POST  /api/admin/applications      - Create application
PATCH /api/admin/applications/:id/status - Update application status
```

### **Communication**
```
POST  /api/admin/messages          - Send message to client
```

### **Email Actions** (Public, Token-Protected)
```
GET /api/email-actions/consultation/:id/confirm/:token  - Confirm consultation
GET /api/email-actions/consultation/:id/waitlist/:token - Add to waitlist
GET /api/email-actions/admin/:adminId/suspend/:token    - Suspend admin
GET /api/email-actions/admin/:adminId/delete/:token     - Delete admin
```

### **System Health**
```
GET /api/health                    - System health check
GET /api/admin/stats               - Admin system statistics
GET /api/admin/logs                - System logs (Admin only)
POST /api/admin/cache/clear        - Clear cache (Admin only)
```

---

## 🎯 **BUTTON INTERACTION FLOWS**

### **1. Create Admin Flow**
1. Click **"Manage Admins"** → Opens admin management page
2. Click **"Create New Admin"** → Opens form modal
3. Fill form fields → Enable **"Save Admin"** button
4. Click **"Save Admin"** → Shows loading spinner
5. Success → Modal closes, admin list refreshes
6. Email sent automatically to new admin

### **2. Suspend Admin Flow**
1. Click **"Suspend"** button → Opens confirmation modal
2. Enter suspension reason → Enable **"Confirm Suspend"** button
3. Click **"Confirm Suspend"** → Shows loading state
4. Success → Button changes to **"Reactivate"**
5. Email sent to suspended admin
6. Notification sent to super admin

### **3. Consultation Management Flow**
1. Click consultation row → Opens details modal
2. Select action button:
   - **"Approve"** → Status changes to confirmed
   - **"Schedule"** → Opens calendar picker
   - **"Waitlist"** → Adds to waitlist
   - **"Reject"** → Opens reason input
3. Action completed → Email sent to client
4. Status updated in real-time

### **4. Client Invitation Flow**
1. Click **"Invite New Client"** → Opens form modal
2. Fill client details → Enable **"Send Invitation"** button
3. Click **"Send Invitation"** → Shows progress indicator
4. Success → Client added to system
5. Invitation email sent with registration link
6. Client appears in pending list

---

## 🔒 **SECURITY FEATURES**

### **1. Permission-Based Actions**
- Super Admin: All actions available
- Regular Admin: Limited to client management
- Role-based button visibility

### **2. Token Security**
- JWT tokens with 24-hour expiration
- Secure token generation for email actions
- Token validation on all protected endpoints

### **3. Action Logging**
- All admin actions logged
- Audit trail for account changes
- Security event monitoring

### **4. Email Action Protection**
- Unique tokens for each action
- Time-based token expiration
- Super admin account protection

---

## 📱 **RESPONSIVE DESIGN**

### **Desktop Layout**
- Full dashboard with sidebar
- Multi-column data tables
- Modal dialogs for forms
- Hover states for buttons

### **Tablet Layout**
- Collapsible sidebar
- Stacked cards for stats
- Touch-friendly buttons
- Swipe gestures for tables

### **Mobile Layout**
- Bottom navigation
- Single-column layout
- Full-screen modals
- Large touch targets

---

## 🎨 **UI COMPONENTS**

### **Button Styles**
```css
/* Primary Actions */
.btn-primary { background: #007bff; color: white; }

/* Success Actions */
.btn-success { background: #28a745; color: white; }

/* Warning Actions */
.btn-warning { background: #ffc107; color: black; }

/* Danger Actions */
.btn-danger { background: #dc3545; color: white; }

/* Secondary Actions */
.btn-secondary { background: #6c757d; color: white; }
```

### **Status Indicators**
```css
/* Status Badges */
.status-active { background: #28a745; }
.status-pending { background: #ffc107; }
.status-suspended { background: #dc3545; }
.status-inactive { background: #6c757d; }
```

### **Icon Usage**
- 👤 User management
- 📧 Email actions
- 📊 Analytics
- ⚙️ Settings
- 🔒 Security
- 📅 Scheduling
- 📝 Notes/Messages

---

This comprehensive guide covers every single button, action, endpoint, and feature available in the admin dashboard. Each section provides exact API calls, response formats, UI elements, and interaction flows for complete implementation.