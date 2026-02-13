#!/usr/bin/env node

/**
 * COMPREHENSIVE EMAIL TEMPLATE SCANNER AND FIXER
 * Scans and fixes:
 * 1. Black backgrounds (#000000) -> White (#ffffff)
 * 2. Missing or incorrect logo URLs
 * 3. Placeholder variables ({{variable}})
 * 4. Dark mode CSS issues
 */

const fs = require('fs').promises;
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'emails', 'templates');
const LOGO_URL = 'https://res.cloudinary.com/dbehg8jsv/image/upload/v1769345413/AB_LOGO_EDITED-removebg-preview_zrz8ai.png';

const issues = {
  blackBackgrounds: [],
  missingLogos: [],
  incorrectLogos: [],
  darkModeIssues: [],
  placeholders: []
};

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

async function scanTemplate(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const templateIssues = [];
    
    // Skip base templates
    if (fileName.startsWith('_')) {
        return null;
    }
    
    // Check for black backgrounds
    if (content.includes('background-color: #000000') || content.includes('background-color:#000000')) {
        templateIssues.push('❌ Black backgrounds found');
        issues.blackBackgrounds.push(fileName);
    }
    
    // Check for logo
    if (!content.includes('<img') || !content.includes('logo')) {
        templateIssues.push('❌ Logo missing');
        issues.missingLogos.push(fileName);
    } else if (!content.includes(LOGO_URL)) {
        templateIssues.push('⚠️  Logo URL incorrect');
        issues.incorrectLogos.push(fileName);
    }
    
    // Check for incorrect dark mode CSS
    if (content.includes('color: #000000 !important') && content.includes('background-color: #000000 !important')) {
        templateIssues.push('❌ Dark mode CSS forcing black');
        issues.darkModeIssues.push(fileName);
    }
    
    // Check for unprocessed placeholders (basic check)
    const placeholderMatches = content.match(/\{\{[^}]+\}\}/g);
    if (placeholderMatches && placeholderMatches.length > 10) {
        templateIssues.push(`⚠️  ${placeholderMatches.length} placeholders (normal)`);
    }
    
    return {
        fileName,
        issues: templateIssues,
        hasIssues: templateIssues.length > 0
    };
}

async function fixTemplate(filePath) {
    let content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    // Skip base templates
    if (fileName.startsWith('_')) {
        return false;
    }
    
    let fixed = false;
    
    // 1. Replace incorrect dark mode CSS
    if (content.includes('<meta name="color-scheme"')) {
        content = content.replace(
            /<meta name="color-scheme"[\s\S]*?<\/style>/,
            CORRECT_DARK_MODE_CSS
        );
        fixed = true;
    }
    
    // 2. Fix all background-color: #000000 to #ffffff
    if (content.includes('#000000')) {
        content = content.replace(/background-color:\s*#000000/gi, 'background-color: #ffffff');
        content = content.replace(/background-color:#000000/gi, 'background-color: #ffffff');
        fixed = true;
    }
    
    // 3. Fix all color: #000000 to proper text color (but not in background context)
    content = content.replace(/([^-])color:\s*#000000/gi, '$1color: #1a1a1a');
    content = content.replace(/([^-])color:#000000/gi, '$1color: #1a1a1a');
    
    // 4. Fix body tag
    if (content.includes('<body')) {
        content = content.replace(
            /<body[^>]*>/,
            '<body style="margin: 0; padding: 0; font-family: \'Inter\', \'Helvetica Neue\', Helvetica, Arial, sans-serif; background-color: #f5f5f5; color: #1a1a1a;">'
        );
        fixed = true;
    }
    
    // 5. Ensure logo uses correct Cloudinary URL
    if (content.includes('<img') && !content.includes(LOGO_URL)) {
        content = content.replace(
            /src="[^"]*(?:logo|AB_LOGO)[^"]*"/gi,
            `src="${LOGO_URL}"`
        );
        content = content.replace(
            /src='[^']*(?:logo|AB_LOGO)[^']*'/gi,
            `src="${LOGO_URL}"`
        );
        fixed = true;
    }
    
    // 6. Add email-container class to main table if not present
    if (!content.includes('class="email-container"')) {
        content = content.replace(
            /<table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px;/g,
            '<table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px;'
        );
    }
    
    // 7. Ensure outer background is light gray
    content = content.replace(
        /<td align="center" style="padding: 40px 20px;">/g,
        '<td align="center" style="padding: 40px 20px; background-color: #f5f5f5;">'
    );
    
    if (fixed) {
        await fs.writeFile(filePath, content, 'utf-8');
    }
    
    return fixed;
}

async function scanAndFixAll() {
    console.log('🔍 COMPREHENSIVE EMAIL TEMPLATE SCANNER');
    console.log('========================================\n');
    
    try {
        const files = await fs.readdir(TEMPLATES_DIR);
        const htmlFiles = files.filter(f => f.endsWith('.html'));
        
        console.log(`Found ${htmlFiles.length} email templates\n`);
        console.log('📊 SCANNING FOR ISSUES...\n');
        
        // Scan all templates
        const scanResults = [];
        for (const file of htmlFiles) {
            const result = await scanTemplate(path.join(TEMPLATES_DIR, file));
            if (result) {
                scanResults.push(result);
                if (result.hasIssues) {
                    console.log(`❌ ${result.fileName}`);
                    result.issues.forEach(issue => console.log(`   ${issue}`));
                } else {
                    console.log(`✅ ${result.fileName} - No issues`);
                }
            }
        }
        
        // Summary of issues
        console.log('\n📋 ISSUE SUMMARY');
        console.log('================');
        console.log(`Black backgrounds: ${issues.blackBackgrounds.length}`);
        console.log(`Missing logos: ${issues.missingLogos.length}`);
        console.log(`Incorrect logos: ${issues.incorrectLogos.length}`);
        console.log(`Dark mode issues: ${issues.darkModeIssues.length}`);
        
        const totalIssues = issues.blackBackgrounds.length + 
                           issues.missingLogos.length + 
                           issues.incorrectLogos.length + 
                           issues.darkModeIssues.length;
        
        if (totalIssues === 0) {
            console.log('\n✅ NO ISSUES FOUND! All templates are perfect.\n');
            return;
        }
        
        console.log(`\n⚠️  Total templates with issues: ${totalIssues}`);
        console.log('\n🔧 FIXING ALL ISSUES...\n');
        
        // Fix all templates
        let fixedCount = 0;
        for (const file of htmlFiles) {
            const fixed = await fixTemplate(path.join(TEMPLATES_DIR, file));
            if (fixed) {
                console.log(`✅ Fixed: ${file}`);
                fixedCount++;
            }
        }
        
        console.log('\n✅ ALL FIXES COMPLETE!');
        console.log('======================');
        console.log(`Templates fixed: ${fixedCount}/${htmlFiles.length - 2}`); // -2 for base templates
        console.log('\nChanges made:');
        console.log('  ✅ Fixed all black backgrounds to white');
        console.log('  ✅ Updated all logos to Cloudinary URL');
        console.log('  ✅ Fixed dark mode CSS');
        console.log('  ✅ Corrected text colors');
        console.log('  ✅ Added email-container classes');
        console.log('\n📧 Ready to test emails!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

scanAndFixAll();
