# Master Dashboard Endpoints Documentation

## Overview
This document provides comprehensive documentation for all dashboard endpoints in the Apply Bureau backend system. The API includes both client and admin dashboard endpoints with real-time capabilities, statistics, notifications, messaging, and activity tracking.

## Base URL
```
https://apply-bureau-backend.vercel.app
```

## Authentication
All dashboard endpoints require authentication using Bearer tokens obtained from the login endpoint.

### Authentication Header
```http
Authorization: Bearer <token>
```

---

## 1. CLIENT DASHBOARD ENDPOINTS

### 1.1 Main Client Dashboard
#### GET /api/dashboard
**Description:** Returns comprehensive client dashboard information including applications, consultations, and notifications.

**Authentication:** Required (Client or Admin)

**Response Format:**
```json
{
  "client": {
    "id": "client-id",
    "full_name": "John Doe",
    "email": "john@example.com",
    "onboarding_complete": true,
    "resume_url": "https://example.com/resume.pdf"
  },
  "stats": {
    "total_applications": 15,
    "pending_applications": 5,
    "interviews_scheduled": 3,
    "offers_received": 1,
    "upcoming_consultations": 2,
    "unread_notifications": 4
  },
  "recent_applications": [
    {
      "id": "app-id",
      "job_title": "Software Engineer",
      "company": "Tech Corp",
      "status": "applied",
      "date_applied": "2026-01-15T10:00:00.000Z",
      "created_at": "2026-01-15T10:00:00.000Z"
    }
  ],
  "upcoming_consultations": [
    {
      "id": "consultation-id",
      "scheduled_at": "2026-01-20T14:00:00.000Z",
      "status": "scheduled",
      "consultation_type": "career_strategy"
    }
  ],
  "unread_notifications": [
    {
      "id": "notification-id",
      "title": "New Application Update",
      "message": "Your application status has been updated",
      "type": "application_update",
      "created_at": "2026-01-17T09:00:00.000Z"
    }
  ]
}
```

### 1.2 Client Dashboard Statistics
#### GET /api/dashboard/stats
**Description:** Get detailed client statistics and analytics.

**Authentication:** Required (Client or Admin)

**Query Parameters:**
- `period` (optional): Time period - 7d, 30d, 90d (default: 30d)

**Response Format:**
```json
{
  "total_applications": 15,
  "applications_by_status": {
    "applied": 8,
    "interview": 3,
    "offer": 1,
    "rejected": 2,
    "withdrawn": 1
  },
  "recent_activity": {
    "last_7_days": 3,
    "last_30_days": 12
  },
  "success_rate": "6.7"
}
```

### 1.3 Enhanced Client Dashboard
#### GET /api/client/dashboard
**Description:** Enhanced client dashboard with onboarding status and next steps.

**Authentication:** Required (Client)

**Response Format:**
```json
{
  "client": {
    "id": "client-id",
    "full_name": "John Doe",
    "email": "john@example.com",
    "profile_unlocked": true,
    "payment_confirmed": true,
    "onboarding_completed": true
  },
  "status": {
    "overall_status": "active",
    "message": "Setup complete. Applications are being processed.",
    "progress_percentage": 100
  },
  "strategy_call": {
    "has_booked": true,
    "has_confirmed": true,
    "latest_status": "confirmed",
    "confirmed_time": "2026-01-18T15:00:00.000Z",
    "meeting_link": "https://meet.google.com/abc-defg-hij"
  },
  "onboarding": {
    "completed": true,
    "approved": true,
    "execution_status": "active",
    "completed_at": "2026-01-16T12:00:00.000Z"
  },
  "files": {
    "resume_uploaded": true,
    "linkedin_added": true,
    "portfolio_added": false,
    "resume_url": "https://example.com/resume.pdf",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "portfolio_urls": []
  },
  "applications": {
    "total_count": 15,
    "active_count": 8,
    "can_view": true
  },
  "next_steps": [
    {
      "action": "view_applications",
      "title": "Application Tracker",
      "description": "15 applications submitted, 8 active",
      "priority": 4,
      "required": false,
      "active": true
    }
  ]
}
```

### 1.4 Client Dashboard Status
#### GET /api/client/dashboard/status
**Description:** Get simplified client status for status bar display.

**Authentication:** Required (Client)

**Response Format:**
```json
{
  "status": "active",
  "message": "Setup complete. Applications are being processed.",
  "can_book_strategy_call": false,
  "can_complete_onboarding": false,
  "can_view_applications": true
}
```

---

## 2. ADMIN DASHBOARD ENDPOINTS

### 2.1 Main Admin Dashboard
#### GET /api/admin-dashboard
**Description:** Comprehensive admin dashboard with system-wide statistics and recent activity.

**Authentication:** Required (Admin)

**Response Format:**
```json
{
  "admin": {
    "id": "admin-id",
    "full_name": "Admin User",
    "email": "admin@applybureau.com",
    "role": "admin",
    "profile_picture_url": null,
    "permissions": {
      "can_create_admins": true,
      "can_delete_admins": true,
      "can_manage_clients": true,
      "can_schedule_consultations": true,
      "can_view_reports": true,
      "can_manage_system": true
    },
    "last_login_at": "2026-01-17T08:00:00.000Z"
  },
  "dashboard_type": "admin",
  "stats": {
    "clients": {
      "total_clients": 45,
      "active_clients": 32,
      "new_clients_this_month": 8,
      "onboarded_clients": 38,
      "pending_onboarding": 7
    },
    "consultations": {
      "total_consultations": 67,
      "scheduled_consultations": 12,
      "completed_consultations": 48,
      "upcoming_consultations": 5,
      "consultations_this_week": 3,
      "consultations_this_month": 15
    },
    "applications": {
      "total_applications": 234,
      "applications_by_status": {
        "applied": 89,
        "interview": 23,
        "offer": 15,
        "rejected": 78,
        "withdrawn": 29
      },
      "applications_this_week": 18,
      "applications_this_month": 67,
      "success_rate": "6.4"
    },
    "system": {
      "total_users": 46,
      "total_data_points": 346,
      "system_health": "excellent",
      "last_backup": "2026-01-17T10:00:00.000Z"
    }
  },
  "recent_activity": {
    "new_clients": [
      {
        "id": "client-id",
        "full_name": "Jane Smith",
        "email": "jane@example.com",
        "created_at": "2026-01-16T14:30:00.000Z"
      }
    ],
    "upcoming_consultations": [
      {
        "id": "consultation-id",
        "scheduled_at": "2026-01-18T15:00:00.000Z",
        "client_name": "John Doe",
        "consultation_type": "career_strategy"
      }
    ],
    "recent_applications": [],
    "notifications": []
  },
  "quick_actions": [
    {
      "action": "invite_client",
      "label": "Invite New Client",
      "icon": "user-plus"
    },
    {
      "action": "schedule_consultation",
      "label": "Schedule Consultation",
      "icon": "calendar-plus"
    },
    {
      "action": "view_reports",
      "label": "View Reports",
      "icon": "chart-bar"
    },
    {
      "action": "manage_admins",
      "label": "Manage Admins",
      "icon": "users-cog"
    },
    {
      "action": "system_settings",
      "label": "System Settings",
      "icon": "cog"
    }
  ]
}
```

### 2.2 Admin Dashboard Clients
#### GET /api/admin-dashboard/clients
**Description:** Get all clients for admin management.

**Authentication:** Required (Admin)

**Query Parameters:**
- `status` (optional): Filter by status - active, pending
- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Offset for pagination (default: 0)
- `search` (optional): Search in name and email

**Response Format:**
```json
{
  "clients": [
    {
      "id": "client-id",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "onboarding_complete": true,
      "created_at": "2026-01-10T10:00:00.000Z",
      "last_login_at": "2026-01-16T14:30:00.000Z",
      "profile_picture_url": null,
      "current_job_title": "Software Engineer",
      "current_company": "Tech Corp"
    }
  ],
  "total": 45,
  "offset": 0,
  "limit": 50
}
```

### 2.3 Admin Dashboard Analytics
#### GET /api/admin-dashboard/analytics
**Description:** Get detailed analytics and trends for admin dashboard.

**Authentication:** Required (Admin)

**Query Parameters:**
- `period` (optional): Time period - 7d, 30d, 90d (default: 30d)

**Response Format:**
```json
{
  "period": "30d",
  "client_growth": [
    {
      "date": "2026-01-01",
      "count": 2
    },
    {
      "date": "2026-01-02",
      "count": 1
    }
  ],
  "consultation_trends": [
    {
      "date": "2026-01-01",
      "count": 3
    }
  ],
  "application_trends": [
    {
      "date": "2026-01-01",
      "count": 8
    }
  ],
  "success_metrics": {
    "onboarding_rate": "84.4",
    "consultation_completion_rate": "71.6",
    "application_success_rate": "6.4"
  }
}
```

---

## 3. ENHANCED DASHBOARD ENDPOINTS

### 3.1 Enhanced Admin Dashboard Stats
#### GET /api/enhanced-dashboard/admin/stats
**Description:** Real-time admin dashboard statistics with live data.

**Authentication:** Required (Admin)

**Response Format:**
```json
{
  "stats": {
    "clients": {
      "total": 45,
      "active": 32,
      "new_this_week": 5,
      "online": 8
    },
    "consultations": {
      "total": 67,
      "scheduled": 12,
      "completed": 48,
      "upcoming": 5,
      "today": 2
    },
    "applications": {
      "total": 234,
      "this_month": 67,
      "by_status": {
        "applied": 89,
        "interview": 23,
        "offer": 15,
        "rejected": 78,
        "withdrawn": 29
      }
    },
    "messages": {
      "total": 156,
      "unread_from_clients": 12,
      "sent_today": 8
    },
    "system": {
      "online_users": 15,
      "server_uptime": 86400,
      "last_updated": "2026-01-17T10:30:00.000Z"
    }
  },
  "upcoming_consultations": [
    {
      "id": "consultation-id",
      "scheduled_at": "2026-01-18T15:00:00.000Z",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "type": "career_strategy",
      "is_prospect": false
    }
  ],
  "recent_activities": [],
  "connected_users": [
    {
      "id": "user-id",
      "full_name": "John Doe",
      "role": "client",
      "connected_at": "2026-01-17T10:00:00.000Z"
    }
  ]
}
```

### 3.2 Enhanced Client Dashboard Stats
#### GET /api/enhanced-dashboard/client/stats
**Description:** Real-time client dashboard statistics.

**Authentication:** Required (Client)

**Response Format:**
```json
{
  "stats": {
    "consultations": {
      "total": 3,
      "upcoming": 1,
      "completed": 2,
      "next_consultation": {
        "id": "consultation-id",
        "scheduled_at": "2026-01-20T14:00:00.000Z",
        "status": "scheduled",
        "consultation_type": "career_strategy"
      }
    },
    "applications": {
      "total": 15,
      "active": 8,
      "interviews": 3,
      "by_status": {
        "applied": 8,
        "interview": 3,
        "offer": 1,
        "rejected": 2,
        "withdrawn": 1
      }
    },
    "messages": {
      "total": 24,
      "unread": 3,
      "recent": []
    },
    "notifications": {
      "total": 18,
      "unread": 4,
      "recent": []
    }
  },
  "upcoming_consultations": [],
  "recent_applications": [],
  "recent_messages": [],
  "unread_notifications": []
}
```

---

## 4. NOTIFICATIONS ENDPOINTS

### 4.1 Get Notifications
#### GET /api/enhanced-dashboard/notifications
**Description:** Get user notifications with pagination.

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 20)
- `unread_only` (optional): Filter unread only - true/false

**Response Format:**
```json
{
  "notifications": [
    {
      "id": "notification-id",
      "user_id": "user-id",
      "user_type": "client",
      "title": "Application Update",
      "message": "Your application status has been updated",
      "type": "application_update",
      "priority": "medium",
      "is_read": false,
      "created_at": "2026-01-17T09:00:00.000Z",
      "read_at": null,
      "action_url": "/dashboard/applications",
      "action_text": "View Application"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "has_more": false
  }
}
```

### 4.2 Mark Notification as Read
#### POST /api/enhanced-dashboard/notifications/:id/read
**Description:** Mark a specific notification as read.

**Authentication:** Required

**Response Format:**
```json
{
  "success": true
}
```

---

## 5. MESSAGING ENDPOINTS

### 5.1 Get Messages
#### GET /api/enhanced-dashboard/messages
**Description:** Get messages for real-time chat functionality.

**Authentication:** Required

**Query Parameters:**
- `conversation_with` (optional): Get conversation with specific user ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 50)

**Response Format:**
```json
{
  "messages": [
    {
      "id": "message-id",
      "message_text": "Hello, how can I help you?",
      "sender_type": "admin",
      "recipient_type": "client",
      "is_read": false,
      "created_at": "2026-01-17T10:00:00.000Z",
      "sender_id": "admin-id",
      "recipient_id": "client-id",
      "consultation_id": null,
      "application_id": null,
      "attachment_url": null,
      "attachment_name": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "has_more": false
  }
}
```

### 5.2 Send Message
#### POST /api/enhanced-dashboard/messages
**Description:** Send a new message in the real-time chat system.

**Authentication:** Required

**Request Body:**
```json
{
  "recipient_id": "user-id",
  "recipient_type": "client",
  "message_text": "Hello, how can I help you?",
  "consultation_id": null,
  "application_id": null
}
```

**Response Format:**
```json
{
  "id": "message-id",
  "sender_id": "admin-id",
  "sender_type": "admin",
  "recipient_id": "client-id",
  "recipient_type": "client",
  "message_text": "Hello, how can I help you?",
  "consultation_id": null,
  "application_id": null,
  "is_read": false,
  "created_at": "2026-01-17T10:00:00.000Z",
  "sender": {
    "full_name": "Admin User",
    "email": "admin@applybureau.com"
  },
  "recipient": {
    "full_name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

## 6. ACTIVITY AND SYSTEM ENDPOINTS

### 6.1 Get Dashboard Activities
#### GET /api/enhanced-dashboard/activities
**Description:** Get recent dashboard activities (Admin only).

**Authentication:** Required (Admin)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 50)

**Response Format:**
```json
{
  "activities": [
    {
      "id": "activity-id",
      "activity_type": "client_registered",
      "description": "New client registered: John Doe",
      "user_id": "client-id",
      "user_type": "client",
      "metadata": {
        "client_name": "John Doe",
        "client_email": "john@example.com"
      },
      "created_at": "2026-01-17T09:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "has_more": false
  }
}
```

### 6.2 Get Online Users
#### GET /api/enhanced-dashboard/online-users
**Description:** Get currently online users (Admin only).

**Authentication:** Required (Admin)

**Response Format:**
```json
{
  "online_users": [
    {
      "id": "user-id",
      "full_name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "connected_at": "2026-01-17T10:00:00.000Z",
      "socket_id": "socket-id"
    }
  ],
  "total_online": 8,
  "admins_online": 2,
  "clients_online": 6
}
```

---

## 7. CONTACTS DASHBOARD ENDPOINTS

### 7.1 Dashboard Contacts
#### GET /api/dashboard/contacts
**Description:** Get combined contacts data for dashboard display.

**Authentication:** Required (Admin)

**Response Format:**
```json
{
  "data": [
    {
      "id": "contact-id",
      "name": "John Doe",
      "email": "john@example.com",
      "type": "consultation_request",
      "status": "pending",
      "created_at": "2026-01-17T10:00:00.000Z",
      "source": "website"
    }
  ],
  "total": 12,
  "consultation_requests": 7,
  "contact_submissions": 5
}
```

---

## 8. ERROR HANDLING

### Common Error Responses

#### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

#### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

#### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to fetch dashboard data"
}
```

---

## 9. REAL-TIME FEATURES

### WebSocket Events
The dashboard supports real-time updates through WebSocket connections:

#### Client Events
- `dashboard_stats` - Real-time dashboard statistics
- `new_notification` - New notification received
- `new_message` - New message received
- `application_update` - Application status changed
- `consultation_update` - Consultation status changed

#### Admin Events
- `dashboard_update` - Dashboard data updated
- `client_activity` - Client activity detected
- `system_alert` - System alerts and notifications

---

## 10. PERFORMANCE CONSIDERATIONS

### Response Times
- **Basic Dashboard:** ~300-600ms
- **Enhanced Dashboard:** ~400-800ms
- **Statistics:** ~200-400ms
- **Real-time Updates:** ~50-100ms

### Caching
- Dashboard data cached for 5 minutes
- Statistics cached for 10 minutes
- Real-time data not cached

### Rate Limiting
- 100 requests per 15 minutes per user
- Real-time connections: 1 per user
- Message sending: 60 per minute

---

## 11. FRONTEND INTEGRATION

### React/JavaScript Example
```javascript
// Fetch admin dashboard
const fetchAdminDashboard = async () => {
  const response = await fetch('/api/admin-dashboard', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Fetch client dashboard
const fetchClientDashboard = async () => {
  const response = await fetch('/api/client/dashboard', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Send message
const sendMessage = async (recipientId, message) => {
  const response = await fetch('/api/enhanced-dashboard/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipient_id: recipientId,
      recipient_type: 'client',
      message_text: message
    })
  });
  return response.json();
};
```

### WebSocket Connection
```javascript
import io from 'socket.io-client';

const socket = io('https://apply-bureau-backend.vercel.app', {
  auth: {
    token: localStorage.getItem('token')
  }
});

socket.on('dashboard_stats', (stats) => {
  // Update dashboard with real-time stats
  updateDashboard(stats);
});

socket.on('new_notification', (notification) => {
  // Show new notification
  showNotification(notification);
});
```

---

## 12. ENDPOINT SUMMARY

### Client Dashboard Endpoints
- `GET /api/dashboard` - Main client dashboard
- `GET /api/dashboard/stats` - Client statistics
- `GET /api/client/dashboard` - Enhanced client dashboard
- `GET /api/client/dashboard/status` - Client status
- `GET /api/enhanced-dashboard/client/stats` - Real-time client stats

### Admin Dashboard Endpoints
- `GET /api/admin-dashboard` - Main admin dashboard
- `GET /api/admin-dashboard/clients` - Admin client management
- `GET /api/admin-dashboard/analytics` - Admin analytics
- `GET /api/enhanced-dashboard/admin/stats` - Real-time admin stats
- `GET /api/enhanced-dashboard/activities` - Dashboard activities
- `GET /api/enhanced-dashboard/online-users` - Online users

### Shared Endpoints
- `GET /api/enhanced-dashboard/notifications` - Get notifications
- `POST /api/enhanced-dashboard/notifications/:id/read` - Mark notification read
- `GET /api/enhanced-dashboard/messages` - Get messages
- `POST /api/enhanced-dashboard/messages` - Send message
- `GET /api/dashboard/contacts` - Dashboard contacts

---

**Status: COMPLETE ✅**  
**Last Updated:** January 17, 2026  
**Environment:** Vercel Production  
**Total Endpoints Documented:** 18