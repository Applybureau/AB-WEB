require('dotenv').config();

// Validate critical environment variables before starting server
const validateCriticalEnvVars = () => {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_KEY',
    'RESEND_API_KEY',
    'JWT_SECRET'
  ];
  
  const missing = required.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    const errorMessage = `
🚨 CRITICAL STARTUP ERROR: Missing required environment variables

❌ Missing variables:
${missing.map(v => `   • ${v}`).join('\n')}

🔧 DigitalOcean Fix:
   1. Go to DigitalOcean App Platform dashboard
   2. Select your app → Settings → App-Level Environment Variables  
   3. Add each missing variable with its actual value:
      • SUPABASE_URL: https://your-project.supabase.co
      • SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIs...
      • SUPABASE_SERVICE_KEY: eyJhbGciOiJIUzI1NiIs...
      • RESEND_API_KEY: re_xxxxxxxxxx
      • JWT_SECRET: your-secret-key-here
   4. Click "Save" and redeploy

💡 The app.yaml references \${VARIABLE_NAME} but DigitalOcean needs actual values.

🚫 Application startup aborted.
`;
    
    console.error(errorMessage);
    process.exit(1);
  }
  
  console.log('✅ All critical environment variables are present');
};

// Validate environment variables before importing other modules
validateCriticalEnvVars();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
// Rate limiting removed for 24/7 operation
const bodyParser = require('body-parser');

// Import advanced utilities
const logger = require('./utils/logger');
const { cache, cacheMiddleware } = require('./utils/cache');
const securityManager = require('./utils/security');
const { dbMonitor, performanceMonitor, SystemMonitor } = require('./utils/monitoring');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const enhancedDashboardRoutes = require('./routes/enhancedDashboard');
const consultationRoutes = require('./routes/consultations');
const contactRoutes = require('./routes/contact');
const applicationRoutes = require('./routes/applications');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const adminDashboardCompleteRoutes = require('./routes/adminDashboardComplete');
const clientRoutes = require('./routes/client');
const webhookRoutes = require('./routes/webhooks');
const publicRoutes = require('./routes/public');
const adminManagementRoutes = require('./routes/adminManagement');
const fileManagementRoutes = require('./routes/fileManagement');
const adminDashboardRoutes = require('./routes/adminDashboard');
const admin20QDashboardRoutes = require('./routes/admin20QDashboard');

// New Pipeline Routes
const leadsRoutes = require('./routes/leads');
const registrationRoutes = require('./routes/registration');
const contactRequestsRoutes = require('./routes/contactRequests');
const meetingsRoutes = require('./routes/meetings');
const consultationRequestsRoutes = require('./routes/consultationRequests');
const pdfViewerRoutes = require('./routes/pdfViewer');

// New Enhanced Client Flow Routes
const strategyCallsRoutes = require('./routes/strategyCalls');
const clientDashboardRoutes = require('./routes/clientDashboardNew'); // Updated to new implementation
const clientUploadsRoutes = require('./routes/clientUploads');
const adminOnboardingTriggersRoutes = require('./routes/adminOnboardingTriggers');
const clientActionsRoutes = require('./routes/clientActions'); // Client actions (strategy call confirm, unlock, password reset)

// Concierge Routes
const publicConsultationsRoutes = require('./routes/publicConsultations');
const adminConciergeRoutes = require('./routes/adminConcierge');
const clientRegistrationRoutes = require('./routes/clientRegistration');
const clientOnboarding20QRoutes = require('./routes/clientOnboarding20Q');

// Enhanced Admin Features Routes
const adminEnhancedFeaturesRoutes = require('./routes/adminEnhancedFeatures');
const adminInterviewsRoutes = require('./routes/adminInterviews');
// Zero-Trust Secure Routes
// const secureOnboardingRoutes = require('./routes/secureOnboarding');

// Client Pipeline Routes
const clientProfileRoutes = require('./routes/clientProfile');

// API Specification Compliant Routes
const consultationRequestsSpecRoutes = require('./routes/consultationRequestsSpec');
const contactRequestsSpecRoutes = require('./routes/contactRequestsSpec');
const adminStatsSpecRoutes = require('./routes/adminStatsSpec');
const adminNotificationsSpecRoutes = require('./routes/adminNotificationsSpec');
const authSpecRoutes = require('./routes/authSpec');
const applicationsSpecRoutes = require('./routes/applicationsSpec');
const profileSpecRoutes = require('./routes/profileSpec');

// New Complete API Specification Routes
const mockSessionsRoutes = require('./routes/mockSessions');
const resourcesRoutes = require('./routes/resources');

// Import error handling middleware
const { globalErrorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware (must be first)
app.use(securityManager.securityMiddleware());

// Enhanced security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(compression());

// Rate limiting disabled for 24/7 uninterrupted operation
// const { authRateLimit, onboardingRateLimit, generalRateLimit, createZeroTrustRateLimit } = require('./middleware/auth');

// Ultra-permissive CORS configuration for 24/7 operation - Allow everything

// Ultra-permissive CORS configuration for 24/7 operation - Allow specific origins
const allowedOrigins = [
  'https://www.applybureau.com',
  'https://applybureau.com',
  'https://apply-bureau.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow requests from allowed origins or no origin (for mobile apps, Postman, etc.)
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  } else {
    // For development and testing, allow all origins
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Expose-Headers', 'Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    logger.info('Preflight request handled', { origin: req.headers.origin });
    return res.status(200).end();
  }
  
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl requests, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, allow all origins for maximum compatibility
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['Authorization', 'Content-Length', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));


// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced logging with performance tracking
const enhancedLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info(`Incoming request: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    logger.http(req, res, responseTime);
    
    // Log performance if slow
    if (responseTime > 1000) {
      logger.performance('slow_request', responseTime, {
        method: req.method,
        path: req.path,
        userId: req.user?.id
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

app.use(enhancedLogger);

// Static files for email assets and templates
app.use('/emails/assets', express.static('emails/assets'));
app.use('/emails/templates', express.static('emails/templates'));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = SystemMonitor.getHealthStatus();
  logger.info('Health check requested', { ip: req.ip, userAgent: req.get('User-Agent') });
  res.status(200).json({ 
    ...healthStatus,
    service: 'Apply Bureau Backend'
  });
});

// API Health check endpoint
app.get('/api/health', (req, res) => {
  const healthStatus = SystemMonitor.getHealthStatus();
  logger.info('API health check requested', { ip: req.ip, userAgent: req.get('User-Agent') });
  res.status(200).json({ 
    ...healthStatus,
    service: 'Apply Bureau Backend'
  });
});

// Detailed system info endpoint (admin only in production)
app.get('/system-info', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    logger.warn('Unauthorized system info access attempt', { ip: req.ip, userAgent: req.get('User-Agent') });
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const systemInfo = SystemMonitor.getSystemInfo();
  logger.info('System info requested', { ip: req.ip, userAgent: req.get('User-Agent') });
  res.json(systemInfo);
});

// API routes with caching where appropriate
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', cacheMiddleware(300), dashboardRoutes); // Cache dashboard for 5 minutes
app.use('/api/enhanced-dashboard', enhancedDashboardRoutes); // Real-time dashboard (no caching)
app.use('/api/consultation-requests', consultationRequestsRoutes); // Enhanced consultation requests (replaces consultationsCombinedRoutes)
app.use('/api/consultations', consultationRoutes); // Main consultations route
app.use('/api/contact', contactRoutes); // Contact form (public)
app.use('/api/consultation-management', require('./routes/consultationManagement')); // Internal consultation management (admin only)
app.use('/api/applications', applicationRoutes); // Main applications route
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminDashboardCompleteRoutes); // Complete admin dashboard with all features
app.use('/api/client', clientRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/public', publicRoutes); // Public routes for website integration
app.use('/api/admin-management', adminManagementRoutes); // Enhanced admin management
app.use('/api/files', fileManagementRoutes); // File upload and management
app.use('/api/admin-dashboard', adminDashboardRoutes); // Admin-specific dashboard
app.use('/api/admin/20q-dashboard', admin20QDashboardRoutes); // 20 Questions admin dashboard

// Enhanced Admin Features - New endpoints for missing functionality
app.use('/api/admin', adminEnhancedFeaturesRoutes); // 20Q mark as reviewed, file details, package monitoring
app.use('/api/admin', adminInterviewsRoutes); // Interview coordination and management

// New Pipeline Routes - Consultation to Client
app.use('/api/leads', leadsRoutes); // Lead submission and management
app.use('/api/register', registrationRoutes); // Registration flow
app.use('/api/contact-requests', contactRequestsRoutes); // Contact form submissions
app.use('/api/meetings', meetingsRoutes); // Meeting scheduling
app.use('/api/pdf', pdfViewerRoutes); // PDF viewing and embedding

// New Enhanced Client Flow Routes
app.use('/api/strategy-calls', strategyCallsRoutes); // Strategy call booking system
app.use('/api/client/dashboard', clientDashboardRoutes); // Client dashboard with status tracking
app.use('/api/client/uploads', clientUploadsRoutes); // File upload system (resume, LinkedIn, portfolio)
app.use('/api/admin/onboarding-triggers', adminOnboardingTriggersRoutes); // Admin onboarding confirmation triggers
app.use('/api/client-actions', clientActionsRoutes); // Client actions (strategy call confirm, unlock, password reset)

// Complete Client Dashboard System
const clientDashboardCompleteRoutes = require('./routes/clientDashboardComplete');
app.use('/api/client-dashboard', clientDashboardCompleteRoutes); // Complete client dashboard with all features

// Existing Concierge Routes (Updated for New Flow)
app.use('/api/public-consultations', publicConsultationsRoutes); // Simplified public consultation requests
app.use('/api/admin/concierge', adminConciergeRoutes); // Admin gatekeeper controls
app.use('/api/client-registration', clientRegistrationRoutes); // Payment-gated client registration
app.use('/api/client/onboarding-20q', clientOnboarding20QRoutes); // 20-question onboarding with approval

// Zero-Trust Secure Routes
// app.use('/api/onboarding', secureOnboardingRoutes); // Secure 20-question onboarding with Zod validation

// Workflow Features Routes (no conflicts)
const onboardingWorkflowRoutes = require('./routes/onboardingWorkflow');
const workflowRoutes = require('./routes/workflow');
const applicationsWorkflowRoutes = require('./routes/applicationsWorkflow');
app.use('/api/workflow', workflowRoutes); // Workflow consultation requests
app.use('/api/applications-workflow', applicationsWorkflowRoutes); // Applications workflow
app.use('/api/onboarding-workflow', onboardingWorkflowRoutes); // 20-field onboarding, profile unlock, payment verification

// Client Pipeline Routes
app.use('/api/client/profile', clientProfileRoutes); // Client profile management
// Note: /api/client/dashboard already registered above

// Email action routes (for email button clicks)
const emailActionsRoutes = require('./routes/emailActions');
app.use('/api/email-actions', emailActionsRoutes);

// API Specification Compliant Routes
app.use('/api/consultation-requests-spec', consultationRequestsSpecRoutes);
app.use('/api/contact-requests-spec', contactRequestsSpecRoutes);
app.use('/api/admin-stats-spec', adminStatsSpecRoutes);
app.use('/api/admin-notifications-spec', adminNotificationsSpecRoutes);
app.use('/api/auth-spec', authSpecRoutes);
app.use('/api/applications-spec', applicationsSpecRoutes);
app.use('/api/profile-spec', profileSpecRoutes);

// Remove conflicting route registrations - keep only the main ones above
// API Specification routes are integrated into main routes

// Admin routes with enhanced security
app.get('/api/admin/stats', require('./middleware/auth').authenticateToken, require('./middleware/auth').requireAdmin, (req, res) => {
  const systemInfo = SystemMonitor.getSystemInfo();
  const cacheStats = cache.getStats();
  const securityStats = securityManager.getStats();
  
  res.json({
    system: systemInfo,
    cache: cacheStats,
    security: securityStats,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/admin/logs', require('./middleware/auth').authenticateToken, require('./middleware/auth').requireAdmin, (req, res) => {
  const { type = 'app', lines = 100 } = req.query;
  const fs = require('fs');
  const path = require('path');
  
  try {
    const logFile = path.join(__dirname, 'logs', `${type}.log`);
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const logLines = content.split('\n').slice(-lines).filter(line => line.trim());
      res.json({ logs: logLines, type, lines: logLines.length });
    } else {
      res.json({ logs: [], type, lines: 0, message: 'Log file not found' });
    }
  } catch (error) {
    logger.error('Failed to read log file', error);
    res.status(500).json({ error: 'Failed to read logs' });
  }
});

app.post('/api/admin/cache/clear', require('./middleware/auth').authenticateToken, require('./middleware/auth').requireAdmin, (req, res) => {
  cache.clear();
  logger.info('Cache cleared by admin', { adminId: req.user.id });
  res.json({ message: 'Cache cleared successfully' });
});

// 404 handler - must be BEFORE error handlers
app.use('*', (req, res, next) => {
  logger.warn('Route not found', { path: req.path, method: req.method, ip: req.ip });
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Enhanced error handler with detailed logging (must be LAST)
app.use((err, req, res, next) => {
  // Skip if response already sent
  if (res.headersSent) {
    return next(err);
  }

  const errorId = require('crypto').randomBytes(8).toString('hex');
  
  // Log error with context
  logger.error(`Error ${errorId}: ${err.message}`, err, {
    errorId,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    body: req.body,
    query: req.query
  });
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details || err.message,
      errorId
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication failed',
      errorId
    });
  }
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'File size exceeds the limit',
      errorId
    });
  }
  
  // Handle database errors
  if (err.code && err.code.startsWith('23')) { // PostgreSQL constraint violations
    return res.status(400).json({
      error: 'Database constraint violation',
      message: 'The operation violates a database constraint',
      errorId
    });
  }
  
  // Default error response
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    errorId,
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      details: err 
    })
  });
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server with proper port binding for DigitalOcean
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Apply Bureau Backend started successfully`, {
    port: PORT,
    host: '0.0.0.0',
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
    nodeVersion: process.version,
    pid: process.pid
  });
  
  // Only initialize WebSocket in development or if explicitly enabled
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_WEBSOCKET === 'true') {
    try {
      const realtimeManager = require('./utils/realtime');
      realtimeManager.initialize(server);
      logger.info('Real-time WebSocket initialized on same port', { port: PORT });
    } catch (error) {
      logger.warn('Failed to initialize WebSocket, continuing without real-time features', { error: error.message });
    }
  } else {
    logger.info('WebSocket disabled in production for resource optimization');
  }
  
  // Start monitoring in production (lightweight version)
  if (process.env.NODE_ENV === 'production') {
    logger.info('Starting production monitoring');
    
    // Only start essential monitoring to reduce resource usage
    try {
      performanceMonitor.startMonitoring();
    } catch (error) {
      logger.warn('Performance monitoring disabled to save resources', { error: error.message });
    }
    
    // Log basic system info
    logger.info('System information', {
      platform: process.platform,
      arch: process.arch,
      memory: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      nodeVersion: process.version
    });
  }
  
  // Reduced frequency cache cleanup to save resources
  setInterval(() => {
    try {
      cache.cleanup();
      if (process.env.NODE_ENV === 'production') {
        logger.info('System check', {
          memory: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
          uptime: `${Math.round(process.uptime() / 3600 * 100) / 100}h`
        });
      }
    } catch (error) {
      logger.warn('System check error', { error: error.message });
    }
  }, 30 * 60 * 1000); // Every 30 minutes instead of 10
});

module.exports = app;