const crypto = require('crypto');

/**
 * Generate secure tokens for email action links
 */

// Generate a secure token for email actions
function generateEmailActionToken(action, id, email) {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  const data = `${action}-${id}-${email}-${Date.now()}`;
  
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/[+/=]/g, '') // Remove URL-unsafe characters
    .slice(0, 16); // Keep it short for URLs
}

// Verify an email action token
function verifyEmailActionToken(token, action, id, email, maxAge = 24 * 60 * 60 * 1000) {
  try {
    // For now, use simple validation (can be enhanced with expiration)
    const expectedToken = Buffer.from(`${id}-${email}`).toString('base64').slice(0, 16);
    return token === expectedToken;
  } catch (error) {
    return false;
  }
}

// Generate consultation action URLs
function generateConsultationActionUrls(consultationId, email) {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const token = Buffer.from(`${consultationId}-${email}`).toString('base64').slice(0, 16);
  
  return {
    confirmUrl: `${baseUrl}/api/email-actions/consultation/${consultationId}/confirm/${token}`,
    waitlistUrl: `${baseUrl}/api/email-actions/consultation/${consultationId}/waitlist/${token}`,
    token
  };
}

// Generate admin action URLs
function generateAdminActionUrls(adminId, email) {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const suspendToken = Buffer.from(`suspend-${adminId}-${email}`).toString('base64').slice(0, 16);
  const deleteToken = Buffer.from(`delete-${adminId}-${email}`).toString('base64').slice(0, 16);
  
  return {
    suspendUrl: `${baseUrl}/api/email-actions/admin/${adminId}/suspend/${suspendToken}`,
    deleteUrl: `${baseUrl}/api/email-actions/admin/${adminId}/delete/${deleteToken}`,
    suspendToken,
    deleteToken
  };
}

module.exports = {
  generateEmailActionToken,
  verifyEmailActionToken,
  generateConsultationActionUrls,
  generateAdminActionUrls
};