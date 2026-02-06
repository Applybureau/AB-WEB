// Load environment variables
require('dotenv').config();

const { replaceTemplateVariables, getEmailTemplate } = require('./utils/email');

async function debugTemplateProcessing() {
  console.log('🔍 Debugging Template Processing\n');
  
  try {
    const testVariables = {
      client_name: 'Emma Thompson',
      company_name: 'Tech Innovations Inc.',
      position_title: 'Senior Software Engineer',
      application_status: 'interview',
      message: 'Great news! Your application has progressed to the interview stage.',
      next_steps: 'Please prepare for a technical interview scheduled for next week.',
      dashboard_url: 'https://www.applybureau.com/dashboard',
      current_year: 2026,
      subject: 'Interview Scheduled - Application Update'
    };
    
    // Get the template
    const template = await getEmailTemplate('application_update');
    
    // Process it
    const processedContent = replaceTemplateVariables(template, testVariables);
    
    // Find any remaining unprocessed variables
    const unprocessedMatches = processedContent.match(/\{\{\w+\}\}/g);
    
    if (unprocessedMatches) {
      console.log('❌ Found unprocessed variables:');
      unprocessedMatches.forEach(match => {
        console.log(`   - ${match}`);
      });
      
      // Show context around each unprocessed variable
      unprocessedMatches.forEach(match => {
        const index = processedContent.indexOf(match);
        const start = Math.max(0, index - 50);
        const end = Math.min(processedContent.length, index + match.length + 50);
        const context = processedContent.substring(start, end);
        console.log(`\nContext for ${match}:`);
        console.log(`"${context}"`);
      });
    } else {
      console.log('✅ No unprocessed variables found');
    }
    
    // Also check for any remaining conditionals
    const conditionalMatches = processedContent.match(/\{\{#if|\{\{\/if\}\}|\{\{else\}\}/g);
    
    if (conditionalMatches) {
      console.log('\n❌ Found unprocessed conditionals:');
      conditionalMatches.forEach(match => {
        console.log(`   - ${match}`);
      });
    } else {
      console.log('\n✅ No unprocessed conditionals found');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugTemplateProcessing();