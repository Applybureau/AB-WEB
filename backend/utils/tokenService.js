const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('./supabase');
const logger = require('./logger');

const TOKEN_EXPIRY_HOURS = 72;

/**
 * Generate a secure registration token for approved leads
 * @param {string} consultationId - The consultation/lead ID
 * @param {string} email - The lead's email address
 * @returns {object} - { token, expiresAt }
 */
const generateRegistrationToken = (consultationId, email) => {
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  
  const payload = {
    consultation_id: consultationId,
    email: email,
    type: 'registration',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiresAt.getTime() / 1000)
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET);
  
  logger.info('Registration token generated', { 
    consultationId, 
    email,
    expiresAt: expiresAt.toISOString()
  });

  return {
    token,
    expiresAt
  };
};

/**
 * Verify a registration token
 * @param {string} token - The JWT token to verify
 * @returns {object} - { valid: boolean, payload?: object, error?: string }
 */
const verifyRegistrationToken = async (token) => {
  try {
    // Verify JWT signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check token type
    if (decoded.type !== 'registration') {
      return { valid: false, error: 'Invalid token type' };
    }

    // Check if token has been used in database
    const { data: lead, error } = await supabaseAdmin
      .from('consultation_requests')
      .select('id, email, token_used, pipeline_status, full_name')
      .eq('id', decoded.consultation_id)
      .single();

    if (error || !lead) {
      logger.warn('Token verification failed - lead not found', { 
        consultationId: decoded.consultation_id 
      });
      return { valid: false, error: 'Lead not found' };
    }

    if (lead.token_used) {
      logger.warn('Token already used', { 
        consultationId: decoded.consultation_id,
        email: decoded.email
      });
      return { valid: false, error: 'Token has already been used' };
    }

    if (lead.pipeline_status === 'client') {
      return { valid: false, error: 'Registration already completed' };
    }

    logger.info('Token verified successfully', { 
      consultationId: decoded.consultation_id,
      email: decoded.email
    });

    return {
      valid: true,
      payload: {
        consultation_id: decoded.consultation_id,
        email: decoded.email,
        full_name: lead.full_name
      }
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expired', { error: error.message });
      return { valid: false, error: 'Token has expired' };
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token', { error: error.message });
      return { valid: false, error: 'Invalid token' };
    }
    logger.error('Token verification error', error);
    return { valid: false, error: 'Token verification failed' };
  }
};

/**
 * Invalidate a token after successful registration
 * @param {string} consultationId - The consultation/lead ID
 * @returns {boolean} - Success status
 */
const invalidateToken = async (consultationId) => {
  try {
    const { error } = await supabaseAdmin
      .from('consultation_requests')
      .update({ 
        token_used: true,
        registration_token: null 
      })
      .eq('id', consultationId);

    if (error) {
      logger.error('Failed to invalidate token', error, { consultationId });
      return false;
    }

    logger.info('Token invalidated successfully', { consultationId });
    return true;
  } catch (error) {
    logger.error('Token invalidation error', error, { consultationId });
    return false;
  }
};

module.exports = {
  generateRegistrationToken,
  verifyRegistrationToken,
  invalidateToken,
  TOKEN_EXPIRY_HOURS
};
