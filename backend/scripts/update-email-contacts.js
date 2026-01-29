#!/usr/bin/env node

/**
 * Update Email Contact Addresses Script
 * Changes all support@applybureau.com to applybureau@gmail.com in email templates
 */

const fs = require('fs').promises;
const path = require('path');

class EmailContactUpdater {
  constructor() {
    this.templatesDir = path.join(__dirname, '..', 'emails', 'templates');
    this.updatedFiles = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📧',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    }[type] || '📧';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async updateEmailTemplate(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Replace all instances of support@applybureau.com with applybureau@gmail.com
      const updatedContent = content.replace(/support@applybureau\.com/g, 'applybureau@gmail.com');
      
      // Only write if content changed
      if (content !== updatedContent) {
        await fs.writeFile(filePath, updatedContent, 'utf8');
        const fileName = path.basename(filePath);
        this.updatedFiles.push(fileName);
        this.log(`Updated ${fileName}`, 'success');
        return true;
      }
      
      return false;
    } catch (error) {
      const fileName = path.basename(filePath);
      this.errors.push({ file: fileName, error: error.message });
      this.log(`Failed to update ${fileName}: ${error.message}`, 'error');
      return false;
    }
  }

  async updateAllTemplates() {
    try {
      this.log('Reading email templates directory...');
      
      const files = await fs.readdir(this.templatesDir);
      const htmlFiles = files.filter(file => file.endsWith('.html'));
      
      this.log(`Found ${htmlFiles.length} HTML template files`);
      
      let updatedCount = 0;
      
      for (const file of htmlFiles) {
        const filePath = path.join(this.templatesDir, file);
        const wasUpdated = await this.updateEmailTemplate(filePath);
        if (wasUpdated) {
          updatedCount++;
        }
      }
      
      return { total: htmlFiles.length, updated: updatedCount };
    } catch (error) {
      this.log(`Failed to read templates directory: ${error.message}`, 'error');
      throw error;
    }
  }

  async run() {
    try {
      this.log('🚀 Starting email contact address update...');
      this.log('Changing support@applybureau.com → applybureau@gmail.com');
      
      const results = await this.updateAllTemplates();
      
      this.log('\n📊 UPDATE SUMMARY:', 'info');
      this.log(`Total templates: ${results.total}`, 'info');
      this.log(`Updated templates: ${results.updated}`, 'success');
      this.log(`Errors: ${this.errors.length}`, this.errors.length > 0 ? 'error' : 'success');
      
      if (this.updatedFiles.length > 0) {
        this.log('\n✅ UPDATED FILES:', 'success');
        this.updatedFiles.forEach((file, index) => {
          this.log(`${index + 1}. ${file}`, 'success');
        });
      }
      
      if (this.errors.length > 0) {
        this.log('\n❌ ERRORS:', 'error');
        this.errors.forEach((error, index) => {
          this.log(`${index + 1}. ${error.file}: ${error.error}`, 'error');
        });
      }
      
      if (results.updated > 0) {
        this.log('\n🎉 Email contact addresses updated successfully!', 'success');
        this.log('All email templates now use applybureau@gmail.com for contact', 'success');
      } else {
        this.log('\n📝 No updates needed - all templates already use correct contact email', 'info');
      }
      
    } catch (error) {
      this.log(`\n💥 Update failed: ${error.message}`, 'error');
      console.error('Full error:', error);
      process.exit(1);
    }
  }
}

// Run the updater
async function main() {
  const updater = new EmailContactUpdater();
  await updater.run();
}

if (require.main === module) {
  main();
}

module.exports = EmailContactUpdater;