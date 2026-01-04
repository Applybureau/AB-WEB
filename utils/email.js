const { Resend } = require('resend');
const fs = require('fs').promises;
const path = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);

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
    
    // Default variables
    const defaultVariables = {
      dashboard_link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
      contact_email: 'support@applybureau.com',
      company_name: 'Apply Bureau',
      current_year: new Date().getFullYear()
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
  replaceTemplateVariables
};