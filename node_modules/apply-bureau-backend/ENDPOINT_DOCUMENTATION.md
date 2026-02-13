# Complete Endpoint Documentation

## 1. Reset Password Endpoints

### Admin Password Reset (Super Admin Only)
- **Endpoint**: `POST /api/admin-management/reset-password`
- **Authentication**: Required (Super Admin only)
- **Description**: Reset another admin's password
- **Request Body**:
```json
{
  "admin_email": "admin@example.com",
  "new_password": "newPassword123",
  "send_email": true
}
```
- **Response**:
```json
{
  "message": "Password reset successfully",
  "admin_email": "admin@example.com",
  "email_sent": true
}
```

### Change Own Password
- **Endpoint**: `PUT /api/auth/change-password`
- **Authentication**: Required (Any user)
- **Description**: Change your own password (requires old password)
- **Request Body**:
```json
{
  "old_password": "currentPassword",
  "new_password": "newPassword123"
}
```
- **Response**:
```json
{
  "message": "Password changed successfully",
  "user": {
    "id": "user_id",
    "full_name": "User Name",
    "email": "user@example.com",
    "table_used": "admins"
  }
}
```

## 2. Notification Endpoints

### Client Notification Endpoints

#### Get Client Notifications
- **Endpoint**: `GET /api/notifications`
- **Authentication**: Required (Client)
- **Query Parameters**:
  - `read`: boolean (filter by read status)
  - `category`: string (filter by category)
  - `priority`: string (filter by priority)
  - `type`: string (filter by type: info, success, warning, error, system)
  - `limit`: number (default: 20)
  - `offset`: number (default: 0)
- **Response**:
```json
{
  "notifications": [
    {
      "id": "notification_id",
      "user_id": "user_id",
      "type": "info",
      "title": "Notification Title",
      "message": "Notification message",
      "is_read": false,
      "metadata": {},
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "stats": {
    "total_unread": 5,
    "by_type": {
      "info": 2,
      "success": 1
    }
  },
  "pagination": {
    "offset": 0,
    "limit": 20,
    "total": 10
  }
}
```

#### Mark Notification as Read
- **Endpoint**: `PATCH /api/notifications/:id/read`
- **Authentication**: Required (Client)
- **Response**:
```json
{
  "message": "Notification marked as read",
  "notification": { /* notification object */ }
}
```

#### Mark All Notifications as Read
- **Endpoint**: `PATCH /api/notifications/read-all`
- **Authentication**: Required (Client)
- **Response**:
```json
{
  "message": "All notifications marked as read"
}
```

#### Delete Notification
- **Endpoint**: `DELETE /api/notifications/:id`
- **Authentication**: Required (Client)
- **Response**:
```json
{
  "message": "Notification deleted successfully"
}
```

#### Get Unread Count
- **Endpoint**: `GET /api/notifications/unread-count`
- **Authentication**: Required (Client)
- **Response**:
```json
{
  "unread_count": 5
}
```

#### Get Recent Notifications
- **Endpoint**: `GET /api/notifications/recent`
- **Authentication**: Required (Client)
- **Query Parameters**:
  - `since`: ISO timestamp (get notifications since this time)
- **Response**:
```json
{
  "notifications": [ /* recent notifications */ ],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Admin Notification Endpoints

#### Create Test Notification (Admin Only)
- **Endpoint**: `POST /api/notifications/test`
- **Authentication**: Required (Admin)
- **Request Body**:
```json
{
  "userId": "client_user_id",
  "type": "info",
  "title": "Test Notification",
  "message": "This is a test notification",
  "category": "system",
  "priority": "low"
}
```
- **Response**:
```json
{
  "message": "Test notification created successfully",
  "notification": { /* notification object */ },
  "allowed_types": ["info", "success", "warning", "error", "system"]
}
```

#### Get Notification Statistics (Admin Only)
- **Endpoint**: `GET /api/notifications/admin/stats`
- **Authentication**: Required (Admin)
- **Response**:
```json
{
  "total": 100,
  "unread": 25,
  "by_type": {
    "info": 40,
    "success": 30,
    "warning": 20,
    "error": 10
  },
  "by_user_type": {
    "client": 90,
    "admin": 10
  },
  "recent_activity": {
    "2024-01-01": 5,
    "2024-01-02": 8
  }
}
```

## 3. Contact Update Endpoints

### Update Contact Status
- **Endpoint**: `PATCH /api/contact/:id`
- **Authentication**: Required (Admin)
- **Request Body**:
```json
{
  "status": "handled",
  "admin_notes": "Contact resolved via phone call"
}
```
- **Response**:
```json
{
  "message": "Contact updated successfully",
  "contact": {
    "id": "contact_id",
    "status": "handled",
    "admin_notes": "Contact resolved via phone call",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Get All Contacts (Admin)
- **Endpoint**: `GET /api/contact`
- **Authentication**: Required (Admin)
- **Query Parameters**:
  - `status`: string (filter by status: pending, in_progress, handled)
  - `page`: number (pagination)
  - `limit`: number (items per page)
- **Response**:
```json
{
  "contacts": [
    {
      "id": "contact_id",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "message": "Contact message",
      "status": "pending",
      "admin_notes": null,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 50,
    "per_page": 10
  }
}
```

## 4. 20 Questions Endpoints

### Client 20Q Endpoints

#### Get Onboarding Status
- **Endpoint**: `GET /api/client/onboarding-20q/status`
- **Authentication**: Required (Client)
- **Response**:
```json
{
  "user": {
    "profile_unlocked": false,
    "payment_confirmed": true,
    "onboarding_completed": false
  },
  "onboarding": {
    "execution_status": "pending_approval",
    "approved_by": null,
    "approved_at": null,
    "completed_at": "2024-01-01T00:00:00Z"
  },
  "can_access_tracker": false,
  "show_discovery_mode": true,
  "next_steps": "Your onboarding is under review. You will be notified when approved."
}
```

#### Submit 20Q Questionnaire
- **Endpoint**: `POST /api/client/onboarding-20q/questionnaire`
- **Authentication**: Required (Client)
- **Request Body**:
```json
{
  "target_job_titles": ["Software Engineer", "Full Stack Developer"],
  "target_industries": ["Technology", "Healthcare"],
  "target_locations": ["New York", "Remote"],
  "target_salary_range": "$80,000 - $120,000",
  "years_of_experience": 5,
  "key_technical_skills": ["JavaScript", "React", "Node.js"],
  "job_search_timeline": "3-6 months",
  "career_goals_short_term": "Secure a senior developer role",
  "biggest_career_challenges": ["Interview preparation"],
  "support_areas_needed": ["Resume optimization", "Interview coaching"]
}
```
- **Response**:
```json
{
  "message": "Onboarding questionnaire submitted successfully",
  "onboarding": {
    "id": "onboarding_id",
    "execution_status": "pending_approval",
    "completed_at": "2024-01-01T00:00:00Z"
  },
  "next_steps": "Your onboarding is under review. You will be notified when your profile is approved.",
  "requires_admin_approval": true,
  "can_access_tracker": false
}
```

#### Get Existing Questionnaire Data
- **Endpoint**: `GET /api/client/onboarding-20q/questionnaire`
- **Authentication**: Required (Client)
- **Response**:
```json
{
  "onboarding": {
    "id": "onboarding_id",
    "user_id": "user_id",
    "target_job_titles": ["Software Engineer"],
    "target_industries": ["Technology"],
    "execution_status": "pending_approval",
    "completed_at": "2024-01-01T00:00:00Z"
  }
}
```

### Admin 20Q Dashboard Endpoints

#### Get All Clients with 20Q Status
- **Endpoint**: `GET /api/admin/20q-dashboard`
- **Authentication**: Required (Admin)
- **Query Parameters**:
  - `page`: number (default: 1)
  - `limit`: number (default: 20)
  - `status_filter`: string (filter by status)
  - `search`: string (search by name or email)
- **Response**:
```json
{
  "clients": [
    {
      "id": "client_id",
      "full_name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-01T00:00:00Z",
      "payment_confirmed": true,
      "profile_unlocked": false,
      "twenty_questions": {
        "status": "pending_approval",
        "display_status": "Pending Review",
        "description": "Assessment completed, awaiting admin approval",
        "color": "yellow",
        "progress": 75,
        "can_approve": true,
        "requires_action": true,
        "completed_at": "2024-01-01T00:00:00Z"
      },
      "days_since_registration": 5
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_count": 50,
    "per_page": 20
  },
  "status_summary": {
    "not_started": 10,
    "pending_approval": 15,
    "active": 20,
    "paused": 3,
    "completed": 2,
    "total": 50
  },
  "filters": {
    "status_filter": "all",
    "search": ""
  }
}
```

#### Get Detailed Client 20Q Info
- **Endpoint**: `GET /api/admin/20q-dashboard/client/:clientId`
- **Authentication**: Required (Admin)
- **Response**:
```json
{
  "client": {
    "id": "client_id",
    "full_name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T00:00:00Z",
    "payment_confirmed": true,
    "profile_unlocked": false,
    "has_resume": true,
    "has_linkedin": true
  },
  "twenty_questions": {
    "status": "pending_approval",
    "target_roles": ["Software Engineer"],
    "target_industries": ["Technology"],
    "experience_years": 5,
    "job_search_timeline": "3-6 months",
    "key_skills": ["JavaScript", "React"],
    "career_goals_short": "Secure a senior developer role",
    "salary_range": "$80,000 - $120,000"
  },
  "strategy_calls": [],
  "applications": {
    "total": 0,
    "by_status": {}
  },
  "timeline": [
    {
      "date": "2024-01-01T00:00:00Z",
      "event": "Client Registration",
      "description": "Client registered on the platform",
      "type": "registration",
      "status": "completed"
    }
  ]
}
```

#### Update 20Q Status
- **Endpoint**: `PATCH /api/admin/20q-dashboard/client/:clientId/status`
- **Authentication**: Required (Admin)
- **Request Body**:
```json
{
  "execution_status": "active",
  "admin_notes": "Profile approved after review"
}
```
- **Response**:
```json
{
  "message": "Status updated successfully",
  "twenty_questions": {
    "status": "active",
    "display_status": "Active & Approved",
    "approved_at": "2024-01-01T00:00:00Z",
    "admin_notes": "Profile approved after review"
  }
}
```

## Base URLs

- **Production**: `https://apply-bureau-backend.vercel.app`
- **Local Development**: `http://localhost:3001`

## Authentication

All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Admin Credentials (Production)
- **Email**: `applybureau@gmail.com`
- **Password**: `Admin123@#`