#!/usr/bin/env node

/**
 * SEND TEST EMAILS TO APPLYBUREAU@GMAIL.COM
 * Tests all 9 email templates with real email sending
 */

require('dotenv').config();
const { sendEmail } = require('./utils/email');

const TEST_EMAIL = 'applybureau@gmail.com';

console.log('📧 SENDING TEST EMAILS');
console.log('======================\n');
console.log(`Recipient: ${TEST_EMAIL}`);
console.log(`Provider: Resend`);
console.log(`From: Apply Bureau <admin@applybureau.com>\n`);

// Sample data for all templates
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
    data: {
      ...sampleData,
      subject: 'Consultation Confirmed — Apply Bureau'
    }
  },
  {
    name: 'Consultation Rescheduled',
    template: 'consultation_rescheduled',
    data: {
      ...sampleData,
      subject: 'Consultation Time Adjustment — Apply Bureau'
    }
  },
  {
    name: 'Consultation Waitlisted',
    template: 'consultation_waitlisted',
    data: {
      ...sampleData,
      subject: 'Apply Bureau — Next Steps'
    }
  },
  {
    name: 'Payment Confirmed Welcome',
    template: 'payment_received_welcome',
    data: {
      ...sampleData,
      subject: 'Apply Bureau — Payment Confirmed & Next Steps'
    }
  },
  {
    name: 'Onboarding Completed',
    template: 'onboarding_completed',
    data: {
      ...sampleData,
      subject: 'Onboarding complete'
    }
  },
  {
    name: 'Interview Update',
    template: 'interview_update_enhanced',
    data: {
      ...sampleData,
      subject: 'Apply Bureau | Interview Update'
    }
  },
  {
    name: 'Strategy Call Confirmed',
    template: 'strategy_call_confirmed',
    data: {
      ...sampleData,
      subject: 'Strategy Call Confirmed'
    }
  },
  {
    name: 'Meeting Reminder',
    template: 'consultation_reminder',
    data: {
      ...sampleData,
      subject: 'Meeting Reminder'
    }
  },
  {
    name: 'Contact Form Received',
    template: 'contact_form_received',
    data: {
      ...sampleData,
      subject: 'We\'ve received your message — Apply Bureau'
    }
  }
];

async function sendTestEmails() {
  let successCount = 0;
  let failCount = 0;
  
  console.log('📤 Sending test emails...\n');
  
  for (const { name, template, data } of templates) {
    try {
      console.log(`Sending: ${name}...`);
      await sendEmail(TEST_EMAIL, template, data);
      console.log(`✅ ${name} sent successfully\n`);
      successCount++;
      
      // Wait 2 seconds between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
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
  } else {
    console.log('\n⚠️  Some emails failed to send. Check the errors above.');
  }
}

// Run the test
sendTestEmails().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
