const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING EMAIL FIXES');
console.log('='.repeat(70));
console.log('');

const templatesDir = path.join(__dirname, 'emails', 'templates');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Templates to verify
const templatesToCheck = [
  'consultation_confirmed.html',
  'consultation_confirmed_concierge.html',
  'payment_verified_registration.html',
  'payment_received_welcome.html',
  'payment_confirmed_welcome_concierge.html',
  'signup_invite.html'
];

console.log('Checking templates for issues...\n');

templatesToCheck.forEach(templateFile => {
  const filePath = path.join(templatesDir, templateFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${templateFile} - FILE NOT FOUND`);
    checks.failed++;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const warnings = [];

  // 1. Check for placeholder data
  if (content.match(/john\.doe@example\.com/gi)) {
    issues.push('Contains placeholder email: john.doe@example.com');
  }
  if (content.match(/example\.com/gi) && !content.match(/mailto:/gi)) {
    warnings.push('Contains example.com (check if it\'s in mailto links)');
  }

  // 2. Check for temp password mentions
  if (content.match(/\{\{temp_password\}\}/gi)) {
    issues.push('Contains {{temp_password}} placeholder');
  }
  if (content.match(/temporary password/gi)) {
    issues.push('Contains "temporary password" text');
  }
  if (content.match(/temp password/gi)) {
    issues.push('Contains "temp password" text');
  }
  if (content.match(/\{\{password\}\}/gi)) {
    issues.push('Contains {{password}} placeholder');
  }

  // 3. Check consultation duration
  if (templateFile.includes('consultation')) {
    if (content.match(/30 minutes/gi)) {
      issues.push('Contains "30 minutes" - should be "1 hour"');
    }
    if (content.match(/45 minutes/gi)) {
      issues.push('Contains "45 minutes" - should be "1 hour"');
    }
    if (content.match(/\{\{consultation_duration\}\}/gi)) {
      warnings.push('Uses {{consultation_duration}} variable - ensure it\'s set to "1 hour"');
    }
  }

  // 4. Check for clickable buttons
  const buttonMatches = content.match(/<a[^>]*background-color:\s*#0[dD]9488[^>]*>/gi);
  if (buttonMatches) {
    buttonMatches.forEach(button => {
      if (!button.includes('cursor:') && !button.includes('cursor :')) {
        issues.push('Button missing cursor:pointer style');
      }
      if (!button.includes('href="http') && !button.includes('href="{{')) {
        issues.push('Button missing proper href attribute');
      }
    });
  }

  // 5. Check for duplicate logos
  const logoHeaderMatches = content.match(/<!--\s*Logo Header\s*-->/g);
  if (logoHeaderMatches && logoHeaderMatches.length > 1) {
    issues.push(`Found ${logoHeaderMatches.length} duplicate logo headers`);
  }

  const logoCommentMatches = content.match(/<!--\s*Logo\s*-->/g);
  if (logoCommentMatches && logoCommentMatches.length > 2) {
    warnings.push(`Found ${logoCommentMatches.length} logo comments (might be duplicates)`);
  }

  // 6. Check for proper registration messaging
  if (templateFile.includes('registration') || templateFile.includes('payment')) {
    if (content.match(/create your password/gi)) {
      // This is OK - telling them they'll create password
    }
    if (content.match(/your password is/gi)) {
      issues.push('Contains "your password is" - should not show passwords');
    }
  }

  // Display results for this template
  if (issues.length === 0 && warnings.length === 0) {
    console.log(`✅ ${templateFile} - All checks passed`);
    checks.passed++;
  } else {
    if (issues.length > 0) {
      console.log(`❌ ${templateFile}:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
      checks.failed++;
    }
    if (warnings.length > 0) {
      console.log(`⚠️  ${templateFile}:`);
      warnings.forEach(warning => console.log(`   - ${warning}`));
      checks.warnings++;
    }
  }
});

console.log('');
console.log('='.repeat(70));
console.log('\n📊 Verification Summary:');
console.log(`   ✅ Passed: ${checks.passed}`);
console.log(`   ❌ Failed: ${checks.failed}`);
console.log(`   ⚠️  Warnings: ${checks.warnings}`);
console.log('');

if (checks.failed === 0) {
  console.log('🎉 All critical checks passed!');
} else {
  console.log('⚠️  Some issues found - please review above');
}

console.log('');
console.log('Next steps:');
console.log('1. Test registration flow with a real email');
console.log('2. Verify registration link can only be used once');
console.log('3. Check that buttons are clickable in email clients');
console.log('4. Confirm consultation duration shows as 1 hour');
