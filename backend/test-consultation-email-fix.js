#!/usr/bin/env node

/**
 * Comprehensive Email Testing Script for Consultation Engine
 * Tests all email functionality and identifies issues
 */

require('dotenv').config();
const { sendEmail } = require('./utils/email');
const { supabaseAdmin } = require('./utils/supabase');

// Test configuration
const TEST_EMAIL = 'applybureau@gmail.com'; // Changed to the new admin email
const TEST_CLIENT_EMAIL = 'israelloko65@gmail.com';

class EmailTester {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📧',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    }[type] || '📧';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testEmailTemplate(templateName, variables, description) {
    try {
      this.log(`Testing ${description}...`);
      
      const result = await sendEmail(
        TEST_EMAIL,
        templateName,
        variables
      );
      
      this.results.push({
        template: templateName,
        description,
        status: 'success',
        result
      });
      
      this.log(`${description} - SUCCESS`, 'success');
      return true;
    } catch (error) {
      this.errors.push({
        template: templateName,
        description,
        error: error.message
      });
      
      this.log(`${description} - FAILED: ${error.message}`, 'error');
      return false;
    }
  }

  async testConsultationConfirmation() {
    return await this.testEmailTemplate(
      'consultation_confirmed',
      {
        client_name: 'John Doe',
        consultation_date: '2024-02-15',
        consultation_time: '2:00 PM',
        meeting_link: 'https://meet.google.com/test-link',
        meeting_details: 'Your consultation has been confirmed.',
        admin_message: 'Looking forward to speaking with you!'
      },
      'Consultation Confirmation Email'
    );
  }

  async testPaymentVerification() {
    return await this.testEmailTemplate(
      'payment_confirmed_welcome_concierge',
      {
        client_name: 'Jane Smith',
        admin_message: 'Payment received. Welcome to Apply Bureau!',
        next_steps: 'You will receive registration details shortly.',
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard`
      },
      'Payment Verification Email'
    );
  }

  async testAdminWelcome() {
    return await this.testEmailTemplate(
      'admin_welcome',
      {
        admin_name: 'New Admin',
        admin_email: 'newadmin@applybureau.com',
        login_url: `${process.env.FRONTEND_URL}/admin/login`,
        super_admin_email: 'applybureau@gmail.com',
        current_year: new Date().getFullYear()
      },
      'Admin Welcome Email (without password)'
    );
  }

  async testClientInvite() {
    return await this.testEmailTemplate(
      'signup_invite',
      {
        client_name: 'Test Client',
        registration_link: `${process.env.FRONTEND_URL}/complete-registration?token=test-token`,
        advisor_name: 'Your Advisor',
        current_year: new Date().getFullYear()
      },
      'Client Invitation Email'
    );
  }

  async testApplicationUpdate() {
    return await this.testEmailTemplate(
      'application_update',
      {
        client_name: 'Test Client',
        company_name: 'Test Company',
        position_title: 'Software Engineer',
        application_status: 'interview',
        message: 'Your application is progressing well!',
        next_steps: 'Prepare for the interview.',
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard`,
        reply_to: 'applybureau@gmail.com'
      },
      'Application Update Email with Reply-To'
    );
  }

  async testEmailVariableReplacement() {
    this.log('Testing variable replacement in templates...');
    
    try {
      const { getEmailTemplate, replaceTemplateVariables } = require('./utils/email');
      
      // Test admin welcome template
      const template = await getEmailTemplate('admin_welcome');
      const variables = {
        admin_name: 'Test Admin',
        admin_email: 'test@applybureau.com',
        current_year: '2024'
      };
      
      const result = replaceTemplateVariables(template, variables);
      
      // Check if variables were replaced
      const hasPlaceholders = result.includes('{{admin_name}}') || 
                             result.includes('{{admin_email}}') || 
                             result.includes('{{current_year}}');
      
      if (hasPlaceholders) {
        this.log('Variable replacement FAILED - placeholders still present', 'error');
        this.errors.push({
          test: 'Variable Replacement',
          error: 'Template variables not being replaced properly'
        });
        return false;
      } else {
        this.log('Variable replacement SUCCESS', 'success');
        return true;
      }
    } catch (error) {
      this.log(`Variable replacement test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testDatabaseConsultationUpdate() {
    this.log('Testing database consultation update with email...');
    
    try {
      // Create a test consultation
      const { data: consultation, error: createError } = await supabaseAdmin
        .from('consultations')
        .insert({
          prospect_name: 'Test Client',
          prospect_email: TEST_CLIENT_EMAIL,
          message: 'Test consultation request',
          status: 'pending',
          consultation_type: 'initial',
          scheduled_at: new Date().toISOString(), // Add required scheduled_at
          preferred_slots: [
            { date: '2024-02-15', time: '14:00' },
            { date: '2024-02-16', time: '15:00' }
          ]
        })
        .select()
        .single();

      if (createError) {
        this.log(`Failed to create test consultation: ${createError.message}`, 'error');
        return false;
      }

      this.log(`Created test consultation with ID: ${consultation.id}`);

      // Update consultation status to confirmed
      const { data: updatedConsultation, error: updateError } = await supabaseAdmin
        .from('consultations')
        .update({
          status: 'confirmed',
          scheduled_at: '2024-02-15T14:00:00Z',
          meeting_link: 'https://meet.google.com/test-meeting'
        })
        .eq('id', consultation.id)
        .select()
        .single();

      if (updateError) {
        this.log(`Failed to update consultation: ${updateError.message}`, 'error');
        return false;
      }

      // Test sending confirmation email
      const emailSent = await this.testEmailTemplate(
        'consultation_confirmed',
        {
          client_name: updatedConsultation.prospect_name,
          consultation_date: new Date(updatedConsultation.scheduled_at).toLocaleDateString(),
          consultation_time: new Date(updatedConsultation.scheduled_at).toLocaleTimeString(),
          meeting_link: updatedConsultation.meeting_link,
          meeting_details: 'Your consultation has been confirmed.'
        },
        'Database Consultation Confirmation'
      );

      // Clean up test data
      await supabaseAdmin
        .from('consultations')
        .delete()
        .eq('id', consultation.id);

      this.log('Test consultation cleaned up');
      return emailSent;
    } catch (error) {
      this.log(`Database consultation test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting comprehensive email testing...', 'info');
    this.log(`Using admin email: ${TEST_EMAIL}`, 'info');
    this.log(`Using client test email: ${TEST_CLIENT_EMAIL}`, 'info');
    
    const tests = [
      () => this.testEmailVariableReplacement(),
      () => this.testConsultationConfirmation(),
      () => this.testPaymentVerification(),
      () => this.testAdminWelcome(),
      () => this.testClientInvite(),
      () => this.testApplicationUpdate(),
      () => this.testDatabaseConsultationUpdate()
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
      
      // Wait between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.log('\n📊 TEST RESULTS SUMMARY:', 'info');
    this.log(`✅ Passed: ${passed}`, 'success');
    this.log(`❌ Failed: ${failed}`, 'error');
    
    if (this.errors.length > 0) {
      this.log('\n🔍 ERRORS FOUND:', 'error');
      this.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.description || error.test}: ${error.error}`, 'error');
      });
    }

    if (this.results.length > 0) {
      this.log('\n✅ SUCCESSFUL TESTS:', 'success');
      this.results.forEach((result, index) => {
        this.log(`${index + 1}. ${result.description}`, 'success');
      });
    }

    return { passed, failed, errors: this.errors, results: this.results };
  }
}

// Run the tests
async function main() {
  const tester = new EmailTester();
  
  try {
    const results = await tester.runAllTests();
    
    if (results.failed > 0) {
      process.exit(1);
    } else {
      console.log('\n🎉 All email tests passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = EmailTester;