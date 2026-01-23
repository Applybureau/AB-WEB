const { Resend } = require('resend');
const fs = require('fs').promises;
const path = require('path');
const { 
  createSecureEmailLink, 
  getEmailSafeImageUrl, 
  createEmailSafeHtml, 
  generatePreheaderText, 
  getEmailHeaders 
} = require('./emailSecurity');

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to construct URLs properly
const buildUrl = (path) => {
  const baseUrl = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// Base64 encoded Apply Bureau logo - loaded from file at runtime for maintainability
let LOGO_BASE64 = null;

const loadLogoBase64 = async () => {
  if (LOGO_BASE64) return LOGO_BASE64;
  
  try {
    const logoPath = path.join(__dirname, '..', '..', 'logo.png');
    const logoBuffer = await fs.readFile(logoPath);
    LOGO_BASE64 = logoBuffer.toString('base64');
    return LOGO_BASE64;
  } catch (error) {
    console.warn('Could not load logo.png for Base64 encoding, using external URL fallback');
    return null;
  }
};

const getEmailTemplate = async (templateName) => {
  const templatePath = path.join(__dirname, '..', 'emails', 'templates', `${templateName}.html`);
  try {
    return await fs.readFile(templatePath, 'utf8');
  } catch (error) {
    console.error(`Template ${templateName} not found:`, error);
    throw new Error(`Email template ${templateName} not found`);
  }
};

const replaceTemplateVariables = (template, variables) => {
  let result = template;
  
  // Handle Handlebars-style conditionals
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
    return variables[condition] ? content : '';
  });
  
  // Handle regular variable replacements
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, variables[key] || '');
  });
  
  return result;
};

const createSecureEmailContent = async (templateName, variables, userId) => {
  try {
    // Load the template
    const template = await getEmailTemplate(templateName);
    
    // Load Base64 logo for embedding
    const logoBase64 = await loadLogoBase64();
    
    // Create secure URLs for all links
    const secureUrls = {};
    if (variables.dashboard_url) {
      secureUrls.dashboard_url = createSecureEmailLink(
        buildUrl('/dashboard'), 
        userId, 
        'dashboard_access'
      );
    }
    if (variables.cta_url) {
      secureUrls.cta_url = createSecureEmailLink(
        variables.cta_url, 
        userId, 
        templateName
      );
    }
    
    // Default secure variables
    const defaultVariables = {
      dashboard_link: buildUrl('/dashboard'),
      support_email: 'support@applybureau.com',
      company_name: 'Apply Bureau',
      current_year: new Date().getFullYear(),
      logo_base64: logoBase64,
      unsubscribe_url: createSecureEmailLink(
        buildUrl('/unsubscribe'), 
        userId, 
        'unsubscribe'
      ),
      preferences_url: createSecureEmailLink(
        buildUrl('/email-preferences'), 
        userId, 
        'preferences'
      ),
      // Generate preheader text from content
      preheader_text: generatePreheaderText(
        variables.email_title || 'Apply Bureau Notification',
        variables.main_content || variables.message || ''
      )
    };

    // Merge all variables
    const allVariables = { 
      ...defaultVariables, 
      ...variables, 
      ...secureUrls 
    };
    
    // Replace template variables
    let htmlContent = replaceTemplateVariables(template, allVariables);
    
    // Apply security enhancements to HTML
    htmlContent = createEmailSafeHtml(htmlContent);

    return htmlContent;
  } catch (error) {
    console.error('Error creating secure email content:', error);
    throw error;
  }
};

const sendEmail = async (to, subject, templateName, variables = {}) => {
  try {
    // Extract user ID for security features
    const userId = variables.user_id || variables.client_id || 'unknown';
    
    // Create secure email content
    const htmlContent = await createSecureEmailContent(templateName, variables, userId);

    // Extract subject from template or use provided subject
    const subjectMatch = htmlContent.match(/<!-- SUBJECT: (.*?) -->/);
    const finalSubject = subject || 
                        (subjectMatch ? subjectMatch[1] : `Notification from Apply Bureau`);

    // Use verified domain or default Resend domain for testing
    const fromEmail = process.env.VERIFIED_EMAIL_DOMAIN 
      ? `Apply Bureau <noreply@${process.env.VERIFIED_EMAIL_DOMAIN}>`
      : 'Apply Bureau <onboarding@resend.dev>'; // Default Resend domain for testing

    // Only redirect emails in explicit testing mode
    const isExplicitTestMode = process.env.EMAIL_TESTING_MODE === 'true';
    const verifiedTestEmail = 'israelloko65@gmail.com';
    
    let actualRecipient = to;
    let testingNotice = '';
    
    if (isExplicitTestMode && to !== verifiedTestEmail) {
      console.log(`🧪 TESTING MODE: Redirecting email from ${to} to ${verifiedTestEmail}`);
      actualRecipient = verifiedTestEmail;
      testingNotice = `
        <div style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 6px;">
          <p style="color: #92400E; font-weight: bold; margin: 0 0 5px 0;">🧪 TESTING MODE</p>
          <p style="color: #92400E; margin: 0; font-size: 14px;">
            This email was originally intended for <strong>${to}</strong> but redirected for testing purposes.
          </p>
        </div>
      `;
      
      // Add testing notice to email content
      htmlContent = htmlContent.replace(
        '{{main_content}}', 
        testingNotice + (variables.main_content || variables.message || '')
      );
    } else {
      console.log(`📧 Sending email to intended recipient: ${to}`);
    }

    // Get email headers for better deliverability
    const headers = getEmailHeaders(templateName, userId);

    const emailData = {
      from: fromEmail,
      to: [actualRecipient],
      subject: finalSubject,
      html: htmlContent,
      headers: headers
    };

    // Add reply-to if specified
    if (variables.reply_to) {
      emailData.reply_to = variables.reply_to;
    }

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('Email sending error:', error);
      throw error;
    }

    console.log('✅ Email sent successfully:', {
      id: data.id,
      to: actualRecipient,
      subject: subject,
      template: templateName
    });
    
    return data;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
};

// Create a simple email for basic notifications
const sendSimpleEmail = async (to, subject, message, userId = 'unknown') => {
  const variables = {
    email_title: subject,
    main_content: message,
    user_id: userId,
    subject: subject
  };
  
  return sendEmail(to, '_secure_base_template', variables);
};

module.exports = {
  sendEmail,
  sendSimpleEmail,
  getEmailTemplate,
  replaceTemplateVariables,
  loadLogoBase64,
  buildUrl,
  createSecureEmailContent
};
