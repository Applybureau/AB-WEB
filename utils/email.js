const { Resend } = require('resend');
const fs = require('fs').promises;
const path = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to construct URLs properly
const buildUrl = (path) => {
  const baseUrl = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// Base64 encoded Apply Bureau logo - loaded from file at runtime for maintainability
// Falls back to external URL if Base64 loading fails
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
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, variables[key] || '');
  });
  return result;
};

const sendEmail = async (to, templateName, variables = {}) => {
  try {
    const template = await getEmailTemplate(templateName);
    
    // Load Base64 logo
    const logoBase64 = await loadLogoBase64();
    
    // Default variables including Base64 logo for inline embedding
    const defaultVariables = {
      dashboard_link: buildUrl('/dashboard'),
      contact_email: 'support@applybureau.com',
      company_name: 'Apply Bureau',
      current_year: new Date().getFullYear(),
      logo_base64: logoBase64 || ''
    };

    const allVariables = { ...defaultVariables, ...variables };
    const htmlContent = replaceTemplateVariables(template, allVariables);

    // Extract subject from template (first line should be <!-- SUBJECT: ... -->)
    const subjectMatch = htmlContent.match(/<!-- SUBJECT: (.*?) -->/);
    const subject = subjectMatch ? subjectMatch[1] : `Notification from ${defaultVariables.company_name}`;

    // Use verified domain or default Resend domain for testing
    const fromEmail = process.env.VERIFIED_EMAIL_DOMAIN 
      ? `Apply Bureau <noreply@${process.env.VERIFIED_EMAIL_DOMAIN}>`
      : 'Apply Bureau <onboarding@resend.dev>'; // Default Resend domain for testing

    // Only redirect emails in explicit testing mode
    // This should ONLY happen when EXPLICITLY testing with unverified emails
    const isExplicitTestMode = process.env.EMAIL_TESTING_MODE === 'true';
    const verifiedTestEmail = 'israelloko65@gmail.com';
    
    let actualRecipient = to;
    if (isExplicitTestMode && to !== verifiedTestEmail) {
      console.log(`🧪 TESTING MODE: Redirecting email from ${to} to ${verifiedTestEmail}`);
      actualRecipient = verifiedTestEmail;
      
      // Add original recipient info to email content for testing visibility
      allVariables.original_recipient = to;
      allVariables.testing_notice = `[TESTING MODE] This email was originally intended for ${to} but redirected for testing purposes.`;
    } else {
      console.log(`📧 Sending email to intended recipient: ${to}`);
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [actualRecipient],
      subject: subject,
      html: htmlContent
    });

    if (error) {
      console.error('Email sending error:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  getEmailTemplate,
  replaceTemplateVariables,
  loadLogoBase64,
  buildUrl
};
