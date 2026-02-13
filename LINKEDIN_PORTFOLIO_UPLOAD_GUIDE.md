# LinkedIn & Portfolio Upload Guide

## Complete API Documentation for Frontend

---

## 1. Add LinkedIn Profile URL

### Endpoint
```
POST /api/client/uploads/linkedin
```

### Authentication
Required - Bearer token in Authorization header

### Content-Type
```
application/json
```

### Request Body Format
```json
{
  "linkedin_url": "https://linkedin.com/in/yourname"
}
```

### Example Request (JavaScript/Fetch)
```javascript
const addLinkedIn = async (linkedinUrl, token) => {
  const response = await fetch('https://your-api.com/api/client/uploads/linkedin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      linkedin_url: linkedinUrl
    })
  });

  return await response.json();
};

// Usage
const result = await addLinkedIn('https://linkedin.com/in/johndoe', userToken);
```

### Example Request (Axios)
```javascript
const addLinkedIn = async (linkedinUrl) => {
  const response = await axios.post('/api/client/uploads/linkedin', {
    linkedin_url: linkedinUrl
  }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.data;
};
```

### Success Response (200)
```json
{
  "message": "LinkedIn profile URL added successfully",
  "linkedin_url": "https://linkedin.com/in/johndoe"
}
```

### Error Responses

#### 400 - Missing URL
```json
{
  "error": "LinkedIn URL is required"
}
```

#### 400 - Invalid Format
```json
{
  "error": "Please provide a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourname)"
}
```

### URL Validation Rules
- Must start with `https://`
- Must match pattern: `https://(www.)?linkedin.com/in/[username]`
- Valid examples:
  - `https://linkedin.com/in/johndoe`
  - `https://www.linkedin.com/in/johndoe`
- Invalid examples:
  - `http://linkedin.com/in/johndoe` (must be https)
  - `linkedin.com/in/johndoe` (missing protocol)
  - `https://linkedin.com/company/example` (not a profile)

---

## 2. Add Portfolio/Website/GitHub URLs

### Endpoint
```
POST /api/client/uploads/portfolio
```

### Authentication
Required - Bearer token in Authorization header

### Content-Type
```
application/json
```

### Request Body Format
```json
{
  "portfolio_urls": [
    "https://yourwebsite.com",
    "https://github.com/yourusername",
    "https://behance.net/yourportfolio"
  ]
}
```

### Important Notes
- **MUST be an array** - Even for a single URL, wrap it in an array
- Minimum: 1 URL
- Maximum: 5 URLs
- Each URL must start with `http://` or `https://`

### Example Request (JavaScript/Fetch)
```javascript
const addPortfolio = async (urls, token) => {
  const response = await fetch('https://your-api.com/api/client/uploads/portfolio', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      portfolio_urls: urls  // MUST be an array
    })
  });

  return await response.json();
};

// Usage - Single URL
const result = await addPortfolio(['https://johndoe.com'], userToken);

// Usage - Multiple URLs
const result = await addPortfolio([
  'https://johndoe.com',
  'https://github.com/johndoe',
  'https://behance.net/johndoe'
], userToken);
```

### Example Request (Axios)
```javascript
const addPortfolio = async (urls) => {
  const response = await axios.post('/api/client/uploads/portfolio', {
    portfolio_urls: urls  // MUST be an array
  }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.data;
};
```

### Success Response (200)
```json
{
  "message": "Portfolio URLs added successfully",
  "portfolio_urls": [
    "https://johndoe.com",
    "https://github.com/johndoe",
    "https://behance.net/johndoe"
  ],
  "count": 3
}
```

### Error Responses

#### 400 - Not an Array
```json
{
  "error": "Portfolio URLs must be provided as an array"
}
```

#### 400 - Empty Array
```json
{
  "error": "At least one portfolio URL is required"
}
```

#### 400 - Too Many URLs
```json
{
  "error": "Maximum 5 portfolio URLs allowed"
}
```

#### 400 - Invalid URL Format
```json
{
  "error": "Invalid URL format: yourwebsite.com. URLs must start with http:// or https://"
}
```

### URL Validation Rules
- Must start with `http://` or `https://`
- Valid examples:
  - `https://yourwebsite.com`
  - `https://github.com/username`
  - `https://behance.net/portfolio`
  - `http://portfolio.example.com`
- Invalid examples:
  - `yourwebsite.com` (missing protocol)
  - `www.yourwebsite.com` (missing protocol)

---

## 3. Get Upload Status

### Endpoint
```
GET /api/client/uploads/status
```

### Authentication
Required - Bearer token in Authorization header

### Request
```javascript
const getUploadStatus = async (token) => {
  const response = await fetch('https://your-api.com/api/client/uploads/status', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

### Success Response (200)
```json
{
  "resume": {
    "uploaded": true,
    "url": "https://storage.supabase.co/.../resume.pdf",
    "filename": "john_doe_resume.pdf"
  },
  "linkedin": {
    "added": true,
    "url": "https://linkedin.com/in/johndoe"
  },
  "portfolio": {
    "added": true,
    "urls": [
      "https://johndoe.com",
      "https://github.com/johndoe"
    ],
    "count": 2
  }
}
```

---

## Common Frontend Patterns

### React Example - LinkedIn
```jsx
import { useState } from 'react';

const LinkedInForm = ({ token }) => {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/client/uploads/linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          linkedin_url: linkedinUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add LinkedIn URL');
      }

      alert('LinkedIn profile added successfully!');
      setLinkedinUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="url"
        value={linkedinUrl}
        onChange={(e) => setLinkedinUrl(e.target.value)}
        placeholder="https://linkedin.com/in/yourname"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add LinkedIn'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
};
```

### React Example - Portfolio
```jsx
import { useState } from 'react';

const PortfolioForm = ({ token }) => {
  const [urls, setUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addUrlField = () => {
    if (urls.length < 5) {
      setUrls([...urls, '']);
    }
  };

  const updateUrl = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const removeUrl = (index) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Filter out empty URLs
    const validUrls = urls.filter(url => url.trim() !== '');

    if (validUrls.length === 0) {
      setError('Please add at least one URL');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/client/uploads/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          portfolio_urls: validUrls  // MUST be an array
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add portfolio URLs');
      }

      alert(`${data.count} portfolio URL(s) added successfully!`);
      setUrls(['']);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {urls.map((url, index) => (
        <div key={index}>
          <input
            type="url"
            value={url}
            onChange={(e) => updateUrl(index, e.target.value)}
            placeholder="https://yourwebsite.com"
          />
          {urls.length > 1 && (
            <button type="button" onClick={() => removeUrl(index)}>
              Remove
            </button>
          )}
        </div>
      ))}
      
      {urls.length < 5 && (
        <button type="button" onClick={addUrlField}>
          Add Another URL
        </button>
      )}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Portfolio URLs'}
      </button>
      
      {error && <p className="error">{error}</p>}
    </form>
  );
};
```

---

## Common Mistakes to Avoid

### ❌ Wrong - Sending portfolio as a string
```javascript
// DON'T DO THIS
{
  "portfolio_urls": "https://johndoe.com"  // Wrong! Must be array
}
```

### ✅ Correct - Sending portfolio as an array
```javascript
// DO THIS
{
  "portfolio_urls": ["https://johndoe.com"]  // Correct! Array with one item
}
```

### ❌ Wrong - Missing protocol
```javascript
// DON'T DO THIS
{
  "linkedin_url": "linkedin.com/in/johndoe"  // Missing https://
}
```

### ✅ Correct - With protocol
```javascript
// DO THIS
{
  "linkedin_url": "https://linkedin.com/in/johndoe"  // Correct!
}
```

### ❌ Wrong - Sending empty array
```javascript
// DON'T DO THIS
{
  "portfolio_urls": []  // Empty array not allowed
}
```

### ✅ Correct - At least one URL
```javascript
// DO THIS
{
  "portfolio_urls": ["https://johndoe.com"]  // At least one URL
}
```

---

## Testing with cURL

### Test LinkedIn
```bash
curl -X POST https://your-api.com/api/client/uploads/linkedin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"linkedin_url":"https://linkedin.com/in/johndoe"}'
```

### Test Portfolio (Single URL)
```bash
curl -X POST https://your-api.com/api/client/uploads/portfolio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"portfolio_urls":["https://johndoe.com"]}'
```

### Test Portfolio (Multiple URLs)
```bash
curl -X POST https://your-api.com/api/client/uploads/portfolio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"portfolio_urls":["https://johndoe.com","https://github.com/johndoe","https://behance.net/johndoe"]}'
```

### Test Get Status
```bash
curl -X GET https://your-api.com/api/client/uploads/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Summary

| Feature | Endpoint | Method | Body Key | Data Type | Min | Max |
|---------|----------|--------|----------|-----------|-----|-----|
| LinkedIn | `/api/client/uploads/linkedin` | POST | `linkedin_url` | String | 1 | 1 |
| Portfolio | `/api/client/uploads/portfolio` | POST | `portfolio_urls` | Array | 1 | 5 |
| Status | `/api/client/uploads/status` | GET | N/A | N/A | N/A | N/A |

**Key Points:**
1. LinkedIn: Single string with valid LinkedIn URL
2. Portfolio: Array of strings (1-5 URLs)
3. All URLs must include protocol (http:// or https://)
4. All endpoints require authentication
5. Content-Type must be application/json
