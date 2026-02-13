#!/usr/bin/env node

/**
 * FIX BLACK BACKGROUNDS IN EMAIL TEMPLATES
 * Replaces all background-color: #000000 with background-color: #ffffff
 * This prevents the "black box" problem in email clients
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING BLACK BACKGROUNDS IN EMAIL TEMPLATES');
console.log('===============================================\n');

const templatesDir = path.join(__dirname, 'emails', 'templates');
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.html'));

let totalFixed = 0;
let filesModified = 0;

files.forEach(filename => {
  const filePath = path.join(templatesDir, filename);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Count occurrences before
  const beforeCount = (content.match(/background-color:\s*#000000/gi) || []).length;
  
  if (beforeCount > 0) {
    // Replace all instances of black background with white
    content = content.replace(/background-color:\s*#000000/gi, 'background-color: #ffffff');
    
    // Also fix color: #ffffff to color: #000000 for text visibility
    content = content.replace(/color:\s*#ffffff/gi, 'color: #000000');
    
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`✅ ${filename}: Fixed ${beforeCount} black backgrounds`);
    totalFixed += beforeCount;
    filesModified++;
  }
});

console.log(`\n📊 SUMMARY`);
console.log(`==========`);
console.log(`Files modified: ${filesModified}`);
console.log(`Total fixes: ${totalFixed}`);
console.log(`\n✅ All black backgrounds replaced with white!`);
console.log(`✅ All white text replaced with black for visibility!`);
