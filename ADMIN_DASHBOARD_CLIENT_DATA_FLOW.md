# Admin Dashboard Client Data Flow - Complete Guide

## Overview
This document explains how client data flows from upload to display in the admin dashboard, including file uploads, status updates, 20Q assessment loading, and troubleshooting.

---

## Part 1: File Upload System

### Client-Side Upload Flow

#### 1. Resume Upload
**Endpoint:** `POST /api/client/uploads/resume`

**Frontend Request:**
```javascript
const formData = new FormData();now for the 
formData.append('resume', fileObject); // File from input

const response = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/client/uploads/resume', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${clientToken}`
  },
  body: formData // Don't set Content-Type, browser sets it automatically
});
```

**Backend Process:**
1. Multer receives file (max 10MB)
2. Validates file type (PDF, DOC, DOCX only)
3. Uploads to Supabase Storage: `client-files/resumes/{clientId}/{timestamp}_{filename}`
4. Gets public URL from storage
5. Saves record to `client_files` table
6. Updates `clients` table `resume_url` field

**Success Response:**
```json
{
  "message": "Resume uploaded successfully",
  "resume_url": "https://...supabase.co/storage/v1/object/public/client-files/resumes/...",
  "file_name": "John_Doe_Resume.pdf",
  "file_size": 245678
}
```

#### 2. LinkedIn URL
**Endpoint:** `POST /api/client/uploads/linkedin`

**Request:**
```javascript
await fetch('/api/client/uploads/linkedin', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${clientToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    linkedin_url: 'https://linkedin.com/in/username'
  })
});
```

**Validation:** Must match pattern `https://linkedin.com/in/[username]`

#### 3. Portfolio URLs
**Endpoint:** `POST /api/client/uploads/portfolio`

**Request:**
```javascript
await fetch('/api/client/uploads/portfolio', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${clientToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    portfolio_urls: [
      'https://johndoe.com',
      'https://github.com/johndoe'
    ]
  })
});
```

**Rules:**
- Array of 1-5 URLs
- Must start with http:// or https://
- Each URL saved as separate record

---

## Part 2: Admin Dashboard Data Loading

### Loading Client Files

**Endpoint:** `GET /api/admin/clients/:id/files`

**Request:**
```javascript
const clientId = '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b';

const response = await fetch(
  `https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/clients/${clientId}/files`,
  {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }
);

const data = await response.json();
```

**Response Structure:**
```json
{
  "files": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "file_type": "resume",
      "filename": "Resume.pdf",
      "file_url": "https://...supabase.co/.../Resume.pdf",
      "file_size": 245678,
      "mime_type": "application/pdf",
      "uploaded_at": "2026-02-09T10:00:00Z"
    },
    {
      "id": "uuid",
      "file_type": "linkedin",
      "url": "https://linkedin.com/in/username",
      "uploaded_at": "2026-02-09T10:05:00Z"
    }
  ],
  "summary": {
    "resume_uploaded": true,
    "linkedin_added": true,
    "portfolio_added": true,
    "total_files": 4
  }
}
```

**Key Points:**
- Resume files have `file_url` field (direct link to PDF)
- LinkedIn/Portfolio have `url` field (external links)
- Use `file_type` to filter: `resume`, `linkedin`, `portfolio`

---

## Part 3: Loading 20 Questions Assessment

**Endpoint:** `GET /api/admin/clients/:id/onboarding`

**Request:**
```javascript
const response = await fetch(
  `https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/clients/${clientId}/onboarding`,
  {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }
);
```

**Response:**
```json
{
  "client": {
    "id": "uuid",
    "email": "john@example.com",
    "full_name": "John Doe",
    "onboarding_completed": true
  },
  "onboarding": {
    "id": "uuid",
    "client_id": "uuid",
    "q1": "Software Engineer, Full Stack Developer",
    "q2": "DevOps Engineer",
    "q3": "Sales, Marketing",
    "q4": "Remote",
    "q5": "North America",
    "q6": "Toronto, Vancouver",
    "q7": "None",
    "q8": "80000",
    "q8_currency": "CAD",
    "q9": "120000",
    "q9_currency": "CAD",
    "q10": "Yes",
    "q10a": "Minimum 6 months",
    "q11": "Canadian Citizen",
    "q12": "No",
    "q13": "Yes",
    "q14": "No",
    "q15": "Tobacco, Gambling",
    "q16": "Prefer not to say",
    "q17": "Not a veteran",
    "q18": "Prefer not to say",
    "q19": "Work-life balance, Career growth",
    "q20": "Looking for remote opportunities",
    "status": "pending_approval",
    "submitted_at": "2026-02-09T10:00:00Z"
  }
}
```

**If Not Submitted:**
```json
{
  "client": { ... },
  "onboarding": null
}
```

---

## Part 4: Complete Client Card (All Data)

**Endpoint:** `GET /api/admin/clients/:id/complete`

**This returns EVERYTHING in one call:**
- Basic client info
- Account status
- 20 Questions
- Files (resume, LinkedIn, portfolio)
- Strategy calls
- Applications
- Subscription

**Use this for client detail pages to minimize API calls.**

---

## Part 5: Status Updates & Real-Time Display

### How Status Updates Work

#### When Resume is Uploaded:
1. Client uploads file → `POST /api/client/uploads/resume`
2. Backend saves to `client_files` table with `is_active = true`
3. Backend updates `clients.resume_url`
4. Admin dashboard polls or refreshes → `GET /api/admin/clients/:id/files`
5. `summary.resume_uploaded` becomes `true`

#### Frontend Display Logic:
```javascript
// Check if resume exists
if (data.summary.resume_uploaded) {
  const resumeFile = data.files.find(f => f.file_type === 'resume');
  
  // Display resume link
  <a href={resumeFile.file_url} target="_blank">
    View Resume ({resumeFile.filename})
  </a>
}
```

---

## Part 6: Common Frontend Upload Errors & Fixes

### Error 1: "Failed to upload resume"
**Cause:** File too large or wrong format
**Fix:**
- Check file size < 10MB
- Only PDF, DOC, DOCX allowed
- Frontend validation:
```javascript
const file = event.target.files[0];
if (file.size > 10 * 1024 * 1024) {
  alert('File too large. Max 10MB');
  return;
}
if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
  alert('Only PDF, DOC, DOCX allowed');
  return;
}
```

### Error 2: "No resume file provided"
**Cause:** FormData not set correctly
**Fix:**
```javascript
// WRONG
const formData = new FormData();
formData.append('file', fileObject); // Wrong field name

// CORRECT
const formData = new FormData();
formData.append('resume', fileObject); // Must be 'resume'
```

### Error 3: "Invalid LinkedIn URL"
**Cause:** URL doesn't match required pattern
**Fix:**
```javascript
// Valid formats:
'https://linkedin.com/in/username'
'https://www.linkedin.com/in/username'
'https://linkedin.com/in/username/'

// Invalid:
'linkedin.com/in/username' // Missing https://
'https://linkedin.com/username' // Missing /in/
```

### Error 4: PDF not displaying in admin dashboard
**Cause:** Bucket is private
**Fix:** Run this SQL:
```sql
UPDATE storage.buckets
SET public = true
WHERE id = 'client-files';
```

### Error 5: CORS error on file upload
**Cause:** Missing or incorrect headers
**Fix:**
```javascript
// Don't set Content-Type for FormData
fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // NO Content-Type header!
  },
  body: formData
});
```

---

## Part 7: Frontend Implementation Examples

### Upload Resume Component

```javascript
import React, { useState } from 'react';

function ResumeUpload({ clientToken, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum 10MB allowed.');
      return;
    }

    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, DOC, and DOCX files are allowed.');
      return;
    }

    // Upload
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch(
        'https://jellyfish-app-t4m35.ondigitalocean.app/api/client/uploads/resume',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${clientToken}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      onUploadSuccess(data);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
  );
}
```

### Display Client Files in Admin Dashboard
```javascript
import React, { useState, useEffect } from 'react';

function AdminClientFiles({ clientId, adminToken }) {
  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, [clientId]);

  async function loadFiles() {
    try {
      const response = await fetch(
        `https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/clients/${clientId}/files`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );

      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading files...</div>;
  if (!files) return <div>No files found</div>;

  const resumeFile = files.files.find(f => f.file_type === 'resume');
  const linkedinFile = files.files.find(f => f.file_type === 'linkedin');
  const portfolioFiles = files.files.filter(f => f.file_type === 'portfolio');

  return (
    <div className="client-files">
      <h3>Client Files</h3>
      
      {/* Resume */}
      <div className="file-section">
        <h4>Resume</h4>
        {resumeFile ? (
          <div>
            <p>{resumeFile.filename}</p>
            <p>{(resumeFile.file_size / 1024).toFixed(2)} KB</p>
            <a href={resumeFile.file_url} target="_blank" rel="noopener noreferrer">
              View Resume
            </a>
          </div>
        ) : (
          <p>No resume uploaded</p>
        )}
      </div>

      {/* LinkedIn */}
      <div className="file-section">
        <h4>LinkedIn Profile</h4>
        {linkedinFile ? (
          <a href={linkedinFile.url} target="_blank" rel="noopener noreferrer">
            View Profile
          </a>
        ) : (
          <p>No LinkedIn profile added</p>
        )}
      </div>

      {/* Portfolio */}
      <div className="file-section">
        <h4>Portfolio URLs</h4>
        {portfolioFiles.length > 0 ? (
          <ul>
            {portfolioFiles.map(file => (
              <li key={file.id}>
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.url}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No portfolio URLs added</p>
        )}
      </div>
    </div>
  );
}
```

### Display 20Q Assessment
```javascript
function Admin20QView({ clientId, adminToken }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOnboarding();
  }, [clientId]);

  async function loadOnboarding() {
    try {
      const response = await fetch(
        `https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/clients/${clientId}/onboarding`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to load 20Q:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading assessment...</div>;
  if (!data?.onboarding) return <div>No assessment submitted yet</div>;

  const q = data.onboarding;

  return (
    <div className="twenty-q-view">
      <h3>{data.client.full_name}'s Career Assessment</h3>
      
      <section>
        <h4>Role Targeting</h4>
        <div>
          <label>Roles Wanted:</label>
          <p>{q.q1}</p>
        </div>
        <div>
          <label>Roles Open To:</label>
          <p>{q.q2 || 'Not specified'}</p>
        </div>
        <div>
          <label>Roles to Avoid:</label>
          <p>{q.q3 || 'None'}</p>
        </div>
      </section>

      <section>
        <h4>Location & Work</h4>
        <div>
          <label>Work Type:</label>
          <p>{q.q4}</p>
        </div>
        <div>
          <label>Location Scope:</label>
          <p>{q.q5}</p>
        </div>
        <div>
          <label>Target Cities:</label>
          <p>{q.q6}</p>
        </div>
      </section>

      <section>
        <h4>Compensation</h4>
        <div>
          <label>Minimum Salary:</label>
          <p>{q.q8} {q.q8_currency}</p>
        </div>
        <div>
          <label>Ideal Salary:</label>
          <p>{q.q9} {q.q9_currency}</p>
        </div>
        <div>
          <label>Contract Roles:</label>
          <p>{q.q10}</p>
          {q.q10 === 'Yes' && q.q10a && <p>Conditions: {q.q10a}</p>}
        </div>
      </section>

      <section>
        <h4>Additional Notes</h4>
        <p>{q.q20 || 'No additional notes'}</p>
      </section>

      <div className="status">
        <p>Status: {q.status}</p>
        <p>Submitted: {new Date(q.submitted_at).toLocaleString()}</p>
      </div>
    </div>
  );
}
```

---

## Part 8: Database Tables Reference

### client_files Table
```sql
- id (uuid, primary key)
- client_id (uuid, foreign key to registered_users)
- file_type (text: 'resume', 'linkedin', 'portfolio')
- filename (text, for resume files)
- file_url (text, for resume files - Supabase Storage URL)
- url (text, for linkedin/portfolio - external URLs)
- file_size (integer, bytes)
- mime_type (text)
- is_active (boolean, default true)
- uploaded_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

### client_onboarding_20q Table
```sql
- id (uuid, primary key)
- client_id (uuid, foreign key)
- user_id (uuid, foreign key)
- q1 through q20 (text fields)
- q8_currency, q9_currency (text)
- status (text: 'pending_approval', 'approved')
- completed (boolean)
- submitted_at (timestamp)
- approved_at (timestamp)
- approved_by (uuid)
```

---

## Part 9: Troubleshooting Checklist

### Frontend Upload Not Working
- [ ] Check file size < 10MB
- [ ] Check file type (PDF, DOC, DOCX only)
- [ ] Verify Authorization header has valid token
- [ ] Don't set Content-Type header for FormData
- [ ] Field name must be 'resume' not 'file'
- [ ] Check browser console for CORS errors
- [ ] Verify API URL is correct

### PDF Not Displaying in Admin Dashboard
- [ ] Run SQL: `UPDATE storage.buckets SET public = true WHERE id = 'client-files';`
- [ ] Check file_url field is not null
- [ ] Test URL directly in browser
- [ ] Check browser console for 403/404 errors

### 20Q Not Loading
- [ ] Verify client has completed onboarding
- [ ] Check `client_onboarding_20q` table has record
- [ ] Verify admin token is valid
- [ ] Check client_id is correct UUID

### Status Not Updating
- [ ] Frontend needs to refresh/poll after upload
- [ ] Check `is_active = true` in client_files table
- [ ] Verify backend saved record successfully
- [ ] Check response from upload endpoint

---

## Part 10: API Endpoint Summary

| Purpose | Method | Endpoint | Auth |
|---------|--------|----------|------|
| Upload Resume | POST | `/api/client/uploads/resume` | Client |
| Add LinkedIn | POST | `/api/client/uploads/linkedin` | Client |
| Add Portfolio | POST | `/api/client/uploads/portfolio` | Client |
| Get Upload Status | GET | `/api/client/uploads/status` | Client |
| Delete Resume | DELETE | `/api/client/uploads/resume` | Client |
| View Client Files | GET | `/api/admin/clients/:id/files` | Admin |
| View 20Q | GET | `/api/admin/clients/:id/onboarding` | Admin |
| Complete Client Card | GET | `/api/admin/clients/:id/complete` | Admin |

---

## Quick Reference: Field Names

**Resume Files:**
- Use `file_url` field (not `url`)
- Has `filename`, `file_size`, `mime_type`

**LinkedIn/Portfolio:**
- Use `url` field (not `file_url`)
- No filename or file_size

**20Q Questions:**
- q1-q20 are the answer fields
- q8_currency, q9_currency for salary currency
- q10a, q11a, q14a are conditional follow-ups

---

**Document Version:** 1.0  
**Last Updated:** February 10, 2026
