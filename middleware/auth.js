const { verifySupabaseJWT } = require('../utils/supabase');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

// JWT Token generation for authentication
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Zero-Trust JWT Authentication Middleware
// Verifies JWT tokens on every request (stateless)
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Missing authorization token', { 
        ip: req.ip, 
        userAgent: req.get('User-Agent'),
        path: req.path 
      });
      return res.status(401).json({ error: 'Access token required' });
    }

    // Use regular JWT verification to match token generation
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Standardize user object structure
    const user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role || 'client',
      full_name: decoded.full_name,
      is_super_admin: decoded.is_super_admin || false,
      source: decoded.source || 'clients'
    };
    
    // Attach user context to request
    req.user = user;
    req.token = token;
    
    // Log successful authentication
    logger.info('Token verified successfully', { 
      userId: user.id, 
      role: user.role,
      path: req.path 
    });
    
    next();
  } catch (error) {
    logger.warn('Token verification failed', { 
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Role-based access control middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    logger.warn('Admin access denied', { 
      userId: req.user?.id, 
      role: req.user?.role,
      path: req.path 
    });
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireClient = (req, res, next) => {
  if (!req.user || req.user.role !== 'client') {
    logger.warn('Client access denied', { 
      userId: req.user?.id, 
      role: req.user?.role,
      path: req.path 
    });
    return res.status(403).json({ error: 'Client access required' });
  }
  next();
};

// Enhanced rate limiting for Zero-Trust architecture
const createZeroTrustRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return require('express-rate-limit')({
    windowMs,
    max,
    message: { error: message, retryAfter: Math.ceil(windowMs / 1000) },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip;
    },
    handler: (req, res) => {
      const identifier = req.user?.id || req.ip;
      logger.security('rate_limit_exceeded', { 
        identifier, 
        endpoint: req.path, 
        userAgent: req.get('User-Agent'),
        userId: req.user?.id 
      });
      res.status(429).json({ 
        error: message, 
        retryAfter: Math.ceil(windowMs / 1000) 
      });
    }
  });
};

// Specific rate limiters for different endpoint types
const authRateLimit = createZeroTrustRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts');
const onboardingRateLimit = createZeroTrustRateLimit(60 * 60 * 1000, 3, 'Too many onboarding submissions');
const generalRateLimit = createZeroTrustRateLimit(15 * 60 * 1000, 100, 'Too many requests');

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin,
  requireClient,
  authRateLimit,
  onboardingRateLimit,
  generalRateLimit,
  createZeroTrustRateLimit
};