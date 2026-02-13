const fs = require('fs').promises;
const path = require('path');

const OLD_LOGO_URL = 'https://res.cloudinary.com/dbehg8jsv/image/upload/v1767902182/AB_Logo-removebg-preview_mlji6p.png';
const NEW_LOGO_URL = 'https://res.cloudinary.com/dbehg8jsv/image/upload/v1769345413/AB_LOGO_EDITED-removebg-preview_zrz8ai.png';

async function updateEmailLogos() {
  try {
    const templatesDir = path.join(__dirname, 'emails', 'templates');
    const files = await fs.readdir(templatesDir);
    
    let updatedCount = 0;
    
    for (const file of files) {
      if (file.endsWith('.html')) {
        const filePath = path.join(templatesDir, file);
        let content = await fs.readFile(filePath, 'utf8');
        
        if (content.includes(OLD_LOGO_URL)) {
          content = content.replace(new RegExp(OLD_LOGO_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_LOGO_URL);
          await fs.writeFile(filePath, content, 'utf8');
          console.log(`✅ Updated logo in: ${file}`);
          updatedCount++;
        }
      }
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} email templates with new logo URL`);
    console.log(`Old URL: ${OLD_LOGO_URL}`);
    console.log(`New URL: ${NEW_LOGO_URL}`);
    
  } catch (error) {
    console.error('❌ Error updating email logos:', error);
  }
}

updateEmailLogos();