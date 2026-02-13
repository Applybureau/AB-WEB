const logger = require('./logger');

// In-memory cache with TTL support
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  set(key, value, ttlSeconds = 300) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set the value
    this.cache.set(key, {
      value,
      createdAt: Date.now(),
      ttl: ttlSeconds * 1000
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlSeconds * 1000);

    this.timers.set(key, timer);
    this.stats.sets++;

    logger.debug(`Cache SET: ${key}`, { ttl: ttlSeconds });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      logger.debug(`Cache MISS: ${key}`);
      return null;
    }

    // Check if expired
    if (Date.now() - item.createdAt > item.ttl) {
      this.delete(key);
      this.stats.misses++;
      logger.debug(`Cache EXPIRED: ${key}`);
      return null;
    }

    this.stats.hits++;
    logger.debug(`Cache HIT: ${key}`);
    return item.value;
  }

  delete(key) {
    const deleted = this.cache.delete(key);
    
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    if (deleted) {
      this.stats.deletes++;
      logger.debug(`Cache DELETE: ${key}`);
    }

    return deleted;
  }

  clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    const size = this.cache.size;
    this.cache.clear();
    
    logger.info(`Cache cleared: ${size} items removed`);
  }

  has(key) {
    return this.cache.has(key) && this.get(key) !== null;
  }

  size() {
    return this.cache.size;
  }

  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      memoryUsage: this.getMemoryUsage()
    };
  }

  getMemoryUsage() {
    let totalSize = 0;
    
    this.cache.forEach((item, key) => {
      totalSize += JSON.stringify(item).length + key.length;
    });

    return `${(totalSize / 1024).toFixed(2)} KB`;
  }

  // Cleanup expired items
  cleanup() {
    let cleaned = 0;
    const now = Date.now();

    this.cache.forEach((item, key) => {
      if (now - item.createdAt > item.ttl) {
        this.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      logger.info(`Cache cleanup: ${cleaned} expired items removed`);
    }

    return cleaned;
  }
}

// Cache middleware for Express
function cacheMiddleware(ttlSeconds = 300, keyGenerator = null) {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const key = keyGenerator 
      ? keyGenerator(req)
      : `${req.method}:${req.originalUrl}:${req.user?.id || 'anonymous'}`;

    // Try to get from cache
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      logger.debug('Serving from cache', { key, url: req.originalUrl });
      return res.json(cachedResponse);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache the response
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data, ttlSeconds);
        logger.debug('Response cached', { key, url: req.originalUrl, ttl: ttlSeconds });
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
}

// Create cache instance
const cache = new MemoryCache();

// Periodic cleanup (every 5 minutes)
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

// Log cache stats periodically (every 10 minutes)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const stats = cache.getStats();
    logger.info('Cache statistics', stats);
  }, 10 * 60 * 1000);
}

module.exports = {
  cache,
  cacheMiddleware
};