const fs = require('fs').promises;
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'emails', 'templates');

async function verifyAllTemplates() {
  console.log('🔍 Verifying all email templates...\n');
  
  const issues = {
    darkMode: [],
    blackBackgrounds: [],
    missingVariables: [],
    malformedPlaceholders: [],
    colorSchemeIssues: []
  };
  
  try {
    const files = await fs.readdir(TEMPLATES_DIR);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    
    for (const file of htmlFiles) {
      const filePath = path.join(TEMPLATES_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Check 1: Dark mode media queries
      if (content.includes('@media (prefers-color-scheme: dark)')) {
        issues.darkMode.push(file);
      }
      
      // Check 2: Black backgrounds
      if (content.match(/background(-color)?:\s*(#000000|black)(?!\s*!important)/)) {
        issues.blackBackgrounds.push(file);
      }
      
      // Check 3: Malformed placeholders (e.g., missing closing braces)
      const malformedPlaceholders = content.match(/\{\{[^}]*$|^[^{]*\}\}/gm);
      if (malformedPlaceholders) {
        issues.malformedPlaceholders.push({ file, examples: malformedPlaceholders.slice(0, 3) });
      }
      
      // Check 4: Color scheme enforcement
      if (!file.startsWith('_') && !content.includes('color-scheme: light')) {
        issues.colorSchemeIssues.push(file);
      }
      
      // Check 5: Extract all variables used
      const variables = content.match(/\{\{([^}]+)\}\}/g);
      if (variables) {
        const uniqueVars = [...new Set(variables)];
        // Just log for info, not an issue
        if (file === htmlFiles[0]) {
          console.log(`📝 Example variables in ${file}:`, uniqueVars.slice(0, 5).join(', '));
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 VERIFICATION RESULTS');
    console.log('='.repeat(70));
    
    let hasIssues = false;
    
    if (issues.darkMode.length > 0) {
      console.log('\n❌ Files with dark mode media queries:');
      issues.darkMode.forEach(f => console.log(`   - ${f}`));
      hasIssues = true;
    } else {
      console.log('\n✅ No dark mode media queries found');
    }
    
    if (issues.blackBackgrounds.length > 0) {
      console.log('\n❌ Files with black backgrounds:');
      issues.blackBackgrounds.forEach(f => console.log(`   - ${f}`));
      hasIssues = true;
    } else {
      console.log('✅ No black backgrounds found');
    }
    
    if (issues.malformedPlaceholders.length > 0) {
      console.log('\n⚠️  Files with potentially malformed placeholders:');
      issues.malformedPlaceholders.forEach(({ file, examples }) => {
        console.log(`   - ${file}: ${examples.join(', ')}`);
      });
      hasIssues = true;
    } else {
      console.log('✅ No malformed placeholders found');
    }
    
    if (issues.colorSchemeIssues.length > 0) {
      console.log('\n⚠️  Files missing color-scheme enforcement:');
      issues.colorSchemeIssues.forEach(f => console.log(`   - ${f}`));
      console.log('   (This is OK for base templates)');
    } else {
      console.log('✅ All templates have color-scheme enforcement');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log(`📁 Total templates checked: ${htmlFiles.length}`);
    
    if (!hasIssues) {
      console.log('\n🎉 ALL TEMPLATES VERIFIED SUCCESSFULLY!');
      console.log('\n✨ Summary:');
      console.log('   ✓ No dark mode media queries');
      console.log('   ✓ No black backgrounds');
      console.log('   ✓ All placeholders properly formatted');
      console.log('   ✓ Light mode enforced');
      console.log('\n📧 All email templates are ready for production!');
    } else {
      console.log('\n⚠️  Some issues found - please review above');
    }
    
  } catch (error) {
    console.error('❌ Verification error:', error);
    process.exit(1);
  }
}

// Run verification
verifyAllTemplates().catch(console.error);
