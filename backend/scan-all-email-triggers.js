const fs = require('fs').promises;
const path = require('path');

async function scanEmailTriggers() {
  console.log('🔍 Scanning All Email Triggers in Codebase...\n');
  console.log('='.repeat(80));
  
  const emailTriggers = new Map();
  const templateFiles = new Set();
  
  // Get all template files
  const templatesDir = path.join(__dirname, 'emails', 'templates');
  const templates = await fs.readdir(templatesDir);
  templates.filter(f => f.endsWith('.html') && !f.startsWith('_')).forEach(t => {
    templateFiles.add(t.replace('.html', ''));
  });
  
  // Directories to scan
  const dirsToScan = [
    'controllers',
    'routes',
    'utils'
  ];
  
  // Scan each directory
  for (const dir of dirsToScan) {
    const dirPath = path.join(__dirname, dir);
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        if (!file.endsWith('.js')) continue;
        
        const filePath = path.join(dirPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Find all sendEmail calls
        const sendEmailRegex = /(?:sendEmail|sendSimpleEmail|sendApplicationUpdateEmail)\s*\(\s*([^,]+),\s*['"`]([^'"`]+)['"`]/g;
        let match;
        
        while ((match = sendEmailRegex.exec(content)) !== null) {
          const recipient = match[1].trim();
          const template = match[2].trim();
          
          if (!emailTriggers.has(template)) {
            emailTriggers.set(template, []);
          }
          
          emailTriggers.get(template).push({
            file: `${dir}/${file}`,
            recipient: recipient,
            line: content.substring(0, match.index).split('\n').length
          });
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not scan ${dir}: ${error.message}`);
    }
  }
  
  // Report findings
  console.log('\n📧 EMAIL TRIGGERS FOUND:\n');
  
  const sortedTemplates = Array.from(emailTriggers.keys()).sort();
  
  for (const template of sortedTemplates) {
    const triggers = emailTriggers.get(template);
    const hasTemplate = templateFiles.has(template);
    
    console.log(`\n${hasTemplate ? '✅' : '❌'} ${template}`);
    console.log(`   Template exists: ${hasTemplate ? 'YES' : 'NO - MISSING!'}`);
    console.log(`   Triggered from ${triggers.length} location(s):`);
    
    triggers.forEach(trigger => {
      console.log(`      - ${trigger.file}:${trigger.line} → ${trigger.recipient}`);
    });
  }
  
  // Check for unused templates
  console.log('\n' + '='.repeat(80));
  console.log('\n📋 UNUSED TEMPLATES (No triggers found):\n');
  
  const usedTemplates = new Set(emailTriggers.keys());
  const unusedTemplates = Array.from(templateFiles).filter(t => !usedTemplates.has(t));
  
  if (unusedTemplates.length > 0) {
    unusedTemplates.forEach(template => {
      console.log(`   ⚠️  ${template}.html - No triggers found`);
    });
  } else {
    console.log('   ✅ All templates have triggers!');
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY:\n');
  console.log(`   Total templates: ${templateFiles.size}`);
  console.log(`   Templates with triggers: ${emailTriggers.size}`);
  console.log(`   Unused templates: ${unusedTemplates.length}`);
  console.log(`   Total trigger locations: ${Array.from(emailTriggers.values()).reduce((sum, arr) => sum + arr.length, 0)}`);
  
  // Check for missing templates
  const missingTemplates = Array.from(emailTriggers.keys()).filter(t => !templateFiles.has(t));
  if (missingTemplates.length > 0) {
    console.log(`\n   ❌ MISSING TEMPLATES (${missingTemplates.length}):`);
    missingTemplates.forEach(t => console.log(`      - ${t}.html`));
  } else {
    console.log(`\n   ✅ All triggered templates exist!`);
  }
  
  console.log('\n' + '='.repeat(80));
}

scanEmailTriggers().catch(console.error);
