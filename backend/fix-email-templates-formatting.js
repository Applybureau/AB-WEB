const fs = require('fs');
const path = require('path');

async function fixEmailTemplatesFormatting() {
  console.log('🔧 Fixing Email Templates Formatting...\n');

  const templatesDir = path.join(__dirname, 'emails', 'templates');
  const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.html'));

  console.log(`Found ${templateFiles.length} email templates to fix\n`);

  // Standard formatting rules
  const fixes = [
    {
      name: 'Update email address',
      search: /applybureau@gmail\.com/g,
      replace: 'hello@applybureau.com'
    },
    {
      name: 'Standardize button colors to black',
      search: /background-color:\s*#[0-9A-Fa-f]{6};/g,
      replace: 'background-color: #000000;'
    },
    {
      name: 'Standardize button gradients to black',
      search: /background:\s*linear-gradient\([^)]+\);/g,
      replace: 'background-color: #000000;'
    },
    {
      name: 'Standardize text colors to black for main content',
      search: /color:\s*#[0-9A-Fa-f]{6};/g,
      replace: function(match, offset, string) {
        // Don't change footer text colors or specific UI elements
        const beforeMatch = string.substring(Math.max(0, offset - 200), offset);
        if (beforeMatch.includes('footer') || 
            beforeMatch.includes('background-color: #0F172A') ||
            beforeMatch.includes('background-color: #F1F5F9') ||
            beforeMatch.includes('font-size: 12px') ||
            beforeMatch.includes('font-size: 14px')) {
          return match; // Keep original color for footer/small text
        }
        return 'color: #000000;';
      }
    },
    {
      name: 'Fix WhatsApp button colors',
      search: /background-color:\s*#25D366;/g,
      replace: 'background-color: #000000;'
    },
    {
      name: 'Fix video call button colors',
      search: /background-color:\s*#0D9488;/g,
      replace: 'background-color: #000000;'
    },
    {
      name: 'Fix green button colors',
      search: /background-color:\s*#10B981;/g,
      replace: 'background-color: #000000;'
    },
    {
      name: 'Fix other green variants',
      search: /background-color:\s*#059669;/g,
      replace: 'background-color: #000000;'
    },
    {
      name: 'Fix gradient buttons in MSO',
      search: /fillcolor="#[0-9A-Fa-f]{6}"/g,
      replace: 'fillcolor="#000000"'
    }
  ];

  let totalChanges = 0;

  for (const templateFile of templateFiles) {
    const filePath = path.join(templatesDir, templateFile);
    let content = fs.readFileSync(filePath, 'utf8');
    let fileChanges = 0;

    console.log(`📧 Processing ${templateFile}:`);

    for (const fix of fixes) {
      const beforeLength = content.length;
      
      if (typeof fix.replace === 'function') {
        content = content.replace(fix.search, fix.replace);
      } else {
        content = content.replace(fix.search, fix.replace);
      }
      
      const afterLength = content.length;
      const changes = (content.match(fix.search) || []).length;
      
      if (beforeLength !== afterLength || changes > 0) {
        console.log(`   ✓ ${fix.name}`);
        fileChanges++;
      }
    }

    // Additional specific fixes for consistency
    
    // Ensure consistent footer styling
    content = content.replace(
      /Questions\? Contact us at <a href="mailto:hello@applybureau\.com"[^>]*>hello@applybureau\.com<\/a>/g,
      'Questions? Contact us at <a href="mailto:hello@applybureau.com" style="color: #64748B; text-decoration: none;">hello@applybureau.com</a>'
    );

    // Ensure consistent button styling
    content = content.replace(
      /style="[^"]*background[^"]*#000000[^"]*"/g,
      function(match) {
        if (!match.includes('color: #FFFFFF')) {
          return match.replace(/#000000;/, '#000000; color: #FFFFFF;');
        }
        return match;
      }
    );

    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    
    if (fileChanges > 0) {
      console.log(`   ✅ Applied ${fileChanges} fixes`);
      totalChanges += fileChanges;
    } else {
      console.log(`   ℹ️  No changes needed`);
    }
    console.log();
  }

  console.log(`🎉 Email Template Formatting Complete!`);
  console.log(`📊 Total fixes applied: ${totalChanges}`);
  console.log(`📧 Templates processed: ${templateFiles.length}`);
  
  console.log('\n✅ Summary of changes:');
  console.log('   - Updated email address to hello@applybureau.com');
  console.log('   - Standardized all button colors to black (#000000)');
  console.log('   - Ensured consistent text formatting');
  console.log('   - Maintained footer and small text colors');
  console.log('   - Fixed WhatsApp and video call button colors');
}

// Run the fix
if (require.main === module) {
  fixEmailTemplatesFormatting().catch(console.error);
}

module.exports = fixEmailTemplatesFormatting;