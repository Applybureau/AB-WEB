# Admin Client View Endpoints

**Production URL:** `https://jellyfish-app-t4m35.ondigitalocean.app`  
**Authentication:** Required (Admin role)  
**Header:** `Authorization: Bearer <admin_token>`

---

## 1. View Client's 20 Questions Assessment

### Endpoint
```
GET /api/admin/clients/:id/onboarding
```

### URL Parameters
- `:id` - Client's UUID (e.g., `14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b`)

### Request Example
```javascript
const clientId = '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b';

const response = await fetch(
  `https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/clients/${clientId}/onboarding`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }
);

const data = await response.json();
```

### Response Format (200 OK)
```json
{
  "client": {
    "id": "14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b",
    "email": "john@example.com",
    "full_name": "John Doe",
    "onboarding_completed": true,
    "onboarding_approved": false
  },
  "onboarding": {
    "id": "onboarding-uuid",
    "client_id": "14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b",
    
    "q1": "Software Engineer, Full Stack Developer, Backend Engineer",
    "q2": "DevOps Engineer, Cloud Architect",
    "q3": "Sales, Marketing, Customer Support",
    
    "q4": "Remote",
    "q5": "North America",
    "q6": "Toronto, Vancouver, New York, San Francisco",
    "q7": "None",
    
    "q8": "80000",
    "q8_currency": "CAD",
    "q9": "120000",
    "q9_currency": "CAD",
    "q10": "Yes",
    "q10a": "Minimum 6 months contract, prefer 12+ months",
    
    "q11": "Canadian Citizen",
    "q11a": null,
    "q12": "No",
    "q13": "Yes",
    "q14": "No",
    "q14a": null,
    "q15": "Tobacco, Gambling, Adult entertainment",
    
    "q16": "Prefer not to say",
    "q17": "Not a veteran",
    "q18": "Prefer not to say",
    
    "q19": "Work-life balance, Career growth, Competitive salary, Remote work",
    
    "q20": "I'm looking for a role that allows me to work remotely and grow my technical skills. I'm particularly interested in companies with strong engineering cultures.",
    
    "status": "pending_approval",
    "submitted_at": "2026-02-09T10:00:00Z",
    "approved_at": null,
    "approved_by": null
  }
}
```

### Response When No Assessment Submitted
```json
{
  "client": {
    "id": "14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b",
    "email": "john@example.com",
    "full_name": "John Doe",
    "onboarding_completed": false,
    "onboarding_approved": false
  },
  "onboarding": null
}
```

### 20 Questions Field Reference

| Field | Section | Description | Type |
|-------|---------|-------------|------|
| `q1` | Role Targeting | Roles wanted | String (comma-separated) |
| `q2` | Role Targeting | Roles open to | String (comma-separated) |
| `q3` | Role Targeting | Roles to avoid | String (comma-separated) |
| `q4` | Location & Work | Work type | String (Remote/Hybrid/On-site) |
| `q5` | Location & Work | Location scope | String |
| `q6` | Location & Work | Target cities | String (comma-separated) |
| `q7` | Location & Work | Locations to exclude | String |
| `q8` | Compensation | Minimum salary | String (number) |
| `q8_currency` | Compensation | Minimum salary currency | String (CAD/USD) |
| `q9` | Compensation | Ideal salary | String (number) |
| `q9_currency` | Compensation | Ideal salary currency | String (CAD/USD) |
| `q10` | Compensation | Accept contract roles | String (Yes/No) |
| `q10a` | Compensation | Contract conditions | String |
| `q11` | Application Rules | Work authorization | String |
| `q11a` | Application Rules | Work auth details | String |
| `q12` | Application Rules | Visa sponsorship | String (Yes/No) |
| `q13` | Application Rules | Willing to relocate | String (Yes/No) |
| `q14` | Application Rules | Driver's license required | String (Yes/No) |
| `q14a` | Application Rules | License type held | String |
| `q15` | Application Rules | Industries to avoid | String (comma-separated) |
| `q16` | Disclosures | Disability status | String |
| `q17` | Disclosures | Veteran status | String |
| `q18` | Disclosures | Demographic self-ID | String |
| `q19` | Priorities | Career priorities | String (comma-separated) |
| `q20` | Final Notes | Additional notes | String (free text) |

---

## 2. View Client's Uploaded Files

### Endpoint
```
GET /api/admin/clients/:id/files
```

### URL Parameters
- `:id` - Client's UUID

### Request Example
```javascript
const clientId = '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b';

const response = await fetch(
  `https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/clients/${clientId}/files`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }
);

const data = await response.json();
```

### Response Format (200 OK)
```json
{
  "files": [
    {
      "id": "file-uuid-1",
      "client_id": "14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b",
      "file_type": "resume",
      "filename": "John_Doe_Resume.pdf",
      "file_url": "https://abcdefgh.supabase.co/storage/v1/object/public/client-files/resumes/14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b/1707480000000_John_Doe_Resume.pdf",
      "url": null,
      "file_size": 245678,
      "mime_type": "application/pdf",
      "is_active": true,
      "uploaded_at": "2026-02-09T10:00:00Z",
      "created_at": "2026-02-09T10:00:00Z",
      "updated_at": "2026-02-09T10:00:00Z"
    },
    {
      "id": "file-uuid-2",
      "client_id": "14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b",
      "file_type": "linkedin",
      "filename": null,
      "file_url": null,
      "url": "https://linkedin.com/in/johndoe",
      "file_size": null,
      "mime_type": null,
      "is_active": true,
      "uploaded_at": "2026-02-09T10:05:00Z",
      "created_at": "2026-02-09T10:05:00Z",
      "updated_at": "2026-02-09T10:05:00Z"
    },
    {
      "id": "file-uuid-3",
      "client_id": "14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b",
      "file_type": "portfolio",
      "filename": null,
      "file_url": null,
      "url": "https://johndoe.com",
      "file_size": null,
      "mime_type": null,
      "is_active": true,
      "uploaded_at": "2026-02-09T10:10:00Z",
      "created_at": "2026-02-09T10:10:00Z",
      "updated_at": "2026-02-09T10:10:00Z"
    },
    {
      "id": "file-uuid-4",
      "client_id": "14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b",
      "file_type": "portfolio",
      "filename": null,
      "file_url": null,
      "url": "https://github.com/johndoe",
      "file_size": null,
      "mime_type": null,
      "is_active": true,
      "uploaded_at": "2026-02-09T10:10:00Z",
      "created_at": "2026-02-09T10:10:00Z",
      "updated_at": "2026-02-09T10:10:00Z"
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

### File Types Explained

#### 1. Resume Files (`file_type: "resume"`)
- **Has:** `filename`, `file_url`, `file_size`, `mime_type`
- **URL Field:** `file_url` (direct download link)
- **Clickable:** Yes, opens PDF/DOC in browser
- **Example:**
  ```json
  {
    "file_type": "resume",
    "filename": "John_Doe_Resume.pdf",
    "file_url": "https://...supabase.co/storage/.../resume.pdf",
    "file_size": 245678,
    "mime_type": "application/pdf"
  }
  ```

#### 2. LinkedIn Profile (`file_type: "linkedin"`)
- **Has:** `url` (LinkedIn profile URL)
- **URL Field:** `url` (not `file_url`)
- **Clickable:** Yes, opens LinkedIn profile
- **Example:**
  ```json
  {
    "file_type": "linkedin",
    "url": "https://linkedin.com/in/johndoe",
    "filename": null,
    "file_url": null
  }
  ```

#### 3. Portfolio URLs (`file_type: "portfolio"`)
- **Has:** `url` (website/GitHub/Behance URL)
- **URL Field:** `url` (not `file_url`)
- **Clickable:** Yes, opens external website
- **Multiple:** Client can have up to 5 portfolio URLs
- **Example:**
  ```json
  {
    "file_type": "portfolio",
    "url": "https://johndoe.com",
    "filename": null,
    "file_url": null
  }
  ```

---

## 3. Complete Client Card (All Data in One Call)

### Endpoint
```
GET /api/admin/clients/:id/complete
```

### Description
Returns ALL client data including 20Q, files, strategy calls, applications, and subscription in a single API call.

### Request Example
```javascript
const clientId = '14e43f88-c8d3-4979-8ec3-b65d8ab4fa4b';

const response = await fetch(
  `https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/clients/${clientId}/complete`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }
);

const data = await response.json();
```

### Response Structure
```json
{
  "basic_info": { ... },
  "account_status": { ... },
  "twenty_questions": {
    "roles_wanted": "Software Engineer, Full Stack Developer",
    "roles_open_to": "DevOps Engineer",
    "roles_to_avoid": "Sales",
    "work_type": "Remote",
    "location_scope": "North America",
    "target_cities": "Toronto, Vancouver",
    "locations_to_exclude": "None",
    "minimum_salary": "80000",
    "minimum_salary_currency": "CAD",
    "ideal_salary": "120000",
    "ideal_salary_currency": "CAD",
    "contract_roles": "Yes",
    "contract_conditions": "Minimum 6 months",
    "work_authorization": "Canadian Citizen",
    "work_authorization_details": null,
    "visa_sponsorship": "No",
    "willing_to_relocate": "Yes",
    "drivers_license_required": "No",
    "license_type_held": null,
    "industries_to_avoid": "Tobacco, Gambling",
    "disability_status": "Prefer not to say",
    "veteran_status": "Not a veteran",
    "demographic_self_id": "Prefer not to say",
    "priorities": "Work-life balance, Career growth",
    "additional_notes": "Looking for remote opportunities",
    "status": "pending_approval",
    "submitted_at": "2026-02-09T10:00:00Z",
    "approved_at": null,
    "approved_by": null
  },
  "files": {
    "resume": {
      "filename": "John_Doe_Resume.pdf",
      "url": "https://...supabase.co/storage/.../resume.pdf",
      "size": 245678,
      "uploaded_at": "2026-02-09T10:00:00Z"
    },
    "linkedin": {
      "url": "https://linkedin.com/in/johndoe",
      "added_at": "2026-02-09T10:05:00Z"
    },
    "portfolio": [
      {
        "url": "https://johndoe.com",
        "added_at": "2026-02-09T10:10:00Z"
      },
      {
        "url": "https://github.com/johndoe",
        "added_at": "2026-02-09T10:10:00Z"
      }
    ],
    "all_files": [ ... ]
  },
  "strategy_calls": { ... },
  "applications": { ... },
  "subscription": { ... },
  "career_profile": { ... }
}
```

---

## Frontend Integration Examples

### Display 20 Questions in Admin UI

```javascript
import React, { useState, useEffect } from 'react';

function AdminClient20QView({ clientId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const adminToken = localStorage.getItem('admin_token');

  useEffect(() => {
    loadClientOnboarding();
  }, [clientId]);

  async function loadClientOnboarding() {
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

  if (loading) return <div>Loading...</div>;
  if (!data?.onboarding) return <div>No assessment submitted yet</div>;

  const q = data.onboarding;

  return (
    <div className="twenty-q-admin-view">
      <div className="client-header">
        <h2>{data.client.full_name}'s Career Assessment</h2>
        <p>{data.client.email}</p>
        <span className={`status-badge ${q.status}`}>
          {q.status === 'pending_approval' ? 'Pending Review' : 'Approved'}
        </span>
      </div>

      <section className="q-section">
        <h3>Role Targeting</h3>
        <div className="q-item">
          <label>Roles Wanted:</label>
          <p>{q.q1}</p>
        </div>
        <div className="q-item">
          <label>Roles Open To:</label>
          <p>{q.q2 || 'Not specified'}</p>
        </div>
        <div className="q-item">
          <label>Roles to Avoid:</label>
          <p>{q.q3 || 'None'}</p>
        </div>
      </section>

      <section className="q-section">
        <h3>Location & Work Preferences</h3>
        <div className="q-item">
          <label>Work Type:</label>
          <p>{q.q4}</p>
        </div>
        <div className="q-item">
          <label>Location Scope:</label>
          <p>{q.q5 || 'Not specified'}</p>
        </div>
        <div className="q-item">
          <label>Target Cities:</label>
          <p>{q.q6 || 'Not specified'}</p>
        </div>
        <div className="q-item">
          <label>Locations to Exclude:</label>
          <p>{q.q7 || 'None'}</p>
        </div>
      </section>

      <section className="q-section">
        <h3>Compensation</h3>
        <div className="q-item">
          <label>Minimum Salary:</label>
          <p>{q.q8} {q.q8_currency}</p>
        </div>
        <div className="q-item">
          <label>Ideal Salary:</label>
          <p>{q.q9 ? `${q.q9} ${q.q9_currency}` : 'Not specified'}</p>
        </div>
        <div className="q-item">
          <label>Contract Roles:</label>
          <p>{q.q10}</p>
          {q.q10 === 'Yes' && q.q10a && (
            <p className="sub-answer">Conditions: {q.q10a}</p>
          )}
        </div>
      </section>

      <section className="q-section">
        <h3>Application Rules</h3>
        <div className="q-item">
          <label>Work Authorization:</label>
          <p>{q.q11}</p>
          {q.q11a && <p className="sub-answer">{q.q11a}</p>}
        </div>
        <div className="q-item">
          <label>Visa Sponsorship:</label>
          <p>{q.q12}</p>
        </div>
        <div className="q-item">
          <label>Willing to Relocate:</label>
          <p>{q.q13}</p>
        </div>
        <div className="q-item">
          <label>Driver's License:</label>
          <p>{q.q14}</p>
          {q.q14 === 'Yes' && q.q14a && (
            <p className="sub-answer">Type: {q.q14a}</p>
          )}
        </div>
        <div className="q-item">
          <label>Industries to Avoid:</label>
          <p>{q.q15 || 'None'}</p>
        </div>
      </section>

      <section className="q-section">
        <h3>Disclosures</h3>
        <div className="q-item">
          <label>Disability Status:</label>
          <p>{q.q16}</p>
        </div>
        <div className="q-item">
          <label>Veteran Status:</label>
          <p>{q.q17}</p>
        </div>
        <div className="q-item">
          <label>Demographic Self-ID:</label>
          <p>{q.q18}</p>
        </div>
      </section>

      <section className="q-section">
        <h3>Priorities</h3>
        <div className="q-item">
          <label>Career Priorities:</label>
          <p>{q.q19}</p>
        </div>
      </section>

      <section className="q-section">
        <h3>Additional Notes</h3>
        <div className="q-item">
          <p className="notes">{q.q20 || 'No additional notes'}</p>
        </div>
      </section>

      <div className="approval-section">
        <p>Submitted: {new Date(q.submitted_at).toLocaleString()}</p>
        {q.status === 'pending_approval' && (
          <button onClick={() => approveAssessment(clientId)}>
            Approve Assessment
          </button>
        )}
        {q.approved_at && (
          <p>Approved: {new Date(q.approved_at).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

export default AdminClient20QView;
```

---

### Display Client Files in Admin UI

```javascript
import React, { useState, useEffect } from 'react';

function AdminClientFilesView({ clientId }) {
  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(true);
  const adminToken = localStorage.getItem('admin_token');

  useEffect(() => {
    loadClientFiles();
  }, [clientId]);

  async function loadClientFiles() {
    try {
      const response = await fetch(
        `https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/clients/${clientId}/files`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );
      const result = await response.json();
      setFiles(result);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading files...</div>;
  if (!files) return <div>No files found</div>;

  // Separate files by type
  const resumeFile = files.files.find(f => f.file_type === 'resume');
  const linkedinFile = files.files.find(f => f.file_type === 'linkedin');
  const portfolioFiles = files.files.filter(f => f.file_type === 'portfolio');

  return (
    <div className="client-files-admin-view">
      <h2>Client Files</h2>

      {/* Summary */}
      <div className="files-summary">
        <div className={`summary-item ${files.summary.resume_uploaded ? 'uploaded' : 'missing'}`}>
          {files.summary.resume_uploaded ? '✓' : '○'} Resume
        </div>
        <div className={`summary-item ${files.summary.linkedin_added ? 'uploaded' : 'missing'}`}>
          {files.summary.linkedin_added ? '✓' : '○'} LinkedIn
        </div>
        <div className={`summary-item ${files.summary.portfolio_added ? 'uploaded' : 'missing'}`}>
          {files.summary.portfolio_added ? '✓' : '○'} Portfolio
        </div>
      </div>

      {/* Resume */}
      <section className="file-section">
        <h3>Resume</h3>
        {resumeFile ? (
          <div className="file-item">
            <div className="file-info">
              <span className="file-icon">📄</span>
              <div>
                <p className="file-name">{resumeFile.filename}</p>
                <p className="file-meta">
                  {(resumeFile.file_size / 1024).toFixed(2)} KB • 
                  Uploaded {new Date(resumeFile.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <a 
              href={resumeFile.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="view-button"
            >
              View Resume
            </a>
          </div>
        ) : (
          <p className="no-file">No resume uploaded</p>
        )}
      </section>

      {/* LinkedIn */}
      <section className="file-section">
        <h3>LinkedIn Profile</h3>
        {linkedinFile ? (
          <div className="file-item">
            <div className="file-info">
              <span className="file-icon">💼</span>
              <div>
                <p className="file-name">LinkedIn Profile</p>
                <p className="file-meta">
                  Added {new Date(linkedinFile.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <a 
              href={linkedinFile.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="view-button"
            >
              View Profile
            </a>
          </div>
        ) : (
          <p className="no-file">No LinkedIn profile added</p>
        )}
      </section>

      {/* Portfolio */}
      <section className="file-section">
        <h3>Portfolio URLs</h3>
        {portfolioFiles.length > 0 ? (
          <div className="portfolio-list">
            {portfolioFiles.map((file, index) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <span className="file-icon">🔗</span>
                  <div>
                    <p className="file-name">Portfolio Link {index + 1}</p>
                    <p className="file-url">{file.url}</p>
                    <p className="file-meta">
                      Added {new Date(file.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="view-button"
                >
                  Visit Site
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-file">No portfolio URLs added</p>
        )}
      </section>
    </div>
  );
}

export default AdminClientFilesView;
```

---

## Quick Reference

### Admin Endpoints for Client View

| Purpose | Endpoint | Returns |
|---------|----------|---------|
| View 20Q | `GET /api/admin/clients/:id/onboarding` | All 20 questions + status |
| View Files | `GET /api/admin/clients/:id/files` | Resume, LinkedIn, Portfolio |
| Complete Card | `GET /api/admin/clients/:id/complete` | Everything in one call |

### File URL Fields

| File Type | URL Field | Example |
|-----------|-----------|---------|
| Resume | `file_url` | `https://...supabase.co/.../resume.pdf` |
| LinkedIn | `url` | `https://linkedin.com/in/username` |
| Portfolio | `url` | `https://johndoe.com` |

### Important Notes

1. **Resume files** use `file_url` field (not `url`)
2. **LinkedIn and Portfolio** use `url` field (not `file_url`)
3. **Multiple portfolios** - Client can have up to 5 portfolio URLs
4. **All files** are in the `files` array, use `file_type` to filter
5. **Admin token** required in Authorization header for all requests

---

**Document Version:** 1.0  
**Last Updated:** February 9, 2026
