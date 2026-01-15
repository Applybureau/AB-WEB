require('dotenv').config();
const { sendEmail } = require('../utils/email');

const TEST_EMAIL = 'israelloko65@gmail.com';

// All email templates with their required variables
const EMAIL_TEMPLATES = [
  {
    name: 'contact_form_received',
    description: 'Contact Form Confirmation (to client)',
    variables: {
      client_name: 'John Doe',
      subject: 'Service Inquiry',
      message: 'I would like to learn more about your services',
      next_steps: 'We will respond to your inquiry within 24 hours.'
    }
  },
  {
    name: 'new_contact_submission',
    description: 'New Contact Submission (to admin)',
    variables: {
      client_name: 'John Doe',
      client_email: 'john@example.com',
      subject: 'Service Inquiry',
      message: 'I would like to learn more about your services',
      phone: '+1234567890'
    }
  },
  {
    name: 'consultation_request_received',
    description: 'Consultation Request Confirmation (to client)',
    variables: {
      client_name: 'John Doe',
      preferred_slots: '1. Friday, Jan 19 at 2:00 PM\n2. Saturday, Jan 20 at 3:00 PM\n3. Sunday, Jan 21 at 4:00 PM',
      next_steps: 'Our team will review your request and confirm your consultation within 24 hours.'
    }
  },
  {
    name: 'new_consultation_request',
    description: 'New Consultation Request (to admin)',
    variables: {
      client_name: 'John Doe',
      client_email: 'john@example.com',
      client_phone: '+1234567890',
      message: 'Interested in career services',
      preferred_slots: '1. Friday, Jan 19 at 2:00 PM\n2. Saturday, Jan 20 at 3:00 PM\n3. Sunday, Jan 21 at 4:00 PM'
    }
  },
  {
    name: 'consultation_confirmed_concierge',
    description: 'Consultation Confirmed (to client)',
    variables: {
      client_name: 'John Doe',
      confirmed_date: 'Friday, January 19, 2026',
      confirmed_time: '2:00 PM EST',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      meeting_details: 'Looking forward to discussing your career goals!',
      calendar_link: 'https://calendar.google.com/calendar/event?action=TEMPLATE'
    }
  },
  {
    name: 'payment_confirmed_welcome_concierge',
    description: 'Payment Confirmed + Registration Link (to client)',
    variables: {
      client_name: 'John Doe',
      payment_amount: '$2,500',
      payment_method: 'Interac e-Transfer',
      payment_reference: 'Transfer #12345',
      registration_link: 'https://yourfrontend.com/register?token=abc123',
      registration_expiry: '7 days',
      next_steps: 'Click the registration link above to create your account and begin onboarding.'
    }
  },
  {
    name: 'signup_invite',
    description: 'Registration Invitation (to client)',
    variables: {
      client_name: 'John Doe',
      registration_link: 'https://yourfrontend.com/complete-registration?token=abc123'
    }
  },
  {
    name: 'client_welcome',
    description: 'Welcome Email (to new client)',
    variables: {
      client_name: 'John Doe',
      dashboard_link: 'https://yourfrontend.com/dashboard',
      next_steps: 'Complete your 20-question onboarding to unlock your dashboard.'
    }
  },
  {
    name: 'profile_under_review',
    description: 'Onboarding Under Review (to client)',
    variables: {
      client_name: 'John Doe',
      submission_date: 'January 15, 2026',
      review_timeline: '1-2 business days',
      next_steps: 'We are reviewing your onboarding information. You will be notified once approved.'
    }
  },
  {
    name: 'profile_unlocked',
    description: 'Profile Unlocked (to client)',
    variables: {
      client_name: 'John Doe',
      dashboard_link: 'https://yourfrontend.com/dashboard',
      next_steps: 'Your dashboard is now fully accessible. Applications will begin within 3 business days.',
      approved_by: 'Admin Team',
      approved_date: 'January 15, 2026'
    }
  },
  {
    name: 'onboarding_completed',
    description: 'Onboarding Completed (to client)',
    variables: {
      client_name: 'John Doe',
      completion_date: 'January 15, 2026',
      next_steps: 'Your profile is under review. You will be notified once approved.'
    }
  },
  {
    name: 'application_status_update',
    description: 'Application Status Update (to client)',
    variables: {
      client_name: 'John Doe',
      company_name: 'Tech Corp',
      job_title: 'Senior Software Engineer',
      old_status: 'Applied',
      new_status: 'Interview Requested',
      status_message: 'Great news! The company has requested an interview.',
      dashboard_link: 'https://yourfrontend.com/dashboard'
    }
  },
  {
    name: 'interview_update_enhanced',
    description: 'Interview Alert (to client)',
    variables: {
      client_name: 'John Doe',
      company_name: 'Tech Corp',
      job_title: 'Senior Software Engineer',
      interview_date: 'January 20, 2026',
      interview_time: '2:00 PM EST',
      interview_type: 'Technical Interview',
      interview_details: 'First round technical interview with the engineering team.',
      preparation_tips: 'Review your resume and prepare examples of your past projects.',
      dashboard_link: 'https://yourfrontend.com/dashboard'
    }
  },
  {
    name: 'strategy_call_requested',
    description: 'Strategy Call Requested (to admin)',
    variables: {
      client_name: 'John Doe',
      client_email: 'john@example.com',
      preferred_slots: '1. Friday, Jan 19 at 2:00 PM\n2. Saturday, Jan 20 at 3:00 PM\n3. Sunday, Jan 21 at 4:00 PM',
      message: 'Looking forward to discussing my career strategy'
    }
  },
  {
    name: 'strategy_call_confirmed',
    description: 'Strategy Call Confirmed (to client)',
    variables: {
      client_name: 'John Doe',
      confirmed_date: 'Friday, January 19, 2026',
      confirmed_time: '2:00 PM EST',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      meeting_details: 'We will discuss your career goals and application strategy.'
    }
  },
  {
    name: 'consultation_reminder',
    description: 'Consultation Reminder (to client)',
    variables: {
      client_name: 'John Doe',
      consultation_date: 'Friday, January 19, 2026',
      consultation_time: '2:00 PM EST',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      hours_until: '24'
    }
  },
  {
    name: 'onboarding_reminder',
    description: 'Onboarding Reminder (to client)',
    variables: {
      client_name: 'John Doe',
      days_since_registration: '3',
      onboarding_link: 'https://yourfrontend.com/onboarding',
      next_steps: 'Complete your 20-question onboarding to unlock your dashboard.'
    }
  },
  {
    name: 'meeting_scheduled',
    description: 'Meeting Scheduled (to client)',
    variables: {
      client_name: 'John Doe',
      meeting_type: 'Strategy Call',
      meeting_date: 'Friday, January 19, 2026',
      meeting_time: '2:00 PM EST',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      meeting_details: 'Career strategy discussion'
    }
  },
  {
    name: 'admin_welcome',
    description: 'Admin Welcome (to new admin)',
    variables: {
      admin_name: 'Admin User',
      admin_email: 'admin@applybureau.com',
      temporary_password: 'TempPass123!',
      admin_dashboard_link: 'https://yourfrontend.com/admin/dashboard',
      role: 'Super Admin'
    }
  }
];

async function testAllEmails() {
  console.log('📧 Testing All Email Templates\n');
  console.log(`Sending all test emails to: ${TEST_EMAIL}\n`);
  console.log('='.repeat(70));
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  for (let i = 0; i < EMAIL_TEMPLATES.length; i++) {
    const template = EMAIL_TEMPLATES[i];
    const testNumber = i + 1;
    
    console.log(`\n${testNumber}/${EMAIL_TEMPLATES.length}. Testing: ${template.name}`);
    console.log(`   Description: ${template.description}`);
    
    try {
      await sendEmail(TEST_EMAIL, template.name, template.variables);
      console.log(`   ✅ SUCCESS - Email sent`);
      results.passed++;
      results.tests.push({
        name: template.name,
        description: template.description,
        status: 'passed'
      });
      
      // Wait 2 seconds between emails to avoid rate limiting
      if (i < EMAIL_TEMPLATES.length - 1) {
        console.log(`   ⏳ Waiting 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.log(`   ❌ FAILED - ${error.message}`);
      results.failed++;
      results.tests.push({
        name: template.name,
        description: template.description,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 EMAIL TESTING SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Templates Tested: ${EMAIL_TEMPLATES.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${Math.round((results.passed / EMAIL_TEMPLATES.length) * 100)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Templates:');
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => {
        console.log(`   - ${t.name}: ${t.error}`);
      });
  }
  
  console.log('\n📬 Check your inbox at:', TEST_EMAIL);
  console.log('   All test emails should arrive within a few minutes.');
  console.log('   Check spam folder if emails are not in inbox.');
  
  if (results.passed === EMAIL_TEMPLATES.length) {
    console.log('\n🎉 ALL EMAIL TEMPLATES WORKING PERFECTLY!');
  } else {
    console.log('\n⚠️ Some email templates failed. Review errors above.');
  }
  
  console.log('\n' + '='.repeat(70));
}

// Run the test
console.log('🚀 Starting Email Template Testing...\n');
console.log('Environment Check:');
console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
console.log(`   EMAIL_TESTING_MODE: ${process.env.EMAIL_TESTING_MODE || 'false'}`);
console.log('');

if (!process.env.RESEND_API_KEY) {
  console.error('❌ ERROR: RESEND_API_KEY not found in environment variables');
  console.error('   Please set RESEND_API_KEY in your .env file');
  process.exit(1);
}

testAllEmails()
  .then(() => {
    console.log('\n✅ Email testing completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Email testing failed:', error);
    process.exit(1);
  });
