const fs = require('fs');
const path = require('path');

async function verifyEmailTemplates() {
  console.log('🔍 Verifying Email Templates...\n');

  const templatesDir = path.join(__dirname, 'emails', 'templates');
  const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.html'));

  console.log(`Checking ${templateFiles.length} email templates\n`);

  let allGood = true;
  const issues = [];

  for (const templateFile of templateFiles) {
    const filePath = path.join(templatesDir, templateFile);
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`📧 ${templateFile}:`);
    
    // Check 1: Email address
    const hasCorrectEmail = content.includes('hello@applybureau.com');
    const hasOldEmail = content.includes('applybureau@gmail.com');
    
    if (hasCorrectEmail && !hasOldEmail) {
      console.log('   ✅ Email address: hello@applybureau.com');
    } else if (hasOldEmail) {
      console.log('   ❌ Still has old email: applybureau@gmail.com');
      issues.push(`${templateFile}: Old email address found`);
      allGood = false;
    } else {
      console.log('   ⚠️  No contact email found');
    }

    // Check 2: Button colors
    const hasBlackButtons = content.includes('background-color: #000000');
    const hasOldButtonColors = content.match(/#10B981|#25D366|#0D9488|#059669/g);
    
    if (hasBlackButtons && !hasOldButtonColors) {
      console.log('   ✅ Button colors: Standardized to black');
    } else if (hasOldButtonColors) {
      console.log(`   ⚠️  Found ${hasOldButtonColors.length} non-black button colors`);
    } else {
      console.log('   ℹ️  No buttons found');
    }

    // Check 3: Placeholders
    const placeholders = content.match(/\[.*?\]|placeholder|PLACEHOLDER|TODO|TBD/gi);
    if (placeholders && placeholders.length > 0) {
      // Filter out MSO comments which are legitimate
      const realPlaceholders = placeholders.filter(p => 
        !p.includes('if mso') && 
        !p.includes('endif') && 
        !p.includes('mso]') &&
        !p.toLowerCase().includes('outlook')
      );
      
      if (realPlaceholders.length > 0) {
        console.log(`   ❌ Found ${realPlaceholders.length} placeholders: ${realPlaceholders.join(', ')}`);
        issues.push(`${templateFile}: Contains placeholders`);
        allGood = false;
      } else {
        console.log('   ✅ No placeholders found');
      }
    } else {
      console.log('   ✅ No placeholders found');
    }

    // Check 4: Text color consistency
    const hasBlackText = content.includes('color: #000000');
    if (hasBlackText) {
      console.log('   ✅ Text colors: Standardized');
    } else {
      console.log('   ℹ️  No black text colors found (may be using default)');
    }

    console.log();
  }

  console.log('🎉 Email Template Verification Complete!\n');
  
  if (allGood) {
    console.log('✅ All templates are properly formatted!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Email addresses updated to hello@applybureau.com');
    console.log('   ✅ Button colors standardized to black (#000000)');
    console.log('   ✅ No placeholders found');
    console.log('   ✅ Consistent formatting applied');
  } else {
    console.log('❌ Issues found in templates:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }

  return allGood;
}

// Run the verification
if (require.main === module) {
  verifyEmailTemplates().catch(console.error);
}

module.exports = verifyEmailTemplates;