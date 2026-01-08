require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');

// Import advanced utilities
const logger = require('./utils/logger');
const { cache, cacheMiddleware } = require('./utils/cache');
const securityManager = require('./utils/security');
const { requestMonitor, dbMonitor, performanceMonitor, SystemMonitor } = require('./utils/monitoring');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const enhancedDashboardRoutes = require('./routes/enhancedDashboard');
const consultationRoutes = require('./routes/consultations');
const consultationsCombinedRoutes = require('./routes/consultationsCombined');
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

// Enhanced rate limiting with different limits for different endpoints
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message, retryAfter: Math.ceil(windowMs / 1000) },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    logger.security('rate_limit_exceeded', { ip, endpoint: req.path, userAgent: req.get('User-Agent') });
    res.status(429).json({ error: message, retryAfter: Math.ceil(windowMs / 1000) });
  }
});

// Different rate limits for different endpoint types
app.use('/api/auth/login', createRateLimiter(15 * 60 * 1000, 5, 'Too many login attempts'));
app.use('/api/auth/invite', createRateLimiter(60 * 60 * 1000, 10, 'Too many invitations sent'));
app.use('/api/upload', createRateLimiter(60 * 60 * 1000, 20, 'Too many file uploads'));
app.use('/api/', createRateLimiter(15 * 60 * 1000, 100, 'Too many requests from this IP'));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // Vite default
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'https://localhost:5173'
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins for now to fix frontend issues
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

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
  res.status(200).json({ 
    ...healthStatus,
    service: 'Apply Bureau Backend'
  });
});

// API Health check endpoint
app.get('/api/health', (req, res) => {
  const healthStatus = SystemMonitor.getHealthStatus();
  res.status(200).json({ 
    ...healthStatus,
    service: 'Apply Bureau Backend'
  });
});

// Detailed system info endpoint (admin only in production)
app.get('/system-info', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const systemInfo = SystemMonitor.getSystemInfo();
  res.json(systemInfo);
});

// API routes with caching where appropriate
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', cacheMiddleware(300), dashboardRoutes); // Cache dashboard for 5 minutes
app.use('/api/enhanced-dashboard', enhancedDashboardRoutes); // Real-time dashboard (no caching)
app.use('/api/consultations', consultationsCombinedRoutes); // Website consultation requests (public POST + admin GET)
app.use('/api/contact', contactRoutes); // Contact form (public)
app.use('/api/consultation-management', consultationRoutes); // Internal consultation management (admin only)
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/public', publicRoutes); // Public routes for website integration
app.use('/api/admin-management', adminManagementRoutes); // Enhanced admin management
app.use('/api/files', fileManagementRoutes); // File upload and management
app.use('/api/admin-dashboard', adminDashboardRoutes); // Admin-specific dashboard

// Admin routes with enhanced security
app.get('/api/admin/stats', require('./utils/auth').authenticateToken, require('./utils/auth').requireAdmin, (req, res) => {
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

app.get('/api/admin/logs', require('./utils/auth').authenticateToken, require('./utils/auth').requireAdmin, (req, res) => {
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

app.post('/api/admin/cache/clear', require('./utils/auth').authenticateToken, require('./utils/auth').requireAdmin, (req, res) => {
  cache.clear();
  logger.info('Cache cleared by admin', { adminId: req.user.id });
  res.json({ message: 'Cache cleared successfully' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Enhanced error handler with detailed logging
app.use((err, req, res, next) => {
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
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
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
  realtimeManager.initialize(server);
  
  // Start server with WebSocket support
  server.listen(PORT + 1, () => {
    logger.info('Real-time WebSocket server started', { port: PORT + 1 });
  });
  
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