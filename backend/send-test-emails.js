// Load environment variables
require('dotenv').config();

const { sendEmail } = require('./utils/email');

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
  meeting_date: 'Tuesday, March 12, 2024',
  meeting_time: '5:00 PM (EST)',
  
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
  sender_name: 'Michael Davis',
  sender_email: 'michael.davis@example.com',
  recipient_name: 'John Smith',
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
  
  // Additional consultation data
  consultation_type: 'Career Strategy Session',
  preferred_date: 'March 15, 2024',
  confirmed_date: 'Tuesday, March 12, 2024',
  confirmed_time: '5:00 PM (EST)',
  meeting_details: 'Google Meet link will be provided 24 hours before the meeting.',
  
  // Additional client data
  role_targets: 'Senior Software Engineer, Tech Lead',
  package_interest: 'Premium Package',
  current_country: 'United States',
  employment_status: 'Currently Employed',
  area_of_concern: 'Interview Preparation',
  resume_uploaded: 'Yes',
  preferred_time_1: '10:00 AM EST',
  preferred_time_2: '2:00 PM EST',
  preferred_time_3: '5:00 PM EST',
  timezone: 'EST',
  job_title: 'Senior Software Engineer',
  job_search_email: 'john.smith.jobs@gmail.com',
  
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

// List of critical email templates to test (most important ones first)
const criticalEmailTemplates = [
  { name: 'consultation_confirmed', subject: 'TEST: Consultation Confirmed — Apply Bureau' },
  { name: 'payment_confirmed_welcome_concierge', subject: 'TEST: Payment Confirmed & Next Steps' },
  { name: 'onboarding_completed', subject: 'TEST: Onboarding complete' },
  { name: 'interview_update_enhanced', subject: 'TEST: Interview Update' },
  { name: 'admin_password_reset', subject: 'TEST: Admin Password Reset' },
  { name: 'contact_form_received', subject: 'TEST: Message Received' },
  { name: 'consultation_rescheduled', subject: 'TEST: Consultation Time Adjustment' },
  { name: 'strategy_call_confirmed', subject: 'TEST: Strategy Call Confirmed' },
  { name: 'admin_welcome', subject: 'TEST: Welcome to Admin Panel' },
  { name: 'signup_invite', subject: 'TEST: Complete Registration' }
];

// All email templates
const allEmailTemplates = [
  { name: 'admin_welcome', subject: 'TEST: Welcome to Apply Bureau Admin Panel' },
  { name: 'admin_password_reset', subject: 'TEST: Admin Password Reset - Apply Bureau' },
  { name: 'admin_account_deleted', subject: 'TEST: Admin Account Deleted - Apply Bureau' },
  { name: 'admin_account_reactivated', subject: 'TEST: Admin Account Reactivated - Apply Bureau' },
  { name: 'admin_account_suspended', subject: 'TEST: Admin Account Suspended - Apply Bureau' },
  { name: 'admin_action_required', subject: 'TEST: Admin Action Required - Apply Bureau' },
  { name: 'admin_meeting_link_notification', subject: 'TEST: Meeting Link - Apply Bureau' },
  { name: 'signup_invite', subject: 'TEST: Welcome to Apply Bureau - Complete Registration' },
  { name: 'client_message_notification', subject: 'TEST: New Message from Your Advisor - Apply Bureau' },
  { name: 'onboarding_reminder', subject: 'TEST: Complete Your Profile - Apply Bureau' },
  { name: 'onboarding_completion', subject: 'TEST: Profile Setup Complete - Apply Bureau' },
  { name: 'onboarding_completed', subject: 'TEST: Onboarding complete' },
  { name: 'onboarding_complete_confirmation', subject: 'TEST: Onboarding complete' },
  { name: 'consultation_confirmed', subject: 'TEST: Consultation Confirmed — Apply Bureau' },
  { name: 'consultation_confirmed_concierge', subject: 'TEST: Consultation Confirmed - Apply Bureau' },
  { name: 'consultation_rescheduled', subject: 'TEST: Consultation Time Adjustment — Apply Bureau' },
  { name: 'consultation_reschedule_request', subject: 'TEST: Consultation Reschedule Request - Apply Bureau' },
  { name: 'consultation_waitlisted', subject: 'TEST: Apply Bureau — Next Steps' },
  { name: 'consultation_reminder', subject: 'TEST: Reminder: Upcoming call with Apply Bureau' },
  { name: 'consultation_rejected', subject: 'TEST: Consultation Update - Apply Bureau' },
  { name: 'consultation_completed', subject: 'TEST: Consultation Completed - Apply Bureau' },
  { name: 'new_consultation_booking', subject: 'TEST: New Consultation Booking - Apply Bureau' },
  { name: 'new_consultation_request', subject: 'TEST: New Consultation Request - Apply Bureau' },
  { name: 'new_consultation_request_with_times', subject: 'TEST: New Consultation Request - Apply Bureau' },
  { name: 'payment_confirmed_welcome_concierge', subject: 'TEST: Apply Bureau — Payment Confirmed & Next Steps' },
  { name: 'payment_received_welcome', subject: 'TEST: Apply Bureau — Payment Confirmed & Next Steps' },
  { name: 'payment_verified_registration', subject: 'TEST: Payment Verified - Create Your Account' },
  { name: 'contact_form_received', subject: 'TEST: We\'ve received your message — Apply Bureau' },
  { name: 'new_contact_submission', subject: 'TEST: New Contact Form Submission - Apply Bureau' },
  { name: 'meeting_scheduled', subject: 'TEST: Meeting Scheduled - Apply Bureau' },
  { name: 'meeting_link_notification', subject: 'TEST: Meeting Link - Apply Bureau' },
  { name: 'strategy_call_confirmed', subject: 'TEST: Strategy Call Confirmed — Apply Bureau' },
  { name: 'interview_update_enhanced', subject: 'TEST: Apply Bureau | Interview Update' },
  { name: 'interview_update_concierge', subject: 'TEST: Interview Update - Apply Bureau' },
  { name: 'application_update', subject: 'TEST: Application Update - Apply Bureau' },
  { name: 'lead_selected', subject: 'TEST: You\'ve Been Selected - Apply Bureau' },
  { name: 'message_notification', subject: 'TEST: New Message - Apply Bureau' }
];

async function sendTestEmails(templates = criticalEmailTemplates, delayMs = 2000) {
  console.log('🧪 SENDING TEST EMAILS TO APPLYBUREAU@GMAIL.COM');
  console.log('=================================================\n');
  console.log(`📧 Recipient: ${TEST_RECIPIENT}`);
  console.log(`📊 Templates to send: ${templates.length}`);
  console.log(`⏱️  Delay between emails: ${delayMs}ms\n`);

  let successCount = 0;
  let failureCount = 0;
  const results = [];

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const templateNumber = i + 1;
    
    console.log(`[${templateNumber}/${templates.length}] Sending: ${template.name}`);
    
    try {
      await sendEmail(
        TEST_RECIPIENT,
        template.name,
        { ...sampleData, subject: template.subject }
      );
      
      console.log(`✅ SUCCESS: ${template.name}`);
      successCount++;
      results.push({ template: template.name, status: 'SUCCESS', error: null });
      
      // Delay to avoid overwhelming the email service
      if (i < templates.length - 1) {
        console.log(`   ⏳ Waiting ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
    } catch (error) {
      console.log(`❌ FAILED: ${template.name} - ${error.message}`);
      failureCount++;
      results.push({ template: template.name, status: 'FAILED', error: error.message });
    }
  }

  // Print summary
  console.log('\n📊 EMAIL SENDING SUMMARY');
  console.log('========================');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📧 Sent to: ${TEST_RECIPIENT}`);
  
  if (failureCount > 0) {
    console.log('\n❌ FAILED EMAILS:');
    results.filter(r => r.status === 'FAILED').forEach(result => {
      console.log(`   - ${result.template}: ${result.error}`);
    });
  }
  
  if (successCount > 0) {
    console.log('\n✅ SUCCESSFUL EMAILS:');
    results.filter(r => r.status === 'SUCCESS').forEach(result => {
      console.log(`   - ${result.template}`);
    });
  }

  console.log('\n🎯 EMAIL SENDING COMPLETED!');
  console.log(`📬 Check ${TEST_RECIPIENT} inbox for ${successCount} test emails.`);
  
  if (successCount === templates.length) {
    console.log('\n🎉 ALL EMAILS SENT SUCCESSFULLY!');
  } else {
    console.log(`\n⚠️  ${failureCount} emails failed to send.`);
  }

  return {
    total: templates.length,
    successful: successCount,
    failed: failureCount,
    results: results
  };
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const sendAll = args.includes('--all');
  const sendCritical = args.includes('--critical') || args.length === 0;
  
  try {
    if (sendAll) {
      console.log('🚀 Sending ALL email templates...\n');
      await sendTestEmails(allEmailTemplates, 1500);
    } else if (sendCritical) {
      console.log('🚀 Sending CRITICAL email templates...\n');
      await sendTestEmails(criticalEmailTemplates, 2000);
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other files
module.exports = {
  sendTestEmails,
  sampleData,
  criticalEmailTemplates,
  allEmailTemplates
};

// Run if called directly
if (require.main === module) {
  main();
}