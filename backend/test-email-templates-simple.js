// Simple email template test that validates template structure without sending
const fs = require('fs').promises;
const path = require('path');

// Test recipient
const TEST_RECIPIENT = 'applybureau@gmail.com';

// Sample data for all email templates
const sampleData = {
  // Client data
  client_name: 'John Smith',
  client_email: 'john.smith@example.com',
  client_phone: '+1-555-0123',
  full_name: 'John Smith',
  
  // Admin data
  admin_name: 'Sarah Johnson',
  admin_email: 'sarah.johnson@applybureau.com',
  admin_id: 'admin-123',
  
  // Consultation data
  consultation_date: 'Tuesday, March 12, 2024',
  consultation_time: '5:00 PM (EST)',
  call_date: 'Tuesday, March 12, 2024',
  call_time: '5:00 PM (EST)',
  meeting_link: 'https://meet.google.com/abc-def-ghi',
  consultation_id: 'consultation-456',
  
  // Application data
  company_name: 'TechCorp Inc.',
  role_title: 'Senior Software Engineer',
  application_status: 'Interview Scheduled',
  
  // Payment data
  package_tier: 'Premium Package',
  payment_amount: '$299.99',
  payment_method: 'Credit Card',
  transaction_id: 'txn_123456789',
  
  // URLs
  dashboard_url: 'https://apply-bureau.vercel.app/dashboard',
  login_url: 'https://apply-bureau.vercel.app/login',
  registration_url: 'https://apply-bureau.vercel.app/register?token=sample-token',
  registration_link: 'https://apply-bureau.vercel.app/register?token=sample-token',
  admin_dashboard_url: 'https://apply-bureau.vercel.app/admin',
  admin_login_url: 'https://apply-bureau.vercel.app/admin/login',
  reschedule_link: 'https://apply-bureau.vercel.app/reschedule/consultation-456',
  message_url: 'https://apply-bureau.vercel.app/messages/msg-789',
  unsubscribe_url: 'https://apply-bureau.vercel.app/unsubscribe',
  
  // Contact data
  name: 'Michael Davis',
  subject: 'General Inquiry',
  message: 'I am interested in learning more about your career services and would like to schedule a consultation.',
  message_preview: 'Your application for Senior Software Engineer at TechCorp Inc. has been updated. Please check your dashboard for details.',
  
  // System data
  current_year: new Date().getFullYear(),
  support_email: 'applybureau@gmail.com',
  contact_email: 'applybureau@gmail.com',
  
  // Reschedule data
  reason: 'Schedule conflict',
  new_proposed_times: [
    { date: '2024-03-15', time: '10:00 AM' },
    { date: '2024-03-16', time: '2:00 PM' }
  ],
  new_date_time: 'Friday, March 15, 2024 at 10:00 AM (EST)',
  
  // Password reset data
  new_password: 'NewSecurePassword123!',
  
  // Admin action data
  admin_status: 'Active',
  action_reason: 'Routine security review',
  suspend_url: 'https://apply-bureau.vercel.app/admin/suspend/admin-123',
  delete_url: 'https://apply-bureau.vercel.app/admin/delete/admin-123',
  
  // Additional data
  token_expiry: '24 hours',
  review_timeline: '2-3 business days',
  next_steps: 'Our team will review your profile and unlock your dashboard within 3 business days.',
  admin_message: 'Welcome to Apply Bureau! Your account has been set up successfully.',
  info_box_content: 'Important: Please keep your login credentials secure.',
  
  // Meeting and interview data
  interview_date: 'March 20, 2024',
  interview_time: '2:00 PM (EST)',
  
  // Logo
  logo_base64: null
};

// Simple Handlebars-like template replacement
function replaceTemplateVariables(template, data) {
  let result = template;
  
  // Replace simple variables {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
  
  // Handle conditional blocks {{#if variable}}...{{else}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, ifContent, elseContent) => {
    return data[key] ? ifContent : elseContent;
  });
  
  // Handle simple conditionals {{#if variable}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    return data[key] ? content : '';
  });
  
  return result;
}

// List of all email templates to test
const emailTemplates = [
  'admin_welcome',
  'admin_password_reset',
  'admin_account_deleted',
  'admin_account_reactivated',
  'admin_account_suspended',
  'admin_action_required',
  'admin_meeting_link_notification',
  'signup_invite',
  'client_message_notification',
  'onboarding_reminder',
  'onboarding_completion',
  'onboarding_completed',
  'onboarding_complete_confirmation',
  'consultation_confirmed',
  'consultation_confirmed_concierge',
  'consultation_rescheduled',
  'consultation_reschedule_request',
  'consultation_waitlisted',
  'consultation_reminder',
  'consultation_rejected',
  'consultation_completed',
  'new_consultation_booking',
  'new_consultation_request',
  'new_consultation_request_with_times',
  'payment_confirmed_welcome_concierge',
  'payment_received_welcome',
  'payment_verified_registration',
  'contact_form_received',
  'new_contact_submission',
  'meeting_scheduled',
  'meeting_link_notification',
  'strategy_call_confirmed',
  'interview_update_enhanced',
  'interview_update_concierge',
  'application_update',
  'lead_selected',
  'message_notification'
];

async function validateEmailTemplate(templateName) {
  try {
    const templatePath = path.join(__dirname, 'emails', 'templates', `${templateName}.html`);
    const templateContent = await fs.readFile(templatePath, 'utf8');
    
    // Replace variables with sample data
    const processedContent = replaceTemplateVariables(templateContent, sampleData);
    
    // Check for remaining placeholders
    const remainingPlaceholders = processedContent.match(/\{\{[^}]+\}\}/g) || [];
    
    // Check for button colors
    const buttonColors = processedContent.match(/background-color:\s*#([0-9A-Fa-f]{6})/g) || [];
    const incorrectColors = buttonColors.filter(color => 
      !color.includes('#0D9488') && 
      !color.includes('#FFC107') && 
      !color.includes('#DC3545') &&
      !color.includes('#F8FAFC') &&
      !color.includes('#E5E7EB') &&
      !color.includes('#FFFFFF') &&
      !color.includes('#1E293B') &&
      !color.includes('#0F172A') &&
      !color.includes('#F1F5F9') &&
      !color.includes('#334155') &&
      !color.includes('#F9FAFB')
    );
    
    // Check for correct logo URL
    const hasCorrectLogo = processedContent.includes('https://res.cloudinary.com/dbehg8jsv/image/upload/v1767902182/AB_Logo-removebg-preview_mlji6p.png');
    
    // Check for correct email addresses
    const hasCorrectEmails = processedContent.includes('applybureau@gmail.com');
    
    return {
      templateName,
      valid: true,
      remainingPlaceholders,
      incorrectColors,
      hasCorrectLogo,
      hasCorrectEmails,
      contentLength: processedContent.length
    };
    
  } catch (error) {
    return {
      templateName,
      valid: false,
      error: error.message
    };
  }
}

async function testAllTemplates() {
  console.log('🧪 VALIDATING ALL EMAIL TEMPLATES');
  console.log('==================================\n');
  console.log(`📊 Total templates to validate: ${emailTemplates.length}`);
  console.log(`📧 Test recipient would be: ${TEST_RECIPIENT}\n`);

  const results = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < emailTemplates.length; i++) {
    const templateName = emailTemplates[i];
    const templateNumber = i + 1;
    
    console.log(`[${templateNumber}/${emailTemplates.length}] Validating: ${templateName}`);
    
    const result = await validateEmailTemplate(templateName);
    results.push(result);
    
    if (result.valid) {
      let issues = [];
      
      if (result.remainingPlaceholders.length > 0) {
        issues.push(`${result.remainingPlaceholders.length} placeholders`);
      }
      
      if (result.incorrectColors.length > 0) {
        issues.push(`${result.incorrectColors.length} incorrect colors`);
      }
      
      if (!result.hasCorrectLogo) {
        issues.push('incorrect logo');
      }
      
      if (!result.hasCorrectEmails) {
        issues.push('incorrect emails');
      }
      
      if (issues.length === 0) {
        console.log(`✅ PERFECT: ${templateName}`);
        validCount++;
      } else {
        console.log(`⚠️  ISSUES: ${templateName} - ${issues.join(', ')}`);
        validCount++;
      }
    } else {
      console.log(`❌ INVALID: ${templateName} - ${result.error}`);
      invalidCount++;
    }
  }

  // Print detailed summary
  console.log('\n📊 EMAIL TEMPLATE VALIDATION SUMMARY');
  console.log('====================================');
  console.log(`✅ Valid templates: ${validCount}`);
  console.log(`❌ Invalid templates: ${invalidCount}`);
  
  // Show templates with issues
  const templatesWithIssues = results.filter(r => 
    r.valid && (
      r.remainingPlaceholders.length > 0 || 
      r.incorrectColors.length > 0 || 
      !r.hasCorrectLogo || 
      !r.hasCorrectEmails
    )
  );
  
  if (templatesWithIssues.length > 0) {
    console.log('\n⚠️  TEMPLATES WITH ISSUES:');
    templatesWithIssues.forEach(result => {
      console.log(`\n   ${result.templateName}:`);
      if (result.remainingPlaceholders.length > 0) {
        console.log(`     - Placeholders: ${result.remainingPlaceholders.join(', ')}`);
      }
      if (result.incorrectColors.length > 0) {
        console.log(`     - Colors: ${result.incorrectColors.join(', ')}`);
      }
      if (!result.hasCorrectLogo) {
        console.log(`     - Logo: Missing correct Cloudinary URL`);
      }
      if (!result.hasCorrectEmails) {
        console.log(`     - Emails: Missing applybureau@gmail.com`);
      }
    });
  }
  
  // Show perfect templates
  const perfectTemplates = results.filter(r => 
    r.valid && 
    r.remainingPlaceholders.length === 0 && 
    r.incorrectColors.length === 0 && 
    r.hasCorrectLogo && 
    r.hasCorrectEmails
  );
  
  if (perfectTemplates.length > 0) {
    console.log('\n✅ PERFECT TEMPLATES:');
    perfectTemplates.forEach(result => {
      console.log(`   - ${result.templateName} (${result.contentLength} chars)`);
    });
  }

  console.log('\n🎯 VALIDATION COMPLETED!');
  
  if (perfectTemplates.length === emailTemplates.length) {
    console.log('🎉 ALL EMAIL TEMPLATES ARE PERFECT!');
    console.log(`\n📧 Ready to send ${emailTemplates.length} test emails to ${TEST_RECIPIENT}`);
    console.log('Run the full email test with: node test-all-email-templates.js');
  } else {
    console.log(`\n⚠️  ${templatesWithIssues.length} templates have minor issues.`);
    console.log(`❌ ${invalidCount} templates are invalid.`);
  }

  return {
    total: emailTemplates.length,
    valid: validCount,
    invalid: invalidCount,
    perfect: perfectTemplates.length,
    withIssues: templatesWithIssues.length,
    results: results
  };
}

// Run the validation
if (require.main === module) {
  testAllTemplates()
    .then(results => {
      console.log('\n📊 Final Results:', {
        total: results.total,
        perfect: results.perfect,
        withIssues: results.withIssues,
        invalid: results.invalid
      });
      process.exit(0);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testAllTemplates,
  validateEmailTemplate,
  sampleData,
  emailTemplates
};