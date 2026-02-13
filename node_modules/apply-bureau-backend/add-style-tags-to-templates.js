const fs = require('fs').promises;
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'emails', 'templates');

const STYLE_TAG = `<style>
        /* Force light mode only */
        :root {
            color-scheme: light only;
            supported-color-schemes: light;
        }
        
        body {
            color-scheme: light only !important;
        }
    </style>
`;

async function addStyleTags() {
  console.log('🎨 Adding style tags with light mode enforcement...\n');
  
  try {
    const files = await fs.readdir(TEMPLATES_DIR);
    const htmlFiles = files.filter(f => f.endsWith('.html') && !f.startsWith('_'));
    
    let updatedCount = 0;
    
    for (const file of htmlFiles) {
      const filePath = path.join(TEMPLATES_DIR, file);
      let content = await fs.readFile(filePath, 'utf8');
      
      // Check if already has color-scheme enforcement
      if (!content.includes('color-scheme: light')) {
        // Add style tag before </head>
        if (content.includes('</head>')) {
          content = content.replace(
            '</head>',
            `${STYLE_TAG}</head>`
          );
          
          await fs.writeFile(filePath, content, 'utf8');
          console.log(`✅ Added to ${file}`);
          updatedCount++;
        } else {
          console.log(`⚠️  No </head> tag found in ${file}`);
        }
      } else {
        console.log(`ℹ️  ${file} already has color-scheme enforcement`);
      }
    }
    
    console.log(`\n📊 Updated ${updatedCount} templates with style tags`);
    console.log('✅ All templates now enforce light mode!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addStyleTags().catch(console.error);
