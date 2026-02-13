# Application Logging Endpoints Documentation

## Base URL
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

## ✅ WORKING ENDPOINTS

---

## 1. Get Applications ✅

### Client Access (Get Own Applications)
- **Endpoint**: `GET /api/applications`
- **Authentication**: Required (Client)
- **Status**: ✅ **WORKING**
- **Description**: Get all applications for the authenticated client
- **Query Parameters**:
  - `limit`: number (default: 50) - Maximum number of applications to return
  - `offset`: number (default: 0) - Number of applications to skip for pagination
- **Response**:
```json
{
  "applications": [
    {
      "id": "app_id",
      "user_id": "user_id",
      "type": "consultation",
      "title": "Company Name - Job Title",
      "description": "Application description",
      "status": "pending",
      "priority": "medium",
      "requirements": [],
      "documents": [],
      "estimated_duration": null,
      "estimated_cost": null,
      "actual_duration": null,
      "actual_cost": null,
      "admin_notes": "Admin notes",
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
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 10,
  "user_role": "client"
}
```

### Admin Access (Get All Applications)
- **Endpoint**: `GET /api/applications`
- **Authentication**: Required (Admin)
- **Status**: ✅ **WORKING**
- **Description**: Get all applications or filter by client
- **Query Parameters**:
  - `client_id`: string (optional) - Filter applications by specific client
  - `limit`: number (default: 50) - Maximum number of applications to return
  - `offset`: number (default: 0) - Number of applications to skip for pagination
- **Response**:
```json
{
  "applications": [
    {
      "id": "app_id",
      "user_id": "user_id",
      "type": "consultation",
      "title": "Company Name - Job Title",
      "description": "Application description",
      "status": "pending",
      "admin_notes": "Admin notes",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "offset": 0,
  "limit": 50,
  "user_role": "admin"
}
```

---

## 2. Create Application (Admin Only) ✅

- **Endpoint**: `POST /api/applications`
- **Authentication**: Required (Admin)
- **Status**: ✅ **WORKING**
- **Description**: Create a new application for a client
- **Request Body**:
```json
{
  "client_id": "user_id",
  "company_name": "Tech Company Inc",
  "job_title": "Senior Software Engineer",
  "job_description": "Full-stack development role",
  "job_link": "https://company.com/jobs/123",
  "salary_range": "$100,000 - $130,000",
  "location": "New York, NY",
  "job_type": "full-time",
  "application_method": "online",
  "application_strategy": "direct_application",
  "admin_notes": "Applied with tailored resume",
  "notes": "Client notes"
}
```
- **Response**:
```json
{
  "message": "Application created successfully",
  "application": {
    "id": "app_id",
    "user_id": "user_id",
    "client_id": "user_id",
    "type": "consultation",
    "title": "Tech Company Inc - Senior Software Engineer",
    "description": "Full-stack development role",
    "status": "pending",
    "admin_notes": "Applied with tailored resume",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## 3. Update Application ✅

- **Endpoint**: `PATCH /api/applications/:id`
- **Authentication**: Required (Admin or Client who owns the application)
- **Status**: ✅ **WORKING**
- **Description**: Update application status and details
- **Request Body**:
```json
{
  "status": "interview_requested",
  "interview_date": "2024-01-15T14:00:00Z",
  "offer_amount": "$120,000",
  "notes": "Interview went well",
  "admin_notes": "Client performed excellently",
  "resume_version_used": "v2.1",
  "job_posting_link": "https://company.com/jobs/123",
  "application_method": "referral"
}
```
- **Response**:
```json
{
  "message": "Application updated successfully",
  "application": {
    "id": "app_id",
    "status": "interview_requested",
    "interview_date": "2024-01-15T14:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "interview_notification_sent": true,
  "status_changed": true,
  "previous_status": "pending"
}
```

---

## ⚠️ ENDPOINTS WITH ISSUES

## 4. Get Application Statistics ⚠️

### Client Statistics
- **Endpoint**: `GET /api/applications/stats`
- **Authentication**: Required (Client with unlocked profile)
- **Status**: ⚠️ **HAS ISSUES** (Database schema mismatch)
- **Description**: Get application statistics for the authenticated client
- **Issue**: Database schema inconsistencies causing 500 errors

- **Endpoint**: `GET /api/applications/weekly`
- **Authentication**: Required (Client with unlocked profile)
- **Description**: Get applications grouped by week for mobile display
- **Query Parameters**:
  - `weeks_back`: number (default: 4) - Number of weeks to retrieve
- **Response**:
```json
{
  "weekly_applications": [
    {
      "week_number": 2024001,
      "applications": [
        {
          "id": "app_id",
          "company": "Tech Corp",
          "role": "Developer",
          "status": "applied",
          "date_applied": "2024-01-01T00:00:00Z"
        }
      ],
      "total_count": 5,
      "status_counts": {
        "applied": 3,
        "interviewing": 1,
        "rejected": 1
      }
    }
  ],
  "total_weeks": 4,
  "mobile_optimized": true
}
```

---

## 6. Get Discovery Mode Status

- **Endpoint**: `GET /api/applications/discovery-mode`
- **Authentication**: Required (Client)
- **Description**: Get discovery mode status for clients with locked profiles
- **Response**:
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

## 7. Send Application Update Email (Admin Only)

- **Endpoint**: `POST /api/applications/:id/send-update`
- **Authentication**: Required (Admin)
- **Description**: Send an application update email to the client
- **Request Body**:
```json
{
  "message": "Your application is progressing well. The hiring manager has reviewed your resume.",
  "next_steps": "We expect to hear back about next steps within 1-2 weeks.",
  "consultant_email": "consultant@applybureau.com",
  "custom_subject": "Update on Your Tech Corp Application"
}
```
- **Response**:
```json
{
  "message": "Application update email sent successfully",
  "email_id": "email_123",
  "sent_to": "client@example.com",
  "reply_to": "consultant@applybureau.com",
  "application_id": "app_id"
}
```

---

## Status Values

Applications can have the following status values:
- `pending` - Application submitted, awaiting review
- `applied` - Application confirmed submitted
- `interviewing` - Interview process started
- `interview_requested` - Interview has been requested
- `offer` - Job offer received
- `rejected` - Application rejected
- `withdrawn` - Application withdrawn by client

---

## Error Responses

All endpoints may return these error responses:

### 401 Unauthorized
```json
{
  "error": "Invalid or missing authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Admin role required."
}
```

### 404 Not Found
```json
{
  "error": "Application not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch applications",
  "details": "Database connection error"
}
```

---

## Notes

1. **Profile Unlocking**: Clients must have their profile unlocked to access most application endpoints. Use the discovery mode endpoint to check requirements.

2. **Email Notifications**: When applications are updated to `interview_requested` status, automatic email notifications are sent to clients.

3. **Statistics Calculation**: Statistics are calculated in real-time based on current application data.

4. **Mobile Optimization**: The weekly endpoint is specifically designed for mobile applications with grouped data.

5. **Admin vs Client Access**: Admins can access all applications and create new ones, while clients can only view and update their own applications.