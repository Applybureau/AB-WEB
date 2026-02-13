const { sendEmail } = require('./utils/email');
const path = require('path');
const fs = require('fs').promises;

// Test recipient
const TEST_RECIPIENT = 'applybureau@gmail.com';

// Sample data for all email templates
const sampleData = {
  // Client data
  client_name: 'John Smith',
  client_email: 'john.smith@example.com',
  client_phone: '+1-555-0123',
  full_name: 'John Smith',
  
  // Admin data
  admin_name: 'Sarah Johnson',
  admin_email: 'sarah.johnson@applybureau.com',
  admin_id: 'admin-123',
  
  // Consultation data
  consultation_date: 'Tuesday, March 12, 2024',
  consultation_time: '5:00 PM (EST)',
  call_date: 'Tuesday, March 12, 2024',
  call_time: '5:00 PM (EST)',
  meeting_link: 'https://meet.google.com/abc-def-ghi',
  consultation_id: 'consultation-456',
  
  // Application data
  company_name: 'TechCorp Inc.',
  role_title: 'Senior Software Engineer',
  application_status: 'Interview Scheduled',
  
  // Payment data
  package_tier: 'Premium Package',
  payment_amount: '$299.99',
  payment_method: 'Credit Card',
  transaction_id: 'txn_123456789',
  
  // URLs
  dashboard_url: 'https://www.applybureau.com/dashboard',
  login_url: 'https://www.applybureau.com/login',
  registration_url: 'https://www.applybureau.com/register?token=sample-token',
  registration_link: 'https://www.applybureau.com/register?token=sample-token',
  admin_dashboard_url: 'https://www.applybureau.com/admin',
  admin_login_url: 'https://www.applybureau.com/admin/login',
  reschedule_link: 'https://www.applybureau.com/reschedule/consultation-456',
  message_url: 'https://www.applybureau.com/messages/msg-789',
  unsubscribe_url: 'https://www.applybureau.com/unsubscribe',
  
  // Contact data
  name: 'Michael Davis',
  subject: 'General Inquiry',
  message: 'I am interested in learning more about your career services and would like to schedule a consultation.',
  message_preview: 'Your application for Senior Software Engineer at TechCorp Inc. has been updated. Please check your dashboard for details.',
  
  // System data
  current_year: new Date().getFullYear(),
  support_email: 'applybureau@gmail.com',
  contact_email: 'applybureau@gmail.com',
  
  // Reschedule data
  reason: 'Schedule conflict',
  new_proposed_times: [
    { date: '2024-03-15', time: '10:00 AM' },
    { date: '2024-03-16', time: '2:00 PM' }
  ],
  new_date_time: 'Friday, March 15, 2024 at 10:00 AM (EST)',
  
  // Password reset data
  new_password: 'NewSecurePassword123!',
  
  // Admin action data
  admin_status: 'Active',
  action_reason: 'Routine security review',
  suspend_url: 'https://www.applybureau.com/admin/suspend/admin-123',
  delete_url: 'https://www.applybureau.com/admin/delete/admin-123',
  
  // Additional data
  token_expiry: '24 hours',
  review_timeline: '2-3 business days',
  next_steps: 'Our team will review your profile and unlock your dashboard within 3 business days.',
  admin_message: 'Welcome to Apply Bureau! Your account has been set up successfully.',
  info_box_content: 'Important: Please keep your login credentials secure.',
  
  // Meeting and interview data
  interview_date: 'March 20, 2024',
  interview_time: '2:00 PM (EST)',
  
  // Logo (will be loaded dynamically)
  logo_base64: null
};

// List of all email templates to test
const emailTemplates = [
  // Admin templates
  { name: 'admin_welcome', subject: 'Welcome to Apply Bureau Admin Panel' },
  { name: 'admin_password_reset', subject: 'Admin Password Reset - Apply Bureau' },
  { name: 'admin_account_deleted', subject: 'Admin Account Deleted - Apply Bureau' },
  { name: 'admin_account_reactivated', subject: 'Admin Account Reactivated - Apply Bureau' },
  { name: 'admin_account_suspended', subject: 'Admin Account Suspended - Apply Bureau' },
  { name: 'admin_action_required', subject: 'Admin Action Required - Apply Bureau' },
  { name: 'admin_meeting_link_notification', subject: 'Meeting Link - Apply Bureau' },
  
  // Client communication templates
  { name: 'signup_invite', subject: 'Welcome to Apply Bureau - Complete Registration' },
  { name: 'client_message_notification', subject: 'New Message from Your Advisor - Apply Bureau' },
  { name: 'onboarding_reminder', subject: 'Complete Your Profile - Apply Bureau' },
  { name: 'onboarding_completion', subject: 'Profile Setup Complete - Apply Bureau' },
  { name: 'onboarding_completed', subject: 'Onboarding complete' },
  { name: 'onboarding_complete_confirmation', subject: 'Onboarding complete' },
  
  // Consultation templates
  { name: 'consultation_confirmed', subject: 'Consultation Confirmed — Apply Bureau' },
  { name: 'consultation_confirmed_concierge', subject: 'Consultation Confirmed - Apply Bureau' },
  { name: 'consultation_rescheduled', subject: 'Consultation Time Adjustment — Apply Bureau' },
  { name: 'consultation_reschedule_request', subject: 'Consultation Reschedule Request - Apply Bureau' },
  { name: 'consultation_waitlisted', subject: 'Apply Bureau — Next Steps' },
  { name: 'consultation_reminder', subject: 'Reminder: Upcoming call with Apply Bureau' },
  { name: 'consultation_rejected', subject: 'Consultation Update - Apply Bureau' },
  { name: 'consultation_completed', subject: 'Consultation Completed - Apply Bureau' },
  { name: 'new_consultation_booking', subject: 'New Consultation Booking - Apply Bureau' },
  { name: 'new_consultation_request', subject: 'New Consultation Request - Apply Bureau' },
  { name: 'new_consultation_request_with_times', subject: 'New Consultation Request - Apply Bureau' },
  
  // Payment templates
  { name: 'payment_confirmed_welcome_concierge', subject: 'Apply Bureau — Payment Confirmed & Next Steps' },
  { name: 'payment_received_welcome', subject: 'Apply Bureau — Payment Confirmed & Next Steps' },
  { name: 'payment_verified_registration', subject: 'Payment Verified - Create Your Account' },
  
  // Contact templates
  { name: 'contact_form_received', subject: 'We\'ve received your message — Apply Bureau' },
  { name: 'new_contact_submission', subject: 'New Contact Form Submission - Apply Bureau' },
  
  // Meeting templates
  { name: 'meeting_scheduled', subject: 'Meeting Scheduled - Apply Bureau' },
  { name: 'meeting_link_notification', subject: 'Meeting Link - Apply Bureau' },
  { name: 'strategy_call_confirmed', subject: 'Strategy Call Confirmed — Apply Bureau' },
  
  // Interview and application templates
  { name: 'interview_update_enhanced', subject: 'Apply Bureau | Interview Update' },
  { name: 'interview_update_concierge', subject: 'Interview Update - Apply Bureau' },
  { name: 'application_update', subject: 'Application Update - Apply Bureau' },
  
  // Other templates
  { name: 'lead_selected', subject: 'You\'ve Been Selected - Apply Bureau' },
  { name: 'message_notification', subject: 'New Message - Apply Bureau' }
];

async function testAllEmailTemplates() {
  console.log('🧪 TESTING ALL EMAIL TEMPLATES');
  console.log('================================\n');
  console.log(`📧 Test recipient: ${TEST_RECIPIENT}`);
  console.log(`📊 Total templates to test: ${emailTemplates.length}\n`);

  let successCount = 0;
  let failureCount = 0;
  const results = [];

  for (let i = 0; i < emailTemplates.length; i++) {
    const template = emailTemplates[i];
    const templateNumber = i + 1;
    
    console.log(`[${templateNumber}/${emailTemplates.length}] Testing: ${template.name}`);
    
    try {
      // Send email with sample data
      await sendEmail(
        TEST_RECIPIENT,
        template.subject,
        template.name,
        sampleData
      );
      
      console.log(`✅ SUCCESS: ${template.name}`);
      successCount++;
      results.push({ template: template.name, status: 'SUCCESS', error: null });
      
      // Small delay to avoid overwhelming the email service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ FAILED: ${template.name} - ${error.message}`);
      failureCount++;
      results.push({ template: template.name, status: 'FAILED', error: error.message });
    }
  }

  // Print summary
  console.log('\n📊 EMAIL TEMPLATE TEST SUMMARY');
  console.log('===============================');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📧 Total sent to: ${TEST_RECIPIENT}`);
  
  if (failureCount > 0) {
    console.log('\n❌ FAILED TEMPLATES:');
    results.filter(r => r.status === 'FAILED').forEach(result => {
      console.log(`   - ${result.template}: ${result.error}`);
    });
  }
  
  if (successCount > 0) {
    console.log('\n✅ SUCCESSFUL TEMPLATES:');
    results.filter(r => r.status === 'SUCCESS').forEach(result => {
      console.log(`   - ${result.template}`);
    });
  }

  console.log('\n🎯 TEST COMPLETED!');
  console.log(`Check ${TEST_RECIPIENT} inbox for ${successCount} test emails.`);
  
  if (successCount === emailTemplates.length) {
    console.log('\n🎉 ALL EMAIL TEMPLATES WORKING PERFECTLY!');
  } else {
    console.log(`\n⚠️  ${failureCount} templates need attention.`);
  }

  return {
    total: emailTemplates.length,
    successful: successCount,
    failed: failureCount,
    results: results
  };
}

// Additional test for specific email scenarios
async function testSpecificScenarios() {
  console.log('\n🎯 TESTING SPECIFIC EMAIL SCENARIOS');
  console.log('===================================\n');

  const scenarios = [
    {
      name: 'Consultation with Meeting Link',
      template: 'consultation_confirmed',
      subject: 'TEST: Consultation Confirmed with Meeting Link',
      data: {
        ...sampleData,
        meeting_link: 'https://meet.google.com/test-meeting-link'
      }
    },
    {
      name: 'Consultation without Meeting Link',
      template: 'consultation_confirmed',
      subject: 'TEST: Consultation Confirmed without Meeting Link',
      data: {
        ...sampleData,
        meeting_link: null
      }
    },
    {
      name: 'Payment Confirmation with Dashboard Access',
      template: 'payment_confirmed_welcome_concierge',
      subject: 'TEST: Payment Confirmed with Dashboard',
      data: {
        ...sampleData,
        package_tier: 'Premium Package ($299)',
        dashboard_url: 'https://www.applybureau.com/client/dashboard'
      }
    },
    {
      name: 'Interview Update with Company Details',
      template: 'interview_update_enhanced',
      subject: 'TEST: Interview Update with Details',
      data: {
        ...sampleData,
        company_name: 'Google Inc.',
        role_title: 'Senior Frontend Developer'
      }
    }
  ];

  for (const scenario of scenarios) {
    console.log(`Testing scenario: ${scenario.name}`);
    
    try {
      await sendEmail(
        TEST_RECIPIENT,
        scenario.subject,
        scenario.template,
        scenario.data
      );
      
      console.log(`✅ SUCCESS: ${scenario.name}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ FAILED: ${scenario.name} - ${error.message}`);
    }
  }
}

// Run the comprehensive test
async function runComprehensiveEmailTest() {
  try {
    console.log('🚀 STARTING COMPREHENSIVE EMAIL TEMPLATE TEST\n');
    
    // Test all templates
    const results = await testAllEmailTemplates();
    
    // Test specific scenarios
    await testSpecificScenarios();
    
    console.log('\n🏁 COMPREHENSIVE EMAIL TEST COMPLETED!');
    console.log(`📧 Check ${TEST_RECIPIENT} for all test emails.`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    throw error;
  }
}

// Export for use in other tests
module.exports = {
  testAllEmailTemplates,
  testSpecificScenarios,
  runComprehensiveEmailTest,
  sampleData,
  emailTemplates
};

// Run if called directly
if (require.main === module) {
  runComprehensiveEmailTest()
    .then(results => {
      console.log('\n📊 Final Results:', results);
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}