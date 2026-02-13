#!/usr/bin/env node

/**
 * SEND TEST EMAILS TO APPLYBUREAU@GMAIL.COM
 * Uses Resend's verified test domain for testing
 */

require('dotenv').config();
const { Resend } = require('resend');
const fs = require('fs').promises;
const path = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);
const TEST_EMAIL = 'applybureau@gmail.com';

console.log('📧 SENDING TEST EMAILS');
console.log('======================\n');
console.log(`Recipient: ${TEST_EMAIL}`);
console.log(`Provider: Resend`);
console.log(`From: Apply Bureau <onboarding@resend.dev> (Test Domain)\n`);
console.log('⚠️  NOTE: Using Resend test domain. To use admin@applybureau.com,');
console.log('   verify your domain at https://resend.com/domains\n');

// Load logo
async function loadLogo() {
  try {
    const logoPath = path.join(__dirname, '..', 'logo.png');
    const logoBuffer = await fs.readFile(logoPath);
    return logoBuffer.toString('base64');
  } catch (error) {
    return null;
  }
}

// Load template
async function loadTemplate(templateName) {
  const templatePath = path.join(__dirname, 'emails', 'templates', `${templateName}.html`);
  return await fs.readFile(templatePath, 'utf-8');
}

// Process template
function processTemplate(template, data, logoBase64) {
  let processed = template;
  
  // Replace logo
  if (logoBase64) {
    processed = processed.replace(
      /src="[^"]*logo\.png[^"]*"/g,
      `src="data:image/png;base64,${logoBase64}"`
    );
  }
  
  // Replace all variables
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    processed = processed.replace(regex, data[key] || '');
  });
  
  return processed;
}

// Sample data
const sampleData = {
  client_name: 'Israel Loko',
  consultation_date: 'Tuesday, March 12, 2026',
  consultation_time: '5:00 PM (EST)',
  consultation_duration: '30–45 minutes',
  meeting_link: 'https://meet.google.com/abc-defg-hij',
  new_date: 'Saturday, March 16, 2026',
  new_time: '11:30 AM (EST)',
  tier: 'Tier 2',
  dashboard_url: 'https://www.applybureau.com/dashboard',
  role_title: 'Senior Software Engineer',
  company_name: 'TechCorp Inc.',
  call_date: 'Tuesday, March 12, 2026',
  call_time: '5:00 PM (EST)',
  call_duration: '30 minutes',
  meeting_date: 'Tuesday, March 12, 2026',
  meeting_time: '5:00 PM (EST)',
  current_year: new Date().getFullYear()
};

const templates = [
  {
    name: 'Consultation Confirmed',
    template: 'consultation_confirmed',
    subject: 'Consultation Confirmed — Apply Bureau',
    data: sampleData
  },
  {
    name: 'Consultation Rescheduled',
    template: 'consultation_rescheduled',
    subject: 'Consultation Time Adjustment — Apply Bureau',
    data: sampleData
  },
  {
    name: 'Consultation Waitlisted',
    template: 'consultation_waitlisted',
    subject: 'Apply Bureau — Next Steps',
    data: sampleData
  },
  {
    name: 'Payment Confirmed Welcome',
    template: 'payment_received_welcome',
    subject: 'Apply Bureau — Payment Confirmed & Next Steps',
    data: sampleData
  },
  {
    name: 'Onboarding Completed',
    template: 'onboarding_completed',
    subject: 'Onboarding complete',
    data: sampleData
  },
  {
    name: 'Interview Update',
    template: 'interview_update_enhanced',
    subject: 'Apply Bureau | Interview Update',
    data: sampleData
  },
  {
    name: 'Strategy Call Confirmed',
    template: 'strategy_call_confirmed',
    subject: 'Strategy Call Confirmed',
    data: sampleData
  },
  {
    name: 'Meeting Reminder',
    template: 'consultation_reminder',
    subject: 'Meeting Reminder',
    data: sampleData
  },
  {
    name: 'Contact Form Received',
    template: 'contact_form_received',
    subject: 'We\'ve received your message — Apply Bureau',
    data: sampleData
  }
];

async function sendTestEmails() {
  let successCount = 0;
  let failCount = 0;
  
  console.log('📤 Sending test emails...\n');
  
  // Load logo once
  const logoBase64 = await loadLogo();
  if (logoBase64) {
    console.log('✅ Logo loaded successfully\n');
  } else {
    console.log('⚠️  Logo not found, using fallback\n');
  }
  
  for (const { name, template, subject, data } of templates) {
    try {
      console.log(`Sending: ${name}...`);
      
      // Load and process template
      const templateHtml = await loadTemplate(template);
      const processedHtml = processTemplate(templateHtml, data, logoBase64);
      
      // Send email using Resend test domain
      await resend.emails.send({
        from: 'Apply Bureau <onboarding@resend.dev>',
        to: TEST_EMAIL,
        subject: subject,
        html: processedHtml
      });
      
      console.log(`✅ ${name} sent successfully\n`);
      successCount++;
      
      // Wait 3 seconds between emails to avoid rate limiting (2 req/sec limit)
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.log(`❌ ${name} failed: ${error.message}\n`);
      failCount++;
    }
  }
  
  console.log('\n📊 SUMMARY');
  console.log('═'.repeat(50));
  console.log(`✅ Successfully sent: ${successCount}/${templates.length}`);
  console.log(`❌ Failed: ${failCount}/${templates.length}`);
  
  if (successCount === templates.length) {
    console.log('\n🎉 All test emails sent successfully!');
    console.log(`\n📬 Check ${TEST_EMAIL} inbox for:`);
    console.log('   1. All 9 email templates');
    console.log('   2. White backgrounds (no black boxes)');
    console.log('   3. Proper formatting on mobile');
    console.log('   4. Dark mode prevention working');
    console.log('   5. All variables populated correctly');
    console.log('\n⚠️  NEXT STEP: Verify applybureau.com domain in Resend');
    console.log('   Visit: https://resend.com/domains');
  } else {
    console.log('\n⚠️  Some emails failed to send. Check the errors above.');
  }
}

// Run the test
sendTestEmails().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
