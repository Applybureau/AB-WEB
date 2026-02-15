# Token Generation and Usage Guide

## Complete JWT Token Flow Explanation

### What is a JWT Token?

A JWT (JSON Web Token) is a secure way to transmit information between the backend and frontend. It's a string that looks like this:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInJvbGUiOiJjbGllbnQiLCJleHAiOjE3MDk1NjgwMDB9.abc123xyz789
```

It has 3 parts separated by dots:
1. **Header** - Token type and algorithm
2. **Payload** - User data (userId, email, role, etc.)
3. **Signature** - Cryptographic signature to verify authenticity

---

## How Tokens Are Generated

### 1. Registration Token Generation

**When:** Admin creates a client account or payment is confirmed

**Location:** `backend/routes/clientRegistration.js` (or admin creates client)

**Code:**
```javascript
const jwt = require('jsonwebtoken');

// Generate registration token
const registrationToken = jwt.sign({
  email: 'john@example.com',
  type: 'registration'
}, process.env.JWT_SECRET, { 
  expiresIn: '7d' // Expires in 7 days
});
```

**Token Payload:**
```json
{
  "email": "john@example.com",
  "type": "registration",
  "exp": 1709568000
}
```

**This token is sent in the registration email:**
```
https://applybureau.com/register?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 2. Authentication Token Generation

**When:** User completes registration OR logs in

**Location:** `backend/middleware/auth.js` - `generateToken()` function

**Code:**
```javascript
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { 
    expiresIn: '24h' // Expires in 24 hours
  });
};
```

**Used in Registration (`backend/routes/clientRegistration.js`):**
```javascript
// After successful registration
const authToken = jwt.sign({
  userId: updatedUser.id,
  id: updatedUser.id,
  email: updatedUser.email,
  role: updatedUser.role,
  full_name: updatedUser.full_name,
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
}, process.env.JWT_SECRET);
```

**Used in Login (`backend/routes/auth.js`):**
```javascript
// After successful login
const token = generateToken({
  userId: user.id,
  email: user.email,
  full_name: user.full_name,
  role: user.role || 'client'
});
```

**Token Payload:**
```json
{
  "userId": "12345-67890-abcdef",
  "id": "12345-67890-abcdef",
  "email": "john@example.com",
  "role": "client",
  "full_name": "John Doe",
  "exp": 1709568000
}
```

---

## Endpoints That Generate Tokens

### 1. Registration Endpoint

**Endpoint:** `POST /api/client-registration/register`

**Request:**
```json
{
  "token": "registration_token_from_email",
  "password": "UserPassword123!",
  "confirm_password": "UserPassword123!"
}
```

**Response:**
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "12345-67890-abcdef",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "client"
  }
}
```

**Frontend receives:** `token` field in response

---

### 2. Login Endpoint

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "UserPassword123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "12345-67890-abcdef",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "client",
    "dashboard_type": "client"
  }
}
```

**Frontend receives:** `token` field in response

---

## How Frontend Uses Tokens

### Step 1: Store Token After Registration/Login

```javascript
// After successful registration or login
const response = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'UserPassword123!'
  })
});

const data = await response.json();

if (response.ok) {
  // ✅ STORE THE TOKEN
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  // Redirect to dashboard
  window.location.href = '/client/dashboard';
}
```

---

### Step 2: Include Token in Protected API Requests

**Every protected endpoint requires the token in the Authorization header:**

```javascript
// Get token from localStorage
const token = localStorage.getItem('authToken');

// Make authenticated request
const response = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/client/dashboard', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,  // ✅ REQUIRED
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

---

### Step 3: Handle Token Expiration

**Tokens expire after 24 hours. When expired, backend returns 403:**

```javascript
async function makeAuthenticatedRequest(url, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  // Handle expired token
  if (response.status === 403 || response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }

  return response;
}
```

---

## Token Verification (Backend)

**Location:** `backend/middleware/auth.js` - `authenticateToken()` function

**How it works:**

1. **Extract token from header:**
```javascript
const authHeader = req.headers['authorization'];
const token = authHeader && authHeader.split(' ')[1];
// "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." → "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

2. **Verify token signature:**
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

3. **Extract user data:**
```javascript
const user = {
  id: decoded.userId || decoded.id,
  email: decoded.email,
  role: decoded.role || 'client',
  full_name: decoded.full_name
};
```

4. **Attach to request:**
```javascript
req.user = user;  // Now available in route handlers
```

---

## Complete Frontend Example

### Auth Helper Utility

```javascript
// auth.js - Reusable authentication utility

const API_BASE_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

export const auth = {
  // Get stored token
  getToken() {
    return localStorage.getItem('authToken');
  },

  // Get stored user
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if logged in
  isAuthenticated() {
    return !!this.getToken();
  },

  // Login
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Store token and user
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error };
    }
  },

  // Register
  async register(token, password, confirmPassword) {
    const response = await fetch(`${API_BASE_URL}/api/client-registration/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        password,
        confirm_password: confirmPassword
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Store token and user
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error };
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Make authenticated API request
  async fetch(endpoint, options = {}) {
    const token = this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Handle expired token
    if (response.status === 401 || response.status === 403) {
      this.logout();
      return;
    }

    return response;
  }
};
```

### Using the Auth Helper

```javascript
// Login page
import { auth } from './auth.js';

async function handleLogin(email, password) {
  const result = await auth.login(email, password);
  
  if (result.success) {
    // Redirect based on role
    if (result.user.dashboard_type === 'admin') {
      window.location.href = '/admin/dashboard';
    } else {
      window.location.href = '/client/dashboard';
    }
  } else {
    alert(result.error);
  }
}

// Registration page
async function handleRegistration(token, password, confirmPassword) {
  const result = await auth.register(token, password, confirmPassword);
  
  if (result.success) {
    window.location.href = '/client/dashboard';
  } else {
    alert(result.error);
  }
}

// Dashboard page - fetch user data
async function loadDashboard() {
  const response = await auth.fetch('/api/client/dashboard');
  const data = await response.json();
  
  // Use dashboard data
  console.log(data);
}

// Logout button
function handleLogout() {
  auth.logout();
}
```

---

## Token Security

### Backend Security

1. **Secret Key:** Tokens are signed with `JWT_SECRET` environment variable
2. **Expiration:** Tokens expire after 24 hours
3. **Verification:** Every request verifies token signature
4. **HTTPS Only:** Tokens only transmitted over HTTPS

### Frontend Security

1. **localStorage:** Store token in localStorage (accessible only to same domain)
2. **HTTPS:** Always use HTTPS to prevent token interception
3. **No Cookies:** Tokens not stored in cookies (prevents CSRF attacks)
4. **Automatic Cleanup:** Remove token on logout or expiration

---

## Summary

### Token Generation Flow

1. **User registers/logs in** → Backend generates JWT token
2. **Backend signs token** with `JWT_SECRET`
3. **Backend returns token** in response
4. **Frontend stores token** in localStorage
5. **Frontend includes token** in all protected requests
6. **Backend verifies token** on each request
7. **Backend extracts user data** from token
8. **Request proceeds** if token is valid

### Key Points

- **Registration endpoint:** `POST /api/client-registration/register` → Returns token
- **Login endpoint:** `POST /api/auth/login` → Returns token
- **Token format:** `Bearer <token>` in Authorization header
- **Token lifetime:** 24 hours
- **Storage:** localStorage on frontend
- **Usage:** Include in Authorization header for all protected endpoints

The system is secure, professional, and production-ready!
