# Apply Bureau API Documentation

## Base URL
```
Production: https://your-backend-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format

### Success Response
```json
{
  "message": "Success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": ["Validation error details"]
}
```

## Endpoints

### Authentication

#### POST /auth/invite
**Description**: Admin sends invitation to new client  
**Access**: Admin only  
**Body**:
```json
{
  "email": "client@example.com",
  "full_name": "John Doe"
}
```
**Response**:
```json
{
  "message": "Invitation sent successfully",
  "client_id": "uuid"
}
```

#### POST /auth/complete-registration
**Description**: Client completes registration with invitation token  
**Access**: Public  
**Body**:
```json
{
  "token": "jwt_registration_token",
  "password": "newpassword123",
  "full_name": "John Doe" // optional
}
```
**Response**:
```json
{
  "message": "Registration completed successfully",
  "token": "jwt_auth_token",
  "user": {
    "id": "uuid",
    "email": "client@example.com",
    "full_name": "John Doe",
    "role": "client"
  }
}
```

#### POST /auth/login
**Description**: Client login  
**Access**: Public  
**Body**:
```json
{
  "email": "client@example.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "message": "Login successful",
  "token": "jwt_auth_token",
  "user": {
    "id": "uuid",
    "email": "client@example.com",
    "full_name": "John Doe",
    "role": "client",
    "onboarding_complete": true
  }
}
```

#### GET /auth/me
**Description**: Get current user information  
**Access**: Authenticated  
**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "client@example.com",
    "full_name": "John Doe",
    "role": "client",
    "onboarding_complete": true,
    "resume_url": "https://..."
  }
}
```

### Dashboard

#### GET /dashboard
**Description**: Get client dashboard data  
**Access**: Authenticated  
**Response**:
```json
{
  "client": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "client@example.com",
    "onboarding_complete": true,
    "resume_url": "https://..."
  },
  "stats": {
    "total_applications": 15,
    "pending_applications": 8,
    "interviews_scheduled": 3,
    "offers_received": 1,
    "upcoming_consultations": 2,
    "unread_notifications": 5
  },
  "recent_applications": [...],
  "upcoming_consultations": [...],
  "unread_notifications": [...]
}
```

#### GET /dashboard/stats
**Description**: Get detailed statistics  
**Access**: Authenticated  
**Response**:
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
    "last_30_days": 10
  },
  "success_rate": "6.7"
}
```

### Consultations

#### GET /consultations
**Description**: List client consultations  
**Access**: Authenticated  
**Query Parameters**:
- `status` (optional): Filter by status
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "consultations": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "scheduled_at": "2024-01-15T10:00:00Z",
      "notes": "Career guidance session",
      "status": "scheduled",
      "created_at": "2024-01-10T09:00:00Z",
      "updated_at": "2024-01-10T09:00:00Z"
    }
  ],
  "total": 5,
  "offset": 0,
  "limit": 20
}
```

#### POST /consultations
**Description**: Admin creates consultation  
**Access**: Admin only  
**Body**:
```json
{
  "client_id": "uuid",
  "scheduled_at": "2024-01-15T10:00:00Z",
  "notes": "Career guidance session"
}
```
**Response**:
```json
{
  "message": "Consultation created successfully",
  "consultation": { ... }
}
```

#### GET /consultations/:id
**Description**: Get specific consultation  
**Access**: Authenticated (own consultations only for clients)  
**Response**:
```json
{
  "consultation": {
    "id": "uuid",
    "client_id": "uuid",
    "scheduled_at": "2024-01-15T10:00:00Z",
    "notes": "Career guidance session",
    "status": "scheduled",
    "created_at": "2024-01-10T09:00:00Z",
    "updated_at": "2024-01-10T09:00:00Z"
  }
}
```

#### PATCH /consultations/:id
**Description**: Update consultation  
**Access**: Admin only  
**Body**:
```json
{
  "scheduled_at": "2024-01-16T10:00:00Z",
  "notes": "Updated notes",
  "status": "rescheduled"
}
```
**Response**:
```json
{
  "message": "Consultation updated successfully",
  "consultation": { ... }
}
```

#### DELETE /consultations/:id
**Description**: Cancel consultation  
**Access**: Admin only  
**Response**:
```json
{
  "message": "Consultation cancelled successfully"
}
```

### Applications

#### GET /applications
**Description**: Get client applications  
**Access**: Authenticated  
**Query Parameters**:
- `status` (optional): Filter by status
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `sort` (optional): Sort field (default: created_at)
- `order` (optional): Sort order - asc/desc (default: desc)

**Response**:
```json
{
  "applications": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "job_title": "Software Engineer",
      "company": "Tech Corp",
      "job_link": "https://...",
      "date_applied": "2024-01-10T00:00:00Z",
      "status": "applied",
      "created_at": "2024-01-10T09:00:00Z",
      "updated_at": "2024-01-10T09:00:00Z"
    }
  ],
  "total": 15,
  "offset": 0,
  "limit": 20
}
```

#### POST /applications
**Description**: Admin adds application  
**Access**: Admin only  
**Body**:
```json
{
  "client_id": "uuid",
  "job_title": "Software Engineer",
  "company": "Tech Corp",
  "job_link": "https://...",
  "status": "applied"
}
```
**Response**:
```json
{
  "message": "Application created successfully",
  "application": { ... }
}
```

#### GET /applications/:id
**Description**: Get specific application  
**Access**: Authenticated (own applications only for clients)  
**Response**:
```json
{
  "application": {
    "id": "uuid",
    "client_id": "uuid",
    "job_title": "Software Engineer",
    "company": "Tech Corp",
    "job_link": "https://...",
    "date_applied": "2024-01-10T00:00:00Z",
    "status": "applied",
    "created_at": "2024-01-10T09:00:00Z",
    "updated_at": "2024-01-10T09:00:00Z"
  }
}
```

#### PATCH /applications/:id
**Description**: Update application  
**Access**: Admin only  
**Body**:
```json
{
  "job_title": "Senior Software Engineer",
  "company": "Tech Corp",
  "job_link": "https://...",
  "status": "interview"
}
```
**Response**:
```json
{
  "message": "Application updated successfully",
  "application": { ... }
}
```

#### DELETE /applications/:id
**Description**: Delete application  
**Access**: Admin only  
**Response**:
```json
{
  "message": "Application deleted successfully"
}
```

#### GET /applications/stats/summary
**Description**: Get application statistics  
**Access**: Authenticated  
**Response**:
```json
{
  "total": 15,
  "by_status": {
    "applied": 8,
    "interview": 3,
    "offer": 1,
    "rejected": 2,
    "withdrawn": 1
  },
  "success_rate": "6.7"
}
```

### Notifications

#### GET /notifications
**Description**: Get client notifications  
**Access**: Authenticated  
**Query Parameters**:
- `read` (optional): Filter by read status (true/false)
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "type": "consultation_scheduled",
      "title": "Consultation Scheduled",
      "message": "Your consultation has been scheduled for...",
      "read": false,
      "delivered_at": "2024-01-10T09:00:00Z",
      "created_at": "2024-01-10T09:00:00Z"
    }
  ],
  "unread_count": 5,
  "total": 25,
  "offset": 0,
  "limit": 20
}
```

#### PATCH /notifications/:id/read
**Description**: Mark notification as read  
**Access**: Authenticated (own notifications only)  
**Response**:
```json
{
  "message": "Notification marked as read",
  "notification": { ... }
}
```

#### PATCH /notifications/read-all
**Description**: Mark all notifications as read  
**Access**: Authenticated  
**Response**:
```json
{
  "message": "All notifications marked as read"
}
```

#### DELETE /notifications/:id
**Description**: Delete notification  
**Access**: Authenticated (own notifications only)  
**Response**:
```json
{
  "message": "Notification deleted successfully"
}
```

#### GET /notifications/unread-count
**Description**: Get unread notification count  
**Access**: Authenticated  
**Response**:
```json
{
  "unread_count": 5
}
```

### File Upload

#### POST /upload/resume
**Description**: Upload client resume  
**Access**: Authenticated  
**Content-Type**: multipart/form-data  
**Body**: Form data with 'resume' field containing PDF file  
**Response**:
```json
{
  "message": "Resume uploaded successfully",
  "resume_url": "https://...",
  "file_path": "client_id/resume_timestamp.pdf"
}
```

#### DELETE /upload/resume
**Description**: Delete client resume  
**Access**: Authenticated  
**Response**:
```json
{
  "message": "Resume deleted successfully"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit info included in response headers
- **Exceeded**: Returns 429 status with retry information

## Data Types

### User Roles
- `admin` - Full system access
- `client` - Limited to own data

### Consultation Status
- `scheduled` - Consultation is scheduled
- `completed` - Consultation completed
- `cancelled` - Consultation cancelled
- `rescheduled` - Consultation rescheduled

### Application Status
- `applied` - Application submitted
- `interview` - Interview scheduled/completed
- `offer` - Job offer received
- `rejected` - Application rejected
- `withdrawn` - Application withdrawn

### Notification Types
- `consultation_scheduled` - New consultation scheduled
- `consultation_rescheduled` - Consultation rescheduled
- `consultation_cancelled` - Consultation cancelled
- `application_added` - New application added
- `application_status_updated` - Application status changed
- `general` - General notification

## Real-time Updates

The system supports real-time updates via Supabase Realtime. Clients can subscribe to:

### Notifications Channel
```javascript
const subscription = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `client_id=eq.${clientId}`
  }, (payload) => {
    // Handle new notification
  })
  .subscribe();
```

### Applications Channel
```javascript
const subscription = supabase
  .channel('applications')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'applications',
    filter: `client_id=eq.${clientId}`
  }, (payload) => {
    // Handle application update
  })
  .subscribe();
```

## Error Handling

### Common Error Responses

#### Validation Error (400)
```json
{
  "error": "Validation error",
  "details": [
    "Email is required",
    "Password must be at least 8 characters"
  ]
}
```

#### Authentication Error (401)
```json
{
  "error": "Access token required"
}
```

#### Authorization Error (403)
```json
{
  "error": "Admin access required"
}
```

#### Not Found Error (404)
```json
{
  "error": "Resource not found"
}
```

#### Rate Limit Error (429)
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

## Testing

### Health Check
```bash
curl https://your-backend-domain.com/health
```

### Authentication Test
```bash
# Login
curl -X POST https://your-backend-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Use token
curl -X GET https://your-backend-domain.com/api/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## SDK Examples

### JavaScript/Node.js
```javascript
const API_BASE = 'https://your-backend-domain.com/api';

class ApplyBureauAPI {
  constructor(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      }
    });
    return response.json();
  }

  async getDashboard() {
    return this.request('/dashboard');
  }

  async getApplications(params = {}) {
    const query = new URLSearchParams(params);
    return this.request(`/applications?${query}`);
  }
}
```

### Python
```python
import requests

class ApplyBureauAPI:
    def __init__(self, token, base_url='https://your-backend-domain.com/api'):
        self.token = token
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def get_dashboard(self):
        response = requests.get(f'{self.base_url}/dashboard', headers=self.headers)
        return response.json()

    def get_applications(self, **params):
        response = requests.get(f'{self.base_url}/applications', 
                              headers=self.headers, params=params)
        return response.json()
```