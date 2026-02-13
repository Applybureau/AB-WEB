const fs = require('fs').promises;
const path = require('path');

// Comprehensive email trigger mapping - CORRECT templates for each action
const CORRECT_EMAIL_MAPPINGS = {
  // Authentication & Registration
  'invite': 'signup_invite',
  'registration': 'signup_invite',
  'complete-registration': 'onboarding_completion',
  'verify-email': 'signup_invite',
  
  // Onboarding
  'onboarding-complete': 'onboarding_completion',
  'onboarding-approved': 'onboarding_approved',
  'onboarding-review-needed': 'admin_onboarding_review_needed',
  'onboarding-reminder': 'onboarding_reminder',
  
  // Consultations
  'consultation-request': 'consultation_request_received',
  'consultation-scheduled': 'consultation_scheduled',
  'consultation-confirmed': 'consultation_confirmed',
  'consultation-cancelled': 'consultation_cancelled',
  'consultation-reminder': 'consultation_reminder',
  'consultation-rejected': 'consultation_rejected',
  'consultation-reschedule': 'consultation_reschedule_request',
  'consultation-rescheduled': 'consultation_rescheduled',
  'consultation-completed': 'consultation_completed',
  'consultation-waitlisted': 'consultation_waitlisted',
  'new-consultation-request': 'new_consultation_request',
  'new-consultation-booking': 'new_consultation_booking',
  
  // Applications
  'application-update': 'application_update',
  'application-added': 'application_update',
  'application-status-change': 'application_update',
  
  // Interviews
  'interview-scheduled': 'interview_scheduled',
  'interview-update': 'interview_update_enhanced',
  
  // Meetings
  'meeting-scheduled': 'meeting_scheduled',
  'meeting-link': 'meeting_link_notification',
  'admin-meeting-link': 'admin_meeting_link_notification',
  
  // Strategy Calls
  'strategy-call-confirmed': 'strategy_call_confirmed',
  
  // Payments
  'payment-received': 'payment_received_welcome',
  'payment-verified': 'payment_verified_registration',
  'payment-confirmed': 'payment_confirmed_welcome_concierge',
  
  // Contact & Messages
  'contact-form': 'contact_form_received',
  'new-contact': 'new_contact_submission',
  'message-notification': 'message_notification',
  'client-message': 'client_message_notification',
  
  // Leads
  'profile-under-review': 'profile_under_review',
  'lead-selected': 'lead_selected',
  
  // Admin
  'admin-welcome': 'admin_welcome',
  'admin-password-reset': 'admin_password_reset',
  'admin-action-required': 'admin_action_required',
  'admin-account-suspended': 'admin_account_suspended',
  'admin-account-reactivated': 'admin_account_reactivated',
  'admin-account-deleted': 'admin_account_deleted'
};

// Common incorrect patterns to fix
const INCORRECT_PATTERNS = [
  // Wrong: Using consultation templates for applications
  {
    pattern: /sendEmail\([^,]+,\s*['"]consultation_confirmed['"]/g,
    context: /application|app_log|tracking/i,
    correctTemplate: 'application_update',
    description: 'Application logging using consultation template'
  },
  // Wrong: Using wrong template names
  {
    pattern: /sendEmail\([^,]+,\s*['"]signup_verification['"]/g,
    correctTemplate: 'signup_invite',
    description: 'Using non-existent signup_verification template'
  },
  {
    pattern: /sendEmail\([^,]+,\s*['"]email_verification['"]/g,
    correctTemplate: 'signup_invite',
    description: 'Using non-existent email_verification template'
  },
  {
    pattern: /sendEmail\([^,]+,\s*['"]registration_invite['"]/g,
    correctTemplate: 'signup_invite',
    description: 'Using non-existent registration_invite template'
  },
  // Wrong: Missing await on sendEmail
  {
    pattern: /(?<!await\s)sendEmail\(/g,
    fix: 'await sendEmail(',
    description: 'Missing await on sendEmail call'
  }
];

async function scanFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const issues = [];
  
  // Check for sendEmail calls
  const sendEmailRegex = /sendEmail\s*\(\s*([^,]+),\s*['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = sendEmailRegex.exec(content)) !== null) {
    const [fullMatch, recipient, templateName] = match;
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    // Check if template exists
    const templatePath = path.join(__dirname, 'emails', 'templates', `${templateName}.html`);
    try {
      await fs.access(templatePath);
    } catch (error) {
      issues.push({
        file: filePath,
        line: lineNumber,
        type: 'missing_template',
        template: templateName,
        match: fullMatch,
        severity: 'error'
      });
    }
    
    // Check for context-specific issues
    const contextBefore = content.substring(Math.max(0, match.index - 500), match.index);
    const contextAfter = content.substring(match.index, Math.min(content.length, match.index + 500));
    const fullContext = contextBefore + contextAfter;
    
    // Check if using wrong template for context
    if (fullContext.match(/application|app_log|tracking/i) && templateName.includes('consultation')) {
      issues.push({
        file: filePath,
        line: lineNumber,
        type: 'wrong_template_context',
        template: templateName,
        suggestedTemplate: 'application_update',
        match: fullMatch,
        severity: 'error'
      });
    }
    
    // Check if missing await
    const beforeMatch = content.substring(Math.max(0, match.index - 10), match.index);
    if (!beforeMatch.includes('await')) {
      issues.push({
        file: filePath,
        line: lineNumber,
        type: 'missing_await',
        template: templateName,
        match: fullMatch,
        severity: 'warning'
      });
    }
  }
  
  return issues;
}

async function scanDirectory(dir, extensions = ['.js']) {
  const allIssues = [];
  
  async function scan(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!['node_modules', '.git', 'logs', 'tests'].includes(entry.name)) {
          await scan(fullPath);
        }
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
        const issues = await scanFile(fullPath);
        allIssues.push(...issues);
      }
    }
  }
  
  await scan(dir);
  return allIssues;
}

async function fixEmailIssues() {
  console.log('🔍 Scanning for email trigger issues...\n');
  
  const backendDir = __dirname;
  const issues = await scanDirectory(backendDir);
  
  // Group issues by type
  const groupedIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.type]) acc[issue.type] = [];
    acc[issue.type].push(issue);
    return acc;
  }, {});
  
  console.log('📊 SCAN RESULTS:\n');
  console.log(`Total issues found: ${issues.length}\n`);
  
  // Report issues by type
  for (const [type, typeIssues] of Object.entries(groupedIssues)) {
    console.log(`\n${type.toUpperCase().replace(/_/g, ' ')} (${typeIssues.length}):`);
    console.log('─'.repeat(60));
    
    for (const issue of typeIssues) {
      const relativePath = path.relative(backendDir, issue.file);
      console.log(`\n📄 ${relativePath}:${issue.line}`);
      console.log(`   Template: ${issue.template}`);
      if (issue.suggestedTemplate) {
        console.log(`   ❌ Wrong template for context`);
        console.log(`   ✅ Should use: ${issue.suggestedTemplate}`);
      }
      if (issue.type === 'missing_template') {
        console.log(`   ❌ Template file does not exist`);
      }
      if (issue.type === 'missing_await') {
        console.log(`   ⚠️  Missing await keyword`);
      }
    }
  }
  
  // Generate fix recommendations
  console.log('\n\n🔧 FIX RECOMMENDATIONS:\n');
  console.log('═'.repeat(60));
  
  const errorIssues = issues.filter(i => i.severity === 'error');
  const warningIssues = issues.filter(i => i.severity === 'warning');
  
  console.log(`\n🚨 CRITICAL (${errorIssues.length} errors):`);
  for (const issue of errorIssues) {
    const relativePath = path.relative(backendDir, issue.file);
    console.log(`\n${relativePath}:${issue.line}`);
    if (issue.type === 'wrong_template_context') {
      console.log(`  Replace: sendEmail(..., '${issue.template}', ...)`);
      console.log(`  With:    sendEmail(..., '${issue.suggestedTemplate}', ...)`);
    } else if (issue.type === 'missing_template') {
      console.log(`  Template '${issue.template}' does not exist`);
      console.log(`  Either create the template or use an existing one`);
    }
  }
  
  console.log(`\n\n⚠️  WARNINGS (${warningIssues.length}):`);
  for (const issue of warningIssues.slice(0, 10)) { // Show first 10
    const relativePath = path.relative(backendDir, issue.file);
    console.log(`${relativePath}:${issue.line} - ${issue.type}`);
  }
  if (warningIssues.length > 10) {
    console.log(`... and ${warningIssues.length - 10} more`);
  }
  
  // Check for specific known issues
  console.log('\n\n🎯 CHECKING SPECIFIC KNOWN ISSUES:\n');
  console.log('═'.repeat(60));
  
  // Check auth controller for invite/verify issues
  const authControllerPath = path.join(backendDir, 'controllers', 'authController.js');
  try {
    const authContent = await fs.readFile(authControllerPath, 'utf8');
    
    console.log('\n1. Auth Controller - Invite Email:');
    if (authContent.includes("sendEmail(email, 'signup_invite'")) {
      console.log('   ✅ Using correct template: signup_invite');
    } else {
      console.log('   ❌ Not using signup_invite template');
    }
    
    console.log('\n2. Auth Controller - Email Sending:');
    const inviteMatches = authContent.match(/sendEmail\([^)]+\)/g) || [];
    console.log(`   Found ${inviteMatches.length} sendEmail calls`);
    for (const match of inviteMatches) {
      console.log(`   - ${match.substring(0, 80)}...`);
    }
  } catch (error) {
    console.log('   ⚠️  Could not read auth controller');
  }
  
  // List all available templates
  console.log('\n\n📧 AVAILABLE EMAIL TEMPLATES:\n');
  console.log('═'.repeat(60));
  
  const templatesDir = path.join(backendDir, 'emails', 'templates');
  try {
    const templates = await fs.readdir(templatesDir);
    const htmlTemplates = templates.filter(t => t.endsWith('.html') && !t.startsWith('_'));
    
    console.log(`\nTotal templates: ${htmlTemplates.length}\n`);
    
    const categories = {
      'Authentication': ['signup_invite', 'onboarding_completion', 'onboarding_approved'],
      'Consultations': templates.filter(t => t.includes('consultation')),
      'Applications': templates.filter(t => t.includes('application')),
      'Interviews': templates.filter(t => t.includes('interview')),
      'Meetings': templates.filter(t => t.includes('meeting')),
      'Payments': templates.filter(t => t.includes('payment')),
      'Admin': templates.filter(t => t.startsWith('admin_')),
      'Other': []
    };
    
    for (const [category, categoryTemplates] of Object.entries(categories)) {
      if (categoryTemplates.length > 0) {
        console.log(`\n${category}:`);
        for (const template of categoryTemplates) {
          if (template.endsWith('.html')) {
            console.log(`  - ${template.replace('.html', '')}`);
          }
        }
      }
    }
  } catch (error) {
    console.log('   ⚠️  Could not read templates directory');
  }
  
  console.log('\n\n✅ SCAN COMPLETE\n');
  console.log('═'.repeat(60));
  console.log(`\nTotal issues: ${issues.length}`);
  console.log(`Errors: ${errorIssues.length}`);
  console.log(`Warnings: ${warningIssues.length}`);
  
  if (errorIssues.length > 0) {
    console.log('\n⚠️  Please fix the critical errors before deploying');
  } else {
    console.log('\n✅ No critical errors found!');
  }
}

// Run the scan
fixEmailIssues().catch(console.error);
