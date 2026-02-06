#!/usr/bin/env node

/**
 * Update Frontend URL to Production
 * Update all references from Vercel URL to production URL
 */

const fs = require('fs');
const path = require('path');

const OLD_URL = 'https://apply-bureau.vercel.app';
const NEW_URL = 'https://www.applybureau.com';

const filesToUpdate = [
  // Test files
  'test-dashboard-endpoints-final.js',
  'send-test-emails.js',
  'test-all-email-templates.js',
  'test-application-email-fix.js',
  'debug-template-processing.js',
  'get-israel-password.js',
  'create-simple-onboarding.js',
  'create-client-user.js',
  'debug-login-issue.js',
  'direct-schema-fix.js',
  'final-dashboard-fix.js',
  'fix-dashboard-access.js',
  'fix-specific-schema-issues.js',
  'fix-user-id-mismatch.js',
  'apply-corrected-schema.js',
  'comprehensive-fix-all-errors.js',
  'test-all-fixes-comprehensive.js',
  
  // Documentation files
  'COMPREHENSIVE_EMAIL_TEST_RESULTS.md',
  'FRONTEND_BACKEND_URLS.md',
  'NEW_FRONTEND_URL_SETUP_COMPLETE.md',
  'PRODUCTION_DEPLOYMENT_CHECKLIST.md',
  'PRODUCTION_READY_SUMMARY.md',
  
  // Script files
  'scripts/create-production-admin.js'
];

async function updateFrontendUrls() {
  console.log('🔄 UPDATING FRONTEND URLs TO PRODUCTION\n');
  console.log(`📝 Changing: ${OLD_URL}`);
  console.log(`📝 To: ${NEW_URL}\n`);

  let updatedFiles = 0;
  let totalReplacements = 0;

  for (const fileName of filesToUpdate) {
    const filePath = path.join(__dirname, fileName);
    
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const updatedContent = content.replace(new RegExp(OLD_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_URL);
        
        if (content !== updatedContent) {
          fs.writeFileSync(filePath, updatedContent);
          const replacements = (content.match(new RegExp(OLD_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
          console.log(`✅ Updated ${fileName} (${replacements} replacements)`);
          updatedFiles++;
          totalReplacements += replacements;
        } else {
          console.log(`⏭️  Skipped ${fileName} (no changes needed)`);
        }
      } else {
        console.log(`⚠️  File not found: ${fileName}`);
      }
    } catch (error) {
      console.log(`❌ Error updating ${fileName}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎯 FRONTEND URL UPDATE COMPLETED');
  console.log('='.repeat(50));
  console.log(`📊 Files updated: ${updatedFiles}`);
  console.log(`📊 Total replacements: ${totalReplacements}`);
  
  console.log('\n🌐 NEW PRODUCTION URLS:');
  console.log(`   Frontend: ${NEW_URL}`);
  console.log(`   Login: ${NEW_URL}/login`);
  console.log(`   Dashboard: ${NEW_URL}/dashboard`);
  console.log(`   Admin: ${NEW_URL}/admin/login`);
  
  console.log('\n✅ All references now point to production domain!');
  
  return { success: true, updatedFiles, totalReplacements };
}

// Run if called directly
if (require.main === module) {
  updateFrontendUrls()
    .then(result => {
      console.log('\n🎉 Frontend URL update completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Frontend URL update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateFrontendUrls };