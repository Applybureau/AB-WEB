const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING DUPLICATE LOGO HEADERS');
console.log('='.repeat(60));
console.log('');

const templatesDir = path.join(__dirname, 'emails', 'templates');

const templatesToFix = [
  'payment_verified_registration.html',
  'payment_confirmed_welcome_concierge.html',
  'signup_invite.html'
];

templatesToFix.forEach(templateFile => {
  const filePath = path.join(templatesDir, templateFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${templateFile} - NOT FOUND`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove duplicate logo headers - keep only the first one
  const logoHeaderPattern = /<!--\s*Logo Header\s*-->[\s\S]*?<\/tr>/g;
  const matches = content.match(logoHeaderPattern);
  
  if (matches && matches.length > 1) {
    console.log(`📄 ${templateFile}:`);
    console.log(`   Found ${matches.length} logo headers, removing duplicates...`);
    
    let firstLogoFound = false;
    content = content.replace(logoHeaderPattern, (match) => {
      if (!firstLogoFound) {
        firstLogoFound = true;
        return match;
      }
      return ''; // Remove duplicate
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`   ✅ Fixed - removed ${matches.length - 1} duplicate(s)`);
  } else {
    console.log(`✅ ${templateFile} - No duplicates found`);
  }
});

console.log('');
console.log('='.repeat(60));
console.log('✅ Duplicate logo headers fixed!');
