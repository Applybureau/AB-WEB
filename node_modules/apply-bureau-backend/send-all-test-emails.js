#!/usr/bin/env node

/**
 * SEND ALL TEST EMAILS
 * Sends all 9 email templates to applybureau@gmail.com for testing
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sendEmail } = require('./utils/email');

const TEST_EMAIL = 'applybureau@gmail.com';

console.log('📧 SENDING ALL TEST EMAILS');
console.log('==========================\n');
console.log(`Recipient: ${TEST_EMAIL}\n`);

// Sample data for each email template
const emailTests = [
  {
    name: '1. Consultation Confirmed',
    template: 'consultation_confirmed',
    data: {
      client_name: 'Israel Loko',
      consultation_date: 'Tuesday, March 12, 2026',
      consultation_time: '5:00 PM (EST)',
      consultation_duration: '30–45 minutes',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      current_year: new Date().getFullYear()
    }
  },
  {
    name: '2. Consultation Rescheduled',
    template: 'consultation_rescheduled',
    data: {
      client_name: 'Israel Loko',
      new_date: 'Saturday, March 16, 2026',
      new_time: '11:30 AM (EST)',
      current_year: new Date().getFullYear()
    }
  },
  {
    name: '3. Consultation Waitlisted',
    template: 'consultation_waitlisted',
    data: {
      client_name: 'Israel Loko',
      current_year: new Date().getFullYear()
    }
  },
  {
    name: '4. Payment Confirmed Welcome',
    template: 'payment_received_welcome',
    data: {
      client_name: 'Israel Loko',
      tier: 'Tier 2 - Premium Package',
      dashboard_url: 'https://www.applybureau.com/dashboard',
      current_year: new Date().getFullYear()
    }
  },
  {
    name: '5. Onboarding Completed',
    template: 'onboarding_completed',
    data: {
      client_name: 'Israel Loko',
      current_year: new Date().getFullYear()
    }
  },
  {
    name: '6. Interview Update',
    template: 'interview_update_enhanced',
    data: {
      client_name: 'Israel Loko',
      role_title: 'Senior Software Engineer',
      company_name: 'TechCorp Inc.',
      current_year: new Date().getFullYear()
    }
  },
  {
    name: '7. Strategy Call Confirmed',
    template: 'strategy_call_confirmed',
    data: {
      client_name: 'Israel Loko',
      call_date: 'Tuesday, March 12, 2026',
      call_time: '5:00 PM (EST)',
      call_duration: '30 minutes',
      current_year: new Date().getFullYear()
    }
  },
  {
    name: '8. Meeting Reminder',
    template: 'consultation_reminder',
    data: {
      client_name: 'Israel Loko',
      meeting_date: 'Tuesday, March 12, 2026',
      meeting_time: '5:00 PM (EST)',
      current_year: new Date().getFullYear()
    }
  },
  {
    name: '9. Contact Form Received',
    template: 'contact_form_received',
    data: {
      client_name: 'Israel Loko',
      current_year: new Date().getFullYear()
    }
  }
];

async function sendAllEmails() {
  let successCount = 0;
  let failCount = 0;
  
  for (const test of emailTests) {
    try {
      console.log(`📤 Sending: ${test.name}...`);
      
      await sendEmail(TEST_EMAIL, test.template, test.data);
      
      console.log(`✅ Sent: ${test.name}\n`);
      successCount++;
      
      // Wait 3 seconds between emails to avoid rate limiting (Resend limit: 2 req/sec)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.log(`❌ Failed: ${test.name}`);
      console.log(`   Error: ${error.message}\n`);
      failCount++;
    }
  }
  
  console.log('\n📊 SUMMARY');
  console.log('═'.repeat(50));
  console.log(`✅ Successfully sent: ${successCount} emails`);
  console.log(`❌ Failed: ${failCount} emails`);
  console.log(`📬 Recipient: ${TEST_EMAIL}`);
  
  if (successCount > 0) {
    console.log('\n🎉 Test emails sent successfully!');
    console.log('\n📝 What to check in your inbox:');
    console.log('   1. All emails display in WHITE mode (even in dark mode)');
    console.log('   2. No color inversion or black backgrounds');
    console.log('   3. Mobile spacing looks good (not too much space)');
    console.log('   4. All variables are filled in (no {{placeholders}})');
    console.log('   5. Logo displays correctly');
    console.log('   6. Links work properly');
    console.log('   7. Text is readable and properly formatted');
  }
  
  if (failCount > 0) {
    console.log('\n⚠️  Some emails failed to send. Check the errors above.');
  }
}

// Run the test
sendAllEmails().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
