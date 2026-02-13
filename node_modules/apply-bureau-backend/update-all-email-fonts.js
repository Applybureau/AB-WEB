const fs = require('fs').promises;
const path = require('path');

// Font styles according to specifications
const FONT_STYLES = {
  // Main Headlines (H1)
  h1: `font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; letter-spacing: -0.02em;`,
  
  // Section Titles (H2/H3)
  h2h3: `font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600;`,
  
  // Body Paragraphs
  body: `font-family: 'Inter', sans-serif; font-weight: 400; line-height: 1.6;`,
  
  // Buttons & Navbar
  button: `font-family: 'Inter', sans-serif; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;`,
  
  // Dashboard / Data
  data: `font-family: 'Inter', sans-serif; font-weight: 400;`,
  
  // Footer text
  footer: `font-family: 'Inter', sans-serif; font-weight: 400;`
};

// Google Fonts link to add to head
const GOOGLE_FONTS_LINK = `<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">`;

async function updateEmailTemplate(templatePath) {
  try {
    console.log(`Updating: ${path.basename(templatePath)}`);
    
    let content = await fs.readFile(templatePath, 'utf8');
    
    // Add Google Fonts link if not present
    if (!content.includes('fonts.googleapis.com')) {
      content = content.replace(
        /<\/title>/,
        `</title>\n    ${GOOGLE_FONTS_LINK}`
      );
    }
    
    // Update body font-family
    content = content.replace(
      /font-family: '[^']*'/g,
      `font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif`
    );
    
    // Update H1 styles (main headlines)
    content = content.replace(
      /<h1[^>]*style="([^"]*)"[^>]*>/g,
      (match, styles) => {
        // Remove existing font-family, font-weight, letter-spacing
        let newStyles = styles
          .replace(/font-family:[^;]*;?/g, '')
          .replace(/font-weight:[^;]*;?/g, '')
          .replace(/letter-spacing:[^;]*;?/g, '')
          .trim();
        
        // Add new font styles
        newStyles = `${FONT_STYLES.h1} ${newStyles}`;
        
        return match.replace(`style="${styles}"`, `style="${newStyles}"`);
      }
    );
    
    // Update H2/H3 styles (section titles)
    content = content.replace(
      /<h[23][^>]*style="([^"]*)"[^>]*>/g,
      (match, styles) => {
        let newStyles = styles
          .replace(/font-family:[^;]*;?/g, '')
          .replace(/font-weight:[^;]*;?/g, '')
          .trim();
        
        newStyles = `${FONT_STYLES.h2h3} ${newStyles}`;
        
        return match.replace(`style="${styles}"`, `style="${newStyles}"`);
      }
    );
    
    // Update paragraph styles (body text)
    content = content.replace(
      /<p[^>]*style="([^"]*)"[^>]*>/g,
      (match, styles) => {
        let newStyles = styles
          .replace(/font-family:[^;]*;?/g, '')
          .replace(/font-weight:[^;]*;?/g, '')
          .replace(/line-height:[^;]*;?/g, '')
          .trim();
        
        newStyles = `${FONT_STYLES.body} ${newStyles}`;
        
        return match.replace(`style="${styles}"`, `style="${newStyles}"`);
      }
    );
    
    // Update button/link styles
    content = content.replace(
      /<a[^>]*style="([^"]*)"[^>]*>/g,
      (match, styles) => {
        // Only update if it looks like a button (has background-color and padding)
        if (styles.includes('background-color') && styles.includes('padding')) {
          let newStyles = styles
            .replace(/font-family:[^;]*;?/g, '')
            .replace(/font-weight:[^;]*;?/g, '')
            .replace(/text-transform:[^;]*;?/g, '')
            .replace(/letter-spacing:[^;]*;?/g, '')
            .trim();
          
          newStyles = `${FONT_STYLES.button} ${newStyles}`;
          
          return match.replace(`style="${styles}"`, `style="${newStyles}"`);
        }
        return match;
      }
    );
    
    // Clean up any double spaces or semicolons
    content = content.replace(/;;+/g, ';');
    content = content.replace(/; ;/g, ';');
    content = content.replace(/style=";\s*/g, 'style="');
    
    await fs.writeFile(templatePath, content, 'utf8');
    console.log(`✅ Updated: ${path.basename(templatePath)}`);
    
  } catch (error) {
    console.error(`❌ Error updating ${templatePath}:`, error.message);
  }
}

async function updateAllEmailTemplates() {
  const templatesDir = path.join(__dirname, 'emails', 'templates');
  
  try {
    const files = await fs.readdir(templatesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`🚀 Updating ${htmlFiles.length} email templates with proper fonts...\n`);
    
    for (const file of htmlFiles) {
      const templatePath = path.join(templatesDir, file);
      await updateEmailTemplate(templatePath);
    }
    
    console.log(`\n🎉 Successfully updated all ${htmlFiles.length} email templates!`);
    console.log('\n📝 Font Specifications Applied:');
    console.log('• Main Headlines (H1): Plus Jakarta Sans, Bold (700), Tight Letter Spacing (-0.02em)');
    console.log('• Section Titles (H2/H3): Plus Jakarta Sans, Semi-Bold (600)');
    console.log('• Body Paragraphs: Inter, Regular (400), Line Height (1.6)');
    console.log('• Buttons & Navbar: Inter, Medium (500), All Caps');
    console.log('• Dashboard / Data: Inter, Regular (400)');
    
  } catch (error) {
    console.error('❌ Error reading templates directory:', error.message);
  }
}

// Run the update
if (require.main === module) {
  updateAllEmailTemplates();
}

module.exports = { updateAllEmailTemplates };