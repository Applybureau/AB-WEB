#!/usr/bin/env node

/**
 * FINAL LOGO VERIFICATION
 * Verifies all 40 email templates have the correct Cloudinary logo
 */

const fs = require('fs').promises;
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'emails', 'templates');
const CORRECT_LOGO_URL = 'https://res.cloudinary.com/dbehg8jsv/image/upload/v1769345413/AB_LOGO_EDITED-removebg-preview_zrz8ai.png';

async function verifyTemplate(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    // Skip base templates
    if (fileName.startsWith('_')) {
        return { fileName, status: 'skipped', reason: 'Base template' };
    }
    
    // Check if template has the correct logo
    if (content.includes(CORRECT_LOGO_URL)) {
        return { fileName, status: 'ok', hasLogo: true };
    }
    
    // Check if template has any image
    if (content.includes('<img')) {
        return { fileName, status: 'wrong_logo', hasLogo: true };
    }
    
    return { fileName, status: 'no_logo', hasLogo: false };
}

async function verifyAll() {
    console.log('🔍 FINAL LOGO VERIFICATION');
    console.log('===========================\n');
    console.log(`Correct Logo URL: ${CORRECT_LOGO_URL}\n`);
    
    try {
        const files = await fs.readdir(TEMPLATES_DIR);
        const htmlFiles = files.filter(f => f.endsWith('.html'));
        
        const results = {
            ok: [],
            wrong_logo: [],
            no_logo: [],
            skipped: []
        };
        
        for (const file of htmlFiles) {
            const result = await verifyTemplate(path.join(TEMPLATES_DIR, file));
            results[result.status].push(result.fileName);
            
            if (result.status === 'ok') {
                console.log(`✅ ${result.fileName}`);
            } else if (result.status === 'wrong_logo') {
                console.log(`⚠️  ${result.fileName} - Has image but wrong URL`);
            } else if (result.status === 'no_logo') {
                console.log(`❌ ${result.fileName} - No logo found`);
            }
        }
        
        console.log('\n📊 SUMMARY');
        console.log('==========');
        console.log(`✅ Correct logo: ${results.ok.length}`);
        console.log(`⚠️  Wrong logo URL: ${results.wrong_logo.length}`);
        console.log(`❌ No logo: ${results.no_logo.length}`);
        console.log(`⏭️  Skipped (base templates): ${results.skipped.length}`);
        console.log(`\nTotal templates checked: ${results.ok.length + results.wrong_logo.length + results.no_logo.length}`);
        
        if (results.wrong_logo.length > 0) {
            console.log('\n⚠️  Templates with wrong logo URL:');
            results.wrong_logo.forEach(f => console.log(`   - ${f}`));
        }
        
        if (results.no_logo.length > 0) {
            console.log('\n❌ Templates missing logo:');
            results.no_logo.forEach(f => console.log(`   - ${f}`));
        }
        
        if (results.ok.length === 38) {
            console.log('\n🎉 SUCCESS! All 38 templates have the correct logo!');
        } else {
            console.log(`\n⚠️  Only ${results.ok.length}/38 templates have the correct logo`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verifyAll();
