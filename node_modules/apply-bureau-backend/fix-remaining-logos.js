#!/usr/bin/env node

/**
 * FIX REMAINING LOGOS
 * Handles templates with different structures
 */

const fs = require('fs').promises;
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'emails', 'templates');
const LOGO_URL = 'https://res.cloudinary.com/dbehg8jsv/image/upload/v1769345413/AB_LOGO_EDITED-removebg-preview_zrz8ai.png';

const failedTemplates = [
    'consultation_reminder.html',
    'contact_form_received.html',
    'interview_update_enhanced.html',
    'new_consultation_request_with_times.html',
    'onboarding_completed.html',
    'payment_received_welcome.html',
    'strategy_call_confirmed.html'
];

async function fixTemplate(fileName) {
    const filePath = path.join(TEMPLATES_DIR, fileName);
    let content = await fs.readFile(filePath, 'utf-8');
    
    // Check if logo already exists
    if (content.includes('<img') && (content.includes('logo') || content.includes('AB_LOGO') || content.includes(LOGO_URL))) {
        console.log(`✅ ${fileName} - Logo already exists`);
        return false;
    }
    
    // Strategy 1: Replace text header with logo
    const textHeaderMatch = content.match(/(<td[^>]*text-align:\s*center[^>]*>)\s*<h1[^>]*>Apply Bureau<\/h1>\s*<\/td>/i);
    if (textHeaderMatch) {
        const replacement = `$1
                            <img src="${LOGO_URL}" alt="Apply Bureau" width="220" height="auto" style="display: block; margin: 0 auto; border: 0; max-width: 100%;">
                        </td>`;
        content = content.replace(textHeaderMatch[0], replacement);
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ ${fileName} - Logo added (replaced text header)`);
        return true;
    }
    
    // Strategy 2: Find first <tr> after main table and insert logo row
    const firstTrMatch = content.match(/(<table[^>]*max-width:\s*600px[^>]*>)\s*(<tr>)/i);
    if (firstTrMatch) {
        const logoRow = `
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px 40px; background-color: #ffffff;">
                            <img src="${LOGO_URL}" alt="Apply Bureau" width="220" height="auto" style="display: block; border: 0; max-width: 100%;">
                        </td>
                    </tr>`;
        const insertPoint = firstTrMatch.index + firstTrMatch[1].length;
        content = content.slice(0, insertPoint) + logoRow + content.slice(insertPoint);
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ ${fileName} - Logo added (before first row)`);
        return true;
    }
    
    // Strategy 3: Find any table with role="presentation" and max-width
    const roleTableMatch = content.match(/(<table[^>]*role="presentation"[^>]*max-width:\s*600px[^>]*>)\s*(<tr>)/i);
    if (roleTableMatch) {
        const logoRow = `
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px 40px; background-color: #ffffff;">
                            <img src="${LOGO_URL}" alt="Apply Bureau" width="220" height="auto" style="display: block; border: 0; max-width: 100%;">
                        </td>
                    </tr>`;
        const insertPoint = roleTableMatch.index + roleTableMatch[1].length;
        content = content.slice(0, insertPoint) + logoRow + content.slice(insertPoint);
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ ${fileName} - Logo added (role=presentation table)`);
        return true;
    }
    
    console.log(`❌ ${fileName} - Could not add logo`);
    return false;
}

async function fixAll() {
    console.log('🔧 FIXING REMAINING LOGOS');
    console.log('=========================\n');
    
    let fixedCount = 0;
    
    for (const fileName of failedTemplates) {
        const result = await fixTemplate(fileName);
        if (result) fixedCount++;
    }
    
    console.log(`\n✅ Fixed ${fixedCount}/${failedTemplates.length} templates`);
}

fixAll();
