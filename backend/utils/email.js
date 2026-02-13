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
    // Try multiple possible logo locations for deployment flexibility
    const possiblePaths = [
      path.join(__dirname, '..', '..', 'logo.png'),
      path.join(__dirname, '..', 'assets', 'logo.png'),
      path.join(process.cwd(), 'logo.png'),
      path.join(process.cwd(), 'backend', 'assets', 'logo.png')
    ];
    
    for (const logoPath of possiblePaths) {
      try {
        const logoBuffer = await fs.readFile(logoPath);
        LOGO_BASE64 = logoBuffer.toString('base64');
        console.log(`Logo loaded successfully from: ${logoPath}`);
        return LOGO_BASE64;
      } catch (pathError) {
        // Continue to next path
        continue;
      }
    }
    
    // If no logo found, use the new Cloudinary URL
    console.warn('Could not load logo.png from any location, using Cloudinary URL fallback');
    return 'https://res.cloudinary.com/dbehg8jsv/image/upload/v1769345413/AB_LOGO_EDITED-removebg-preview_zrz8ai.png';
  } catch (error) {
    console.warn('Logo loading error:', error.message);
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
  
  // First, handle regular variable replacements to avoid conflicts
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    let value = variables[key];
    
    // Handle object serialization properly
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        value = value.join(', ');
      } else {
        value = JSON.stringify(value, null, 2);
      }
    }
    
    // Convert undefined/null to empty string
    if (value === undefined || value === null) {
      value = '';
    }
    
    result = result.replace(regex, value);
  });
  
  // Handle Handlebars-style conditionals with else (non-greedy matching)
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, ifContent, elseContent) => {
    const value = variables[condition];
    const shouldShow = value && value !== '' && value !== null && value !== undefined;
    return shouldShow ? ifContent : elseContent;
  });
  
  // Handle Handlebars-style conditionals without else (process multiple times for nested conditionals)
  let maxIterations = 10; // Prevent infinite loops
  let iteration = 0;
  
  while (result.includes('{{#if') && iteration < maxIterations) {
    const beforeReplace = result;
    
    result = result.replace(/\{\{#if\s+(\w+)\}\}((?:(?!\{\{#if|\{\{\/if\}\}).)*)\{\{\/if\}\}/g, (match, condition, content) => {
      const value = variables[condition];
      const shouldShow = value && value !== '' && value !== null && value !== undefined;
      return shouldShow ? content : '';
    });
    
    // If no changes were made, break to avoid infinite loop
    if (beforeReplace === result) {
      break;
    }
    
    iteration++;
  }
  
  // Clean up any remaining unprocessed conditionals (safety net)
  result = result.replace(/\{\{#if\s+\w+\}\}/g, '');
  result = result.replace(/\{\{\/if\}\}/g, '');
  result = result.replace(/\{\{else\}\}/g, '');
  
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
      support_email: 'applybureau@gmail.com',
      company_name: 'Apply Bureau',
      current_year: new Date().getFullYear(),
      logo_base64: logoBase64,
      logo_url: 'https://res.cloudinary.com/dbehg8jsv/image/upload/v1769345413/AB_LOGO_EDITED-removebg-preview_zrz8ai.png', // New logo URL
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

const sendEmail = async (to, templateName, variables = {}) => {
  try {
    // Extract user ID for security features
    const userId = variables.user_id || variables.client_id || 'unknown';
    
    // Create secure email content
    let htmlContent = await createSecureEmailContent(templateName, variables, userId);

    // Extract subject from template or use provided subject
    const subjectMatch = htmlContent.match(/<!-- SUBJECT: (.*?) -->/);
    const finalSubject = variables.subject || 
                        (subjectMatch ? subjectMatch[1] : `Notification from Apply Bureau`);

    // Use the verified domain for production emails
    const fromEmail = 'Apply Bureau <admin@applybureau.com>';

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
      
      // Add testing notice to email content if main_content placeholder exists
      if (htmlContent.includes('{{main_content}}')) {
        htmlContent = htmlContent.replace(
          '{{main_content}}', 
          testingNotice + (variables.main_content || variables.message || '')
        );
      }
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
      headers: headers,
      reply_to: variables.reply_to || 'applybureau@gmail.com' // Default reply-to
    };

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('Email sending error:', error);
      throw error;
    }

    console.log('✅ Email sent successfully:', {
      id: data.id,
      to: actualRecipient,
      subject: finalSubject,
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

// Send application update email with reply-to functionality
const sendApplicationUpdateEmail = async (clientEmail, applicationData, options = {}) => {
  try {
    const {
      client_name,
      company_name,
      position_title,
      application_status,
      message,
      next_steps,
      consultant_email = 'applybureau@gmail.com', // Default consultant email for replies
      user_id
    } = applicationData;

    // Determine subject based on status or use custom
    let subject = options.subject || 'Application Update - Apply Bureau';
    
    if (application_status) {
      const statusSubjects = {
        'review': 'Your Application is Under Review - Apply Bureau',
        'interview': 'Interview Scheduled - Application Update',
        'offer': '🎉 Great News About Your Application!',
        'rejected': 'Application Status Update - Apply Bureau',
        'withdrawn': 'Application Withdrawal Confirmed - Apply Bureau'
      };
      subject = statusSubjects[application_status] || subject;
    }

    const variables = {
      subject,
      client_name,
      company_name,
      position_title,
      application_status,
      message: message || 'Your application is being reviewed and we will keep you updated on any progress.',
      next_steps,
      dashboard_url: buildUrl('/dashboard'),
      user_id: user_id || 'unknown',
      reply_to: consultant_email, // This enables the reply-to functionality
      current_year: new Date().getFullYear()
    };

    console.log(`📧 Sending application update email to ${clientEmail} with reply-to: ${consultant_email}`);
    
    return await sendEmail(clientEmail, 'application_update', variables);
  } catch (error) {
    console.error('❌ Failed to send application update email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendSimpleEmail,
  sendApplicationUpdateEmail,
  getEmailTemplate,
  replaceTemplateVariables,
  loadLogoBase64,
  buildUrl,
  createSecureEmailContent
};
