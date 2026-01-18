# **COMPLETE DASHBOARD API INTEGRATION GUIDE**

## **🚨 AUTHENTICATION ISSUE DIAGNOSIS**

### **Problem**: Frontend getting 401 errors for contacts/consultations
### **Root Cause**: Authentication middleware is working correctly - issue is with frontend token handling

---

## **🔐 AUTHENTICATION FLOW**

### **Step 1: Login**
```javascript
// Frontend Login Request
const loginResponse = await fetch('https://apply-bureau-backend.vercel.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@applybureau.com',
    password: 'your_password'
  })
});

const loginData = await loginResponse.json();

// Response Format:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@applybureau.com",
    "full_name": "Admin User",
    "role": "admin",
    "dashboard_type": "admin"
  }
}
```

### **Step 2: Store Token**
```javascript
// Store token in localStorage or secure storage
localStorage.setItem('authToken', loginData.token);
localStorage.setItem('user', JSON.stringify(loginData.user));
```

### **Step 3: Use Token in Requests**
```javascript
// Get stored token
const token = localStorage.getItem('authToken');

// Make authenticated request
const response = await fetch('https://apply-bureau-backend.vercel.app/api/contact', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});
```

---

## **📊 DASHBOARD ENDPOINTS REFERENCE**

### **BASE URL**
```
Production: https://apply-bureau-backend.vercel.app
```

---

## **🔑 AUTHENTICATION ENDPOINTS**

### **POST /api/auth/login**
**Purpose**: Authenticate user and get token
```javascript
// Request
{
  "email": "admin@applybureau.com",
  "password": "your_password"
}

// Response
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "admin@applybureau.com",
    "full_name": "Admin User",
    "role": "admin",
    "dashboard_type": "admin"
  }
}
```

### **GET /api/auth/me**
**Purpose**: Get current user info (verify token)
```javascript
// Headers Required
{
  "Authorization": "Bearer <token>"
}

// Response
{
  "user": {
    "id": "uuid",
    "email": "admin@applybureau.com",
    "full_name": "Admin User",
    "role": "admin",
    "dashboard_type": "admin",
    "permissions": {
      "can_create_admins": true,
      "can_delete_admins": true,
      "can_manage_clients": true
    }
  }
}
```

---

## **👥 CONTACT MANAGEMENT ENDPOINTS**

### **GET /api/contact**
**Purpose**: Get all contact form submissions (Admin Only)
**Auth**: Required (Admin role)
```javascript
// Request
const contacts = await fetch('/api/contact?page=1&limit=10&status=new', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Response
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
      "created_at": "2024-01-15T10:00:00Z",
      "admin_notes": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### **PATCH /api/contact/:id**
**Purpose**: Update contact submission status
```javascript
// Request
await fetch(`/api/contact/${contactId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'resolved',
    admin_notes: 'Issue resolved via email'
  })
});

// Response
{
  "message": "Contact submission updated successfully",
  "contact": { /* updated contact object */ }
}
```

---

## **📅 CONSULTATION MANAGEMENT ENDPOINTS**

### **GET /api/consultation-requests**
**Purpose**: Get all consultation requests (Admin Only)
**Auth**: Required (Admin role)
```javascript
// Request
const consultations = await fetch('/api/consultation-requests?page=1&limit=20&status=pending', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "message": "I need career guidance",
      "preferredSlots": [
        "2024-01-20 14:00",
        "2024-01-21 10:00"
      ],
      "requestType": "consultation_booking",
      "company": "Current Corp",
      "job_title": "Marketing Manager",
      "consultation_type": "career_strategy",
      "urgency_level": "normal",
      "source": "website",
      "status": "pending",
      "pipeline_status": "lead",
      "priority": "medium",
      "created_at": "2024-01-15T10:00:00Z",
      "admin_notes": null,
      "confirmedSlot": null,
      "scheduled_datetime": null,
      "google_meet_link": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **PATCH /api/consultation-requests/:id**
**Purpose**: Update consultation status
```javascript
// Request
await fetch(`/api/consultation-requests/${consultationId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'confirmed',
    admin_notes: 'Consultation confirmed for Monday',
    confirmedSlot: '2024-01-20 14:00',
    google_meet_link: 'https://meet.google.com/abc-def-ghi'
  })
});
```

---

## **📊 ADMIN DASHBOARD ENDPOINTS**

### **GET /api/admin-dashboard**
**Purpose**: Main admin dashboard with comprehensive stats
**Auth**: Required (Admin role)
```javascript
// Request
const dashboard = await fetch('/api/admin-dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Response
{
  "admin": {
    "id": "uuid",
    "full_name": "Admin User",
    "email": "admin@applybureau.com",
    "role": "admin",
    "permissions": {
      "can_create_admins": true,
      "can_delete_admins": true,
      "can_manage_clients": true,
      "can_schedule_consultations": true,
      "can_view_reports": true,
      "can_manage_system": true
    }
  },
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
    }
  },
  "recent_activity": {
    "new_clients": [/* recent clients */],
    "upcoming_consultations": [/* upcoming consultations */],
    "recent_applications": [/* recent applications */]
  }
}
```

### **GET /api/admin-dashboard/clients**
**Purpose**: Get all clients for admin management
```javascript
// Request with filters
const clients = await fetch('/api/admin-dashboard/clients?status=active&limit=50&search=john', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Response
{
  "clients": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "onboarding_complete": true,
      "created_at": "2024-01-01T00:00:00Z",
      "last_login_at": "2024-01-15T10:00:00Z",
      "current_job_title": "Software Engineer",
      "current_company": "Tech Corp"
    }
  ],
  "total": 150,
  "offset": 0,
  "limit": 50
}
```

### **GET /api/admin-dashboard/analytics**
**Purpose**: Detailed analytics for charts and reports
```javascript
// Request with time period
const analytics = await fetch('/api/admin-dashboard/analytics?period=30d', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Response
{
  "period": "30d",
  "client_growth": [
    { "date": "2024-01-15", "count": 3 },
    { "date": "2024-01-16", "count": 5 }
  ],
  "consultation_trends": [
    { "date": "2024-01-15", "count": 8 }
  ],
  "application_trends": [
    { "date": "2024-01-15", "count": 25 }
  ],
  "success_metrics": {
    "onboarding_rate": "85.5",
    "consultation_completion_rate": "92.3",
    "application_success_rate": "4.2"
  }
}
```

---

## **📱 CLIENT DASHBOARD ENDPOINTS**

### **GET /api/dashboard**
**Purpose**: Main client dashboard data
**Auth**: Required (Client role)
```javascript
// Request
const dashboard = await fetch('/api/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Response
{
  "client": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "onboarding_complete": true,
    "resume_url": "https://storage.url/resume.pdf"
  },
  "stats": {
    "total_applications": 25,
    "pending_applications": 10,
    "interviews_scheduled": 3,
    "offers_received": 1,
    "upcoming_consultations": 2,
    "unread_notifications": 5,
    "success_rate": "4.0"
  },
  "recent_applications": [
    {
      "id": "uuid",
      "job_title": "Software Engineer",
      "company": "Tech Corp",
      "status": "applied",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "upcoming_consultations": [
    {
      "id": "uuid",
      "scheduled_at": "2024-01-20T14:00:00Z",
      "status": "scheduled",
      "type": "initial"
    }
  ]
}
```

### **GET /api/client/dashboard**
**Purpose**: Enhanced client dashboard with workflow status
```javascript
// Response includes onboarding progress
{
  "client": {
    "id": "uuid",
    "full_name": "John Doe",
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
    "confirmed_time": "2024-01-20T14:00:00Z",
    "meeting_link": "https://meet.google.com/abc-def-ghi"
  },
  "applications": {
    "total_count": 25,
    "active_count": 13,
    "can_view": true
  },
  "next_steps": [
    {
      "action": "view_applications",
      "title": "Application Tracker",
      "description": "25 applications submitted, 13 active",
      "priority": 4,
      "required": false,
      "active": true
    }
  ]
}
```

---

## **📋 APPLICATION TRACKING ENDPOINTS**

### **GET /api/applications**
**Purpose**: Get client's applications (Client only)
**Auth**: Required (Client role)
```javascript
// Request with pagination and filters
const applications = await fetch('/api/applications?page=1&limit=20&status=applied&sort=applied_date', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "company": "Tech Corp",
      "role": "Software Engineer",
      "status": "applied",
      "applied_date": "2024-01-15",
      "job_link": "https://company.com/jobs/123",
      "salary_range": "$80,000 - $120,000",
      "location": "San Francisco, CA",
      "interview_date": null,
      "offer_amount": null,
      "notes": "Applied through company website"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## **🔔 NOTIFICATION ENDPOINTS**

### **GET /api/notifications**
**Purpose**: Get user notifications
**Auth**: Required
```javascript
// Request with filters
const notifications = await fetch('/api/notifications?read=false&category=applications&limit=10', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Response
{
  "notifications": [
    {
      "id": "uuid",
      "title": "Application Update",
      "message": "Your application status has been updated",
      "type": "application_update",
      "category": "applications",
      "priority": "medium",
      "is_read": false,
      "created_at": "2024-01-15T10:00:00Z",
      "data": {
        "application_id": "uuid",
        "new_status": "interview"
      }
    }
  ],
  "stats": {
    "total_unread": 5,
    "by_category": {
      "applications": 3,
      "consultations": 1,
      "system": 1
    }
  }
}
```

### **PATCH /api/notifications/:id/read**
**Purpose**: Mark notification as read
```javascript
await fetch(`/api/notifications/${notificationId}/read`, {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## **🛠️ FRONTEND IMPLEMENTATION EXAMPLES**

### **React Hook for Authentication**
```javascript
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Verify token on app load
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          // Token invalid, clear it
          localStorage.removeItem('authToken');
          setToken(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('authToken');
        setToken(null);
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  return { user, token, login, logout, loading };
};
```

### **API Service Class**
```javascript
class ApiService {
  constructor() {
    this.baseURL = 'https://apply-bureau-backend.vercel.app';
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      return;
    }

    return response.json();
  }

  // Dashboard methods
  async getAdminDashboard() {
    return this.request('/api/admin-dashboard');
  }

  async getContacts(page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams({ page, limit, ...filters });
    return this.request(`/api/contact?${params}`);
  }

  async getConsultations(page = 1, limit = 20, filters = {}) {
    const params = new URLSearchParams({ page, limit, ...filters });
    return this.request(`/api/consultation-requests?${params}`);
  }

  async updateContactStatus(id, status, notes) {
    return this.request(`/api/contact/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_notes: notes })
    });
  }

  async updateConsultationStatus(id, updates) {
    return this.request(`/api/consultation-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }
}

export const apiService = new ApiService();
```

### **Dashboard Component Example**
```javascript
import React, { useState, useEffect } from 'react';
import { apiService } from './services/api';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dashboard, contactsData, consultationsData] = await Promise.all([
        apiService.getAdminDashboard(),
        apiService.getContacts(1, 10),
        apiService.getConsultations(1, 10)
      ]);

      setDashboardData(dashboard);
      setContacts(contactsData.contacts || []);
      setConsultations(consultationsData.data || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Clients</h3>
          <p>{dashboardData?.stats?.clients?.total_clients || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Active Consultations</h3>
          <p>{dashboardData?.stats?.consultations?.scheduled_consultations || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Applications</h3>
          <p>{dashboardData?.stats?.applications?.total_applications || 0}</p>
        </div>
      </div>

      {/* Recent Contacts */}
      <div className="contacts-section">
        <h2>Recent Contacts</h2>
        <div className="contacts-list">
          {contacts.map(contact => (
            <div key={contact.id} className="contact-item">
              <h4>{contact.name}</h4>
              <p>{contact.email}</p>
              <p>{contact.subject}</p>
              <span className={`status ${contact.status}`}>{contact.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Consultations */}
      <div className="consultations-section">
        <h2>Recent Consultations</h2>
        <div className="consultations-list">
          {consultations.map(consultation => (
            <div key={consultation.id} className="consultation-item">
              <h4>{consultation.fullName}</h4>
              <p>{consultation.email}</p>
              <p>{consultation.consultation_type}</p>
              <span className={`status ${consultation.status}`}>{consultation.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
```

---

## **🚨 TROUBLESHOOTING 401 ERRORS**

### **Common Causes & Solutions**

1. **Missing Authorization Header**
   ```javascript
   // ❌ Wrong
   fetch('/api/contact')
   
   // ✅ Correct
   fetch('/api/contact', {
     headers: { 'Authorization': `Bearer ${token}` }
   })
   ```

2. **Incorrect Token Format**
   ```javascript
   // ❌ Wrong
   headers: { 'Authorization': token }
   
   // ✅ Correct
   headers: { 'Authorization': `Bearer ${token}` }
   ```

3. **Expired Token**
   ```javascript
   // Check token expiration
   const tokenParts = token.split('.');
   const payload = JSON.parse(atob(tokenParts[1]));
   const isExpired = payload.exp * 1000 < Date.now();
   
   if (isExpired) {
     // Redirect to login
     window.location.href = '/login';
   }
   ```

4. **Token Not Stored**
   ```javascript
   // After successful login
   localStorage.setItem('authToken', response.data.token);
   ```

5. **CORS Issues**
   ```javascript
   // Ensure credentials are included if needed
   fetch('/api/contact', {
     credentials: 'include',
     headers: { 'Authorization': `Bearer ${token}` }
   })
   ```

---

## **✅ TESTING CHECKLIST**

### **Authentication Flow**
- [ ] Login endpoint returns token
- [ ] Token is stored correctly
- [ ] Token is included in request headers
- [ ] 401 responses trigger re-authentication
- [ ] Logout clears token

### **Dashboard Data**
- [ ] Admin dashboard loads stats
- [ ] Contact list displays correctly
- [ ] Consultation list displays correctly
- [ ] Pagination works
- [ ] Filters work
- [ ] Status updates work

### **Error Handling**
- [ ] 401 errors redirect to login
- [ ] Network errors show user-friendly messages
- [ ] Loading states are shown
- [ ] Empty states are handled

---

## **🔗 QUICK REFERENCE URLs**

```
Base URL: https://apply-bureau-backend.vercel.app

Authentication:
POST /api/auth/login
GET  /api/auth/me

Admin Dashboard:
GET  /api/admin-dashboard
GET  /api/admin-dashboard/clients
GET  /api/admin-dashboard/analytics

Contact Management:
GET    /api/contact
PATCH  /api/contact/:id

Consultation Management:
GET    /api/consultation-requests
PATCH  /api/consultation-requests/:id

Client Dashboard:
GET  /api/dashboard
GET  /api/client/dashboard

Applications:
GET  /api/applications

Notifications:
GET    /api/notifications
PATCH  /api/notifications/:id/read
```

This guide provides everything needed to integrate the frontend with the backend dashboard APIs. The authentication is working correctly - the issue is likely in the frontend token handling implementation.