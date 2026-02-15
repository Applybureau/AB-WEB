# Frontend Registration & Login Integration Guide

## Complete Authentication Flow

### Base URL
```
Production: https://jellyfish-app-t4m35.ondigitalocean.app
```

---

## 1. REGISTRATION FLOW

### Step 1: Validate Registration Token

**Endpoint:** `GET /api/client-registration/validate-token/:token`

**Purpose:** Check if registration link is valid before showing registration form

**Request:**
```javascript
const token = new URLSearchParams(window.location.search).get('token');

const response = await fetch(`${API_BASE_URL}/api/client-registration/validate-token/${token}`);
const data = await response.json();
```

**Success Response (200):**
```json
{
  "valid": true,
  "client": {
    "full_name": "John Doe",
    "email": "john@example.com",
    "expires_at": "2026-02-20T13:01:32.135821+00:00"
  }
}
```

**Error Response (400):**
```json
{
  "valid": false,
  "error": "Registration link expired",
  "message": "This registration link has expired. Please contact support for a new link.",
  "redirect_to_login": false
}
```

---

### Step 2: Complete Registration

**Endpoint:** `POST /api/client-registration/register`

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "UserPassword123!",
  "confirm_password": "UserPassword123!"
}
```

**Field Requirements:**
- `token` (string, required) - Registration token from email link
- `password` (string, required) - Minimum 8 characters
- `confirm_password` (string, required) - Must match password

**Frontend Code:**
```javascript
async function handleRegistration(token, password, confirmPassword) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/client-registration/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        password: password,
        confirm_password: confirmPassword
      })
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ CRITICAL: Store the token and redirect
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to client dashboard
      window.location.href = '/client/dashboard';
      
    } else {
      // Show error message
      showError(data.error || data.message);
    }
  } catch (error) {
    showError('Registration failed. Please try again.');
  }
}
```

**Success Response (201):**
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInJvbGUiOiJjbGllbnQiLCJleHAiOjE3MDk1NjgwMDB9.abc123",
  "user": {
    "id": "12345-67890-abcdef",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "client",
    "profile_unlocked": false,
    "payment_confirmed": true,
    "onboarding_completed": false
  },
  "next_steps": "Complete your onboarding questionnaire to unlock your Application Tracker."
}
```

**Error Responses:**

**400 - Passwords don't match:**
```json
{
  "error": "Passwords do not match"
}
```

**400 - Password too short:**
```json
{
  "error": "Password must be at least 8 characters long"
}
```

**400 - Token already used:**
```json
{
  "error": "Registration link expired",
  "message": "This registration link has already been used. Your account has been created. Please login instead.",
  "redirect_to_login": true
}
```

---

## 2. LOGIN FLOW

### Login Endpoint

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "UserPassword123!"
}
```

**Field Requirements:**
- `email` (string, required) - User's email address
- `password` (string, required) - User's password

**Frontend Code:**
```javascript
async function handleLogin(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ Store the token and user data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect based on user role
      if (data.user.dashboard_type === 'admin') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/client/dashboard';
      }
      
    } else {
      // Show error message
      showError(data.error || 'Invalid credentials');
    }
  } catch (error) {
    showError('Login failed. Please try again.');
  }
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInJvbGUiOiJjbGllbnQiLCJleHAiOjE3MDk1NjgwMDB9.abc123",
  "user": {
    "id": "12345-67890-abcdef",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "client",
    "onboarding_complete": false,
    "is_super_admin": false,
    "dashboard_type": "client",
    "source": "registered_users"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

## 3. AUTHENTICATED REQUESTS

### Get Current User

**Endpoint:** `GET /api/auth/me`

**Headers:**
```javascript
{
  'Authorization': 'Bearer ' + localStorage.getItem('authToken')
}
```

**Frontend Code:**
```javascript
async function getCurrentUser() {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      return data.user;
    } else {
      // Token invalid or expired - redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "12345-67890-abcdef",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "client",
    "onboarding_complete": false,
    "dashboard_type": "client"
  }
}
```

---

## 4. COMPLETE FRONTEND EXAMPLE

### Registration Page Component

```javascript
// RegistrationPage.jsx
import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

export default function RegistrationPage() {
  const [token, setToken] = useState('');
  const [clientInfo, setClientInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setError('No registration token provided');
    }
  }, []);

  async function validateToken(tokenValue) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/client-registration/validate-token/${tokenValue}`
      );
      const data = await response.json();

      if (data.valid) {
        setClientInfo(data.client);
      } else {
        setError(data.message || 'Invalid registration link');
        if (data.redirect_to_login) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        }
      }
    } catch (err) {
      setError('Failed to validate registration link');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/client-registration/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: token,
            password: password,
            confirm_password: confirmPassword
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        // ✅ SUCCESS - Store token and redirect
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to dashboard
        window.location.href = '/client/dashboard';
      } else {
        setError(data.error || data.message || 'Registration failed');
        if (data.redirect_to_login) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        }
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!clientInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Complete Registration</h1>
      <p>Welcome, {clientInfo.full_name}!</p>
      <p>Email: {clientInfo.email}</p>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Complete Registration'}
        </button>
      </form>
    </div>
  );
}
```

### Login Page Component

```javascript
// LoginPage.jsx
import { useState } from 'react';

const API_BASE_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ SUCCESS - Store token and redirect
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect based on role
        if (data.user.dashboard_type === 'admin') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/client/dashboard';
        }
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Login</h1>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

---

## 5. AUTHENTICATION HELPER

```javascript
// auth.js - Utility functions
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

  // Check if user is logged in
  isAuthenticated() {
    return !!this.getToken();
  },

  // Logout
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Make authenticated request
  async fetch(url, options = {}) {
    const token = this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers
    });

    // Handle 401 - token expired
    if (response.status === 401) {
      this.logout();
      return;
    }

    return response;
  }
};
```

---

## SUMMARY

### Registration Flow:
1. User clicks registration link with token
2. Frontend validates token: `GET /api/client-registration/validate-token/:token`
3. User enters password
4. Frontend submits: `POST /api/client-registration/register`
5. Backend returns JWT token
6. Frontend stores token and redirects to dashboard

### Login Flow:
1. User enters email and password
2. Frontend submits: `POST /api/auth/login`
3. Backend returns JWT token
4. Frontend stores token and redirects to dashboard

### Key Points:
- Always store the `token` from response in `localStorage`
- Always include `Authorization: Bearer <token>` header for protected endpoints
- Redirect to dashboard immediately after successful registration/login
- Handle 401 errors by logging out and redirecting to login

The backend is working perfectly. The frontend just needs to handle the response correctly!
