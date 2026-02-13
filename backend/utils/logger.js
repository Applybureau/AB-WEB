const fs = require('fs');
const path = require('path');

// Advanced logging utility
class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      meta,
      pid: process.pid,
      memory: process.memoryUsage().rss,
      uptime: process.uptime()
    });
  }

  writeToFile(filename, content) {
    const filePath = path.join(this.logDir, filename);
    const logEntry = content + '\n';
    
    try {
      fs.appendFileSync(filePath, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  info(message, meta = {}) {
    const formatted = this.formatMessage('info', message, meta);
    console.log(`[INFO] ${message}`, meta);
    this.writeToFile('app.log', formatted);
  }

  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      })
    };
    
    const formatted = this.formatMessage('error', message, errorMeta);
    console.error(`[ERROR] ${message}`, errorMeta);
    this.writeToFile('error.log', formatted);
    this.writeToFile('app.log', formatted);
  }

  warn(message, meta = {}) {
    const formatted = this.formatMessage('warn', message, meta);
    console.warn(`[WARN] ${message}`, meta);
    this.writeToFile('app.log', formatted);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      const formatted = this.formatMessage('debug', message, meta);
      console.debug(`[DEBUG] ${message}`, meta);
      this.writeToFile('debug.log', formatted);
    }
  }

  http(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    };

    const message = `${req.method} ${req.url} - ${res.statusCode} (${responseTime}ms)`;
    
    if (res.statusCode >= 400) {
      this.error(message, null, logData);
    } else {
      this.info(message, logData);
    }
    
    this.writeToFile('access.log', this.formatMessage('http', message, logData));
  }

  security(event, details = {}) {
    const securityLog = {
      event,
      details,
      timestamp: new Date().toISOString(),
      severity: this.getSecuritySeverity(event)
    };

    this.warn(`Security Event: ${event}`, securityLog);
    this.writeToFile('security.log', this.formatMessage('security', event, securityLog));
  }

  getSecuritySeverity(event) {
    const highSeverityEvents = ['sql_injection', 'xss_attempt', 'brute_force', 'unauthorized_access'];
    const mediumSeverityEvents = ['invalid_token', 'rate_limit_exceeded', 'suspicious_activity'];
    
    if (highSeverityEvents.includes(event)) return 'HIGH';
    if (mediumSeverityEvents.includes(event)) return 'MEDIUM';
    return 'LOW';
  }

  performance(operation, duration, meta = {}) {
    const perfLog = {
      operation,
      duration: `${duration}ms`,
      ...meta
    };

    if (duration > 5000) {
      this.warn(`Slow operation: ${operation}`, perfLog);
    } else {
      this.debug(`Performance: ${operation}`, perfLog);
    }
    
    this.writeToFile('performance.log', this.formatMessage('performance', operation, perfLog));
  }

  // Log rotation (simple implementation)
  rotateLogs() {
    const logFiles = ['app.log', 'error.log', 'access.log', 'security.log', 'performance.log'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    logFiles.forEach(filename => {
      const filePath = path.join(this.logDir, filename);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        
        if (stats.size > maxSize) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const archivePath = path.join(this.logDir, `${filename}.${timestamp}`);
          
          try {
            fs.renameSync(filePath, archivePath);
            this.info(`Log rotated: ${filename} -> ${filename}.${timestamp}`);
          } catch (error) {
            this.error('Failed to rotate log file', error, { filename });
          }
        }
      }
    });
  }
}

// Create singleton instance
const logger = new Logger();

// Start log rotation check (every hour)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    logger.rotateLogs();
  }, 60 * 60 * 1000);
}

module.exports = logger;