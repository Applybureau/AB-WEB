require('dotenv').config();
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
const clientDashboardRoutes = require('./routes/clientDashboard');
const clientUploadsRoutes = require('./routes/clientUploads');
const adminOnboardingTriggersRoutes = require('./routes/adminOnboardingTriggers');

// Concierge Routes
const publicConsultationsRoutes = require('./routes/publicConsultations');
const adminConciergeRoutes = require('./routes/adminConcierge');
const clientRegistrationRoutes = require('./routes/clientRegistration');
const clientOnboarding20QRoutes = require('./routes/clientOnboarding20Q');

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
const PORT = process.env.PORT || 3000;

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

// Enhanced CORS configuration for Zero-Trust architecture
const corsOptions = {
  origin: function (origin, callback) {
    // Production-only allowed origins for Zero-Trust
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          process.env.FRONTEND_URL,
          'https://apply-bureau.vercel.app',
          'https://applybureau.com',
          'https://www.applybureau.com'
        ].filter(Boolean)
      : [
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
          'http://127.0.0.1:5173'
        ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    
    // Strict origin checking for Zero-Trust
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.security('cors_blocked', { 
        origin, 
        allowedOrigins
      });
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin'
  ],
  exposedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Total-Count', 
    'X-Page', 
    'X-Per-Page'
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
    logger.info('Preflight request received', { origin });
    return res.status(200).end();
  }
  
  next();
});


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
app.use('/api/contact', contactRoutes); // Contact form (public)
app.use('/api/consultation-management', require('./routes/consultationManagement')); // Internal consultation management (admin only)
app.use('/api/applications', applicationRoutes); // Main applications route
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/public', publicRoutes); // Public routes for website integration
app.use('/api/admin-management', adminManagementRoutes); // Enhanced admin management
app.use('/api/files', fileManagementRoutes); // File upload and management
app.use('/api/admin-dashboard', adminDashboardRoutes); // Admin-specific dashboard
app.use('/api/admin/20q-dashboard', admin20QDashboardRoutes); // 20 Questions admin dashboard

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
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'CORS policy violation',
      message: 'Origin not allowed',
      errorId
    });
  }
  
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

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`Apply Bureau Backend started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
    nodeVersion: process.version,
    pid: process.pid
  });
  
  // Initialize real-time WebSocket server
  const realtimeManager = require('./utils/realtime');
  const http = require('http');
  const server = http.createServer(app);
  
  try {
    realtimeManager.initialize(server);
    
    // Start server with WebSocket support
    server.listen(PORT + 1, () => {
      logger.info('Real-time WebSocket server started', { port: PORT + 1 });
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.warn('WebSocket port in use, continuing without real-time features', { port: PORT + 1 });
      } else {
        logger.error('WebSocket server error', { error: error.message });
      }
    });
  } catch (error) {
    logger.warn('Failed to initialize WebSocket server, continuing without real-time features', { error: error.message });
  }
  
  // Start monitoring in production
  if (process.env.NODE_ENV === 'production') {
    logger.info('Starting production monitoring and security features');
    performanceMonitor.startMonitoring();
    dbMonitor.startHealthCheck();
    
    // Log system info
    const systemInfo = SystemMonitor.getSystemInfo();
    logger.info('System information', {
      platform: systemInfo.platform,
      arch: systemInfo.arch,
      memory: `${Math.round(systemInfo.memory.process.rss / 1024 / 1024)}MB`,
      cpuCores: systemInfo.cpu.cores
    });
  }
  
  // Periodic cache cleanup and stats logging
  setInterval(() => {
    cache.cleanup();
    if (process.env.NODE_ENV === 'production') {
      logger.info('Periodic system check', {
        cacheStats: cache.getStats(),
        securityStats: securityManager.getStats(),
        memory: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        uptime: `${Math.round(process.uptime() / 3600 * 100) / 100}h`
      });
    }
  }, 10 * 60 * 1000); // Every 10 minutes
});

module.exports = app;