# CORS Error Fix Guide

## Current Issue
The backend is experiencing CORS (Cross-Origin Resource Sharing) errors when accessed from frontend applications.

## Root Cause Analysis
Based on the server.js configuration, the CORS setup is currently allowing all origins but there may be issues with:
1. Preflight OPTIONS requests not being handled properly
2. Missing or incorrect headers
3. Credentials handling
4. Specific frontend domain not being recognized

## Current CORS Configuration
The server currently has:
- Origin: Allows all origins (callback(null, true))
- Credentials: true
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin

## Immediate Fix

### Option 1: Enhanced CORS Configuration (Recommended)
Replace the current CORS configuration in server.js with this improved version:

```javascript
// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://apply-bureau.vercel.app',
      'https://apply-bureau-frontend.vercel.app',
      'https://applybureau.com',
      'https://www.applybureau.com',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'https://localhost:5173'
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.endsWith('*')) {
        return origin.startsWith(allowedOrigin.slice(0, -1));
      }
      return origin === allowedOrigin;
    })) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      // For debugging, allow all origins temporarily
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Credentials'
  ],
  exposedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Total-Count', 
    'X-Page', 
    'X-Per-Page',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Enhanced CORS headers middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Access-Control-Allow-Methods, Access-Control-Allow-Credentials');
  res.header('Access-Control-Expose-Headers', 'Content-Type, Authorization, X-Total-Count, X-Page, X-Per-Page, Access-Control-Allow-Origin, Access-Control-Allow-Credentials');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Preflight request from:', origin);
    return res.status(200).end();
  }
  
  next();
});
```

### Option 2: Simple Allow-All Configuration (Quick Fix)
If you need an immediate fix, replace the CORS section with:

```javascript
// Simple CORS - Allow all origins (for development/testing)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

// Ensure CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
```

## Environment Variables
Make sure your .env file has the correct frontend URL:

```env
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## Testing CORS Fix
Use this script to test CORS after applying the fix:

```javascript
// Test CORS from browser console
fetch('https://apply-bureau-backend.vercel.app/api/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log('CORS test successful:', data))
.catch(error => console.error('CORS test failed:', error));
```

## Frontend Configuration
Ensure your frontend is making requests correctly:

### Axios Configuration
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://apply-bureau-backend.vercel.app/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Fetch Configuration
```javascript
const makeRequest = async (endpoint, options = {}) => {
  const response = await fetch(`https://apply-bureau-backend.vercel.app/api${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};
```

## Deployment Steps
1. Update the CORS configuration in server.js
2. Add your frontend domain to the allowed origins
3. Commit and push changes
4. Verify deployment on Vercel
5. Test CORS from your frontend

## Troubleshooting

### Common CORS Errors and Solutions

#### Error: "Access to fetch at '...' from origin '...' has been blocked by CORS policy"
**Solution:** Add your frontend domain to the allowedOrigins array

#### Error: "CORS policy: Request header field authorization is not allowed"
**Solution:** Add 'Authorization' to allowedHeaders in CORS config

#### Error: "CORS policy: The request client is not a secure context"
**Solution:** Use HTTPS for both frontend and backend in production

#### Error: "CORS policy: Credentials flag is 'true', but the 'Access-Control-Allow-Credentials' header is ''"
**Solution:** Ensure credentials: true in CORS config and proper header setting

### Debug CORS Issues
Add this middleware for debugging:

```javascript
app.use((req, res, next) => {
  console.log('CORS Debug:', {
    origin: req.headers.origin,
    method: req.method,
    headers: req.headers,
    url: req.url
  });
  next();
});
```

## Production Considerations
1. **Security:** Don't use wildcard (*) origins in production
2. **Performance:** Cache preflight responses
3. **Monitoring:** Log CORS violations for security analysis
4. **Domains:** Keep allowed origins list updated

## Quick Implementation
To implement the fix immediately, run this command in your backend directory:

```bash
# Backup current server.js
cp server.js server.js.backup

# Apply the CORS fix (you'll need to manually update the CORS section)
```

Then update the CORS configuration as shown in Option 1 or Option 2 above.