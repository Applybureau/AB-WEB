const jwt = require('jsonwebtoken');
const { supabase } = require('../utils/supabase');
const logger = require('../utils/logger');
const securityManager = require('../utils/security');

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        logger.warn('Token verification failed', { error: err.message });
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      
      req.user = user;
      next();
    });
  } catch (error) {
    logger.error('Token verification error', error, { userId: req.user?.id });
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to check if user is client
const requireClient = (req, res, next) => {
  if (!req.user || req.user.role !== 'client') {
    return res.status(403).json({ error: 'Client access required' });
  }
  next();
};

// Rate limiting middleware
const rateLimiter = securityManager.securityMiddleware();

module.exports = {
  authenticateToken,
  requireAdmin,
  requireClient,
  rateLimiter
};