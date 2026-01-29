const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'emails', 'templates');

// Function to fix email template styling
function fixEmailTemplate(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remove dark mode - change black backgrounds to white
    if (content.includes('background-color: #000000')) {
      content = content.replace(/background-color: #000000/g, 'background-color: #ffffff');
      modified = true;
    }

    // Change text color from white to black
    if (content.includes('color: #FFFFFF')) {
      content = content.replace(/color: #FFFFFF/g, 'color: #000000');
      modified = true;
    }

    // Fix button colors - make buttons teal-600 with white text
    content = content.replace(
      /background-color: #[0-9A-Fa-f]{6}; color: #[0-9A-Fa-f]{6}; color: #[0-9A-Fa-f]{6}/g,
      'background-color: #0d9488; color: #ffffff'
    );
    content = content.replace(
      /background-color: #[0-9A-Fa-f]{6}; color: #[0-9A-Fa-f]{6}/g,
      'background-color: #0d9488; color: #ffffff'
    );

    // Remove "Meeting details will be provided separately" text
    if (content.includes('Meeting details will be provided separately')) {
      content = content.replace(/.*Meeting details will be provided separately.*\n?/g, '');
      modified = true;
    }

    // Change "Career Advisor" to "Career Strategist"
    if (content.includes('Career Advisor')) {
      content = content.replace(/Career Advisor/g, 'Career Strategist');
      modified = true;
    }

    // Change "career advisor" to "Career Strategist"
    if (content.includes('career advisor')) {
      content = content.replace(/career advisor/g, 'Career Strategist');
      modified = true;
    }

    // Change "lead strategist" to "Career Strategist"
    if (content.includes('lead strategist')) {
      content = content.replace(/lead strategist/g, 'Career Strategist');
      modified = true;
    }

    // Fix footer text color
    content = content.replace(
      /color: #000000; font-size: 14px;  margin/g,
      'color: #64748B; font-size: 14px; margin'
    );
    content = content.replace(
      /color: #000000; font-size: 12px; margin/g,
      'color: #64748B; font-size: 12px; margin'
    );

    // Fix box shadow for light mode
    content = content.replace(
      /box-shadow: 0 4px 6px rgba\(0, 0, 0, 0\.3\)/g,
      'box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1)'
    );

    // Fix border colors for light mode
    content = content.replace(
      /border-top: 1px solid #334155/g,
      'border-top: 1px solid #E2E8F0'
    );

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`⚪ No changes needed: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main function to fix all templates
function fixAllTemplates() {
  console.log('🔧 Fixing all email templates...\n');
  
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
    
    console.log(`\n🎉 Email template fixes completed!`);
    console.log(`📊 Total templates processed: ${htmlFiles.length}`);
    console.log(`✅ Templates modified: ${totalFixed}`);
    console.log(`\n📋 Changes made:`);
    console.log(`   • Removed dark mode (black → white backgrounds)`);
    console.log(`   • Fixed text colors (white → black text)`);
    console.log(`   • Updated button colors (teal-600 background, white text)`);
    console.log(`   • Removed "Meeting details will be provided separately"`);
    console.log(`   • Changed "Career Advisor/lead strategist" → "Career Strategist"`);
    console.log(`   • Fixed footer styling for light mode`);
    
  } catch (error) {
    console.error('❌ Error reading templates directory:', error.message);
  }
}

// Run the fix
fixAllTemplates();