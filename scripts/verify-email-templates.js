const fs = require('fs').promises;
const path = require('path');

async function verifyEmailTemplates() {
  const templatesDir = path.join(__dirname, '..', 'emails', 'templates');
  
  try {
    const files = await fs.readdir(templatesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log('🔍 Verifying email templates...\n');
    
    let allGood = true;
    
    for (const file of htmlFiles) {
      const filePath = path.join(templatesDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      console.log(`📧 ${file}:`);
      
      // Check logo
      if (content.includes('width="220"') && content.includes('height="auto"')) {
        console.log('  ✅ Logo: Correct size (220px) with responsive attributes');
      } else if (content.includes('width="180"')) {
        console.log('  ❌ Logo: Still using old size (180px)');
        allGood = false;
      } else {
        console.log('  ⚠️  Logo: No logo found or different format');
      }
      
      // Check Cloudinary URL
      if (content.includes('res.cloudinary.com/dbehg8jsv')) {
        console.log('  ✅ Logo URL: Using Cloudinary');
      } else if (content.includes('githubusercontent.com')) {
        console.log('  ❌ Logo URL: Still using GitHub');
        allGood = false;
      } else {
        console.log('  ⚠️  Logo URL: Different or no URL found');
      }
      
      // Check for slate-900 buttons
      if (content.includes('#0f172a')) {
        console.log('  ✅ Buttons: Using slate-900 color');
      } else if (content.includes('#10b981') || content.includes('#06b6d4')) {
        console.log('  ⚠️  Buttons: Using old brand colors (not slate-900)');
      } else {
        console.log('  ℹ️  Buttons: No buttons or different colors');
      }
      
      // Check for dashboard_link variable
      if (content.includes('{{dashboard_link}}')) {
        console.log('  ✅ Dashboard: Using dynamic dashboard_link variable');
      } else if (content.includes('localhost:5173')) {
        console.log('  ⚠️  Dashboard: Using hardcoded localhost link');
      } else {
        console.log('  ℹ️  Dashboard: No dashboard link found');
      }
      
      console.log('');
    }
    
    if (allGood) {
      console.log('🎉 All templates look good!');
    } else {
      console.log('⚠️  Some templates need attention.');
    }
    
  } catch (error) {
    console.error('❌ Error verifying templates:', error);
  }
}

verifyEmailTemplates();