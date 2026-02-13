#!/usr/bin/env node

/**
 * FIX DOUBLE LOGOS AND $1 ISSUES
 * 1. Remove duplicate logo sections
 * 2. Fix $1 text that appears from regex replacements
 */

const fs = require('fs').promises;
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'emails', 'templates');
const LOGO_URL = 'https://res.cloudinary.com/dbehg8jsv/image/upload/v1769345413/AB_LOGO_EDITED-removebg-preview_zrz8ai.png';

async function fixTemplate(filePath) {
    let content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    // Skip base templates
    if (fileName.startsWith('_')) {
        return { fileName, fixed: false, issues: [] };
    }
    
    const issues = [];
    let fixed = false;
    
    // 1. Fix $1 appearing in content (from bad regex replacements)
    if (content.includes('$1')) {
        content = content.replace(/\$1/g, '');
        issues.push('Removed $1 artifacts');
        fixed = true;
    }
    
    // 2. Count logo occurrences
    const logoMatches = content.match(new RegExp(LOGO_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
    const logoCount = logoMatches ? logoMatches.length : 0;
    
    if (logoCount > 1) {
        // Find all logo sections
        const logoSectionRegex = /<tr>\s*<td[^>]*>\s*<img[^>]*cloudinary[^>]*>\s*<\/td>\s*<\/tr>/gi;
        const sections = content.match(logoSectionRegex);
        
        if (sections && sections.length > 1) {
            // Keep only the first logo section, remove the rest
            let firstLogoFound = false;
            content = content.replace(logoSectionRegex, (match) => {
                if (!firstLogoFound) {
                    firstLogoFound = true;
                    return match; // Keep first occurrence
                }
                return ''; // Remove duplicates
            });
            
            issues.push(`Removed ${sections.length - 1} duplicate logo(s)`);
            fixed = true;
        }
    }
    
    if (fixed) {
        await fs.writeFile(filePath, content, 'utf-8');
    }
    
    return { fileName, fixed, issues, logoCount };
}

async function fixAll() {
    console.log('🔧 FIXING DOUBLE LOGOS AND $1 ISSUES');
    console.log('=====================================\n');
    
    try {
        const files = await fs.readdir(TEMPLATES_DIR);
        const htmlFiles = files.filter(f => f.endsWith('.html'));
        
        let fixedCount = 0;
        const results = [];
        
        for (const file of htmlFiles) {
            const result = await fixTemplate(path.join(TEMPLATES_DIR, file));
            if (result.fixed) {
                console.log(`✅ ${result.fileName}`);
                result.issues.forEach(issue => console.log(`   - ${issue}`));
                fixedCount++;
            } else if (!result.fileName.startsWith('_')) {
                console.log(`✓  ${result.fileName} - No issues`);
            }
            results.push(result);
        }
        
        console.log('\n📊 SUMMARY');
        console.log('==========');
        console.log(`Fixed: ${fixedCount} templates`);
        console.log(`No issues: ${results.filter(r => !r.fixed && !r.fileName.startsWith('_')).length} templates`);
        
        if (fixedCount > 0) {
            console.log('\n✅ All issues fixed!');
        } else {
            console.log('\n✅ No issues found!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixAll();
