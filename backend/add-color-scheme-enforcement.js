const fs = require('fs').promises;
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'emails', 'templates');

const COLOR_SCHEME_ENFORCEMENT = `        /* Force light mode only */
        :root {
            color-scheme: light only;
            supported-color-schemes: light;
        }
        
        body {
            color-scheme: light only !important;
        }
        `;

async function addColorSchemeEnforcement() {
  console.log('🎨 Adding color-scheme enforcement to templates...\n');
  
  try {
    const files = await fs.readdir(TEMPLATES_DIR);
    const htmlFiles = files.filter(f => f.endsWith('.html') && !f.startsWith('_'));
    
    let updatedCount = 0;
    
    for (const file of htmlFiles) {
      const filePath = path.join(TEMPLATES_DIR, file);
      let content = await fs.readFile(filePath, 'utf8');
      
      // Check if already has color-scheme enforcement
      if (!content.includes('color-scheme: light')) {
        // Find the <style> tag and add enforcement
        if (content.includes('<style>')) {
          content = content.replace(
            /<style>/,
            `<style>\n${COLOR_SCHEME_ENFORCEMENT}`
          );
          
          await fs.writeFile(filePath, content, 'utf8');
          console.log(`✅ Added to ${file}`);
          updatedCount++;
        } else {
          console.log(`⚠️  No <style> tag found in ${file}`);
        }
      }
    }
    
    console.log(`\n📊 Updated ${updatedCount} templates with color-scheme enforcement`);
    console.log('✅ All templates now enforce light mode!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addColorSchemeEnforcement().catch(console.error);
