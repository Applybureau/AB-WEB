# Application Logging Dashboard Endpoints & Data Formats

## 🚀 Production Base URL
```
https://jellyfish-app-t4m35.ondigitalocean.app
```

## 🔐 Authentication
All endpoints require Bearer token authentication:
```javascript
headers: {
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

---

## 📊 Main Application Endpoints

### 1. Get Applications (Primary Dashboard Endpoint)

#### **Client Access - Get Own Applications**
```http
GET /api/applications
Authorization: Bearer <client_token>
```

**Response Format:**
```json
{
  "applications": [
    {
      "id": "uuid",
      "user_id": "client_uuid",
      "client_id": "client_uuid",
      "type": "job_application",
      "title": "Google - Senior Software Engineer",
      "description": "Application for Senior Software Engineer position at Google",
      "status": "applied",
      "priority": "high",
      "requirements": [],
      "documents": [],
      "estimated_duration": null,
      "estimated_cost": null,
      "actual_duration": null,
      "actual_cost": null,
      "admin_notes": "Application created by admin for Google - Senior Software Engineer",
      "rejection_reason": null,
      "internal_notes": null,
      "tags": [],
      "deadline": null,
      "approved_by": null,
      "assigned_to": null,
      "approved_at": null,
      "completed_at": null,
      "cancelled_at": null,
      "cancellation_reason": null,
      "created_at": "2024-01-28T10:30:00.000Z",
      "updated_at": "2024-01-28T10:30:00.000Z",
      
      // Job-specific fields
      "company": "Google",
      "job_title": "Senior Software Engineer",
      "job_url": "https://careers.google.com/jobs/123",
      "offer_salary": "$150,000 - $200,000",
      "interview_date": null,
      "offer_amount": null,
      "resume_version_used": null,
      "job_posting_link": null,
      "application_method": null,
      "interview_update_sent": false,
      "interview_notification_sent_at": null,
      "last_email_sent_at": null
    }
  ],
  "total": 15,
  "user_role": "client"
}
```

#### **Admin Access - Get All Applications**
```http
GET /api/applications?client_id=<optional>&limit=50&offset=0
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `client_id` (optional): Filter by specific client
- `limit` (default: 50): Number of applications per page
- `offset` (default: 0): Pagination offset

**Response Format:**
```json
{
  "applications": [
    {
      "id": "uuid",
      "user_id": "client_uuid",
      "client_id": "client_uuid",
      "type": "job_application",
      "title": "Microsoft - Product Manager",
      "description": "Application for Product Manager position at Microsoft",
      "status": "interview_requested",
      "company": "Microsoft",
      "job_title": "Product Manager",
      "admin_notes": "Client has strong PM background",
      "created_at": "2024-01-28T09:15:00.000Z",
      "updated_at": "2024-01-28T14:22:00.000Z"
    }
  ],
  "total": 150,
  "offset": 0,
  "limit": 50,
  "user_role": "admin"
}
```

---

### 2. Application Statistics (Dashboard Metrics)

#### **Client Statistics**
```http
GET /api/applications/stats
Authorization: Bearer <client_token>
```

**Response Format:**
```json
{
  "tier": "Tier 1",
  "weekly_target": 17,
  "total_applications": 45,
  "applications_this_week": 12,
  "weekly_progress": 71,
  "status_breakdown": {
    "applied": 25,
    "interviewing": 8,
    "offer": 3,
    "rejected": 7,
    "withdrawn": 2
  },
  "response_rate": 24,
  "offer_rate": 7
}
```

#### **Admin Statistics (Overall)**
```http
GET /api/applications/stats
Authorization: Bearer <admin_token>
```

**Response Format:**
```json
{
  "user_type": "admin",
  "total_applications": 1250,
  "total_clients": 85,
  "status_breakdown": {
    "applied": 650,
    "interviewing": 200,
    "offer": 150,
    "rejected": 200,
    "withdrawn": 50
  },
  "overall_response_rate": 28,
  "overall_offer_rate": 12
}
```

---

### 3. Weekly Applications (Mobile Dashboard)

```http
GET /api/applications/weekly?weeks_back=4
Authorization: Bearer <client_token>
```

**Query Parameters:**
- `weeks_back` (default: 4): Number of weeks to retrieve

**Response Format:**
```json
{
  "weekly_applications": [
    {
      "week_number": 202404,
      "applications": [
        {
          "id": "uuid",
          "company": "Apple",
          "job_title": "iOS Developer",
          "status": "applied",
          "date_applied": "2024-01-22T00:00:00.000Z",
          "created_at": "2024-01-22T10:30:00.000Z"
        },
        {
          "id": "uuid",
          "company": "Netflix",
          "job_title": "Data Scientist",
          "status": "interviewing",
          "date_applied": "2024-01-24T00:00:00.000Z",
          "created_at": "2024-01-24T15:45:00.000Z"
        }
      ],
      "total_count": 8,
      "status_counts": {
        "applied": 5,
        "interviewing": 2,
        "rejected": 1
      }
    },
    {
      "week_number": 202403,
      "applications": [...],
      "total_count": 12,
      "status_counts": {
        "applied": 7,
        "interviewing": 3,
        "offer": 1,
        "rejected": 1
      }
    }
  ],
  "total_weeks": 4,
  "mobile_optimized": true
}
```

---

### 4. Client Dashboard Integration

```http
GET /api/client/dashboard
Authorization: Bearer <client_token>
```

**Applications Section in Response:**
```json
{
  "client": {...},
  "status": {...},
  "applications": {
    "total_count": 45,
    "active_count": 12,
    "can_view": true
  },
  "next_steps": [
    {
      "action": "view_applications",
      "title": "Application Tracker",
      "description": "45 applications submitted, 12 active",
      "priority": 4,
      "required": false,
      "active": true
    }
  ]
}
```

---

## 🔧 Application Management Endpoints

### 5. Create Application (Admin Only)

```http
POST /api/applications
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "client_id": "client_uuid",
  "company_name": "Tesla",
  "job_title": "Software Engineer",
  "job_description": "Full-stack development for autonomous driving systems",
  "job_link": "https://tesla.com/careers/123",
  "salary_range": "$130,000 - $160,000",
  "location": "Palo Alto, CA",
  "job_type": "full-time",
  "application_method": "online",
  "application_strategy": "direct_application",
  "admin_notes": "Strong candidate for this role",
  "notes": "Client very interested in autonomous vehicles"
}
```

**Response:**
```json
{
  "message": "Application created successfully",
  "application": {
    "id": "new_uuid",
    "user_id": "client_uuid",
    "client_id": "client_uuid",
    "type": "job_application",
    "title": "Tesla - Software Engineer",
    "description": "Full-stack development for autonomous driving systems",
    "status": "applied",
    "company": "Tesla",
    "job_title": "Software Engineer",
    "job_url": "https://tesla.com/careers/123",
    "offer_salary": "$130,000 - $160,000",
    "admin_notes": "Strong candidate for this role",
    "created_at": "2024-01-28T16:45:00.000Z"
  }
}
```

---

### 6. Update Application

```http
PATCH /api/applications/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "interview_requested",
  "interview_date": "2024-02-05T14:00:00.000Z",
  "offer_amount": "$145,000",
  "notes": "Interview scheduled for next week",
  "admin_notes": "Client prepared well for technical screening",
  "resume_version_used": "v3.2",
  "job_posting_link": "https://company.com/jobs/456",
  "application_method": "referral"
}
```

**Response:**
```json
{
  "message": "Application updated successfully",
  "application": {
    "id": "uuid",
    "status": "interview_requested",
    "interview_date": "2024-02-05T14:00:00.000Z",
    "offer_amount": "$145,000",
    "interview_update_sent": true,
    "interview_notification_sent_at": "2024-01-28T16:50:00.000Z",
    "updated_at": "2024-01-28T16:50:00.000Z"
  },
  "interview_notification_sent": true,
  "status_changed": true,
  "previous_status": "applied"
}
```

---

### 7. Send Application Update Email (Admin Only)

```http
POST /api/applications/:id/send-update
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Great news! The hiring manager has reviewed your application and wants to move forward with an interview.",
  "next_steps": "Please prepare for a technical interview. We'll send you preparation materials shortly.",
  "consultant_email": "applybureau@gmail.com",
  "custom_subject": "Interview Request - Tesla Software Engineer Position"
}
```

**Response:**
```json
{
  "message": "Application update email sent successfully",
  "email_id": "resend_email_id",
  "sent_to": "client@example.com",
  "reply_to": "applybureau@gmail.com",
  "application_id": "uuid"
}
```

---

## 📱 Profile & Discovery Mode

### 8. Discovery Mode Status

```http
GET /api/applications/discovery-mode
Authorization: Bearer <client_token>
```

**Response:**
```json
{
  "discovery_mode": {
    "active": false
  },
  "message": "Your Application Tracker is active and ready to use!"
}
```

**If Profile Locked:**
```json
{
  "discovery_mode": {
    "active": true,
    "requirements": [
      "Complete payment verification",
      "Submit 20-question assessment",
      "Upload resume"
    ],
    "completion_percentage": 66
  },
  "message": "Your Application Tracker is currently locked. Complete the requirements below to unlock it."
}
```

---

## 📊 Status Values & Data Types

### Application Status Values
- `applied` - Application submitted
- `in_review` - Under review by company
- `interview_requested` - Interview has been requested
- `interview_completed` - Interview process completed
- `interviewing` - Currently in interview process
- `offer` - Job offer received
- `rejected` - Application rejected
- `withdrawn` - Application withdrawn

### Priority Values
- `low` - Low priority application
- `medium` - Medium priority application
- `high` - High priority application

### Application Types
- `job_application` - Standard job application
- `consultation` - Legacy consultation type

---

## 🔗 Frontend Integration Examples

### React/Next.js Integration

```javascript
// Get applications for dashboard
const fetchApplications = async () => {
  const response = await fetch(`${API_BASE_URL}/api/applications`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return data.applications;
};

// Get application statistics
const fetchStats = async () => {
  const response = await fetch(`${API_BASE_URL}/api/applications/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};

// Update application status
const updateApplication = async (applicationId, updates) => {
  const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  return await response.json();
};
```

### Dashboard Data Structure

```javascript
// Complete dashboard data structure
const dashboardData = {
  applications: {
    list: [], // Array of application objects
    stats: {
      total: 45,
      thisWeek: 12,
      weeklyTarget: 17,
      progress: 71,
      statusBreakdown: {
        applied: 25,
        interviewing: 8,
        offer: 3,
        rejected: 7
      }
    },
    weekly: [], // Weekly grouped applications
    canView: true
  }
};
```

---

## ⚠️ Error Handling

### Common Error Responses

```json
// 401 Unauthorized
{
  "error": "Invalid or missing authentication token"
}

// 403 Forbidden  
{
  "error": "Access denied"
}

// 404 Not Found
{
  "error": "Application not found"
}

// 400 Bad Request
{
  "error": "Missing required fields",
  "required": ["client_id", "company_name", "job_title"],
  "received": {...}
}

// 500 Internal Server Error
{
  "error": "Failed to fetch applications",
  "details": "Database connection error"
}
```

---

## 🎯 Production Ready

All endpoints are **production-ready** and deployed at:
**https://jellyfish-app-t4m35.ondigitalocean.app**

✅ CORS enabled for all origins  
✅ Authentication working  
✅ Database connected  
✅ Error handling implemented  
✅ Email notifications functional