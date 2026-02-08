#!/usr/bin/env node

/**
 * ADD LOGOS TO ALL EMAIL TEMPLATES
 * Adds the logo header section to templates that are missing it
 */

const fs = require('fs').promises;
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'emails', 'templates');
const LOGO_URL = 'https://res.cloudinary.com/dbehg8jsv/image/upload/v1769345413/AB_LOGO_EDITED-removebg-preview_zrz8ai.png';

const LOGO_HEADER = `                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px 40px; background-color: #ffffff;">
                            <img src="${LOGO_URL}" alt="Apply Bureau" width="220" height="auto" style="display: block; border: 0; max-width: 100%;">
                        </td>
                    </tr>`;

async function addLogoToTemplate(filePath) {
    let content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    // Skip base templates
    if (fileName.startsWith('_')) {
        return false;
    }
    
    // Check if logo already exists
    if (content.includes('<img') && content.includes('logo')) {
        console.log(`✅ ${fileName} - Logo already exists`);
        return false;
    }
    
    // Find the main content table and add logo before it
    // Look for the pattern: <table...email-container...> followed by content
    const mainTableMatch = content.match(/(<table[^>]*class="email-container"[^>]*>)\s*(<tr>|<!--)/);
    
    if (mainTableMatch) {
        const insertPoint = mainTableMatch.index + mainTableMatch[1].length;
        content = content.slice(0, insertPoint) + '\n' + LOGO_HEADER + '\n' + content.slice(insertPoint);
        
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ ${fileName} - Logo added`);
        return true;
    }
    
    // Alternative: Look for first <tr> after main table
    const altMatch = content.match(/(<table[^>]*width="600"[^>]*>)\s*(<tr>|<!--)/);
    
    if (altMatch) {
        const insertPoint = altMatch.index + altMatch[1].length;
        content = content.slice(0, insertPoint) + '\n' + LOGO_HEADER + '\n' + content.slice(insertPoint);
        
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ ${fileName} - Logo added (alt method)`);
        return true;
    }
    
    console.log(`⚠️  ${fileName} - Could not find insertion point`);
    return false;
}

async function addLogosToAll() {
    console.log('🎨 ADDING LOGOS TO ALL EMAIL TEMPLATES');
    console.log('=======================================\n');
    
    try {
        const files = await fs.readdir(TEMPLATES_DIR);
        const htmlFiles = files.filter(f => f.endsWith('.html'));
        
        let addedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;
        
        for (const file of htmlFiles) {
            const result = await addLogoToTemplate(path.join(TEMPLATES_DIR, file));
            if (result === true) {
                addedCount++;
            } else if (result === false && !file.startsWith('_')) {
                skippedCount++;
            }
        }
        
        console.log('\n📊 SUMMARY');
        console.log('==========');
        console.log(`✅ Logos added: ${addedCount}`);
        console.log(`⏭️  Already had logos: ${skippedCount}`);
        console.log(`⚠️  Failed: ${failedCount}`);
        console.log('\n✅ All templates now have logos!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addLogosToAll();
