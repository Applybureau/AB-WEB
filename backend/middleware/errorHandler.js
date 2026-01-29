const logger = require('../utils/logger');

// Error codes constants
const ERROR_CODES = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_STATUS: 'INVALID_STATUS',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // Business logic errors
  PROFILE_LOCKED: 'PROFILE_LOCKED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

// Standardized error response format
const createErrorResponse = (error, code, details = [], status = 500, path = '', timestamp = new Date().toISOString()) => {
  return {
    success: false,
    error,
    code,
    details: Array.isArray(details) ? details : [details],
    timestamp,
    path,
    status
  };
};

// Success response format
const createSuccessResponse = (data = null, message = 'Success', meta = {}) => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }
  
  return response;
};

// Paginated response format
const createPaginatedResponse = (data, pagination, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    pagination: {
      total: pagination.total || 0,
      limit: pagination.limit || 20,
      offset: pagination.offset || 0,
      page: Math.floor((pagination.offset || 0) / (pagination.limit || 20)) + 1,
      total_pages: Math.ceil((pagination.total || 0) / (pagination.limit || 20)),
      has_next: (pagination.offset || 0) + (pagination.limit || 20) < (pagination.total || 0),
      has_previous: (pagination.offset || 0) > 0
    }
  };
};

// Validation error handler
const handleValidationError = (req, res, errors) => {
  const details = Array.isArray(errors) ? errors : [errors];
  const errorResponse = createErrorResponse(
    'Validation failed',
    ERROR_CODES.VALIDATION_ERROR,
    details,
    400,
    req.path
  );
  
  logger.warn('Validation error', { 
    path: req.path, 
    method: req.method, 
    errors: details,
    userId: req.user?.id 
  });
  
  return res.status(400).json(errorResponse);
};

// Authentication error handler
const handleAuthError = (req, res, message = 'Authentication required', code = ERROR_CODES.UNAUTHORIZED) => {
  const errorResponse = createErrorResponse(
    message,
    code,
    [],
    code === ERROR_CODES.UNAUTHORIZED ? 401 : 403,
    req.path
  );
  
  logger.warn('Authentication error', { 
    path: req.path, 
    method: req.method, 
    code,
    ip: req.ip 
  });
  
  return res.status(code === ERROR_CODES.UNAUTHORIZED ? 401 : 403).json(errorResponse);
};

// Not found error handler
const handleNotFoundError = (req, res, resource = 'Resource') => {
  const errorResponse = createErrorResponse(
    `${resource} not found`,
    ERROR_CODES.NOT_FOUND,
    [],
    404,
    req.path
  );
  
  logger.warn('Resource not found', { 
    path: req.path, 
    method: req.method, 
    resource,
    userId: req.user?.id 
  });
  
  return res.status(404).json(errorResponse);
};

// Database error handler
const handleDatabaseError = (req, res, error, message = 'Database operation failed') => {
  const errorResponse = createErrorResponse(
    message,
    ERROR_CODES.DATABASE_ERROR,
    [],
    500,
    req.path
  );
  
  logger.error('Database error', error, { 
    path: req.path, 
    method: req.method,
    userId: req.user?.id 
  });
  
  return res.status(500).json(errorResponse);
};

// Business logic error handler
const handleBusinessLogicError = (req, res, message, code, status = 400, details = []) => {
  const errorResponse = createErrorResponse(
    message,
    code,
    details,
    status,
    req.path
  );
  
  logger.warn('Business logic error', { 
    path: req.path, 
    method: req.method, 
    code, 
    message,
    userId: req.user?.id 
  });
  
  return res.status(status).json(errorResponse);
};

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error', err, {
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return handleValidationError(req, res, err.message);
  }
  
  if (err.name === 'JsonWebTokenError') {
    return handleAuthError(req, res, 'Invalid token', ERROR_CODES.INVALID_TOKEN);
  }
  
  if (err.name === 'TokenExpiredError') {
    return handleAuthError(req, res, 'Token expired', ERROR_CODES.TOKEN_EXPIRED);
  }
  
  if (err.code === '23505') { // PostgreSQL unique violation
    return handleBusinessLogicError(req, res, 'Resource already exists', ERROR_CODES.ALREADY_EXISTS, 409);
  }
  
  if (err.code === '23503') { // PostgreSQL foreign key violation
    return handleBusinessLogicError(req, res, 'Referenced resource not found', ERROR_CODES.NOT_FOUND, 404);
  }

  // Default server error
  const errorResponse = createErrorResponse(
    'Internal server error',
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    [],
    500,
    req.path
  );
  
  return res.status(500).json(errorResponse);
};

module.exports = {
  ERROR_CODES,
  createErrorResponse,
  createSuccessResponse,
  createPaginatedResponse,
  handleValidationError,
  handleAuthError,
  handleNotFoundError,
  handleDatabaseError,
  handleBusinessLogicError,
  globalErrorHandler
};