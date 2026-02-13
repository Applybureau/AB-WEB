# Frontend and Backend URLs Configuration

## Current Status

### ✅ Production Frontend
- **Primary URL**: `https://www.applybureau.com`
- **Secondary URL**: `https://applybureau.com`
- **Development URL**: `https://www.applybureau.com`
- **Status**: ✅ Production ready

### ✅ DigitalOcean Backend (Primary)
- **URL**: `https://jellyfish-app-t4m35.ondigitalocean.app`
- **Status**: ✅ CORS configured for all frontend URLs
- **CORS Headers**: 
  - `Access-Control-Allow-Origin: https://www.applybureau.com` (and others)
  - `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
  - `Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma`
  - `Access-Control-Allow-Credentials: true`
- **Frontend Compatibility**: ✅ Works with all frontend URLs

### ✅ Vercel Backend (Backup)
- **URL**: `https://apply-bureau-backend.vercel.app`
- **Status**: ✅ Available as backup
- **CORS Headers**: Ultra-permissive for development

## Production Configuration

### Frontend URLs (All Supported)
```javascript
const ALLOWED_FRONTEND_URLS = [
  'https://www.applybureau.com',      // Primary production
  'https://applybureau.com',          // Secondary production  
  'https://www.applybureau.com',  // Development/staging
  'http://localhost:3000',            // Local development
  'http://localhost:5173',            // Vite dev server
  'http://localhost:5174'             // Alternative Vite port
];
```

### Backend Configuration
```javascript
// Primary backend (recommended)
const API_BASE_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

// Environment-based configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://jellyfish-app-t4m35.ondigitalocean.app'  // DigitalOcean for production
  : 'http://localhost:3000';                          // Local for development
```

## Test Results (All Working ✅)
- ✅ Health check: Working
- ✅ OPTIONS preflight: Working  
- ✅ Login requests: Working
- ✅ Applications endpoint: Working
- ✅ Dashboard access: Working
- ✅ All CORS headers present

## Login Credentials
- **Email**: `israelloko65@gmail.com`
- **Password**: `SimplePass123!`

## Admin Credentials  
- **Email**: `applybureau@gmail.com`
- **Password**: `Admin123@#`

## API Endpoints
- **Login**: `POST /api/auth/login`
- **Dashboard**: `GET /api/client/dashboard`
- **Applications**: `GET /api/applications`
- **Stats**: `GET /api/applications/stats`
- **Health**: `GET /api/health`

## Frontend Access URLs
- **Production Login**: `https://www.applybureau.com/login`
- **Production Dashboard**: `https://www.applybureau.com/dashboard`
- **Development**: `https://www.applybureau.com/login`

Both backends use the same Supabase database and have identical functionality.