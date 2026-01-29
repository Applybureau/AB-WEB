const { sendEmail } = require('../utils/email');

// Test configuration
const TEST_EMAIL = 'test@applybureautest.com';

class SimpleEmailTest {
  constructor() {
    this.testTemplates = [
      {
        name: 'Consultation Confirmed',
        template: 'consultation_confirmed',
        data: {
          client_name: 'Test Client Johnson',
          consultation_date: '2024-02-15',
          consultation_time: '2:00 PM',
          meeting_link: 'https://meet.google.com/test-meeting',
          admin_name: 'Sarah Johnson'
        }
      },
      {
        name: 'Consultation Confirmed Concierge',
        template: 'consultation_confirmed_concierge',
        data: {
          client_name: 'Test Client Johnson',
          scheduled_date: '2024-02-15',
          scheduled_time: '2:00 PM',
          meeting_link: 'https://meet.google.com/test-meeting',
          meeting_notes: 'Initial consultation to discuss job search strategy'
        }
      },
      {
        name: 'New Consultation Request',
        template: 'new_consultation_request',
        data: {
          prospect_name: 'Test Client Johnson',
          prospect_email: 'testclient@example.com',
          prospect_phone: '+1-555-0123',
          message: 'I need help with my job search strategy.',
          preferred_slots: [
            { date: '2024-02-15', time: '14:00' },
            { date: '2024-02-16', time: '10:00' }
          ]
        }
      },
      {
        name: 'Payment Confirmed Welcome Concierge',
        template: 'payment_confirmed_welcome_concierge',
        data: {
          client_name: 'Test Client Johnson',
          package_tier: 'Tier 2',
          payment_amount: '$500',
          registration_link: 'https://applybureautest.com/register/test-token-123',
          token_expires: '7 days'
        }
      },
      {
        name: 'Onboarding Completed',
        template: 'onboarding_completed',
        data: {
          client_name: 'Test Client Johnson',
          completion_date: '2024-02-15',
          next_steps: 'Your profile is being reviewed by our team'
        }
      },
      {
        name: 'Interview Update Enhanced',
        template: 'interview_update_enhanced',
        data: {
          client_name: 'Test Client Johnson',
          company_name: 'TechCorp Inc',
          job_title: 'Senior Software Engineer',
          interview_date: '2024-02-25',
          interview_time: '10:00 AM',
          interview_type: 'Technical Interview',
          preparation_notes: 'Review system design concepts and coding challenges'
        }
      },
      {
        name: 'Meeting Scheduled',
        template: 'meeting_scheduled',
        data: {
          client_name: 'Test Client Johnson',
          meeting_date: '2024-02-20',
          meeting_time: '3:00 PM',
          meeting_link: 'https://meet.google.com/strategy-call',
          meeting_type: 'Strategy Call'
        }
      },
      {
        name: 'Strategy Call Confirmed',
        template: 'strategy_call_confirmed',
        data: {
          client_name: 'Test Client Johnson',
          call_date: '2024-02-20',
          call_time: '3:00 PM',
          call_link: 'https://meet.google.com/strategy-call',
          agenda: 'Review application strategy and target companies'
        }
      },
      {
        name: 'Contact Form Received',
        template: 'contact_form_received',
        data: {
          name: 'Test Client Johnson',
          email: 'testclient@example.com',
          message: 'Thank you for contacting us. We will respond within 24 hours.'
        }
      },
      {
        name: 'Admin Welcome',
        template: 'admin_welcome',
        data: {
          admin_name: 'Sarah Johnson',
          login_url: 'https://applybureautest.com/admin/login',
          temp_password: 'TempPass123!',
          setup_instructions: 'Please change your password on first login'
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
      this.log(`📧 Testing: ${template.name}`);
      
      await sendEmail(
        TEST_EMAIL,
        `Test: ${template.name}`,
        template.template,
        template.data
      );
      
      this.log(`✅ Success: ${template.name}`);
      return true;
    } catch (error) {
      this.log(`❌ Failed: ${template.name}`, error.message);
      return false;
    }
  }

  async testAllTemplates() {
    this.log('🚀 STARTING SIMPLE EMAIL TEMPLATE TEST');
    this.log(`Testing ${this.testTemplates.length} core email templates...`);
    this.log('=' .repeat(60));
    
    let successCount = 0;
    let failureCount = 0;
    const results = [];
    
    for (const template of this.testTemplates) {
      const success = await this.testEmailTemplate(template);
      results.push({
        template: template.name,
        success
      });
      
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.generateReport(results, successCount, failureCount);
  }

  generateReport(results, successCount, failureCount) {
    this.log('\n📋 EMAIL TEMPLATE TEST REPORT');
    this.log('=' .repeat(60));
    
    results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      this.log(`${status} - ${result.template}`);
    });
    
    this.log('\n' + '=' .repeat(60));
    this.log(`TOTAL TEMPLATES TESTED: ${results.length}`);
    this.log(`SUCCESSFUL: ${successCount}`);
    this.log(`FAILED: ${failureCount}`);
    this.log(`SUCCESS RATE: ${Math.round((successCount/results.length) * 100)}%`);
    
    if (failureCount === 0) {
      this.log('🎉 ALL EMAIL TEMPLATES WORKING');
    } else {
      this.log(`⚠️  ${failureCount} EMAIL TEMPLATES FAILED`);
    }
    
    this.log('\nTEMPLATE CATEGORIES TESTED:');
    this.log('• Consultation Flow (3 templates)');
    this.log('• Payment & Registration (1 template)');
    this.log('• Onboarding (1 template)');
    this.log('• Meetings & Interviews (3 templates)');
    this.log('• Contact Forms (1 template)');
    this.log('• Admin Management (1 template)');
  }

  // Test specific email trigger buttons
  async testEmailTriggerButtons() {
    this.log('\n🎯 TESTING EMAIL TRIGGER BUTTONS');
    this.log('=' .repeat(60));
    
    const triggerScenarios = [
      {
        name: 'New Client Consultation',
        description: 'When client submits consultation request',
        templates: ['new_consultation_request', 'consultation_confirmed_concierge']
      },
      {
        name: 'Payment Confirmation',
        description: 'When admin confirms payment received',
        templates: ['payment_confirmed_welcome_concierge']
      },
      {
        name: 'Interview Scheduling',
        description: 'When interview is scheduled or updated',
        templates: ['interview_update_enhanced', 'meeting_scheduled']
      },
      {
        name: 'Strategy Call Booking',
        description: 'When strategy call is confirmed',
        templates: ['strategy_call_confirmed']
      }
    ];
    
    for (const scenario of triggerScenarios) {
      this.log(`\n📋 Scenario: ${scenario.name}`);
      this.log(`Description: ${scenario.description}`);
      
      for (const templateName of scenario.templates) {
        const template = this.testTemplates.find(t => t.template === templateName);
        if (template) {
          await this.testEmailTemplate(template);
        } else {
          this.log(`⚠️  Template not found in test set: ${templateName}`);
        }
      }
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new SimpleEmailTest();
  test.testAllTemplates()
    .then(() => test.testEmailTriggerButtons())
    .catch(console.error);
}

module.exports = SimpleEmailTest;