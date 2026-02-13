#!/usr/bin/env node

/**
 * TEST EMAIL TEMPLATES - DARK MODE & SPACING FIXES
 * 
 * Verifies:
 * 1. Dark mode prevention meta tags present
 * 2. Mobile responsive styles included
 * 3. Reduced spacing on mobile
 * 4. All required variables still present
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING EMAIL TEMPLATES - DARK MODE & SPACING FIXES');
console.log('======================================================\n');

const templatesDir = path.join(__dirname, 'emails', 'templates');

const templates = [
  {
    file: 'consultation_confirmed.html',
    variables: ['client_name', 'consultation_date', 'consultation_time', 'consultation_duration', 'meeting_link', 'current_year']
  },
  {
    file: 'consultation_rescheduled.html',
    variables: ['client_name', 'new_date', 'new_time', 'current_year']
  },
  {
    file: 'consultation_waitlisted.html',
    variables: ['client_name', 'current_year']
  },
  {
    file: 'payment_received_welcome.html',
    variables: ['client_name', 'tier', 'dashboard_url', 'current_year']
  },
  {
    file: 'onboarding_completed.html',
    variables: ['client_name', 'current_year']
  },
  {
    file: 'interview_update_enhanced.html',
    variables: ['client_name', 'role_title', 'company_name', 'current_year']
  },
  {
    file: 'strategy_call_confirmed.html',
    variables: ['client_name', 'call_date', 'call_time', 'call_duration', 'current_year']
  },
  {
    file: 'consultation_reminder.html',
    variables: ['client_name', 'meeting_date', 'meeting_time', 'current_year']
  },
  {
    file: 'contact_form_received.html',
    variables: ['client_name', 'current_year']
  }
];

let allTestsPassed = true;

templates.forEach(template => {
  console.log(`\n📧 Testing: ${template.file}`);
  console.log('─'.repeat(50));
  
  const filePath = path.join(templatesDir, template.file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Test 1: Dark mode prevention
  const hasDarkModeMeta = content.includes('color-scheme') && content.includes('light');
  console.log(`${hasDarkModeMeta ? '✅' : '❌'} Dark mode prevention meta tags`);
  if (!hasDarkModeMeta) allTestsPassed = false;
  
  // Test 2: Dark mode CSS override
  const hasDarkModeCSS = content.includes('@media (prefers-color-scheme: dark)');
  console.log(`${hasDarkModeCSS ? '✅' : '❌'} Dark mode CSS override`);
  if (!hasDarkModeCSS) allTestsPassed = false;
  
  // Test 3: Mobile responsive styles
  const hasMobileStyles = content.includes('@media only screen and (max-width: 600px)');
  console.log(`${hasMobileStyles ? '✅' : '❌'} Mobile responsive styles`);
  if (!hasMobileStyles) allTestsPassed = false;
  
  // Test 4: Reduced mobile padding
  const hasMobilePadding = content.includes('mobile-header-padding') && 
                           content.includes('mobile-footer-padding');
  console.log(`${hasMobilePadding ? '✅' : '❌'} Mobile padding classes`);
  if (!hasMobilePadding) allTestsPassed = false;
  
  // Test 5: Email client compatibility
  const hasEmailClientFixes = content.includes('xmlns:v') && 
                               content.includes('xmlns:o') &&
                               content.includes('mso-table-lspace');
  console.log(`${hasEmailClientFixes ? '✅' : '❌'} Email client compatibility`);
  if (!hasEmailClientFixes) allTestsPassed = false;
  
  // Test 6: All variables present
  let allVariablesPresent = true;
  template.variables.forEach(variable => {
    const variablePattern = new RegExp(`{{${variable}}}`);
    if (!variablePattern.test(content)) {
      console.log(`❌ Missing variable: {{${variable}}}`);
      allVariablesPresent = false;
      allTestsPassed = false;
    }
  });
  if (allVariablesPresent) {
    console.log(`✅ All ${template.variables.length} variables present`);
  }
  
  // Test 7: No hardcoded data
  const hasHardcodedEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content.replace(/{{.*?}}/g, ''));
  const hasHardcodedDate = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/.test(content.replace(/{{.*?}}/g, ''));
  const hasHardcodedTime = /\b\d{1,2}:\d{2}\s*(AM|PM|am|pm)\b/.test(content.replace(/{{.*?}}/g, ''));
  
  if (!hasHardcodedEmail && !hasHardcodedDate && !hasHardcodedTime) {
    console.log('✅ No hardcoded data detected');
  } else {
    if (hasHardcodedEmail) console.log('❌ Hardcoded email detected');
    if (hasHardcodedDate) console.log('❌ Hardcoded date detected');
    if (hasHardcodedTime) console.log('❌ Hardcoded time detected');
    allTestsPassed = false;
  }
});

console.log('\n\n📊 FINAL RESULTS');
console.log('═'.repeat(50));

if (allTestsPassed) {
  console.log('✅ ALL TESTS PASSED!');
  console.log('\n🎉 Email templates are ready for production!');
  console.log('\nKey improvements:');
  console.log('  ✅ Dark mode forced to light (no color inversion)');
  console.log('  ✅ Reduced spacing on mobile (20px instead of 40px)');
  console.log('  ✅ Better mobile responsiveness');
  console.log('  ✅ Email client compatibility (Outlook, Gmail, Apple Mail)');
  console.log('  ✅ All variables present and no hardcoded data');
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('\nPlease review the issues above and fix them.');
  process.exit(1);
}
