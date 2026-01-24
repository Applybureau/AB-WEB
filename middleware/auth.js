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

// Rate limiting removed for 24/7 uninterrupted operation
// Enhanced rate limiting functions disabled

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin,
  requireClient
};