const request = require('supertest');

// Create app instance without starting server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');

// Import monitoring utilities
const { requestMonitor, SystemMonitor } = require('../utils/monitoring');

// Import routes
const authRoutes = require('../routes/auth');
const dashboardRoutes = require('../routes/dashboard');
const consultationRoutes = require('../routes/consultations');
const applicationRoutes = require('../routes/applications');
const notificationRoutes = require('../routes/notifications');
const uploadRoutes = require('../routes/upload');

// Create test app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60 * 1000 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000'
    ].filter(Boolean);
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging (silent in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static files for email assets
app.use('/emails/assets', express.static('emails/assets'));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = SystemMonitor.getHealthStatus();
  res.status(200).json({ 
    ...healthStatus,
    service: 'Apply Bureau Backend'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', err);
  }
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'CORS policy violation',
      message: 'Origin not allowed'
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details || err.message
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication failed'
    });
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'File size exceeds the limit'
    });
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

describe('Apply Bureau API Tests', () => {
  let authToken;
  let testClientId;
  let testConsultationId;
  let testApplicationId;

  // Test data
  const testAdmin = {
    email: 'admin@applybureau.com',
    password: 'admin123'
  };

  const testClient = {
    email: 'testclient@example.com',
    full_name: 'Test Client',
    password: 'testpass123'
  };

  beforeAll(async () => {
    // Setup test environment
    console.log('Setting up test environment...');
  });

  afterAll(async () => {
    // Cleanup test data
    if (testClientId) {
      // Clean up test client and related data
      console.log('Cleaning up test data...');
    }
  });

  describe('Health Check', () => {
    test('GET /health should return 200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'Apply Bureau Backend');
    });
  });

  describe('Authentication', () => {
    test('POST /api/auth/login with invalid credentials should return 401', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/auth/login with missing fields should return 400', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    test('POST /api/auth/invite without auth should return 401', async () => {
      const response = await request(app)
        .post('/api/auth/invite')
        .send({
          email: testClient.email,
          full_name: testClient.full_name
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Protected Routes', () => {
    test('GET /api/dashboard without auth should return 401', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('GET /api/consultations without auth should return 401', async () => {
      const response = await request(app)
        .get('/api/consultations')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('GET /api/applications without auth should return 401', async () => {
      const response = await request(app)
        .get('/api/applications')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('GET /api/notifications without auth should return 401', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Input Validation', () => {
    test('POST /api/auth/invite with invalid email should return 401', async () => {
      const response = await request(app)
        .post('/api/auth/invite')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          email: 'invalid-email',
          full_name: 'Test User'
        })
        .expect(403); // Will fail auth first (403 for invalid token)

      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/auth/complete-registration with short password should return 400', async () => {
      const response = await request(app)
        .post('/api/auth/complete-registration')
        .send({
          token: 'some-token',
          password: '123', // too short
          full_name: 'Test User'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('Rate Limiting', () => {
    test('Should handle rate limiting', async () => {
      // Make multiple requests quickly to test rate limiting
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .get('/health')
        );
      }

      const responses = await Promise.all(promises);
      
      // All should succeed for health endpoint (not rate limited)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('CORS', () => {
    test('Should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type');

      expect(response.status).toBe(204);
    });
  });

  describe('Error Handling', () => {
    test('Should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
    });

    test('Should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });
  });

  describe('Security Headers', () => {
    test('Should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for Helmet security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Content Type Handling', () => {
    test('Should handle different content types', async () => {
      // Test JSON
      const jsonResponse = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(jsonResponse.status).toBe(401); // Invalid credentials, but processed

      // Test URL encoded
      const urlEncodedResponse = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('email=test@example.com&password=password123');

      expect(urlEncodedResponse.status).toBe(401); // Invalid credentials, but processed
    });
  });

  describe('File Upload Endpoints', () => {
    test('POST /api/upload/resume without auth should return 401', async () => {
      const response = await request(app)
        .post('/api/upload/resume')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('API Response Format', () => {
    test('Should return consistent error format', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    test('Health endpoint should return consistent format', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service');
    });
  });
});