require('dotenv').config();
const { sendEmail } = require('../utils/email');

const TEST_EMAIL = 'israelloko65@gmail.com';

// Delay between emails to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const emailTests = [
  // 1. Admin Account Management Emails
  {
    name: 'Admin Welcome',
    template: 'admin_welcome',
    variables: {
      admin_name: 'Test Admin',
      admin_email: 'admin@applybureau.com',
      temporary_password: 'TempPass123!',
      login_link: 'https://apply-bureau-backend.vercel.app/admin/login'
    }
  },
  {
    name: 'Admin Password Reset',
    template: 'admin_password_reset',
    variables: {
      admin_name: 'Test Admin',
      reset_link: 'https://apply-bureau-backend.vercel.app/reset-password?token=test123',
      expiry_time: '1 hour'
    }
  },
  {
    name: 'Admin Account Suspended',
    template: 'admin_account_suspended',
    variables: {
      admin_name: 'Test Admin',
      suspension_reason: 'Security review',
      contact_email: 'support@applybureau.com'
    }
  },
  {
    name: 'Admin Account Reactivated',
    template: 'admin_account_reactivated',
    variables: {
      admin_name: 'Test Admin',
      reactivation_date: new Date().toLocaleDateString(),
      login_link: 'https://apply-bureau-backend.vercel.app/admin/login'
    }
  },
  {
    name: 'Admin Account Deleted',
    template: 'admin_account_deleted',
    variables: {
      admin_name: 'Test Admin',
      deletion_date: new Date().toLocaleDateString(),
      contact_email: 'support@applybureau.com'
    }
  },

  // 2. Client Authentication & Onboarding
  {
    name: 'Signup Invite',
    template: 'signup_invite',
    variables: {
      client_name: 'David Johnson',
      registration_link: 'https://apply-bureau-backend.vercel.app/complete-registration?token=test123'
    }
  },
  {
    name: 'Client Welcome',
    template: 'client_welcome',
    variables: {
      client_name: 'David Johnson',
      dashboard_link: 'https://apply-bureau-backend.vercel.app/dashboard',
      onboarding_link: 'https://apply-bureau-backend.vercel.app/onboarding'
    }
  },
  {
    name: 'Payment Verified Registration',
    template: 'payment_verified_registration',
    variables: {
      client_name: 'David Johnson',
      registration_link: 'https://apply-bureau-backend.vercel.app/register?token=test123',
      payment_amount: '$500',
      payment_date: new Date().toLocaleDateString()
    }
  },

  // 3. Onboarding Process
  {
    name: 'Onboarding Reminder',
    template: 'onboarding_reminder',
    variables: {
      client_name: 'David Johnson',
      onboarding_link: 'https://apply-bureau-backend.vercel.app/onboarding',
      days_remaining: '3'
    }
  },
  {
    name: 'Onboarding Completion',
    template: 'onboarding_completion',
    variables: {
      client_name: 'David Johnson',
      dashboard_link: 'https://apply-bureau-backend.vercel.app/dashboard'
    }
  },
  {
    name: 'Onboarding Completed',
    template: 'onboarding_completed',
    variables: {
      client_name: 'David Johnson',
      completion_date: new Date().toLocaleDateString(),
      dashboard_link: 'https://apply-bureau-backend.vercel.app/dashboard'
    }
  },
  {
    name: 'Onboarding Complete Confirmation',
    template: 'onboarding_complete_confirmation',
    variables: {
      client_name: 'David Johnson',
      review_timeline: '24-48 hours',
      dashboard_link: 'https://apply-bureau-backend.vercel.app/dashboard'
    }
  },

  // 4. Profile Management
  {
    name: 'Profile Under Review',
    template: 'profile_under_review',
    variables: {
      client_name: 'David Johnson',
      review_timeline: '24-48 hours',
      dashboard_link: 'https://apply-bureau-backend.vercel.app/dashboard'
    }
  },
  {
    name: 'Profile Unlocked',
    template: 'profile_unlocked',
    variables: {
      client_name: 'David Johnson',
      unlock_date: new Date().toLocaleDateString(),
      dashboard_link: 'https://apply-bureau-backend.vercel.app/dashboard'
    }
  },

  // 5. Consultation Requests (Public)
  {
    name: 'Consultation Request Received',
    template: 'consultation_request_received',
    variables: {
      client_name: 'David Johnson',
      consultation_date: new Date().toLocaleDateString(),
      response_timeline: '24 hours'
    }
  },
  {
    name: 'New Consultation Request',
    template: 'new_consultation_request',
    variables: {
      client_name: 'David Johnson',
      client_email: TEST_EMAIL,
      preferred_date: new Date().toLocaleDateString(),
      message: 'I would like to discuss my career options.'
    }
  },
  {
    name: 'New Consultation Request With Times',
    template: 'new_consultation_request_with_times',
    variables: {
      client_name: 'David Johnson',
      client_email: TEST_EMAIL,
      slot_1: 'Monday, Jan 20, 2026 at 10:00 AM',
      slot_2: 'Tuesday, Jan 21, 2026 at 2:00 PM',
      slot_3: 'Wednesday, Jan 22, 2026 at 4:00 PM',
      message: 'Looking forward to discussing opportunities.'
    }
  },
  {
    name: 'Consultation Approved',
    template: 'consultation_approved',
    variables: {
      client_name: 'David Johnson',
      consultation_date: 'Monday, Jan 20, 2026 at 10:00 AM',
      meeting_link: 'https://meet.google.com/abc-defg-hij'
    }
  },
  {
    name: 'Consultation Rejected',
    template: 'consultation_rejected',
    variables: {
      client_name: 'David Johnson',
      rejection_reason: 'Unfortunately, we are fully booked for the requested time slots.',
      alternative_action: 'Please submit a new request with different time preferences.'
    }
  },
  {
    name: 'Consultation Under Review',
    template: 'consultation_under_review',
    variables: {
      client_name: 'David Johnson',
      review_timeline: '24 hours',
      requested_slots: '3 time slots'
    }
  },

  // 6. Consultation Scheduling
  {
    name: 'Consultation Confirmed',
    template: 'consultation_confirmed',
    variables: {
      client_name: 'David Johnson',
      consultation_date: 'Monday, Jan 20, 2026',
      consultation_time: '10:00 AM EST',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      consultant_name: 'Sarah Williams'
    }
  },
  {
    name: 'Consultation Confirmed Concierge',
    template: 'consultation_confirmed_concierge',
    variables: {
      client_name: 'David Johnson',
      meeting_date: 'Monday, Jan 20, 2026',
      meeting_time: '10:00 AM EST',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      zoom_link: 'https://zoom.us/j/123456789'
    }
  },
  {
    name: 'Consultation Scheduled',
    template: 'consultation_scheduled',
    variables: {
      client_name: 'David Johnson',
      consultation_date: 'Monday, Jan 20, 2026',
      consultation_time: '10:00 AM EST',
      meeting_link: 'https://meet.google.com/abc-defg-hij'
    }
  },
  {
    name: 'Consultation Reminder',
    template: 'consultation_reminder',
    variables: {
      client_name: 'David Johnson',
      consultation_date: 'Tomorrow',
      consultation_time: '10:00 AM EST',
      meeting_link: 'https://meet.google.com/abc-defg-hij'
    }
  },
  {
    name: 'New Consultation Booking',
    template: 'new_consultation_booking',
    variables: {
      client_name: 'David Johnson',
      client_email: TEST_EMAIL,
      booking_date: new Date().toLocaleDateString(),
      preferred_time: '10:00 AM EST'
    }
  },

  // 7. Strategy Calls
  {
    name: 'Strategy Call Requested',
    template: 'strategy_call_requested',
    variables: {
      client_name: 'David Johnson',
      client_email: TEST_EMAIL,
      requested_date: 'Monday, Jan 20, 2026',
      requested_time: '10:00 AM EST',
      call_purpose: 'Career strategy discussion'
    }
  },
  {
    name: 'Strategy Call Confirmed',
    template: 'strategy_call_confirmed',
    variables: {
      client_name: 'David Johnson',
      call_date: 'Monday, Jan 20, 2026',
      call_time: '10:00 AM EST',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      consultant_name: 'Sarah Williams'
    }
  },

  // 8. Meeting Management
  {
    name: 'Meeting Scheduled',
    template: 'meeting_scheduled',
    variables: {
      client_name: 'David Johnson',
      meeting_date: 'Monday, Jan 20, 2026',
      meeting_time: '10:00 AM EST',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      meeting_type: 'Initial Consultation'
    }
  },
  {
    name: 'Meeting Link Notification',
    template: 'meeting_link_notification',
    variables: {
      client_name: 'David Johnson',
      meeting_date: 'Monday, Jan 20, 2026',
      meeting_time: '10:00 AM EST',
      meeting_link: 'https://meet.google.com/abc-defg-hij'
    }
  },
  {
    name: 'Admin Meeting Link Notification',
    template: 'admin_meeting_link_notification',
    variables: {
      admin_name: 'Admin User',
      client_name: 'David Johnson',
      meeting_date: 'Monday, Jan 20, 2026',
      meeting_time: '10:00 AM EST',
      meeting_link: 'https://meet.google.com/abc-defg-hij'
    }
  },

  // 9. Contact Form
  {
    name: 'Contact Form Received',
    template: 'contact_form_received',
    variables: {
      client_name: 'David Johnson',
      subject: 'General Inquiry',
      message: 'I have a question about your services.',
      next_steps: 'We will respond within 24 hours.'
    }
  },
  {
    name: 'New Contact Submission',
    template: 'new_contact_submission',
    variables: {
      client_name: 'David Johnson',
      client_email: TEST_EMAIL,
      subject: 'General Inquiry',
      message: 'I have a question about your services.',
      phone: '+1234567890'
    }
  },

  // 10. Application Tracking
  {
    name: 'Application Status Update',
    template: 'application_status_update',
    variables: {
      client_name: 'David Johnson',
      company_name: 'Tech Corp',
      position: 'Senior Software Engineer',
      status: 'Interview Scheduled',
      status_details: 'Your interview is scheduled for Monday, Jan 20, 2026 at 10:00 AM.',
      dashboard_link: 'https://apply-bureau-backend.vercel.app/dashboard'
    }
  },
  {
    name: 'Interview Update Enhanced',
    template: 'interview_update_enhanced',
    variables: {
      client_name: 'David Johnson',
      company_name: 'Tech Corp',
      position: 'Senior Software Engineer',
      interview_date: 'Monday, Jan 20, 2026',
      interview_time: '10:00 AM EST',
      interview_type: 'Technical Interview',
      dashboard_link: 'https://apply-bureau-backend.vercel.app/dashboard'
    }
  },

  // 11. Payment & Registration
  {
    name: 'Payment Received Welcome',
    template: 'payment_received_welcome',
    variables: {
      client_name: 'David Johnson',
      payment_amount: '$500',
      payment_date: new Date().toLocaleDateString(),
      next_steps: 'Complete your onboarding to get started.',
      onboarding_link: 'https://apply-bureau-backend.vercel.app/onboarding'
    }
  },
  {
    name: 'Payment Confirmed Welcome Concierge',
    template: 'payment_confirmed_welcome_concierge',
    variables: {
      client_name: 'David Johnson',
      payment_amount: '$500',
      payment_date: new Date().toLocaleDateString(),
      registration_link: 'https://apply-bureau-backend.vercel.app/register?token=test123'
    }
  },

  // 12. Lead Management
  {
    name: 'Lead Selected',
    template: 'lead_selected',
    variables: {
      client_name: 'David Johnson',
      selection_date: new Date().toLocaleDateString(),
      next_steps: 'We will contact you within 24 hours to discuss next steps.',
      contact_email: 'support@applybureau.com'
    }
  },

  // 13. Messaging
  {
    name: 'Message Notification',
    template: 'message_notification',
    variables: {
      client_name: 'David Johnson',
      sender_name: 'Admin User',
      message_preview: 'Hi David, I wanted to follow up on your application...',
      message_link: 'https://apply-bureau-backend.vercel.app/messages'
    }
  },
  {
    name: 'Client Message Notification',
    template: 'client_message_notification',
    variables: {
      admin_name: 'Admin User',
      client_name: 'David Johnson',
      message_preview: 'Hi, I have a question about my application status...',
      message_link: 'https://apply-bureau-backend.vercel.app/admin/messages'
    }
  }
];

async function testAllEmails() {
  console.log('📧 Testing All Email Templates\n');
  console.log(`Total templates to test: ${emailTests.length}`);
  console.log(`Test email: ${TEST_EMAIL}\n`);
  console.log('='.repeat(60));
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  for (let i = 0; i < emailTests.length; i++) {
    const test = emailTests[i];
    const progress = `[${i + 1}/${emailTests.length}]`;
    
    try {
      console.log(`\n${progress} Testing: ${test.name}`);
      console.log(`   Template: ${test.template}`);
      
      await sendEmail(TEST_EMAIL, test.template, test.variables);
      
      console.log(`   ✅ SUCCESS - Email sent`);
      results.passed++;
      
      // Wait 2 seconds between emails to avoid rate limiting
      if (i < emailTests.length - 1) {
        console.log(`   ⏳ Waiting 2 seconds...`);
        await delay(2000);
      }
      
    } catch (error) {
      console.error(`   ❌ FAILED - ${error.message}`);
      results.failed++;
      results.errors.push({
        name: test.name,
        template: test.template,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${emailTests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${Math.round((results.passed / emailTests.length) * 100)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.errors.forEach((err, index) => {
      console.log(`\n${index + 1}. ${err.name}`);
      console.log(`   Template: ${err.template}`);
      console.log(`   Error: ${err.error}`);
    });
  }
  
  if (results.passed === emailTests.length) {
    console.log('\n🎉 ALL EMAIL TEMPLATES TESTED SUCCESSFULLY!');
    console.log(`\n📬 Check ${TEST_EMAIL} for ${results.passed} test emails`);
  } else {
    console.log('\n⚠️ Some email templates failed. Review errors above.');
  }
  
  console.log('\n📝 Note: All emails were sent to ' + TEST_EMAIL);
  console.log('   Check your inbox and spam folder for test emails.');
}

// Run tests
testAllEmails().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
