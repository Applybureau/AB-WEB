# Apply Bureau API Documentation

## 🌐 Base URL
```
Production: https://apply-bureau-backend.onrender.com/api
Development: http://localhost:3000/api
```

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Admin Credentials
```
Email: admin@applybureau.com
Password: admin123
```

## 📋 Response Format

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

## 🚀 API Endpoints

### 🏥 Health Check

#### GET /health
**Description**: Check API health status  
**Access**: Public  
**URL**: `https://apply-bureau-backend.onrender.com/health`  
**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-04T21:54:40.026Z",
  "uptime": "0.04 hours",
  "memory": "67MB",
  "pid": 18,
  "environment": "production",
  "service": "Apply Bureau Backend"
}
```

### 🔐 Authentication

#### POST /auth/login
**Description**: User login (admin or client)  
**Access**: Public  
**URL**: `https://apply-bureau-backend.onrender.com/api/auth/login`  
**Body**:
```json
{
  "email": "admin@applybureau.com",
  "password": "admin123"
}
```
**Response**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "688b3986-0398-4c00-8aa9-0f14a411b378",
    "email": "admin@applybureau.com",
    "full_name": "Admin User",
    "role": "admin"
  }
}
```

#### GET /auth/me
**Description**: Get current user information  
**Access**: Authenticated  
**URL**: `https://apply-bureau-backend.onrender.com/api/auth/me`  
**Headers**: `Authorization: Bearer <token>`  
**Response**:
```json
{
  "user": {
    "id": "688b3986-0398-4c00-8aa9-0f14a411b378",
    "email": "admin@applybureau.com",
    "full_name": "Admin User",
    "role": "admin",
    "onboarding_complete": true,
    "resume_url": null
  }
}
```

#### POST /auth/invite
**Description**: Admin sends invitation to new client  
**Access**: Admin only  
**URL**: `https://apply-bureau-backend.onrender.com/api/auth/invite`  
**Headers**: `Authorization: Bearer <admin_token>`  
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
**URL**: `https://apply-bureau-backend.onrender.com/api/auth/complete-registration`  
**Body**:
```json
{
  "token": "jwt_registration_token",
  "password": "newpassword123",
  "full_name": "John Doe"
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

### 📊 Dashboard

#### GET /dashboard
**Description**: Get client dashboard data  
**Access**: Authenticated  
**URL**: `https://apply-bureau-backend.onrender.com/api/dashboard`  
**Headers**: `Authorization: Bearer <token>`  
**Response**:
```json
{
  "client": {
    "id": "688b3986-0398-4c00-8aa9-0f14a411b378",
    "full_name": "Admin User",
    "email": "admin@applybureau.com",
    "onboarding_complete": true,
    "resume_url": null
  },
  "stats": {
    "total_applications": 0,
    "pending_applications": 0,
    "interviews_scheduled": 0,
    "offers_received": 0,
    "upcoming_consultations": 0,
    "unread_notifications": 0
  },
  "recent_applications": [],
  "upcoming_consultations": [],
  "unread_notifications": []
}
```

#### GET /dashboard/stats
**Description**: Get detailed statistics  
**Access**: Authenticated  
**URL**: `https://apply-bureau-backend.onrender.com/api/dashboard/stats`  
**Headers**: `Authorization: Bearer <token>`  
**Response**:
```json
{
  "total_applications": 0,
  "applications_by_status": {
    "applied": 0,
    "interview": 0,
    "offer": 0,
    "rejected": 0,
    "withdrawn": 0
  },
  "recent_activity": {
    "last_7_days": 0,
    "last_30_days": 0
  },
  "success_rate": "0"
}
```

### 📅 Consultations

#### GET /consultations
**Description**: List client consultations  
**Access**: Authenticated  
**URL**: `https://apply-bureau-backend.onrender.com/api/consultations`  
**Headers**: `Authorization: Bearer <token>`  
**Query Parameters**:
- `status` (optional): Filter by status
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
[
  {
    "id": "uuid",
    "client_id": "uuid",
    "scheduled_at": "2024-01-15T10:00:00Z",
    "admin_notes": "Career guidance session",
    "status": "scheduled",
    "created_at": "2024-01-10T09:00:00Z",
    "updated_at": "2024-01-10T09:00:00Z"
  }
]
```

#### POST /consultations
**Description**: Admin creates consultation  
**Access**: Admin only  
**URL**: `https://apply-bureau-backend.onrender.com/api/consultations`  
**Headers**: `Authorization: Bearer <admin_token>`  
**Body**:
```json
{
  "client_id": "uuid",
  "scheduled_at": "2024-01-15T10:00:00Z",
  "admin_notes": "Career guidance session"
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
**URL**: `https://apply-bureau-backend.onrender.com/api/consultations/:id`  
**Headers**: `Authorization: Bearer <token>`  

#### PATCH /consultations/:id
**Description**: Update consultation  
**Access**: Admin only  
**URL**: `https://apply-bureau-backend.onrender.com/api/consultations/:id`  
**Headers**: `Authorization: Bearer <admin_token>`  

#### DELETE /consultations/:id
**Description**: Cancel consultation  
**Access**: Admin only  
**URL**: `https://apply-bureau-backend.onrender.com/api/consultations/:id`  
**Headers**: `Authorization: Bearer <admin_token>`  

### 💼 Applications

#### GET /applications
**Description**: Get client applications  
**Access**: Authenticated  
**URL**: `https://apply-bureau-backend.onrender.com/api/applications`  
**Headers**: `Authorization: Bearer <token>`  
**Query Parameters**:
- `status` (optional): Filter by status
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `sort` (optional): Sort field (default: created_at)
- `order` (optional): Sort order - asc/desc (default: desc)

**Response**:
```json
[
  {
    "id": "uuid",
    "client_id": "uuid",
    "job_title": "Software Engineer",
    "company": "Tech Corp",
    "job_url": "https://...",
    "date_applied": "2024-01-10T00:00:00Z",
    "status": "applied",
    "created_at": "2024-01-10T09:00:00Z",
    "updated_at": "2024-01-10T09:00:00Z"
  }
]
```

#### POST /applications
**Description**: Admin adds application  
**Access**: Admin only  
**URL**: `https://apply-bureau-backend.onrender.com/api/applications`  
**Headers**: `Authorization: Bearer <admin_token>`  
**Body**:
```json
{
  "client_id": "uuid",
  "job_title": "Software Engineer",
  "company": "Tech Corp",
  "job_url": "https://...",
  "status": "applied"
}
```

#### GET /applications/:id
**Description**: Get specific application  
**Access**: Authenticated (own applications only for clients)  
**URL**: `https://apply-bureau-backend.onrender.com/api/applications/:id`  
**Headers**: `Authorization: Bearer <token>`  

#### PATCH /applications/:id
**Description**: Update application  
**Access**: Admin only  
**URL**: `https://apply-bureau-backend.onrender.com/api/applications/:id`  
**Headers**: `Authorization: Bearer <admin_token>`  

#### DELETE /applications/:id
**Description**: Delete application  
**Access**: Admin only  
**URL**: `https://apply-bureau-backend.onrender.com/api/applications/:id`  
**Headers**: `Authorization: Bearer <admin_token>`  

### 🔔 Notifications

#### GET /notifications
**Description**: Get client notifications  
**Access**: Authenticated  
**URL**: `https://apply-bureau-backend.onrender.com/api/notifications`  
**Headers**: `Authorization: Bearer <token>`  
**Query Parameters**:
- `read` (optional): Filter by read status (true/false)
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "notifications": [],
  "unread_count": 0,
  "total": 0,
  "offset": 0,
  "limit": 20
}
```

#### GET /notifications/unread-count
**Description**: Get unread notification count  
**Access**: Authenticated  
**URL**: `https://apply-bureau-backend.onrender.com/api/notifications/unread-count`  
**Headers**: `Authorization: Bearer <token>`  
**Response**:
```json
{
  "unread_count": 0
}
```

#### PATCH /notifications/:id/read
**Description**: Mark notification as read  
**Access**: Authenticated (own notifications only)  
**URL**: `https://apply-bureau-backend.onrender.com/api/notifications/:id/read`  
**Headers**: `Authorization: Bearer <token>`  

#### PATCH /notifications/read-all
**Description**: Mark all notifications as read  
**Access**: Authenticated  
**URL**: `https://apply-bureau-backend.onrender.com/api/notifications/read-all`  
**Headers**: `Authorization: Bearer <token>`  

#### DELETE /notifications/:id
**Description**: Delete notification  
**Access**: Authenticated (own notifications only)  
**URL**: `https://apply-bureau-backend.onrender.com/api/notifications/:id`  
**Headers**: `Authorization: Bearer <token>`  

### 📧 Email Templates

#### GET /emails/templates/{template_name}
**Description**: Access email templates  
**Access**: Public  
**Available Templates**:
- `https://apply-bureau-backend.onrender.com/emails/templates/signup_invite.html`
- `https://apply-bureau-backend.onrender.com/emails/templates/consultation_scheduled.html`
- `https://apply-bureau-backend.onrender.com/emails/templates/application_status_update.html`
- `https://apply-bureau-backend.onrender.com/emails/templates/onboarding_completion.html`

#### GET /emails/assets/logo.png
**Description**: Access logo asset  
**Access**: Public  
**URL**: `https://apply-bureau-backend.onrender.com/emails/assets/logo.png`  

### 📁 File Upload

#### POST /upload/resume
**Description**: Upload client resume  
**Access**: Authenticated  
**URL**: `https://apply-bureau-backend.onrender.com/api/upload/resume`  
**Headers**: `Authorization: Bearer <token>`  
**Content-Type**: multipart/form-data  
**Body**: Form data with 'resume' field containing PDF file  

#### DELETE /upload/resume
**Description**: Delete client resume  
**Access**: Authenticated  
**URL**: `https://apply-bureau-backend.onrender.com/api/upload/resume`  
**Headers**: `Authorization: Bearer <token>`  

### 👥 Admin Routes

#### GET /admin/stats
**Description**: Get system statistics (Admin only)  
**Access**: Admin only  
**URL**: `https://apply-bureau-backend.onrender.com/api/admin/stats`  
**Headers**: `Authorization: Bearer <admin_token>`  

#### GET /admin/logs
**Description**: Get system logs (Admin only)  
**Access**: Admin only  
**URL**: `https://apply-bureau-backend.onrender.com/api/admin/logs`  
**Headers**: `Authorization: Bearer <admin_token>`  

#### POST /admin/cache/clear
**Description**: Clear system cache (Admin only)  
**Access**: Admin only  
**URL**: `https://apply-bureau-backend.onrender.com/api/admin/cache/clear`  
**Headers**: `Authorization: Bearer <admin_token>`  

## 📊 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 🛡️ Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Login**: 5 requests per 15 minutes per IP
- **Invitations**: 10 requests per hour per IP
- **File Upload**: 20 requests per hour per IP
- **Headers**: Rate limit info included in response headers
- **Exceeded**: Returns 429 status with retry information

## 🎨 Email Branding

All email templates use professional branding:
- **Primary Color**: #10b981 (Green)
- **Secondary Color**: #06b6d4 (Light Blue)
- **Button Text**: #ffffff (White)
- **Structure**: Table-based HTML for email client compatibility
- **Logo**: Apply Bureau logo from GitHub repository

## 🔧 Data Types

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

## 🧪 Testing Examples

### Health Check
```bash
curl https://apply-bureau-backend.onrender.com/health
```

### Authentication Test
```bash
# Login
curl -X POST https://apply-bureau-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@applybureau.com","password":"admin123"}'

# Use token
curl -X GET https://apply-bureau-backend.onrender.com/api/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get User Info
```bash
curl -X GET https://apply-bureau-backend.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Dashboard
```bash
curl -X GET https://apply-bureau-backend.onrender.com/api/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Notifications
```bash
curl -X GET https://apply-bureau-backend.onrender.com/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 💻 SDK Examples

### JavaScript/Node.js
```javascript
const API_BASE = 'https://apply-bureau-backend.onrender.com/api';

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

  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async getDashboard() {
    return this.request('/dashboard');
  }

  async getApplications(params = {}) {
    const query = new URLSearchParams(params);
    return this.request(`/applications?${query}`);
  }

  async getNotifications(params = {}) {
    const query = new URLSearchParams(params);
    return this.request(`/notifications?${query}`);
  }
}

// Usage
const api = new ApplyBureauAPI();
const loginResult = await api.login('admin@applybureau.com', 'admin123');
const apiWithToken = new ApplyBureauAPI(loginResult.token);
const dashboard = await apiWithToken.getDashboard();
```

### Python
```python
import requests

class ApplyBureauAPI:
    def __init__(self, token=None, base_url='https://apply-bureau-backend.onrender.com/api'):
        self.token = token
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json'
        }
        if token:
            self.headers['Authorization'] = f'Bearer {token}'

    def login(self, email, password):
        response = requests.post(f'{self.base_url}/auth/login', 
                               json={'email': email, 'password': password})
        return response.json()

    def get_me(self):
        response = requests.get(f'{self.base_url}/auth/me', headers=self.headers)
        return response.json()

    def get_dashboard(self):
        response = requests.get(f'{self.base_url}/dashboard', headers=self.headers)
        return response.json()

    def get_applications(self, **params):
        response = requests.get(f'{self.base_url}/applications', 
                              headers=self.headers, params=params)
        return response.json()

    def get_notifications(self, **params):
        response = requests.get(f'{self.base_url}/notifications', 
                              headers=self.headers, params=params)
        return response.json()

# Usage
api = ApplyBureauAPI()
login_result = api.login('admin@applybureau.com', 'admin123')
api_with_token = ApplyBureauAPI(login_result['token'])
dashboard = api_with_token.get_dashboard()
```

### cURL Examples
```bash
# Login and get token
TOKEN=$(curl -s -X POST https://apply-bureau-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@applybureau.com","password":"admin123"}' | \
  jq -r '.token')

# Get user info
curl -X GET https://apply-bureau-backend.onrender.com/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Get dashboard
curl -X GET https://apply-bureau-backend.onrender.com/api/dashboard \
  -H "Authorization: Bearer $TOKEN"

# Get applications
curl -X GET https://apply-bureau-backend.onrender.com/api/applications \
  -H "Authorization: Bearer $TOKEN"

# Get notifications
curl -X GET https://apply-bureau-backend.onrender.com/api/notifications \
  -H "Authorization: Bearer $TOKEN"
```

## 🚀 Production Status

**Backend URL**: https://apply-bureau-backend.onrender.com  
**Status**: ✅ Production Ready (93% success rate)  
**Last Updated**: January 4, 2026  

### ✅ Working Endpoints:
- Health monitoring
- Authentication system
- Dashboard and statistics
- Consultations management
- Applications tracking
- Notifications system
- Email templates
- Static assets

### 🎯 Ready for Frontend Integration!

This backend is fully functional and ready for frontend developers to integrate with. All core endpoints are working and tested in production.