// Test all email templates to verify they work correctly
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { sendEmail } = require('./utils/email');

console.log('🧪 TESTING ALL EMAIL TEMPLATES');
console.log('='.repeat(70));
console.log('');

const testEmail = 'applybureau@gmail.com'; // Send all tests to monitoring email

async function testAllEmails() {
  const tests = [
    {
      name: 'Consultation Confirmed',
      template: 'consultation_confirmed',
      data: {
        client_name: 'Israel',
        consultation_date: 'Tuesday, March 12',
        consultation_time: '5:00 PM (EST)',
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        current_year: new Date().getFullYear()
      }
    },
    {
      name: 'Consultation Rescheduled',
      template: 'consultation_rescheduled',
      data: {
        client_name: 'Israel',
        new_date: 'Saturday, March 16',
        new_time: '11:30 AM (EST)',
        current_year: new Date().getFullYear()
      }
    },
    {
      name: 'Consultation Waitlisted',
      template: 'consultation_waitlisted',
      data: {
        client_name: 'Israel',
        current_year: new Date().getFullYear()
      }
    },
    {
      name: 'Payment Confirmed Welcome',
      template: 'payment_confirmed_welcome_concierge',
      data: {
        client_name: 'Israel',
        tier_name: 'Tier 2',
        registration_link: 'https://www.applybureau.com/register?token=test123',
        current_year: new Date().getFullYear()
      }
    },
    {
      name: 'Payment Verified Registration',
      template: 'payment_verified_registration',
      data: {
        client_name: 'Israel',
        tier_name: 'Tier 2',
        registration_link: 'https://www.applybureau.com/register?token=test123',
        current_year: new Date().getFullYear()
      }
    },
    {
      name: 'Onboarding Completed',
      template: 'onboarding_completed_secure',
      data: {
        client_name: 'Israel',
        current_year: new Date().getFullYear()
      }
    },
    {
      name: 'Interview Update',
      template: 'interview_update_enhanced',
      data: {
        client_name: 'Israel',
        role_title: 'Senior Software Engineer',
        company_name: 'TechCorp Inc.',
        current_year: new Date().getFullYear()
      }
    },
    {
      name: 'Strategy Call Confirmed',
      template: 'strategy_call_confirmed',
      data: {
        client_name: 'Israel',
        call_date: 'Tuesday, March 12',
        call_time: '5:00 PM (EST)',
        current_year: new Date().getFullYear()
      }
    },
    {
      name: 'Meeting Reminder',
      template: 'consultation_reminder',
      data: {
        client_name: 'Israel',
        meeting_date: 'Tuesday, March 12',
        meeting_time: '5:00 PM (EST)',
        current_year: new Date().getFullYear()
      }
    },
    {
      name: 'Contact Form Received',
      template: 'contact_form_received',
      data: {
        client_name: 'Israel',
        current_year: new Date().getFullYear()
      }
    }
  ];

  console.log(`Sending ${tests.length} test emails to ${testEmail}...`);
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (const test of tests) {
    try {
      await sendEmail(testEmail, test.template, test.data);
      console.log(`✅ ${test.name}`);
      successCount++;
      
      // Wait 1 second between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      errorCount++;
    }
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('');
  console.log(`✅ Successfully sent: ${successCount} emails`);
  console.log(`❌ Failed: ${errorCount} emails`);
  console.log('');
  console.log('📧 Check your inbox at:', testEmail);
  console.log('');
  console.log('✅ VERIFICATION CHECKLIST:');
  console.log('  1. All emails display correctly (no black backgrounds)');
  console.log('  2. No placeholder data ({{variable}} should be replaced)');
  console.log('  3. Buttons are clickable links');
  console.log('  4. Logo displays correctly');
  console.log('  5. Text is readable (not white on white)');
  console.log('  6. Consultation duration shows "1 hour"');
  console.log('  7. Strategy call duration shows "30 minutes"');
  console.log('');
}

testAllEmails().catch(error => {
  console.error('');
  console.error('❌ TEST ERROR:', error);
  console.error('');
  process.exit(1);
});
