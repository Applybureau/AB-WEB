const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'emails', 'templates');

// Function to fix button colors specifically
function fixButtonColors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    // Fix all button/link elements with inline-block display (these are buttons)
    content = content.replace(
      /<a[^>]*style="[^"]*display:\s*inline-block[^"]*"[^>]*>/g,
      (match) => {
        let newMatch = match;
        
        // Ensure teal background
        if (newMatch.includes('background-color:')) {
          newMatch = newMatch.replace(/background-color:\s*#[0-9A-Fa-f]{6}/, 'background-color: #0d9488');
        } else {
          // Add background-color if not present
          newMatch = newMatch.replace(/style="/, 'style="background-color: #0d9488; ');
        }
        
        // Ensure white text color
        if (newMatch.includes('color:')) {
          newMatch = newMatch.replace(/color:\s*#[0-9A-Fa-f]{6}/, 'color: #ffffff');
        } else {
          // Add color if not present
          newMatch = newMatch.replace(/background-color: #0d9488;/, 'background-color: #0d9488; color: #ffffff;');
        }
        
        return newMatch;
      }
    );

    // Also fix any buttons that might use different patterns
    content = content.replace(
      /<a[^>]*style="[^"]*text-decoration:\s*none[^"]*"[^>]*>/g,
      (match) => {
        // Only modify if it looks like a button (has padding or background)
        if (match.includes('padding:') || match.includes('background-color:')) {
          let newMatch = match;
          
          // Ensure teal background
          if (newMatch.includes('background-color:')) {
            newMatch = newMatch.replace(/background-color:\s*#[0-9A-Fa-f]{6}/, 'background-color: #0d9488');
          } else {
            newMatch = newMatch.replace(/style="/, 'style="background-color: #0d9488; ');
          }
          
          // Ensure white text color
          if (newMatch.includes('color:')) {
            newMatch = newMatch.replace(/color:\s*#[0-9A-Fa-f]{6}/, 'color: #ffffff');
          } else {
            newMatch = newMatch.replace(/background-color: #0d9488;/, 'background-color: #0d9488; color: #ffffff;');
          }
          
          return newMatch;
        }
        return match;
      }
    );

    // Fix specific button patterns that might have been missed
    content = content.replace(
      /background-color:\s*#ffffff;\s*color:\s*#000000/g,
      'background-color: #0d9488; color: #ffffff'
    );

    // Fix any remaining white backgrounds on elements that look like buttons
    content = content.replace(
      /<a[^>]*style="[^"]*padding:[^"]*background-color:\s*#ffffff[^"]*"[^>]*>/g,
      (match) => match.replace('background-color: #ffffff', 'background-color: #0d9488').replace('color: #000000', 'color: #ffffff')
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed buttons in: ${path.basename(filePath)}`);
      modified = true;
    } else {
      console.log(`⚪ No button changes needed: ${path.basename(filePath)}`);
    }

    return modified;
  } catch (error) {
    console.error(`❌ Error fixing buttons in ${filePath}:`, error.message);
    return false;
  }
}

// Main function to fix all button colors
function fixAllButtonColors() {
  console.log('🔧 Fixing button colors in all email templates...\n');
  
  try {
    const files = fs.readdirSync(templatesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    let totalFixed = 0;
    
    htmlFiles.forEach(file => {
      const filePath = path.join(templatesDir, file);
      if (fixButtonColors(filePath)) {
        totalFixed++;
      }
    });
    
    console.log(`\n🎉 Button color fixes completed!`);
    console.log(`📊 Total templates processed: ${htmlFiles.length}`);
    console.log(`✅ Templates with button fixes: ${totalFixed}`);
    console.log(`\n📋 Button styling applied:`);
    console.log(`   • Background color: #0d9488 (teal-600)`);
    console.log(`   • Text color: #ffffff (white)`);
    console.log(`   • Applied to all button elements`);
    
  } catch (error) {
    console.error('❌ Error reading templates directory:', error.message);
  }
}

// Run the fix
fixAllButtonColors();