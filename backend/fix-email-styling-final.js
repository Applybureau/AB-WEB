const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'emails', 'templates');

// Function to fix email template styling comprehensively
function fixEmailTemplate(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix teal backgrounds to white (except for buttons)
    const originalContent = content;
    
    // Change teal body backgrounds to white
    content = content.replace(
      /background-color: #0d9488; color: #ffffff;/g,
      'background-color: #ffffff; color: #000000;'
    );
    
    // Change teal table backgrounds to white (but preserve button backgrounds)
    content = content.replace(
      /<body style="[^"]*background-color: #0d9488[^"]*"/g,
      (match) => match.replace('background-color: #0d9488', 'background-color: #ffffff').replace('color: #ffffff', 'color: #000000')
    );
    
    // Fix table backgrounds
    content = content.replace(
      /<table[^>]*style="[^"]*background-color: #0d9488[^"]*"/g,
      (match) => {
        // Don't change button table backgrounds
        if (match.includes('inline-block') || match.includes('text-decoration: none')) {
          return match;
        }
        return match.replace('background-color: #0d9488', 'background-color: #ffffff').replace('color: #ffffff', 'color: #000000');
      }
    );
    
    // Fix td backgrounds (but preserve buttons)
    content = content.replace(
      /<td[^>]*style="[^"]*background-color: #0d9488[^"]*"/g,
      (match) => {
        // Don't change button td backgrounds or if it contains a button
        if (match.includes('inline-block') || match.includes('text-decoration: none')) {
          return match;
        }
        return match.replace('background-color: #0d9488', 'background-color: #ffffff').replace('color: #ffffff', 'color: #000000');
      }
    );
    
    // Fix div backgrounds (but preserve special divs like buttons)
    content = content.replace(
      /<div[^>]*style="[^"]*background-color: #0d9488[^"]*"/g,
      (match) => {
        // Don't change if it's a button or special component
        if (match.includes('inline-block') || match.includes('text-decoration: none') || match.includes('border:')) {
          return match;
        }
        return match.replace('background-color: #0d9488', 'background-color: #f8f9fa').replace('color: #ffffff', 'color: #000000');
      }
    );

    // Ensure buttons have proper teal background and white text
    content = content.replace(
      /<a[^>]*style="[^"]*display: inline-block[^"]*"/g,
      (match) => {
        if (!match.includes('background-color: #0d9488')) {
          match = match.replace(/background-color: #[0-9A-Fa-f]{6}/, 'background-color: #0d9488');
        }
        if (!match.includes('color: #ffffff')) {
          match = match.replace(/color: #[0-9A-Fa-f]{6}/, 'color: #ffffff');
        }
        return match;
      }
    );

    // Fix any remaining white text that should be black (except in buttons)
    content = content.replace(
      /<p[^>]*style="[^"]*color: #ffffff[^"]*"/g,
      (match) => match.replace('color: #ffffff', 'color: #000000')
    );
    
    content = content.replace(
      /<h[1-6][^>]*style="[^"]*color: #ffffff[^"]*"/g,
      (match) => match.replace('color: #ffffff', 'color: #000000')
    );

    // Fix footer colors specifically
    content = content.replace(
      /color: #000000; font-size: 14px;  margin/g,
      'color: #64748B; font-size: 14px; margin'
    );
    content = content.replace(
      /color: #000000; font-size: 12px; margin/g,
      'color: #64748B; font-size: 12px; margin'
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
      modified = true;
    } else {
      console.log(`⚪ No changes needed: ${path.basename(filePath)}`);
    }

    return modified;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main function to fix all templates
function fixAllTemplates() {
  console.log('🔧 Fixing email template styling (final pass)...\n');
  
  try {
    const files = fs.readdirSync(templatesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    let totalFixed = 0;
    
    htmlFiles.forEach(file => {
      const filePath = path.join(templatesDir, file);
      if (fixEmailTemplate(filePath)) {
        totalFixed++;
      }
    });
    
    console.log(`\n🎉 Final email template styling fixes completed!`);
    console.log(`📊 Total templates processed: ${htmlFiles.length}`);
    console.log(`✅ Templates modified: ${totalFixed}`);
    console.log(`\n📋 Final changes made:`);
    console.log(`   • Fixed all teal backgrounds to white (except buttons)`);
    console.log(`   • Ensured all text is black (except button text)`);
    console.log(`   • Preserved teal-600 button backgrounds with white text`);
    console.log(`   • Fixed footer text colors to gray`);
    console.log(`   • Maintained proper contrast and readability`);
    
  } catch (error) {
    console.error('❌ Error reading templates directory:', error.message);
  }
}

// Run the fix
fixAllTemplates();