const fs = require('fs').promises;
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'emails', 'templates');

// Light mode color scheme - no dark backgrounds
const LIGHT_MODE_COLORS = {
  background: '#ffffff',
  text: '#1a1a1a',
  secondary_text: '#64748B',
  border: '#E2E8F0',
  button_bg: '#ffffff',
  button_text: '#1a1a1a',
  info_box_bg: '#f8f9fa',
  header_bg: '#ffffff'
};

async function fixAllEmailTemplates() {
  console.log('🔧 Starting comprehensive email template fixes...\n');
  
  try {
    const files = await fs.readdir(TEMPLATES_DIR);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const file of htmlFiles) {
      try {
        const filePath = path.join(TEMPLATES_DIR, file);
        let content = await fs.readFile(filePath, 'utf8');
        let modified = false;
        
        console.log(`📄 Processing: ${file}`);
        
        // Fix 1: Remove all black backgrounds (#000000)
        if (content.includes('#000000') || content.includes('black')) {
          content = content.replace(/background-color:\s*#000000/g, 'background-color: #ffffff');
          content = content.replace(/background:\s*#000000/g, 'background: #ffffff');
          content = content.replace(/background-color:\s*black/g, 'background-color: #ffffff');
          content = content.replace(/background:\s*black/g, 'background: #ffffff');
          console.log('  ✓ Fixed black backgrounds');
          modified = true;
        }
        
        // Fix 2: Remove dark mode media queries completely
        if (content.includes('@media (prefers-color-scheme: dark)')) {
          // Remove entire dark mode media query blocks
          content = content.replace(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[^}]*\{[^}]*\}[^}]*\}/gs, '');
          content = content.replace(/\/\*\s*Dark mode.*?\*\/\s*@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[\s\S]*?\}\s*\}/g, '');
          content = content.replace(/\/\*\s*Gmail dark mode prevention.*?\*\/\s*@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[\s\S]*?\}\s*\}/g, '');
          console.log('  ✓ Removed dark mode media queries');
          modified = true;
        }
        
        // Fix 3: Add light mode enforcement in style tag
        if (content.includes('<style>') && !content.includes('color-scheme: light only')) {
          content = content.replace(
            /<style>/,
            `<style>
        /* Force light mode only */
        :root {
            color-scheme: light only;
            supported-color-schemes: light;
        }
        
        body {
            color-scheme: light only !important;
        }
        `
          );
          console.log('  ✓ Added light mode enforcement');
          modified = true;
        }
        
        // Fix 4: Ensure proper color values in body tag
        if (content.includes('<body')) {
          content = content.replace(
            /<body([^>]*?)style="([^"]*?)"/g,
            (match, attrs, styles) => {
              let newStyles = styles;
              // Ensure white background and dark text
              if (!newStyles.includes('background-color:') || newStyles.includes('background-color: #000000')) {
                newStyles = newStyles.replace(/background-color:\s*[^;]+;?/g, '');
                newStyles += ' background-color: #ffffff;';
              }
              if (!newStyles.includes('color:') || newStyles.includes('color: #000000')) {
                newStyles = newStyles.replace(/color:\s*[^;]+;?/g, '');
                newStyles += ' color: #1a1a1a;';
              }
              return `<body${attrs}style="${newStyles.trim()}"`;
            }
          );
          console.log('  ✓ Fixed body tag colors');
          modified = true;
        }
        
        // Fix 5: Fix any remaining color: #000000 that should be text color
        const colorBlackRegex = /color:\s*#000000(?!\s*!important)/g;
        if (colorBlackRegex.test(content)) {
          content = content.replace(colorBlackRegex, 'color: #1a1a1a');
          console.log('  ✓ Fixed text color values');
          modified = true;
        }
        
        // Fix 6: Ensure all table backgrounds are white
        content = content.replace(
          /(<table[^>]*?style="[^"]*?)background-color:\s*#000000/g,
          '$1background-color: #ffffff'
        );
        
        // Fix 7: Ensure all td backgrounds are white where they were black
        content = content.replace(
          /(<td[^>]*?style="[^"]*?)background-color:\s*#000000/g,
          '$1background-color: #ffffff'
        );
        
        // Fix 8: Clean up any duplicate spaces or formatting issues
        content = content.replace(/\s{3,}/g, '  ');
        content = content.replace(/;\s*;/g, ';');
        
        if (modified) {
          await fs.writeFile(filePath, content, 'utf8');
          console.log(`  ✅ Saved changes to ${file}\n`);
          fixedCount++;
        } else {
          console.log(`  ℹ️  No changes needed for ${file}\n`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing ${file}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total files processed: ${htmlFiles.length}`);
    console.log(`   Files fixed: ${fixedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('='.repeat(60));
    
    if (errorCount === 0) {
      console.log('\n✅ All email templates fixed successfully!');
      console.log('\n📋 Changes made:');
      console.log('   1. Removed all black backgrounds (#000000)');
      console.log('   2. Removed all dark mode media queries');
      console.log('   3. Added light mode enforcement');
      console.log('   4. Fixed body tag colors');
      console.log('   5. Fixed text color values');
      console.log('   6. Ensured white backgrounds throughout');
      console.log('\n🎨 All emails now use light mode only!');
    } else {
      console.log(`\n⚠️  Completed with ${errorCount} error(s)`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the fix
fixAllEmailTemplates().catch(console.error);
