const os = require('os');

// System monitoring utilities
class SystemMonitor {
  static getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        process: process.memoryUsage()
      },
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg()
      }
    };
  }

  static getHealthStatus() {
    const memory = process.memoryUsage();
    const memoryUsageMB = Math.round(memory.rss / 1024 / 1024);
    const uptimeHours = Math.round(process.uptime() / 3600 * 100) / 100;

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${uptimeHours} hours`,
      memory: `${memoryUsageMB}MB`,
      pid: process.pid,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  static logPerformanceMetrics() {
    const metrics = this.getSystemInfo();
    const memoryUsageMB = Math.round(metrics.memory.process.rss / 1024 / 1024);
    
    console.log(`[METRICS] Memory: ${memoryUsageMB}MB, Uptime: ${Math.round(metrics.uptime)}s, Load: ${metrics.cpu.loadAverage[0].toFixed(2)}`);
    
    // Alert if memory usage is high
    if (memoryUsageMB > 512) {
      console.warn(`[WARNING] High memory usage: ${memoryUsageMB}MB`);
    }
    
    // Alert if load average is high
    if (metrics.cpu.loadAverage[0] > metrics.cpu.cores) {
      console.warn(`[WARNING] High CPU load: ${metrics.cpu.loadAverage[0].toFixed(2)}`);
    }
  }
}

// Request monitoring middleware
const requestMonitor = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[REQUEST] ${req.method} ${req.path} - ${req.ip}`);
  }
  
  // Monitor response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[RESPONSE] ${req.method} ${req.path} - ${status} (${duration}ms)`);
    }
    
    // Alert on slow requests
    if (duration > 5000) {
      console.warn(`[WARNING] Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
    
    // Alert on errors
    if (status >= 500) {
      console.error(`[ERROR] Server error: ${req.method} ${req.path} returned ${status}`);
    }
  });
  
  next();
};

// Database connection monitor
const dbMonitor = {
  async checkConnection() {
    try {
      const { supabase } = require('./supabase');
      const { data, error } = await supabase
        .from('clients')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('[DB_ERROR] Database connection failed:', error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[DB_ERROR] Database check failed:', error.message);
      return false;
    }
  },

  startHealthCheck(intervalMs = 60000) {
    setInterval(async () => {
      const isHealthy = await this.checkConnection();
      if (!isHealthy) {
        console.error('[DB_ALERT] Database connection is unhealthy');
      }
    }, intervalMs);
  }
};

// Error tracking
const errorTracker = {
  track(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
    
    console.error('[ERROR_TRACKER]', JSON.stringify(errorInfo, null, 2));
    
    // In production, you might want to send this to an external service
    // like Sentry, LogRocket, or custom logging service
    if (process.env.SENTRY_DSN) {
      // Sentry.captureException(error, { extra: context });
    }
  }
};

// Performance monitoring
const performanceMonitor = {
  startMonitoring(intervalMs = 300000) { // 5 minutes
    setInterval(() => {
      SystemMonitor.logPerformanceMetrics();
    }, intervalMs);
  }
};

module.exports = {
  SystemMonitor,
  requestMonitor,
  dbMonitor,
  errorTracker,
  performanceMonitor
};