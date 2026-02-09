# Application Creation - Complete Guide

**Last Updated**: February 8, 2026  
**Status**: ✅ WORKING  
**Endpoint**: `POST /api/admin/applications`

---

## Table of Contents
1. [Overview](#overview)
2. [Endpoint Details](#endpoint-details)
3. [Request Format](#request-format)
4. [Response Format](#response-format)
5. [Database Schema](#database-schema)
6. [Field Mapping](#field-mapping)
7. [Example Usage](#example-usage)
8. [Error Handling](#error-handling)

---

## Overview

This endpoint allows **admins only** to create job applications on behalf of clients. When an application is created:
1. Application is saved to database
2. Email notification is automatically sent to the client
3. Client can view the application in their dashboard

---

## Endpoint Details

### URL
```
POST /api/admin/applications
```

### Authentication
```
Authorization: Bearer <admin_token>
```

### Content-Type
```
Content-Type: application/json
```

---

## Request Format

### Required Fields

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `client_id` | UUID | Client's unique identifier | `"0ce6ea58-9735-4c05-b751-ebcb802ba89e"` |
| `company` | String | Company name | `"TechCorp Inc."` |
| `job_title` | String | Job position title | `"Senior Software Engineer"` |

### Optional Fields

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `job_description` | String | Detailed job description | `"Full stack development role..."` |
| `job_url` | String (URL) | Link to job posting | `"https://techcorp.com/careers/123"` |
| `salary_range` | String | Salary range (will be parsed) | `"$150k-$200k"` or `"150000-200000"` |
| `job_type` | String | Type of employment | `"full-time"`, `"part-time"`, `"contract"`, `"remote"` |
| `application_strategy` | String | How application was submitted | `"Direct application through company website"` |
| `admin_notes` | String | Internal notes for admin | `"Strong match for client background"` |

### Complete Request Body Example

```json
{
  "client_id": "0ce6ea58-9735-4c05-b751-ebcb802ba89e",
  "company": "TechCorp Inc.",
  "job_title": "Senior Software Engineer",
  "job_description": "Full stack development role with React and Node.js. 5+ years experience required.",
  "job_url": "https://techcorp.com/careers/senior-engineer",
  "salary_range": "$150k-$200k",
  "job_type": "full-time",
  "application_strategy": "Direct application through company website with tailored resume",
  "admin_notes": "Client has strong React background, good match for this role"
}
```

### Minimal Request Body Example

```json
{
  "client_id": "0ce6ea58-9735-4c05-b751-ebcb802ba89e",
  "company": "TechCorp Inc.",
  "job_title": "Senior Software Engineer"
}
```

---

## Response Format

### Success Response (201 Created)

```json
{
  "message": "Application created successfully",
  "application": {
    "id": "34c3fb92-befa-454e-905d-17db2d67f316",
    "client_id": "0ce6ea58-9735-4c05-b751-ebcb802ba89e",
    "applied_by_admin": true,
    "job_title": "Senior Software Engineer",
    "company": "TechCorp Inc.",
    "title": "TechCorp Inc. - Senior Software Engineer",
    "description": "Full stack development role with React and Node.js",
    "job_url": "https://techcorp.com/careers/senior-engineer",
    "offer_salary_min": 150000,
    "offer_salary_max": 200000,
    "type": "full-time",
    "application_strategy": "Direct application through company website",
    "admin_notes": "Client has strong React background",
    "status": "applied",
    "date_applied": "2026-02-09T01:41:35.889Z",
    "created_at": "2026-02-09T01:41:35.890Z",
    "updated_at": "2026-02-09T01:41:35.890Z",
    "priority": null,
    "requirements": null,
    "documents": null,
    "estimated_duration": null,
    "estimated_cost": null,
    "actual_duration": null,
    "actual_cost": null,
    "client_notes": null,
    "internal_notes": null,
    "rejection_reason": null,
    "status_update_reason": null,
    "tags": null,
    "deadline": null,
    "interview_scheduled_at": null,
    "follow_up_date": null,
    "interview_type": null,
    "interview_notes": null,
    "offer_benefits": null,
    "offer_deadline": null,
    "approved_by": null,
    "assigned_to": null,
    "approved_at": null,
    "completed_at": null,
    "cancelled_at": null,
    "cancellation_reason": null
  }
}
```

### Error Response (404 Not Found)

```json
{
  "error": "Client not found"
}
```

### Error Response (400 Bad Request)

```json
{
  "error": "Missing required fields",
  "required": ["client_id", "company", "job_title"]
}
```

### Error Response (500 Internal Server Error)

```json
{
  "error": "Failed to create application",
  "details": "Detailed error message from database"
}
```

---

## Database Schema

### Applications Table - Complete Column List

```javascript
[
  'id',                       // UUID - Primary key (auto-generated)
  'client_id',                // UUID - Foreign key to clients table (REQUIRED)
  'type',                     // String - Application type
  'title',                    // String - Application title (REQUIRED, auto-generated)
  'description',              // Text - Job description
  'company',                  // String - Company name
  'job_title',                // String - Job position title
  'job_url',                  // String - Job posting URL
  'status',                   // String - Application status (default: 'applied')
  'priority',                 // String - Priority level
  'requirements',             // JSON - Job requirements
  'documents',                // JSON - Attached documents
  'estimated_duration',       // Integer - Estimated duration
  'estimated_cost',           // Decimal - Estimated cost
  'actual_duration',          // Integer - Actual duration
  'actual_cost',              // Decimal - Actual cost
  'admin_notes',              // Text - Admin internal notes
  'client_notes',             // Text - Client notes
  'internal_notes',           // Text - Internal system notes
  'rejection_reason',         // Text - Reason for rejection
  'status_update_reason',     // Text - Reason for status change
  'tags',                     // Array - Tags for categorization
  'deadline',                 // Timestamp - Application deadline
  'date_applied',             // Timestamp - Date application was submitted
  'interview_scheduled_at',   // Timestamp - Interview date/time
  'follow_up_date',           // Timestamp - Follow-up date
  'interview_type',           // String - Type of interview
  'interview_notes',          // Text - Interview notes
  'offer_salary_min',         // Integer - Minimum salary offered
  'offer_salary_max',         // Integer - Maximum salary offered
  'offer_benefits',           // Text - Benefits offered
  'offer_deadline',           // Timestamp - Offer acceptance deadline
  'application_strategy',     // Text - Application strategy used
  'approved_by',              // UUID - Admin who approved
  'assigned_to',              // UUID - Admin assigned to
  'applied_by_admin',         // Boolean - Whether admin created this
  'approved_at',              // Timestamp - Approval timestamp
  'completed_at',             // Timestamp - Completion timestamp
  'cancelled_at',             // Timestamp - Cancellation timestamp
  'cancellation_reason',      // Text - Reason for cancellation
  'created_at',               // Timestamp - Record creation time
  'updated_at'                // Timestamp - Last update time
]
```

---

## Field Mapping

### Frontend → Backend → Database

| Frontend Field | Backend Receives | Database Column | Data Type | Notes |
|----------------|------------------|-----------------|-----------|-------|
| `client_id` | `client_id` | `client_id` | UUID | Required |
| `company` | `company` | `company` | String | Required |
| `job_title` | `job_title` | `job_title` | String | Required |
| N/A | N/A | `title` | String | Auto-generated: `${company} - ${job_title}` |
| `job_description` | `job_description` | `description` | Text | Optional |
| `job_url` | `job_url` | `job_url` | String | Optional |
| `salary_range` | `salary_range` | `offer_salary_min` | Integer | Parsed from string |
| `salary_range` | `salary_range` | `offer_salary_max` | Integer | Parsed from string |
| `job_type` | `job_type` | `type` | String | Default: `"full-time"` |
| `application_strategy` | `application_strategy` | `application_strategy` | Text | Optional |
| `admin_notes` | `admin_notes` | `admin_notes` | Text | Optional |
| N/A | N/A | `applied_by_admin` | Boolean | Always `true` |
| N/A | N/A | `status` | String | Always `"applied"` |
| N/A | N/A | `date_applied` | Timestamp | Auto-generated |
| N/A | N/A | `created_at` | Timestamp | Auto-generated |
| N/A | N/A | `updated_at` | Timestamp | Auto-generated |

### Salary Range Parsing

The `salary_range` field is parsed to extract min and max values:

```javascript
// Input examples:
"$150k-$200k"     → min: 150000, max: 200000
"150000-200000"   → min: 150000, max: 200000
"$150,000-$200,000" → min: 150000, max: 200000

// Parsing logic:
offer_salary_min = parseInt(salary_range.split('-')[0].replace(/\D/g, ''))
offer_salary_max = parseInt(salary_range.split('-')[1]?.replace(/\D/g, ''))
```

---

## Example Usage

### JavaScript/Axios Example

```javascript
const axios = require('axios');

async function createApplication() {
  try {
    const response = await axios.post(
      'https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/applications',
      {
        client_id: '0ce6ea58-9735-4c05-b751-ebcb802ba89e',
        company: 'TechCorp Inc.',
        job_title: 'Senior Software Engineer',
        job_description: 'Full stack development role with React and Node.js',
        job_url: 'https://techcorp.com/careers/senior-engineer',
        salary_range: '$150k-$200k',
        job_type: 'full-time',
        application_strategy: 'Direct application through company website',
        admin_notes: 'Strong match for client background'
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Application created:', response.data.application.id);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}
```

### cURL Example

```bash
curl -X POST https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/applications \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "0ce6ea58-9735-4c05-b751-ebcb802ba89e",
    "company": "TechCorp Inc.",
    "job_title": "Senior Software Engineer",
    "job_description": "Full stack development role",
    "job_url": "https://techcorp.com/careers/123",
    "salary_range": "$150k-$200k",
    "job_type": "full-time",
    "application_strategy": "Direct application",
    "admin_notes": "Good match"
  }'
```

### Fetch API Example

```javascript
async function createApplication(adminToken, applicationData) {
  const response = await fetch(
    'https://jellyfish-app-t4m35.ondigitalocean.app/api/admin/applications',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(applicationData)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create application');
  }

  return await response.json();
}

// Usage
const result = await createApplication(adminToken, {
  client_id: '0ce6ea58-9735-4c05-b751-ebcb802ba89e',
  company: 'TechCorp Inc.',
  job_title: 'Senior Software Engineer',
  salary_range: '$150k-$200k'
});
```

---

## Error Handling

### Common Errors and Solutions

#### 1. Client Not Found (404)
```json
{
  "error": "Client not found"
}
```
**Solution**: Verify the `client_id` exists in the database.

#### 2. Missing Required Fields (400)
```json
{
  "error": "Missing required fields",
  "required": ["client_id", "company", "job_title"]
}
```
**Solution**: Ensure all required fields are included in the request.

#### 3. Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```
**Solution**: Provide a valid admin authentication token.

#### 4. Forbidden (403)
```json
{
  "error": "Access denied. Admin privileges required."
}
```
**Solution**: Ensure the user has admin role.

#### 5. Database Error (500)
```json
{
  "error": "Failed to create application",
  "details": "Database connection error"
}
```
**Solution**: Check database connection and schema.

---

## Email Notification

When an application is created, an automatic email is sent to the client:

### Email Template: `application_update`

**Variables**:
```javascript
{
  client_name: "John Doe",
  company_name: "TechCorp Inc.",
  position_title: "Senior Software Engineer",
  application_status: "applied",
  message: "We've submitted your application for the Senior Software Engineer position at TechCorp Inc.",
  next_steps: "We will monitor the application and keep you updated on any progress."
}
```

**Email Preview**:
```
Subject: Application Update - TechCorp Inc.

Hi John Doe,

We've submitted your application for the Senior Software Engineer position at TechCorp Inc.

Status: Applied

Next Steps:
We will monitor the application and keep you updated on any progress.

Best regards,
Apply Bureau Team
```

---

## Status Values

Valid application status values:

| Status | Description |
|--------|-------------|
| `applied` | Application submitted (default) |
| `under_review` | Application being reviewed |
| `interview_scheduled` | Interview scheduled |
| `interview_completed` | Interview completed |
| `second_round` | Second round interview |
| `offer_received` | Job offer received |
| `offer_accepted` | Offer accepted |
| `offer_declined` | Offer declined |
| `rejected` | Application rejected |
| `withdrawn` | Application withdrawn |
| `closed` | Application closed |

---

## Testing

### Test Script Location
```
backend/test-real-application-creation.js
```

### Run Test
```bash
cd backend
node test-real-application-creation.js
```

### Expected Output
```
✅ Application created successfully!
Application ID: 34c3fb92-befa-454e-905d-17db2d67f316
Client ID: 0ce6ea58-9735-4c05-b751-ebcb802ba89e
Company: TechCorp Inc.
Job Title: Senior Software Engineer
Status: applied
```

---

## Related Endpoints

### Get Client Applications
```
GET /api/client/applications
```
Clients can view all applications created for them (read-only).

### Update Application Status
```
PATCH /api/admin/applications/:id/status
```
Admins can update the status of an application.

### Get All Applications (Admin)
```
GET /api/applications
```
Admins can view all applications across all clients.

---

**Production URL**: https://jellyfish-app-t4m35.ondigitalocean.app  
**Frontend URL**: https://www.applybureau.com  
**Documentation**: Complete and tested ✅
