const { sendEmail } = require('../utils/email');
const { supabaseAdmin } = require('../utils/supabase');

// Test configuration
const TEST_EMAIL = 'test@applybureautest.com';
const TEST_CLIENT_DATA = {
  full_name: 'Test Client Johnson',
  email: TEST_EMAIL,
  phone: '+1-555-0123',
  company_name: 'TechCorp Inc',
  job_title: 'Senior Software Engineer',
  consultation_id: 'test-consultation-123',
  application_id: 'test-app-456'
};

class EmailTriggersTest {
  constructor() {
    this.emailTemplates = [
      // Consultation Flow Emails
      {
        name: 'New Consultation Request',
        template: 'new_consultation_request',
        recipient: 'admin',
        data: {
          prospect_name: TEST_CLIENT_DATA.full_name,
          prospect_email: TEST_CLIENT_DATA.email,
          prospect_phone: TEST_CLIENT_DATA.phone,
          message: 'I need help with my job search strategy.',
          preferred_slots: [
            { date: '2024-02-15', time: '14:00' },
            { date: '2024-02-16', time: '10:00' }
          ]
        }
      },
      {
        name: 'New Consultation Request with Times',
        template: 'new_consultation_request_with_times',
        recipient: 'admin',
        data: {
          prospect_name: TEST_CLIENT_DATA.full_name,
          prospect_email: TEST_CLIENT_DATA.email,
          preferred_times: '2024-02-15 at 2:00 PM, 2024-02-16 at 10:00 AM',
          message: 'Looking for career guidance and application strategy.'
        }
      },
      {
        name: 'Consultation Confirmed',
        template: 'consultation_confirmed',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          consultation_date: '2024-02-15',
          consultation_time: '2:00 PM',
          meeting_link: 'https://meet.google.com/test-meeting',
          admin_name: 'Sarah Johnson'
        }
      },
      {
        name: 'Consultation Confirmed Concierge',
        template: 'consultation_confirmed_concierge',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          scheduled_date: '2024-02-15',
          scheduled_time: '2:00 PM',
          meeting_link: 'https://meet.google.com/test-meeting',
          meeting_notes: 'Initial consultation to discuss job search strategy'
        }
      },
      {
        name: 'Consultation Reminder',
        template: 'consultation_reminder',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          consultation_date: '2024-02-15',
          consultation_time: '2:00 PM',
          meeting_link: 'https://meet.google.com/test-meeting'
        }
      },
      {
        name: 'Consultation Rescheduled',
        template: 'consultation_rescheduled',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          old_date: '2024-02-15',
          old_time: '2:00 PM',
          new_date: '2024-02-16',
          new_time: '10:00 AM',
          reason: 'Schedule conflict resolved'
        }
      },

      // Payment & Registration Emails
      {
        name: 'Payment Confirmed Welcome Concierge',
        template: 'payment_confirmed_welcome_concierge',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          package_tier: 'Tier 2',
          payment_amount: '$500',
          registration_link: 'https://applybureautest.com/register/test-token-123',
          token_expires: '7 days'
        }
      },
      {
        name: 'Payment Received Welcome',
        template: 'payment_received_welcome',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          payment_amount: '$500',
          service_tier: 'Tier 2',
          next_steps: 'Complete your registration using the link provided'
        }
      },
      {
        name: 'Payment Verified Registration',
        template: 'payment_verified_registration',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          registration_link: 'https://applybureautest.com/register/test-token-123',
          expires_at: '2024-02-22',
          support_email: 'support@applybureautest.com'
        }
      },

      // Onboarding Emails
      {
        name: 'Onboarding Completed',
        template: 'onboarding_completed',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          completion_date: '2024-02-15',
          next_steps: 'Your profile is being reviewed by our team'
        }
      },
      {
        name: 'Onboarding Complete Confirmation',
        template: 'onboarding_complete_confirmation',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          dashboard_url: 'https://applybureautest.com/dashboard',
          profile_completion: '85%'
        }
      },
      {
        name: 'Onboarding Completed Secure',
        template: 'onboarding_completed_secure',
        recipient: 'admin',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          client_email: TEST_CLIENT_DATA.email,
          completion_date: '2024-02-15',
          review_url: 'https://applybureautest.com/admin/clients/review'
        }
      },
      {
        name: 'Onboarding Reminder',
        template: 'onboarding_reminder',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          days_remaining: '3',
          onboarding_url: 'https://applybureautest.com/onboarding'
        }
      },

      // Meeting & Interview Emails
      {
        name: 'Meeting Scheduled',
        template: 'meeting_scheduled',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          meeting_date: '2024-02-20',
          meeting_time: '3:00 PM',
          meeting_link: 'https://meet.google.com/strategy-call',
          meeting_type: 'Strategy Call'
        }
      },
      {
        name: 'Meeting Link Notification',
        template: 'meeting_link_notification',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          meeting_link: 'https://meet.google.com/strategy-call',
          meeting_date: '2024-02-20',
          meeting_time: '3:00 PM'
        }
      },
      {
        name: 'Admin Meeting Link Notification',
        template: 'admin_meeting_link_notification',
        recipient: 'admin',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          meeting_link: 'https://meet.google.com/strategy-call',
          meeting_date: '2024-02-20',
          meeting_time: '3:00 PM'
        }
      },
      {
        name: 'Interview Update Enhanced',
        template: 'interview_update_enhanced',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          company_name: TEST_CLIENT_DATA.company_name,
          job_title: TEST_CLIENT_DATA.job_title,
          interview_date: '2024-02-25',
          interview_time: '10:00 AM',
          interview_type: 'Technical Interview',
          preparation_notes: 'Review system design concepts and coding challenges'
        }
      },
      {
        name: 'Strategy Call Confirmed',
        template: 'strategy_call_confirmed',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          call_date: '2024-02-20',
          call_time: '3:00 PM',
          call_link: 'https://meet.google.com/strategy-call',
          agenda: 'Review application strategy and target companies'
        }
      },

      // Contact & Lead Emails
      {
        name: 'Contact Form Received',
        template: 'contact_form_received',
        recipient: 'client',
        data: {
          name: TEST_CLIENT_DATA.full_name,
          email: TEST_CLIENT_DATA.email,
          message: 'Thank you for contacting us. We will respond within 24 hours.'
        }
      },
      {
        name: 'New Contact Submission',
        template: 'new_contact_submission',
        recipient: 'admin',
        data: {
          name: TEST_CLIENT_DATA.full_name,
          email: TEST_CLIENT_DATA.email,
          phone: TEST_CLIENT_DATA.phone,
          message: 'Interested in learning more about your services',
          submitted_at: '2024-02-15 14:30:00'
        }
      },
      {
        name: 'Lead Selected',
        template: 'lead_selected',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          company_name: TEST_CLIENT_DATA.company_name,
          job_title: TEST_CLIENT_DATA.job_title,
          application_deadline: '2024-03-01',
          why_selected: 'Strong match for your skills and career goals'
        }
      },

      // Admin Account Emails
      {
        name: 'Admin Welcome',
        template: 'admin_welcome',
        recipient: 'admin',
        data: {
          admin_name: 'Sarah Johnson',
          login_url: 'https://applybureautest.com/admin/login',
          temp_password: 'TempPass123!',
          setup_instructions: 'Please change your password on first login'
        }
      },
      {
        name: 'Admin Password Reset',
        template: 'admin_password_reset',
        recipient: 'admin',
        data: {
          admin_name: 'Sarah Johnson',
          reset_link: 'https://applybureautest.com/admin/reset-password/token123',
          expires_in: '1 hour'
        }
      },
      {
        name: 'Admin Account Suspended',
        template: 'admin_account_suspended',
        recipient: 'admin',
        data: {
          admin_name: 'Sarah Johnson',
          suspension_reason: 'Security policy violation',
          contact_email: 'security@applybureautest.com'
        }
      },
      {
        name: 'Admin Account Deleted',
        template: 'admin_account_deleted',
        recipient: 'admin',
        data: {
          admin_name: 'Sarah Johnson',
          deletion_date: '2024-02-15',
          data_retention: '30 days'
        }
      },
      {
        name: 'Admin Account Reactivated',
        template: 'admin_account_reactivated',
        recipient: 'admin',
        data: {
          admin_name: 'Sarah Johnson',
          reactivation_date: '2024-02-15',
          login_url: 'https://applybureautest.com/admin/login'
        }
      },

      // Notification Emails
      {
        name: 'Client Message Notification',
        template: 'client_message_notification',
        recipient: 'admin',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          message_preview: 'I have a question about my application strategy...',
          message_url: 'https://applybureautest.com/admin/messages/123'
        }
      },
      {
        name: 'Message Notification',
        template: 'message_notification',
        recipient: 'client',
        data: {
          client_name: TEST_CLIENT_DATA.full_name,
          sender_name: 'Sarah Johnson',
          message_preview: 'I reviewed your application and have some feedback...',
          message_url: 'https://applybureautest.com/messages/456'
        }
      },
      {
        name: 'Signup Invite',
        template: 'signup_invite',
        recipient: 'client',
        data: {
          invitee_name: TEST_CLIENT_DATA.full_name,
          inviter_name: 'Sarah Johnson',
          signup_link: 'https://applybureautest.com/signup/invite-token-123',
          expires_in: '7 days'
        }
      }
    ];
  }

  async log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async testEmailTemplate(template) {
    try {
      this.log(`📧 Testing email template: ${template.name}`);
      
      await sendEmail(
        TEST_EMAIL,
        template.name,
        template.template,
        template.data
      );
      
      this.log(`✅ Email sent successfully: ${template.name}`);
      return true;
    } catch (error) {
      this.log(`❌ Email failed: ${template.name}`, error.message);
      return false;
    }
  }

  async testAllEmailTemplates() {
    this.log('🚀 STARTING EMAIL TRIGGERS TEST');
    this.log(`Testing ${this.emailTemplates.length} email templates...`);
    this.log('=' .repeat(60));
    
    let successCount = 0;
    let failureCount = 0;
    const results = [];
    
    for (const template of this.emailTemplates) {
      const success = await this.testEmailTemplate(template);
      results.push({
        template: template.name,
        success,
        recipient_type: template.recipient
      });
      
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    this.generateEmailTestReport(results, successCount, failureCount);
  }

  generateEmailTestReport(results, successCount, failureCount) {
    this.log('\n📋 EMAIL TRIGGERS TEST REPORT');
    this.log('=' .repeat(60));
    
    // Group results by recipient type
    const clientEmails = results.filter(r => r.recipient_type === 'client');
    const adminEmails = results.filter(r => r.recipient_type === 'admin');
    
    this.log('\nCLIENT EMAILS:');
    clientEmails.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      this.log(`${status} - ${result.template}`);
    });
    
    this.log('\nADMIN EMAILS:');
    adminEmails.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      this.log(`${status} - ${result.template}`);
    });
    
    this.log('\n' + '=' .repeat(60));
    this.log(`TOTAL TEMPLATES TESTED: ${results.length}`);
    this.log(`SUCCESSFUL: ${successCount}`);
    this.log(`FAILED: ${failureCount}`);
    this.log(`SUCCESS RATE: ${Math.round((successCount/results.length) * 100)}%`);
    
    if (failureCount === 0) {
      this.log('🎉 ALL EMAIL TEMPLATES WORKING CORRECTLY');
    } else {
      this.log(`⚠️  ${failureCount} EMAIL TEMPLATES FAILED - CHECK LOGS ABOVE`);
    }
    
    this.log('\nEMAIL CATEGORIES TESTED:');
    this.log('• Consultation Flow (6 templates)');
    this.log('• Payment & Registration (3 templates)');
    this.log('• Onboarding (4 templates)');
    this.log('• Meetings & Interviews (5 templates)');
    this.log('• Contact & Leads (3 templates)');
    this.log('• Admin Account Management (5 templates)');
    this.log('• Notifications (3 templates)');
  }

  // Test specific email trigger scenarios
  async testEmailTriggerScenarios() {
    this.log('\n🎯 TESTING EMAIL TRIGGER SCENARIOS');
    this.log('=' .repeat(60));
    
    const scenarios = [
      {
        name: 'New Client Consultation Flow',
        emails: ['new_consultation_request', 'consultation_confirmed_concierge', 'payment_confirmed_welcome_concierge']
      },
      {
        name: 'Client Onboarding Process',
        emails: ['payment_verified_registration', 'onboarding_completed', 'onboarding_complete_confirmation']
      },
      {
        name: 'Interview Management',
        emails: ['interview_update_enhanced', 'meeting_scheduled', 'strategy_call_confirmed']
      },
      {
        name: 'Admin Notifications',
        emails: ['new_contact_submission', 'client_message_notification', 'onboarding_completed_secure']
      }
    ];
    
    for (const scenario of scenarios) {
      this.log(`\n📋 Testing scenario: ${scenario.name}`);
      
      for (const emailTemplate of scenario.emails) {
        const template = this.emailTemplates.find(t => t.template === emailTemplate);
        if (template) {
          await this.testEmailTemplate(template);
        } else {
          this.log(`⚠️  Template not found: ${emailTemplate}`);
        }
      }
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new EmailTriggersTest();
  test.testAllEmailTemplates()
    .then(() => test.testEmailTriggerScenarios())
    .catch(console.error);
}

module.exports = EmailTriggersTest;