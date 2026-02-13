require('dotenv').config();
const { sendEmail } = require('./utils/email');
const fs = require('fs').promises;
const path = require('path');

/**
 * Send all email templates to applybureau@gmail.com for monitoring
 * This will help identify any remaining placeholder issues
 */

async function getAllEmailTemplates() {
  const templatesDir = path.join(__dirname, 'emails', 'templates');
  const files = await fs.readdir(templatesDir);
  
  // Filter for HTML templates, exclude base templates
  return files
    .filter(f => f.endsWith('.html') && !f.startsWith('_'))
    .map(f => f.replace('.html', ''));
}

async function testAllEmails() {
  console.log('📧 TESTING ALL EMAIL TEMPLATES');
  console.log('Sending to: applybureau@gmail.com');
  console.log('=' .repeat(60));
  console.log('');

  const templates = await getAllEmailTemplates();
  console.log(`Found ${templates.length} email templates\n`);

  const results = {
    success: [],
    failed: []
  };

  for (const templateName of templates) {
    try {
      console.log(`📤 Sending: ${templateName}`);
      
      // Create comprehensive test data that covers all possible variables
      const testData = {
        // Client info
        client_name: 'Test Client Name',
        client_email: 'testclient@example.com',
        full_name: 'Test Full Name',
        
        // Admin info
        admin_name: 'Test Admin',
        admin_email: 'admin@applybureau.com',
        
        // Links
        registration_link: 'https://applybureau.com/register?token=test123',
        dashboard_url: 'https://applybureau.com/dashboard',
        dashboard_link: 'https://applybureau.com/dashboard',
        meeting_link: 'https://meet.google.com/test-meeting',
        action_url: 'https://applybureau.com/action',
        
        // Dates and times
        confirmed_date: '2026-03-15',
        confirmed_time: '14:00',
        call_date: 'March 15, 2026',
        call_time: '2:00 PM EST',
        call_duration: '1 hour',
        booking_date: 'March 15, 2026',
        booking_time: '2:00 PM',
        interview_date: 'March 20, 2026',
        interview_time: '3:00 PM',
        
        // Application info
        company_name: 'Test Company Inc.',
        position_title: 'Senior Software Engineer',
        application_status: 'interview',
        job_title: 'Software Engineer',
        
        // Communication
        communication_method: 'meeting_link',
        whatsapp_number: '+1234567890',
        message: 'This is a test message for the email template.',
        notes: 'Additional notes for testing.',
        admin_notes: 'Admin notes for testing.',
        next_steps: 'Please review and respond within 24 hours.',
        
        // Status
        status: 'confirmed',
        reason: 'Testing purposes',
        
        // Misc
        token_expiry: '7 days',
        current_year: new Date().getFullYear(),
        phone: '+1234567890',
        email: 'test@example.com',
        
        // Consultation specific
        preferred_date: 'March 15, 2026',
        preferred_time: '2:00 PM',
        consultation_type: 'Strategy Call',
        
        // Payment
        amount: '$299.00',
        payment_method: 'Credit Card',
        
        // User ID for security
        user_id: 'test-user-123',
        client_id: 'test-client-123'
      };

      await sendEmail('applybureau@gmail.com', templateName, testData);
      
      results.success.push(templateName);
      console.log(`   ✅ SUCCESS\n`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      results.failed.push({ template: templateName, error: error.message });
      console.log(`   ❌ FAILED: ${error.message}\n`);
    }
  }

  console.log('');
  console.log('=' .repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Successful: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('');

  if (results.success.length > 0) {
    console.log('✅ Successfully sent templates:');
    results.success.forEach(t => console.log(`   • ${t}`));
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('❌ Failed templates:');
    results.failed.forEach(f => console.log(`   • ${f.template}: ${f.error}`));
    console.log('');
  }

  console.log('📧 All emails sent to: applybureau@gmail.com');
  console.log('🔍 Check inbox for placeholder issues');
  console.log('');
  console.log('✨ Test complete!');
}

// Run the test
testAllEmails().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
