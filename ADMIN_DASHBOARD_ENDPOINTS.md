# Admin Dashboard API Endpoints

## Base URL
```
Production: https://apply-bureau-backend.vercel.app
```

## Authentication
All admin endpoints require JWT token in Authorization header:
```javascript
headers: {
  'Authorization': `Bearer ${adminToken}`,
  'Content-Type': 'application/json'
}
```

---

## 🔐 Authentication Endpoints

### Admin Login
```http
POST /api/auth/login
```

**Request Body:**
```json
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

---

## 📋 Consultation Request Endpoints

### 1. Get All Consultation Requests
```http
GET /api/consultation-requests
```

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `under_review`, `approved`, `rejected`, `scheduled`, `completed`)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `search` (optional): Search in name, email, or role targets

**Example Request:**
```javascript
const response = await fetch('/api/consultation-requests?status=pending&limit=20', {
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});
```

**Response:**
```json
[
  {
    "id": "9a0cd4cf-e6fd-49d7-a2c9-f6aa7241347f",
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "role_targets": "Software Engineer, Full Stack Developer",
    "location_preferences": "San Francisco, Remote",
    "minimum_salary": "120000",
    "target_market": "Tech Startups",
    "employment_status": "Currently Employed",
    "package_interest": "Tier 2",
    "area_of_concern": "Interview preparation and salary negotiation",
    "consultation_window": "Next 2 weeks",
    "pdf_url": "https://supabase-url/consultation-resumes/file.pdf",
    "pdf_path": "consultation_123456_John_Doe.pdf",
    "status": "pending",
    "pipeline_status": "lead",
    "created_at": "2026-01-09T18:02:04.649Z",
    "processed_by": null,
    "processed_at": null,
    "admin_notes": null
  }
]
```

### 2. Get Specific Consultation Request
```http
GET /api/consultation-requests/{id}
```

**Example:**
```javascript
const response = await fetch('/api/consultation-requests/9a0cd4cf-e6fd-49d7-a2c9-f6aa7241347f', {
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});
```

### 3. Update Consultation Status
```http
PATCH /api/consultation-requests/{id}
```

**Request Body (Regular Status Update):**
```json
{
  "status": "under_review",
  "admin_notes": "Reviewing candidate background and requirements"
}
```

**Request Body (Approve with Registration Token):**
```json
{
  "action": "approve",
  "admin_notes": "Great candidate, approved for Tier 2 service"
}
```

**Request Body (Reject):**
```json
{
  "action": "reject",
  "admin_notes": "Not a good fit for current service offerings"
}
```

**Response (Approval):**
```json
{
  "message": "Consultation approved and registration token generated",
  "consultation": {
    "id": "9a0cd4cf-e6fd-49d7-a2c9-f6aa7241347f",
    "status": "approved",
    "pipeline_status": "approved",
    "registration_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_expires_at": "2026-01-16T18:02:04.649Z"
  },
  "registration_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📊 Dashboard Statistics Endpoints

### Get Admin Dashboard Stats
```http
GET /api/admin/stats
```

**Response:**
```json
{
  "system": {
    "uptime": "2.5 hours",
    "memory": "118MB",
    "environment": "production"
  },
  "cache": {
    "hits": 150,
    "misses": 25,
    "size": 45
  },
  "security": {
    "blocked_requests": 5,
    "rate_limited": 2
  }
}
```

### Get Enhanced Dashboard Data
```http
GET /api/enhanced-dashboard
```

**Response:**
```json
{
  "consultations": {
    "total": 25,
    "pending": 8,
    "approved": 12,
    "rejected": 3,
    "completed": 2
  },
  "recent_activity": [
    {
      "type": "consultation_submitted",
      "user": "John Doe",
      "timestamp": "2026-01-09T18:02:04.649Z"
    }
  ]
}
```

---

## 👥 Client Management Endpoints

### Get All Registered Clients
```http
GET /api/admin/clients
```

### Get Client Profile
```http
GET /api/admin/clients/{clientId}
```

---

## 📁 File Management Endpoints

### Download PDF Resume
```http
GET /api/consultation-requests/{id}/pdf
Authorization: Bearer {adminToken}
```

**Example:**
```javascript
const downloadPDF = async (consultationId) => {
  const response = await fetch(`/api/consultation-requests/${consultationId}/pdf`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  if (response.ok) {
    // Get the PDF as a blob
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consultation_${consultationId}.pdf`;
    link.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
  } else {
    console.error('Failed to download PDF');
  }
};
```

**Response:**
- **Success**: PDF file content (binary data)
- **Headers**: 
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="John_Doe_resume.pdf"`
  - `Content-Length: [file size]`

**Error Responses:**
```json
// 404 - No PDF found
{
  "error": "No PDF file found for this consultation"
}

// 500 - Download failed
{
  "error": "Failed to download PDF file"
}
```

### Alternative: Direct PDF Access (Legacy)
```http
GET {pdf_url}
```

The `pdf_url` from consultation requests can be accessed directly. Example:
```javascript
// From consultation data
const pdfUrl = consultation.pdf_url;

// Create download link
const downloadLink = document.createElement('a');
downloadLink.href = pdfUrl;
downloadLink.download = consultation.pdf_path || 'resume.pdf';
downloadLink.click();
```

---

## 🔍 Search and Filter Examples

### Search Consultations
```javascript
// Search by name or email
const searchResults = await fetch('/api/consultation-requests?search=john', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

// Filter by status
const pendingConsultations = await fetch('/api/consultation-requests?status=pending', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

// Pagination
const page2 = await fetch('/api/consultation-requests?limit=10&offset=10', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
```

---

## 📱 Frontend Integration Examples

### React Admin Dashboard Component
```jsx
import React, { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchConsultations();
  }, [filter]);

  const fetchConsultations = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = filter === 'all' 
        ? '/api/consultation-requests'
        : `/api/consultation-requests?status=${filter}`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setConsultations(data);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (consultationId, action, notes = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/consultation-requests/${consultationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action,
          admin_notes: notes
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        // Refresh consultations
        fetchConsultations();
        
        if (action === 'approve') {
          alert(`Consultation approved! Registration token: ${result.registration_token}`);
        }
      } else {
        alert('Error updating consultation: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating consultation:', error);
    }
  };

  const downloadPDF = async (consultation) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/consultation-requests/${consultation.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Get the PDF as a blob
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = consultation.pdf_path || `${consultation.full_name}_resume.pdf`;
        link.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
      } else {
        const error = await response.json();
        alert('Error downloading PDF: ' + error.error);
      }
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Failed to download PDF');
    }
  };

  if (loading) return <div>Loading consultations...</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      {/* Filter Controls */}
      <div className="filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Consultations</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Consultations List */}
      <div className="consultations-list">
        {consultations.map(consultation => (
          <div key={consultation.id} className="consultation-card">
            <div className="consultation-header">
              <h3>{consultation.full_name}</h3>
              <span className={`status ${consultation.status}`}>
                {consultation.status}
              </span>
            </div>
            
            <div className="consultation-details">
              <p><strong>Email:</strong> {consultation.email}</p>
              <p><strong>Phone:</strong> {consultation.phone}</p>
              <p><strong>Role Targets:</strong> {consultation.role_targets}</p>
              <p><strong>Package Interest:</strong> {consultation.package_interest}</p>
              <p><strong>Employment Status:</strong> {consultation.employment_status}</p>
              <p><strong>Submitted:</strong> {new Date(consultation.created_at).toLocaleDateString()}</p>
              
              {consultation.pdf_url && (
                <button 
                  onClick={() => downloadPDF(consultation)}
                  className="download-pdf-btn"
                >
                  📄 Download Resume
                </button>
              )}
            </div>

            {consultation.status === 'pending' && (
              <div className="actions">
                <button 
                  onClick={() => handleStatusUpdate(consultation.id, 'approve')}
                  className="approve-btn"
                >
                  ✅ Approve
                </button>
                <button 
                  onClick={() => handleStatusUpdate(consultation.id, 'reject')}
                  className="reject-btn"
                >
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
```

---

## 🚨 Error Handling

### Common Error Responses
```json
// 401 Unauthorized
{
  "error": "Access token required"
}

// 403 Forbidden
{
  "error": "Admin access required"
}

// 404 Not Found
{
  "error": "Consultation request not found"
}

// 500 Server Error
{
  "error": "Failed to fetch consultation requests"
}
```

### Error Handling Example
```javascript
const fetchConsultations = async () => {
  try {
    const response = await fetch('/api/consultation-requests', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Redirect to login
        window.location.href = '/admin/login';
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

---

## 📋 Quick Reference

### Available Status Values
- `pending` - New consultation request
- `under_review` - Admin is reviewing
- `approved` - Approved, registration token generated
- `rejected` - Rejected by admin
- `scheduled` - Meeting scheduled
- `completed` - Consultation completed
- `registered` - Client has registered (pipeline status: client)

### Available Actions
- `approve` - Approve consultation and generate registration token
- `reject` - Reject consultation with reason

### PDF Display
- Use `pdf_url` field to display/download PDFs
- Check if `pdf_url` exists before showing download button
- Use `pdf_path` for filename when downloading