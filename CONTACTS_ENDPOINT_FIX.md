# Contacts Endpoint - Frontend Fix

## Issue
Contacts not loading in the admin dashboard.

## Root Cause
Frontend is using the wrong endpoint URL.

## Solution

### Correct Endpoint
```
GET /api/contact-requests
```

### ❌ Wrong (Don't use)
```
GET /api/admin/contact-requests
```

## Full API Details

### Get All Contact Requests

**Endpoint:**
```http
GET https://apply-bureau-backend.vercel.app/api/contact-requests
Authorization: Bearer <token>
```

**Query Parameters (optional):**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `status` - Filter by status: `new`, `in_progress`, `resolved`, `closed`

**Response:**
```json
{
  "data": [
    {
      "id": "eb4aac90-b4c6-49e9-94f6-0829fdf8c44c",
      "first_name": "Test",
      "last_name": "User",
      "email": "test@example.com",
      "phone": null,
      "subject": "Test Subject",
      "message": "Test message",
      "status": "new",
      "handled_by": null,
      "handled_at": null,
      "admin_notes": null,
      "created_at": "2026-01-16T11:18:36.127847+00:00",
      "updated_at": "2026-01-16T11:18:36.127847+00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

### Get Single Contact Request

**Endpoint:**
```http
GET https://apply-bureau-backend.vercel.app/api/contact-requests/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": {
    "id": "eb4aac90-b4c6-49e9-94f6-0829fdf8c44c",
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "phone": null,
    "subject": "Test Subject",
    "message": "Test message",
    "status": "new",
    "handled_by": null,
    "handled_at": null,
    "admin_notes": null,
    "created_at": "2026-01-16T11:18:36.127847+00:00",
    "updated_at": "2026-01-16T11:18:36.127847+00:00"
  }
}
```

### Update Contact Request Status

**Endpoint:**
```http
PATCH https://apply-bureau-backend.vercel.app/api/contact-requests/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress",
  "admin_notes": "Following up with client"
}
```

**Request Body:**
- `status` (optional): `new`, `in_progress`, `resolved`, `closed`
- `admin_notes` (optional): Admin notes about the contact

**Response:**
```json
{
  "message": "Contact request updated successfully",
  "data": {
    "id": "eb4aac90-b4c6-49e9-94f6-0829fdf8c44c",
    "status": "in_progress",
    "admin_notes": "Following up with client",
    "handled_by": "688b3986-0398-4c00-8aa9-0f14a411b378",
    "handled_at": "2026-01-16T18:05:00Z"
  }
}
```

## Frontend Integration Example

### Fetch Contacts
```javascript
const fetchContacts = async (token, page = 1, status = null) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '50'
  });
  
  if (status) {
    params.append('status', status);
  }

  const response = await fetch(
    `https://apply-bureau-backend.vercel.app/api/contact-requests?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();
  return data;
};
```

### Update Contact Status
```javascript
const updateContactStatus = async (contactId, status, notes, token) => {
  const response = await fetch(
    `https://apply-bureau-backend.vercel.app/api/contact-requests/${contactId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status,
        admin_notes: notes
      })
    }
  );

  return await response.json();
};
```

## Status Values

- `new` - New contact request (default)
- `in_progress` - Admin is working on it
- `resolved` - Issue resolved
- `closed` - Contact closed

## Testing

Test script available:
```bash
node scripts/test-contacts-vercel.js
```

## Verification

✅ Endpoint tested on Vercel - **WORKING**
✅ Returns contact data correctly
✅ Authentication working
✅ Pagination working

## Action Required

Update frontend to use:
```
/api/contact-requests
```

Instead of:
```
/api/admin/contact-requests
```

---

**Last Updated**: January 16, 2026
**Status**: ✅ Backend Working - Frontend needs URL update
