const fs = require('fs');
const path = require('path');

console.log('🔧 COMPREHENSIVE EMAIL SYSTEM FIX');
console.log('='.repeat(60));
console.log('');
console.log('Issues to fix:');
console.log('1. Remove placeholder data from all emails');
console.log('2. Remove temp password/email mentions from registration emails');
console.log('3. Set all consultation durations to 1 hour');
console.log('4. Fix buttons to be actual clickable links');
console.log('5. Remove duplicate content');
console.log('');

const templatesDir = path.join(__dirname, 'emails', 'templates');

// Templates that need fixing
const templatesToFix = [
  'consultation_confirmed.html',
  'consultation_confirmed_concierge.html',
  'payment_verified_registration.html',
  'payment_received_welcome.html',
  'payment_confirmed_welcome_concierge.html',
  'signup_invite.html',
  'onboarding_completed.html',
  'onboarding_completed_secure.html',
  'onboarding_complete_confirmation.html'
];

let fixedCount = 0;
let issuesFound = 0;

templatesToFix.forEach(templateFile => {
  const filePath = path.join(templatesDir, templateFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${templateFile} - NOT FOUND`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let fileIssues = [];

  // 1. Check for placeholder data (example emails, names, etc.)
  const placeholderPatterns = [
    /john\.doe@example\.com/gi,
    /jane\.smith@example\.com/gi,
    /test@example\.com/gi,
    /johndoe@example\.com/gi,
    /example\.com/gi,
    /\{\{temp_password\}\}/gi,
    /temporary password/gi,
    /temp password/gi,
    /\{\{password\}\}/gi
  ];

  placeholderPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      fileIssues.push(`Found placeholder: ${pattern}`);
      issuesFound++;
    }
  });

  // 2. Fix consultation duration to 1 hour
  if (content.includes('{{consultation_duration}}') || content.includes('30 minutes') || content.includes('45 minutes')) {
    content = content.replace(/\{\{consultation_duration\}\}/g, '1 hour');
    content = content.replace(/30 minutes/g, '1 hour');
    content = content.replace(/45 minutes/g, '1 hour');
    modified = true;
    fileIssues.push('Fixed consultation duration to 1 hour');
  }

  // 3. Fix buttons - ensure they have proper href and cursor:pointer
  // Find all button-like elements that don't have proper links
  const buttonPatterns = [
    // Pattern: style with background-color but no href or broken href
    /<a[^>]*style="[^"]*background-color:[^"]*"[^>]*>(?!.*href="http)/gi,
    // Pattern: buttons with just # or empty href
    /href="#"/gi,
    /href=""/gi
  ];

  // Fix button styling - ensure all buttons have cursor:pointer
  if (content.includes('background-color: #0d9488') || content.includes('background-color: #0D9488')) {
    // Ensure cursor:pointer is added to all button styles
    content = content.replace(
      /(style="[^"]*background-color:\s*#0[dD]9488[^"]*)(">)/g,
      (match, stylepart, closing) => {
        if (!stylepart.includes('cursor:')) {
          return stylepart + '; cursor: pointer' + closing;
        }
        return match;
      }
    );
    modified = true;
    fileIssues.push('Added cursor:pointer to buttons');
  }

  // 4. Remove duplicate logo headers
  const logoPattern = /<!--\s*Logo Header\s*-->[\s\S]*?<\/tr>/g;
  const logoMatches = content.match(logoPattern);
  if (logoMatches && logoMatches.length > 1) {
    // Keep only the first logo, remove duplicates
    let firstLogoFound = false;
    content = content.replace(logoPattern, (match) => {
      if (!firstLogoFound) {
        firstLogoFound = true;
        return match;
      }
      return ''; // Remove duplicate
    });
    modified = true;
    fileIssues.push(`Removed ${logoMatches.length - 1} duplicate logo(s)`);
  }

  // 5. Check for duplicate content blocks
  const duplicateCommentPattern = /<!--\s*Logo\s*-->/g;
  const duplicateComments = content.match(duplicateCommentPattern);
  if (duplicateComments && duplicateComments.length > 1) {
    fileIssues.push(`Found ${duplicateComments.length} duplicate logo comments`);
    issuesFound++;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedCount++;
  }

  if (fileIssues.length > 0) {
    console.log(`\n📄 ${templateFile}:`);
    fileIssues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log(`✅ ${templateFile} - No issues found`);
  }
});

console.log('');
console.log('='.repeat(60));
console.log(`\n📊 Summary:`);
console.log(`   Files checked: ${templatesToFix.length}`);
console.log(`   Files modified: ${fixedCount}`);
console.log(`   Issues found: ${issuesFound}`);
console.log('');
console.log('✅ Phase 1 complete - Basic fixes applied');
console.log('');
console.log('Next: Run specific template fixes for registration emails');
