const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'emails', 'templates');

// Function to comprehensively fix email template
function fixEmailTemplate(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    // 1. Fix body background and text color
    content = content.replace(
      /<body[^>]*style="[^"]*"/g,
      (match) => {
        let newMatch = match;
        newMatch = newMatch.replace(/background-color:\s*#[0-9A-Fa-f]{6}/, 'background-color: #ffffff');
        newMatch = newMatch.replace(/color:\s*#ffffff/, 'color: #000000');
        return newMatch;
      }
    );

    // 2. Fix main table backgrounds (but preserve button tables)
    content = content.replace(
      /<table[^>]*style="[^"]*"/g,
      (match) => {
        // Skip if it's a button table (has inline-block or text-decoration)
        if (match.includes('inline-block') || match.includes('text-decoration')) {
          return match;
        }
        let newMatch = match;
        newMatch = newMatch.replace(/background-color:\s*#0d9488/, 'background-color: #ffffff');
        newMatch = newMatch.replace(/color:\s*#ffffff/, 'color: #000000');
        return newMatch;
      }
    );

    // 3. Fix td backgrounds (but preserve button tds)
    content = content.replace(
      /<td[^>]*style="[^"]*"/g,
      (match) => {
        // Skip if it's a button td or contains button elements
        if (match.includes('inline-block') || match.includes('text-decoration')) {
          return match;
        }
        let newMatch = match;
        newMatch = newMatch.replace(/background-color:\s*#0d9488/, 'background-color: #ffffff');
        newMatch = newMatch.replace(/color:\s*#ffffff/, 'color: #000000');
        return newMatch;
      }
    );

    // 4. Fix div backgrounds (but preserve special divs)
    content = content.replace(
      /<div[^>]*style="[^"]*"/g,
      (match) => {
        // Skip if it's a button div or special component
        if (match.includes('inline-block') || match.includes('text-decoration') || match.includes('border:')) {
          return match;
        }
        let newMatch = match;
        newMatch = newMatch.replace(/background-color:\s*#0d9488/, 'background-color: #f8f9fa');
        newMatch = newMatch.replace(/color:\s*#ffffff/, 'color: #000000');
        return newMatch;
      }
    );

    // 5. Fix paragraph and heading text colors (but not in buttons)
    content = content.replace(
      /<p[^>]*style="[^"]*color:\s*#ffffff[^"]*"/g,
      (match) => match.replace(/color:\s*#ffffff/, 'color: #000000')
    );
    
    content = content.replace(
      /<h[1-6][^>]*style="[^"]*color:\s*#ffffff[^"]*"/g,
      (match) => match.replace(/color:\s*#ffffff/, 'color: #000000')
    );

    // 6. Ensure ALL buttons have teal background and white text
    content = content.replace(
      /<a[^>]*style="[^"]*display:\s*inline-block[^"]*"[^>]*>/g,
      (match) => {
        let newMatch = match;
        
        // Force teal background
        if (newMatch.includes('background-color:')) {
          newMatch = newMatch.replace(/background-color:\s*#[0-9A-Fa-f]{6}/, 'background-color: #0d9488');
        } else {
          newMatch = newMatch.replace(/style="/, 'style="background-color: #0d9488; ');
        }
        
        // Force white text
        if (newMatch.includes('color:')) {
          newMatch = newMatch.replace(/color:\s*#[0-9A-Fa-f]{6}/, 'color: #ffffff');
        } else {
          newMatch = newMatch.replace(/background-color: #0d9488;/, 'background-color: #0d9488; color: #ffffff;');
        }
        
        return newMatch;
      }
    );

    // 7. Fix any other button patterns
    content = content.replace(
      /<a[^>]*style="[^"]*text-decoration:\s*none[^"]*padding:[^"]*"[^>]*>/g,
      (match) => {
        let newMatch = match;
        
        // Force teal background
        if (newMatch.includes('background-color:')) {
          newMatch = newMatch.replace(/background-color:\s*#[0-9A-Fa-f]{6}/, 'background-color: #0d9488');
        } else {
          newMatch = newMatch.replace(/style="/, 'style="background-color: #0d9488; ');
        }
        
        // Force white text
        if (newMatch.includes('color:')) {
          newMatch = newMatch.replace(/color:\s*#[0-9A-Fa-f]{6}/, 'color: #ffffff');
        } else {
          newMatch = newMatch.replace(/background-color: #0d9488;/, 'background-color: #0d9488; color: #ffffff;');
        }
        
        return newMatch;
      }
    );

    // 8. Fix footer colors
    content = content.replace(
      /color:\s*#000000;\s*font-size:\s*14px;\s*margin/g,
      'color: #64748B; font-size: 14px; margin'
    );
    content = content.replace(
      /color:\s*#000000;\s*font-size:\s*12px;\s*margin/g,
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

// Main function
function fixAllTemplatesComprehensive() {
  console.log('🔧 Comprehensive email template fix (white bg, black text, teal buttons)...\n');
  
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
    
    console.log(`\n🎉 Comprehensive email template fixes completed!`);
    console.log(`📊 Total templates processed: ${htmlFiles.length}`);
    console.log(`✅ Templates modified: ${totalFixed}`);
    console.log(`\n📋 Final styling:`);
    console.log(`   • Background: White (#ffffff)`);
    console.log(`   • Text: Black (#000000)`);
    console.log(`   • Buttons: Teal background (#0d9488) with white text (#ffffff)`);
    console.log(`   • Footer: Gray text (#64748B)`);
    
  } catch (error) {
    console.error('❌ Error reading templates directory:', error.message);
  }
}

// Run the fix
fixAllTemplatesComprehensive();