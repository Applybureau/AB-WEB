const crypto = require('crypto');
const logger = require('./logger');

// Advanced security utilities
class SecurityManager {
  constructor() {
    this.suspiciousIPs = new Map();
    this.failedAttempts = new Map();
    this.blockedIPs = new Set();
    this.maxFailedAttempts = 5;
    this.blockDuration = 15 * 60 * 1000; // 15 minutes
  }

  // Rate limiting per IP
  checkRateLimit(ip, endpoint, maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    
    if (!this.suspiciousIPs.has(key)) {
      this.suspiciousIPs.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    const data = this.suspiciousIPs.get(key);
    
    // Reset if window expired
    if (now > data.resetTime) {
      this.suspiciousIPs.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    // Increment count
    data.count++;
    
    if (data.count > maxRequests) {
      logger.security('rate_limit_exceeded', { ip, endpoint, count: data.count });
      return { allowed: false, remaining: 0, resetTime: data.resetTime };
    }

    return { allowed: true, remaining: maxRequests - data.count };
  }

  // Track failed login attempts
  recordFailedAttempt(identifier, ip) {
    const key = `${identifier}:${ip}`;
    const attempts = this.failedAttempts.get(key) || 0;
    const newAttempts = attempts + 1;
    
    this.failedAttempts.set(key, newAttempts);
    
    if (newAttempts >= this.maxFailedAttempts) {
      this.blockIP(ip, 'brute_force_attempt');
      logger.security('brute_force_detected', { identifier, ip, attempts: newAttempts });
      return { blocked: true, attempts: newAttempts };
    }

    logger.security('failed_login_attempt', { identifier, ip, attempts: newAttempts });
    return { blocked: false, attempts: newAttempts };
  }

  // Clear failed attempts on successful login
  clearFailedAttempts(identifier, ip) {
    const key = `${identifier}:${ip}`;
    this.failedAttempts.delete(key);
  }

  // Block IP address
  blockIP(ip, reason) {
    this.blockedIPs.add(ip);
    logger.security('ip_blocked', { ip, reason });
    
    // Auto-unblock after duration
    setTimeout(() => {
      this.unblockIP(ip);
    }, this.blockDuration);
  }

  // Unblock IP address
  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    logger.security('ip_unblocked', { ip });
  }

  // Check if IP is blocked
  isBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  // Detect SQL injection attempts
  detectSQLInjection(input) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/|;|'|"|\||&)/,
      /(\bOR\b|\bAND\b).*?[=<>]/i,
      /\b(WAITFOR|DELAY)\b/i,
      /\b(XP_|SP_)/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        return true;
      }
    }
    return false;
  }

  // Detect XSS attempts
  detectXSS(input) {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /eval\s*\(/i,
      /expression\s*\(/i
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        return true;
      }
    }
    return false;
  }

  // Sanitize input
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Generate secure token
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash sensitive data
  hashData(data, salt = null) {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: actualSalt };
  }

  // Verify hashed data
  verifyHash(data, hash, salt) {
    const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  // Encrypt sensitive data
  encrypt(text, key = null) {
    const actualKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, actualKey);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex')
    };
  }

  // Decrypt sensitive data
  decrypt(encryptedData, key = null) {
    const actualKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const algorithm = 'aes-256-gcm';
    const decipher = crypto.createDecipher(algorithm, actualKey);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Security middleware
  securityMiddleware() {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      
      // Check if IP is blocked
      if (this.isBlocked(ip)) {
        logger.security('blocked_ip_access_attempt', { ip, url: req.url });
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check for suspicious patterns in query parameters and body
      const checkData = { ...req.query, ...req.body };
      
      for (const [key, value] of Object.entries(checkData)) {
        if (typeof value === 'string') {
          if (this.detectSQLInjection(value)) {
            logger.security('sql_injection_attempt', { ip, key, value, url: req.url });
            return res.status(400).json({ error: 'Invalid input detected' });
          }
          
          if (this.detectXSS(value)) {
            logger.security('xss_attempt', { ip, key, value, url: req.url });
            return res.status(400).json({ error: 'Invalid input detected' });
          }
        }
      }

      // Add security headers
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      });

      next();
    };
  }

  // Get security statistics
  getStats() {
    return {
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size,
      failedAttempts: this.failedAttempts.size,
      maxFailedAttempts: this.maxFailedAttempts,
      blockDuration: this.blockDuration
    };
  }
}

// Create singleton instance
const securityManager = new SecurityManager();

module.exports = securityManager;