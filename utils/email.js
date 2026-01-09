const { Resend } = require('resend');
const fs = require('fs').promises;
const path = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);

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
      dashboard_link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
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

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
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
  loadLogoBase64
};
