#!/usr/bin/env node

/**
 * COMPREHENSIVE EMAIL DARK MODE FIX
 * Fixes all email templates to prevent dark mode and ensure white backgrounds
 */

const fs = require('fs').promises;
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'emails', 'templates');

// Correct dark mode prevention CSS
const CORRECT_DARK_MODE_CSS = `
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <style>
        /* Force light mode - prevent dark mode */
        :root {
            color-scheme: light only;
            supported-color-schemes: light;
        }
        
        /* Gmail dark mode prevention */
        @media (prefers-color-scheme: dark) {
            body, table, td, p, a, span, div, h1, h2, h3, h4, h5, h6 {
                color: #1a1a1a !important;
                background-color: #ffffff !important;
            }
            .email-container {
                background-color: #ffffff !important;
            }
            .content-box {
                background-color: #f8f9fa !important;
            }
        }
        
        /* Outlook dark mode prevention */
        [data-ogsc] body, [data-ogsc] table, [data-ogsc] td {
            background-color: #ffffff !important;
            color: #1a1a1a !important;
        }
        
        /* Mobile responsive */
        @media only screen and (max-width: 600px) {
            table[width="600"] {
                width: 100% !important;
            }
            td[style*="padding: 40px"] {
                padding: 20px !important;
            }
        }
    </style>`;

async function fixTemplate(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf-8');
        const fileName = path.basename(filePath);
        
        // Skip base templates
        if (fileName.startsWith('_')) {
            console.log(`⏭️  Skipping base template: ${fileName}`);
            return;
        }
        
        console.log(`🔧 Fixing: ${fileName}`);
        
        // Replace incorrect dark mode CSS
        content = content.replace(
            /<meta name="color-scheme"[\s\S]*?<\/style>/,
            CORRECT_DARK_MODE_CSS
        );
        
        // Fix all background-color: #000000 to #ffffff
        content = content.replace(/background-color:\s*#000000/gi, 'background-color: #ffffff');
        
        // Fix all color: #000000 to proper text color
        content = content.replace(/color:\s*#000000(?!;?\s*background)/gi, 'color: #1a1a1a');
        
        // Fix body tag
        content = content.replace(
            /<body[^>]*>/,
            '<body style="margin: 0; padding: 0; font-family: \'Inter\', \'Helvetica Neue\', Helvetica, Arial, sans-serif; background-color: #f5f5f5; color: #1a1a1a;">'
        );
        
        // Ensure logo uses Cloudinary URL
        content = content.replace(
            /src="[^"]*logo[^"]*"/gi,
            'src="https://res.cloudinary.com/dbehg8jsv/image/upload/v1769345413/AB_LOGO_EDITED-removebg-preview_zrz8ai.png"'
        );
        
        // Add email-container class to main table
        content = content.replace(
            /<table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px;/g,
            '<table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px;'
        );
        
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ Fixed: ${fileName}\n`);
        
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
}

async function fixAllTemplates() {
    console.log('🚀 COMPREHENSIVE EMAIL DARK MODE FIX');
    console.log('=====================================\n');
    
    try {
        const files = await fs.readdir(TEMPLATES_DIR);
        const htmlFiles = files.filter(f => f.endsWith('.html'));
        
        console.log(`Found ${htmlFiles.length} email templates\n`);
        
        for (const file of htmlFiles) {
            await fixTemplate(path.join(TEMPLATES_DIR, file));
        }
        
        console.log('\n✅ ALL TEMPLATES FIXED!');
        console.log('\nChanges made:');
        console.log('  1. ✅ Fixed dark mode CSS (white backgrounds)');
        console.log('  2. ✅ Changed all #000000 backgrounds to #ffffff');
        console.log('  3. ✅ Fixed text colors to #1a1a1a');
        console.log('  4. ✅ Ensured Cloudinary logo URLs');
        console.log('  5. ✅ Added Gmail/Outlook dark mode prevention');
        console.log('\n📧 Ready to send test emails!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixAllTemplates();
