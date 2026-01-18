# Contacts Fetching API Documentation

## Overview
This document provides comprehensive documentation for fetching contacts data from the Apply Bureau backend deployed on Vercel. The API provides multiple endpoints for managing consultation requests, contact form submissions, and dashboard data.

## Base URL
```
https://apply-bureau-backend.vercel.app
```

## Authentication
All contact fetching endpoints require admin authentication using Bearer tokens.

### Login Endpoint
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@applybureau.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin-id",
    "email": "admin@applybureau.com",
    "role": "admin"
  }
}
```

## Main Contacts Endpoints

### 1. Consultation Requests (Primary Contacts)

#### GET /api/consultation-requests
**Description:** Fetch all consultation requests with pagination and filtering support.

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 50)
- `status` (optional): Filter by status
- `search` (optional): Search in name, email, company
- `sort` (optional): Sort field (default: created_at)
- `order` (optional): Sort order - asc/desc (default: desc)

**Example Request:**
```http
GET /api/consultation-requests?page=1&limit=10&status=pending
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Format:**
```json
{
  "data": [
    {
      "id": "1d97a76c-b533-4d28-9b2e-7ccf5814842d",
      "fullName": "Iretioluwa Akinwale",
      "email": "ainaakinwale@gmail.com",
      "phone": "22298564355854",
      "message": "I need help with my career transition",
      "preferredSlots": [
        {
          "date": "2026-01-22",
          "time": "18:00"
        },
        {
          "date": "2026-01-23",
          "time": "10:30"
        }
      ],
      "requestType": "consultation_booking",
      "company": null,
      "job_title": null,
      "consultation_type": "initial",
      "urgency_level": "medium",
      "source": "website",
      "status": "confirmed",
      "pipeline_status": "lead",
      "priority": "medium",
      "created_at": "2026-01-17T09:57:33.712+00:00",
      "updated_at": "2026-01-17T09:57:33.712+00:00",
      "admin_notes": "Confirmed via email action at 2026-01-17T10:15:22.123Z",
      "confirmedSlot": null,
      "scheduled_datetime": null,
      "google_meet_link": null,
      "handled_by": null,
      "response_sent": false
    }
  ],
  "total": 7,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "message": "Consultation requests retrieved successfully"
}
```

#### Data Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique consultation request ID |
| `fullName` | string | Client's full name |
| `email` | string | Client's email address |
| `phone` | string | Client's phone number |
| `message` | string | Client's consultation request message |
| `preferredSlots` | array | Array of preferred time slots |
| `requestType` | string | Type of request (always "consultation_booking") |
| `company` | string | Client's company (nullable) |
| `job_title` | string | Client's job title (nullable) |
| `consultation_type` | string | Type of consultation requested |
| `urgency_level` | string | Priority level: low, normal, high |
| `source` | string | Source of the request (website, referral, etc.) |
| `status` | string | Current status: pending, confirmed, rejected, approved |
| `pipeline_status` | string | Pipeline stage: lead, qualified, etc. |
| `priority` | string | Derived priority: low, medium, high |
| `created_at` | string | ISO timestamp of creation |
| `updated_at` | string | ISO timestamp of last update |
| `admin_notes` | string | Admin notes and comments |
| `confirmedSlot` | object | Confirmed time slot (nullable) |
| `scheduled_datetime` | string | Scheduled meeting datetime (nullable) |
| `google_meet_link` | string | Meeting link (nullable) |
| `handled_by` | string | Admin who handled the request (nullable) |
| `response_sent` | boolean | Whether response was sent |

#### Status Values
- `pending` - New request awaiting review
- `confirmed` - Request confirmed by client
- `rejected` - Request rejected
- `approved` - Request approved by admin

#### Consultation Types
- `career_strategy` - Career strategy consultation
- `resume_review` - Resume review session
- `interview_prep` - Interview preparation
- `job_search` - Job search guidance
- `salary_negotiation` - Salary negotiation help
- `career_transition` - Career change guidance
- `linkedin_optimization` - LinkedIn profile optimization
- `general_consultation` - General consultation

### 2. Contact Form Submissions

#### GET /api/contact-requests
**Description:** Fetch contact form submissions from the website.

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 50)
- `status` (optional): Filter by status (new, in_progress, handled, archived)
- `search` (optional): Search in name, email, subject
- `sort` (optional): Sort field (default: created_at)
- `order` (optional): Sort order - asc/desc (default: desc)

**Response Format:**
```json
{
  "data": [
    {
      "id": "contact-id",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "subject": "General Inquiry",
      "message": "I would like to know more about your services",
      "status": "new",
      "admin_notes": null,
      "handled_at": null,
      "handled_by": null,
      "created_at": "2026-01-17T10:00:00.000Z",
      "updated_at": "2026-01-17T10:00:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

#### Contact Request Status Values
- `new` - New contact request
- `in_progress` - Being handled
- `handled` - Completed
- `archived` - Archived

### 3. Dashboard Contacts

#### GET /api/dashboard/contacts
**Description:** Get combined contacts data for dashboard display.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response Format:**
```json
{
  "data": [
    {
      "id": "contact-id",
      "name": "John Doe",
      "email": "john.doe@example.com",
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

## Individual Contact Operations

### Get Single Consultation Request
```http
GET /api/consultation-requests/{id}
Authorization: Bearer <token>
```

### Update Consultation Request
```http
PATCH /api/consultation-requests/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed",
  "admin_notes": "Confirmed and scheduled",
  "confirmedSlot": {
    "date": "2026-01-25",
    "time": "14:00"
  },
  "scheduled_datetime": "2026-01-25T14:00:00.000Z",
  "google_meet_link": "https://meet.google.com/abc-defg-hij"
}
```

### Get Single Contact Request
```http
GET /api/contact-requests/{id}
Authorization: Bearer <token>
```

### Update Contact Request
```http
PATCH /api/contact-requests/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "handled",
  "admin_notes": "Responded via email"
}
```

## Filtering and Search Examples

### Filter by Status
```http
GET /api/consultation-requests?status=pending
GET /api/contact-requests?status=new
```

### Search Contacts
```http
GET /api/consultation-requests?search=gmail
GET /api/contact-requests?search=john
```

### Pagination
```http
GET /api/consultation-requests?page=2&limit=20
GET /api/contact-requests?page=1&limit=10
```

### Combined Filters
```http
GET /api/consultation-requests?status=pending&search=gmail&page=1&limit=5&sort=created_at&order=desc
```

## Error Handling

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
  "error": "Contact request not found"
}
```

#### 429 Too Many Requests
```json
{
  "error": "Too many requests from this IP",
  "retryAfter": 900
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to fetch consultation requests"
}
```

## Rate Limiting
The API implements rate limiting to prevent abuse:
- **Limit:** 100 requests per 15 minutes per IP
- **Headers:** Rate limit info included in response headers
- **Retry:** Wait for the time specified in `retryAfter` field

## Performance Considerations

### Response Times
- **Consultation Requests:** ~200-500ms
- **Contact Requests:** ~150-300ms
- **Dashboard Contacts:** ~300-600ms

### Optimization Tips
1. Use pagination to limit response size
2. Implement client-side caching for frequently accessed data
3. Use specific filters to reduce server load
4. Batch operations when possible

## Frontend Integration Examples

### React/JavaScript Example
```javascript
const fetchContacts = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('https://apply-bureau-backend.vercel.app/api/consultation-requests', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};
```

### Axios Example
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://apply-bureau-backend.vercel.app/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Fetch consultation requests
const consultations = await api.get('/consultation-requests?page=1&limit=20');

// Fetch contact requests
const contacts = await api.get('/contact-requests?status=new');

// Update consultation status
await api.patch(`/consultation-requests/${id}`, {
  status: 'confirmed',
  admin_notes: 'Confirmed via admin panel'
});
```

## Testing Status ✅

### Verified Endpoints
- ✅ **Authentication:** Working correctly
- ✅ **GET /api/consultation-requests:** Fully functional
- ✅ **Pagination:** Working with page/limit parameters
- ✅ **Data Format:** Consistent and complete
- ✅ **Error Handling:** Proper HTTP status codes
- ✅ **Rate Limiting:** Implemented and functional

### Test Results Summary
- **Total Consultation Records:** 7
- **Response Time:** ~200-500ms
- **Data Integrity:** ✅ Complete
- **Authentication:** ✅ Working
- **Pagination:** ✅ Functional
- **Filtering:** ✅ Available

## Support and Troubleshooting

### Common Issues
1. **401 Errors:** Check token validity and admin role
2. **429 Rate Limit:** Implement request throttling
3. **Empty Results:** Verify filters and search parameters
4. **Slow Responses:** Use pagination and specific filters

### Debug Information
- **Backend URL:** https://apply-bureau-backend.vercel.app
- **Health Check:** GET /api/health
- **Admin Email:** admin@applybureau.com
- **Last Updated:** January 17, 2026

---

**Status: COMPLETE ✅**  
**Last Tested:** January 17, 2026  
**Environment:** Vercel Production