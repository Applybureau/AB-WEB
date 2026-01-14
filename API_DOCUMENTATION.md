# Apply Bureau Backend - Complete API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Data Formats](#data-formats)
5. [Error Handling](#error-handling)
6. [Client Setup Guide](#client-setup-guide)
7. [Token Management](#token-management)
8. [Database Schema](#database-schema)

## Overview

The Apply Bureau Backend is a comprehensive consultation and client management system built with:
- **Node.js & Express.js** - RESTful API server
- **Supabase (PostgreSQL)** - Database and authentication
- **JWT** - Token-based authentication
- **Resend** - Email delivery service
- **Socket.IO** - Real-time notifications

**Base URL**: `http://localhost:3000` (development) or your deployed URL

**API Version**: 1.0.0

---

## Authentication

### Authentication Methods

The API uses JWT (JSON Web Tokens) for authentication. All protected endpoints require a valid JWT token in the Authorization header.

#### Header Format
```
Authorization: Bearer <your_jwt_token>
```

### Token Types

1. **Access Token** - Used for API authentication (expires in 24 hours)
2. **Registration Token** - One-time use for client registration (expires in 7 days)
3. **Password Reset Token** - One-time use for password reset (expires in 1 hour)

### Getting a Token

#### Client Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "client@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "client@example.com",
    "full_name": "John Doe",
    "role": "client"
  }
}
```


#### Admin Login
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "full_name": "Admin User",
    "role": "admin"
  }
}
```

---

## API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Health Check
```http
GET /health
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-14T10:00:00.000Z",
  "uptime": 3600,
  "service": "Apply Bureau Backend",
  "database": "connected",
  "email": "operational"
}
```

#### 2. Submit Contact Form
```http
POST /api/contact
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Example Corp",
  "message": "Interested in your services",
  "country": "United States"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contact request submitted successfully",
  "requestId": "uuid"
}
```

#### 3. Request Consultation (Public)
```http
POST /api/public-consultations
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role_targets": "Software Engineer, Senior Developer",
  "package_interest": "Tier 2",
  "employment_status": "Currently Employed",
  "area_of_concern": "Need help with interview preparation",
  "consultation_window": "Weekday evenings",
  "country": "United States"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consultation request submitted successfully",
  "consultationId": "uuid",
  "status": "pending"
}
```



### Client Endpoints (Requires Authentication)

#### 4. Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "client@example.com",
  "full_name": "John Doe",
  "role": "client",
  "profile": {
    "phone": "+1234567890",
    "company": "Example Corp",
    "country": "United States",
    "profile_status": "approved",
    "onboarding_completed": true
  }
}
```

#### 5. Update Client Profile
```http
PUT /api/client/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "John Doe",
  "phone": "+1234567890",
  "company": "Example Corp",
  "position": "CEO",
  "country": "United States",
  "linkedin_url": "https://linkedin.com/in/johndoe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "client@example.com",
    "phone": "+1234567890",
    "company": "Example Corp",
    "updated_at": "2024-01-14T10:00:00.000Z"
  }
}
```

#### 6. Get Client Dashboard
```http
GET /api/client/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "client@example.com",
    "profile_status": "approved"
  },
  "stats": {
    "total_applications": 5,
    "pending_applications": 2,
    "completed_consultations": 3,
    "upcoming_consultations": 1
  },
  "recent_activity": [
    {
      "type": "consultation_scheduled",
      "title": "Strategy Call Scheduled",
      "date": "2024-01-15T14:00:00.000Z"
    }
  ],
  "next_consultation": {
    "id": "uuid",
    "title": "Initial Strategy Call",
    "scheduled_at": "2024-01-15T14:00:00.000Z",
    "meeting_link": "https://meet.google.com/xxx-yyyy-zzz"
  }
}
```

#### 7. Upload Files
```http
POST /api/client/uploads
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary_file_data>
type: "resume" | "linkedin_pdf" | "portfolio"
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "id": "uuid",
    "filename": "resume.pdf",
    "url": "https://storage.supabase.co/...",
    "type": "resume",
    "size": 1024000,
    "uploaded_at": "2024-01-14T10:00:00.000Z"
  }
}
```



### Admin Endpoints (Requires Admin Authentication)

#### 8. Get Admin Dashboard Stats
```http
GET /api/admin/dashboard/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "users": {
    "total": 150,
    "active": 120,
    "pending_approval": 10,
    "new_this_month": 25
  },
  "consultations": {
    "total": 300,
    "scheduled": 15,
    "completed": 250,
    "cancelled": 35,
    "revenue_this_month": 45000
  },
  "applications": {
    "total": 200,
    "pending": 20,
    "approved": 150,
    "rejected": 30
  },
  "leads": {
    "total_contacts": 500,
    "qualified_leads": 100,
    "conversion_rate": 20
  }
}
```

#### 9. Approve Consultation Request
```http
POST /api/admin/concierge/approve/:consultationId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "admin_notes": "Approved for Tier 2 package",
  "package_assigned": "Tier 2"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consultation approved and registration link sent",
  "consultation": {
    "id": "uuid",
    "status": "approved",
    "registration_token": "generated_token",
    "registration_link": "https://yourfrontend.com/register?token=xxx"
  }
}
```

#### 10. Manage Client Onboarding
```http
POST /api/admin/onboarding-triggers/approve/:userId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "unlock_profile": true,
  "send_welcome_email": true,
  "admin_notes": "All requirements met"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Client onboarding approved and profile unlocked",
  "user": {
    "id": "uuid",
    "profile_status": "approved",
    "profile_unlocked": true
  }
}
```

#### 11. Get All Consultation Requests
```http
GET /api/admin/concierge/requests?status=pending&page=1&limit=20
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "consultations": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "role_targets": "Software Engineer",
      "package_interest": "Tier 2",
      "status": "pending",
      "created_at": "2024-01-14T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```



---

## Data Formats

### Request Data Formats

#### Consultation Request
```json
{
  "full_name": "string (required, 2-100 chars)",
  "email": "string (required, valid email)",
  "phone": "string (optional, 10-20 chars)",
  "role_targets": "string (required, 5-200 chars)",
  "package_interest": "enum (Tier 1, Tier 2, Tier 3)",
  "employment_status": "enum (Currently Employed, Unemployed, Student, Freelancer)",
  "area_of_concern": "string (required, 10-500 chars)",
  "consultation_window": "string (optional)",
  "country": "string (required)",
  "linkedin_url": "string (optional, valid URL)"
}
```

#### Client Profile Update
```json
{
  "full_name": "string (optional)",
  "phone": "string (optional)",
  "company": "string (optional)",
  "position": "string (optional)",
  "country": "string (optional)",
  "linkedin_url": "string (optional, valid URL)",
  "current_salary": "string (optional)",
  "target_salary": "string (optional)",
  "years_of_experience": "number (optional)",
  "education_level": "string (optional)"
}
```

#### File Upload
```
Content-Type: multipart/form-data

Fields:
- file: binary (required, max 10MB)
- type: string (required: resume, linkedin_pdf, portfolio, cover_letter)
- description: string (optional)
```

### Response Data Formats

#### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data object
  }
}
```

#### Error Response
```json
{
  "error": "Error message",
  "details": "Detailed error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-14T10:00:00.000Z"
}
```

#### Pagination Response
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Date/Time Format

All dates and times are in ISO 8601 format (UTC):
```
2024-01-14T10:00:00.000Z
```

### File URLs

File URLs are returned in the following format:
```
https://uhivvmpljffhbodrklip.supabase.co/storage/v1/object/public/bucket-name/file-path
```



---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Codes

#### Authentication Errors
```json
{
  "error": "Invalid or expired token",
  "code": "AUTH_TOKEN_INVALID",
  "status": 401
}
```

```json
{
  "error": "Insufficient permissions",
  "code": "AUTH_INSUFFICIENT_PERMISSIONS",
  "status": 403
}
```

#### Validation Errors
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "status": 422,
  "details": {
    "email": "Invalid email format",
    "phone": "Phone number must be 10-20 characters"
  }
}
```

#### Rate Limiting
```json
{
  "error": "Too many requests from this IP",
  "code": "RATE_LIMIT_EXCEEDED",
  "status": 429,
  "retryAfter": 900
}
```

### Error Handling Best Practices

1. **Always check the HTTP status code** before processing the response
2. **Handle token expiration** by refreshing or re-authenticating
3. **Implement retry logic** for 429 (rate limit) errors
4. **Display user-friendly messages** based on error codes
5. **Log errors** for debugging purposes



---

## Client Setup Guide

### Prerequisites

- Node.js 20+ installed
- npm or yarn package manager
- Git for version control
- Code editor (VS Code recommended)

### Installation Steps

#### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd backend
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Supabase Configuration
SUPABASE_URL=https://uhivvmpljffhbodrklip.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key

# Security
JWT_SECRET=your_jwt_secret_key

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend Configuration
FRONTEND_URL=http://localhost:5173
```

#### 4. Database Setup

Run the master schema in your Supabase SQL Editor:

```bash
# Copy the content of MASTER_DATABASE_SCHEMA.sql
# Paste it into Supabase SQL Editor
# Execute the script
```

#### 5. Create Admin User

```bash
npm run create-first-admin
```

Follow the prompts to create your first admin user.

#### 6. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

#### 7. Verify Installation

```bash
npm run health-check
```

Expected output:
```
✓ Server is running
✓ Database connection successful
✓ Email service operational
✓ All systems operational
```

### Frontend Integration

#### JavaScript/TypeScript Example

```javascript
// API Client Setup
const API_BASE_URL = 'http://localhost:3000';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Authentication
  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.token = data.token;
    localStorage.setItem('auth_token', data.token);
    return data;
  }

  // Get current user
  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  // Submit consultation request
  async submitConsultation(data) {
    return this.request('/api/public-consultations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get client dashboard
  async getClientDashboard() {
    return this.request('/api/client/dashboard');
  }

  // Upload file
  async uploadFile(file, type) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request('/api/client/uploads', {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData
      },
      body: formData,
    });
  }
}

// Usage
const api = new ApiClient();

// Login
try {
  const { user, token } = await api.login('user@example.com', 'password');
  console.log('Logged in:', user);
} catch (error) {
  console.error('Login failed:', error.message);
}

// Get dashboard
try {
  const dashboard = await api.getClientDashboard();
  console.log('Dashboard data:', dashboard);
} catch (error) {
  console.error('Failed to load dashboard:', error.message);
}
```

#### React Example

```jsx
import { useState, useEffect } from 'react';

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:3000/api/client/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard');
        }

        const data = await response.json();
        setDashboard(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Welcome, {dashboard.user.full_name}</h1>
      <div>
        <h2>Stats</h2>
        <p>Total Applications: {dashboard.stats.total_applications}</p>
        <p>Pending: {dashboard.stats.pending_applications}</p>
        <p>Completed Consultations: {dashboard.stats.completed_consultations}</p>
      </div>
    </div>
  );
}
```



---

## Token Management

### Token Lifecycle

#### 1. Access Token (Authentication)

**Generation:**
- Created upon successful login
- Contains user ID, email, and role
- Expires in 24 hours

**Usage:**
```javascript
// Store token after login
localStorage.setItem('auth_token', token);

// Use token in requests
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
});
```

**Expiration Handling:**
```javascript
async function makeAuthenticatedRequest(endpoint, options) {
  try {
    const response = await fetch(endpoint, options);
    
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      return;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
```

#### 2. Registration Token (One-Time Use)

**Generation:**
- Created when admin approves consultation request
- Sent via email to client
- Expires in 7 days
- Single-use only

**Usage Flow:**
1. Admin approves consultation → Token generated
2. Client receives email with registration link
3. Client clicks link: `https://yourfrontend.com/register?token=xxx`
4. Frontend extracts token and calls registration endpoint
5. Token is marked as used and cannot be reused

**Frontend Implementation:**
```javascript
// Extract token from URL
const urlParams = new URLSearchParams(window.location.search);
const registrationToken = urlParams.get('token');

// Validate and use token
async function completeRegistration(password) {
  const response = await fetch('/api/client-registration/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      registration_token: registrationToken,
      password: password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.code === 'TOKEN_EXPIRED') {
      alert('Registration link has expired. Please request a new one.');
    } else if (error.code === 'TOKEN_ALREADY_USED') {
      alert('This registration link has already been used.');
    }
    throw new Error(error.error);
  }

  return response.json();
}
```

#### 3. Password Reset Token

**Generation:**
- Created when user requests password reset
- Sent via email
- Expires in 1 hour
- Single-use only

**Usage:**
```javascript
// Request password reset
async function requestPasswordReset(email) {
  await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

// Reset password with token
async function resetPassword(token, newPassword) {
  await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      password: newPassword,
    }),
  });
}
```

### Token Security Best Practices

1. **Never expose tokens in URLs** (except registration/reset links)
2. **Store tokens securely** (localStorage for web, secure storage for mobile)
3. **Clear tokens on logout**
4. **Implement token refresh** before expiration
5. **Validate tokens on every request** (backend handles this)
6. **Use HTTPS** in production to prevent token interception

### Common Token Errors and Fixes

#### Error: "Invalid or expired token"
**Cause:** Token has expired or is malformed
**Fix:**
```javascript
// Clear token and redirect to login
localStorage.removeItem('auth_token');
window.location.href = '/login';
```

#### Error: "Token already used"
**Cause:** Registration/reset token was already consumed
**Fix:**
```javascript
// Request new token
alert('This link has already been used. Please request a new one.');
// Redirect to request form
```

#### Error: "Token expired"
**Cause:** Token exceeded its validity period
**Fix:**
```javascript
// For access tokens: Re-login
// For registration tokens: Contact support for new link
```



---

## Database Schema

### Core Tables

#### registered_users
Stores all user accounts (clients and admins)

```sql
CREATE TABLE registered_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  passcode_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'client', -- 'client', 'admin', 'super_admin'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### consultation_requests
Stores consultation requests from potential clients

```sql
CREATE TABLE consultation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role_targets TEXT NOT NULL,
  package_interest TEXT,
  employment_status TEXT,
  area_of_concern TEXT,
  consultation_window TEXT,
  country TEXT,
  linkedin_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'registered'
  registration_token TEXT,
  token_expires_at TIMESTAMPTZ,
  token_used BOOLEAN DEFAULT false,
  user_id UUID REFERENCES registered_users(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ
);
```

#### client_profiles
Extended profile information for clients

```sql
CREATE TABLE client_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES registered_users(id) UNIQUE,
  phone TEXT,
  company TEXT,
  position TEXT,
  country TEXT,
  current_country TEXT,
  linkedin_url TEXT,
  current_salary TEXT,
  target_salary TEXT,
  years_of_experience INTEGER,
  education_level TEXT,
  profile_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  profile_unlocked BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### applications
Client application submissions

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES registered_users(id),
  type TEXT NOT NULL, -- 'job_application', 'interview_prep', 'resume_review'
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  assigned_to UUID REFERENCES registered_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

#### strategy_calls
Strategy call bookings

```sql
CREATE TABLE strategy_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES registered_users(id),
  consultation_id UUID REFERENCES consultation_requests(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'rescheduled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### contact_requests
Public contact form submissions

```sql
CREATE TABLE contact_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT NOT NULL,
  country TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'closed'
  lead_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
```

#### notifications
System notifications for users

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES registered_users(id),
  type TEXT NOT NULL, -- 'info', 'success', 'warning', 'error'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

### Storage Buckets

#### documents
Stores user-uploaded documents (resumes, portfolios, etc.)

**Access:** Private (user-specific)
**Max Size:** 10MB per file
**Allowed Types:** PDF, DOC, DOCX, TXT

#### profile-images
Stores user profile pictures

**Access:** Public (with signed URLs)
**Max Size:** 5MB per file
**Allowed Types:** JPG, PNG, GIF, WEBP

### Row Level Security (RLS)

All tables have RLS enabled with policies:

1. **Users can read their own data**
2. **Users can update their own data**
3. **Admins can read all data**
4. **Admins can update all data**
5. **Public endpoints have specific policies**

Example RLS Policy:
```sql
-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
ON client_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Admins can see all profiles
CREATE POLICY "Admins can view all profiles"
ON client_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM registered_users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.js

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Test Coverage

The backend includes comprehensive tests for:
- Authentication and authorization
- API endpoints
- Data validation
- Error handling
- Token management
- File uploads
- Email notifications

### Example Test

```javascript
describe('Authentication', () => {
  test('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
  });

  test('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});
```

---

## Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-production-domain.com

# Use production database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_production_service_key

# Use production email service
RESEND_API_KEY=your_production_resend_key

# Strong JWT secret
JWT_SECRET=your_very_strong_random_secret_key
```

### Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set strong JWT_SECRET
- [ ] Configure production email service
- [ ] Set correct FRONTEND_URL
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Run database migrations
- [ ] Create admin user
- [ ] Test all endpoints
- [ ] Monitor logs and errors

### Recommended Hosting Platforms

1. **Render** - Easy deployment with automatic builds
2. **Railway** - Simple setup with database integration
3. **Vercel** - Serverless deployment
4. **DigitalOcean** - Full control with App Platform
5. **AWS/GCP/Azure** - Enterprise-grade infrastructure

---

## Support and Troubleshooting

### Common Issues

#### Issue: "Database connection failed"
**Solution:** Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file

#### Issue: "Email not sending"
**Solution:** Verify RESEND_API_KEY and check email service status

#### Issue: "Token invalid"
**Solution:** Ensure JWT_SECRET matches between requests, clear old tokens

#### Issue: "File upload fails"
**Solution:** Check file size (<10MB) and file type (allowed formats)

#### Issue: "CORS error"
**Solution:** Add your frontend URL to FRONTEND_URL in .env

### Getting Help

1. Check the logs: `logs/app.log` and `logs/error.log`
2. Run health check: `npm run health-check`
3. Verify database: `npm run verify-setup`
4. Check environment variables
5. Review API documentation

### Contact

For additional support or questions, please contact the development team.

---

**Last Updated:** January 14, 2024
**API Version:** 1.0.0
**Backend Version:** 1.0.0
