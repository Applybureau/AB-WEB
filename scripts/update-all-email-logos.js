const fs = require('fs').promises;
const path = require('path');

async function updateAllEmailLogos() {
  const templatesDir = path.join(__dirname, '..', 'emails', 'templates');
  
  try {
    const files = await fs.readdir(templatesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`Found ${htmlFiles.length} email templates to update...`);
    
    for (const file of htmlFiles) {
      const filePath = path.join(templatesDir, file);
      let content = await fs.readFile(filePath, 'utf8');
      
      // Skip if already updated (has width="220")
      if (content.includes('width="220"')) {
        console.log(`✓ ${file} already updated`);
        continue;
      }
      
      // Update logo size and add proper attributes
      const oldLogoPattern = /width="180" style="display: block; border: 0;"/g;
      const newLogoPattern = 'width="220" height="auto" style="display: block; border: 0; max-width: 100%;"';
      
      if (content.includes('width="180"')) {
        content = content.replace(oldLogoPattern, newLogoPattern);
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✓ Updated ${file}`);
      } else {
        console.log(`- ${file} doesn't need logo update`);
      }
    }
    
    console.log('\n✅ All email templates updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating templates:', error);
  }
}

updateAllEmailLogos();