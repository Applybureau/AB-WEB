// Email Security and Deliverability Utilities
const crypto = require('crypto');

/**
 * Generate secure tracking parameters for email links
 */
function generateSecureTrackingParams(userId, action, timestamp = Date.now()) {
  const secret = process.env.EMAIL_TRACKING_SECRET || process.env.JWT_SECRET || 'default-secret';
  const data = `${userId}-${action}-${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex').substring(0, 16);
  
  return {
    utm_source: 'email',
    utm_medium: 'notification',
    utm_campaign: action,
    t: timestamp,
    s: signature,
    u: userId
  };
}

/**
 * Create secure, trackable URLs for email links
 */
function createSecureEmailLink(baseUrl, userId, action, additionalParams = {}) {
  const trackingParams = generateSecureTrackingParams(userId, action);
  const allParams = { ...trackingParams, ...additionalParams };
  
  const url = new URL(baseUrl);
  Object.entries(allParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return url.toString();
}

/**
 * Generate email-safe image URLs with fallbacks
 */
function getEmailSafeImageUrl(imageUrl, fallbackText = 'Apply Bureau') {
  // For production, use a CDN with proper CORS headers
  const baseUrl = process.env.EMAIL_ASSETS_CDN || 'https://res.cloudinary.com/dbehg8jsv/image/upload';
  
  // If it's already a full URL, return as-is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Construct CDN URL
  return `${baseUrl}/${imageUrl}`;
}

/**
 * Create email-safe HTML with proper security attributes
 */
function createEmailSafeHtml(html) {
  // Add security and compatibility attributes to links
  return html.replace(
    /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi,
    (match, attributes, href) => {
      // Don't modify mailto links
      if (href.startsWith('mailto:')) {
        return match;
      }
      
      // Add security and tracking attributes
      const securityAttrs = [
        'rel="noopener noreferrer"',
        'target="_blank"',
        'style="color: #10B981; text-decoration: none;"'
      ].join(' ');
      
      return `<a ${attributes} ${securityAttrs}>`;
    }
  );
}

/**
 * Generate email preheader text for better inbox display
 */
function generatePreheaderText(subject, content) {
  // Extract first sentence or meaningful content
  const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const firstSentence = cleanContent.split('.')[0];
  
  if (firstSentence.length > 100) {
    return firstSentence.substring(0, 97) + '...';
  }
  
  return firstSentence;
}

/**
 * Add email client compatibility CSS
 */
function getEmailCompatibilityCSS() {
  return `
    <style>
      /* Email Client Compatibility */
      @media screen and (max-width: 600px) {
        .email-container { width: 100% !important; }
        .email-content { padding: 20px !important; }
      }
      
      /* Outlook specific fixes */
      <!--[if mso]>
      <style>
        .email-button { 
          border: none !important; 
          mso-style-priority: 99 !important; 
        }
      </style>
      <![endif]-->
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .email-container { background-color: #1a1a1a !important; }
        .email-text { color: #ffffff !important; }
      }
      
      /* Image display fixes */
      img { 
        display: block; 
        border: 0; 
        outline: none; 
        text-decoration: none; 
        -ms-interpolation-mode: bicubic; 
      }
      
      /* Link security */
      a { 
        color: #10B981; 
        text-decoration: none; 
      }
      a:hover { 
        text-decoration: underline; 
      }
    </style>
  `;
}

/**
 * Create email headers for better deliverability
 */
function getEmailHeaders(templateName, userId) {
  return {
    'X-Email-Template': templateName,
    'X-User-ID': userId,
    'X-Mailer': 'Apply Bureau Email System',
    'List-Unsubscribe': `<mailto:unsubscribe@applybureau.com?subject=Unsubscribe-${userId}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
  };
}

module.exports = {
  generateSecureTrackingParams,
  createSecureEmailLink,
  getEmailSafeImageUrl,
  createEmailSafeHtml,
  generatePreheaderText,
  getEmailCompatibilityCSS,
  getEmailHeaders
};