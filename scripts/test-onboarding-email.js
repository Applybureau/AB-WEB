#!/usr/bin/env node

/**
 * Test script to send an onboarding email after payment verification
 * This simulates the email that would be sent to a user after they've paid
 * and are ready to register for their Apply Bureau account
 */

require('dotenv').config();
const { sendEmail } = require('../utils/email');
const crypto = require('crypto');

async function sendTestOnboardingEmail() {
  console.log('🧪 Testing Onboarding Email Delivery');
  console.log('=====================================');
  
  try {
    // Generate a mock registration token (in real scenario, this would be stored in database)
    const registrationToken = crypto.randomBytes(32).toString('hex');
    const frontendUrl = process.env.FRONTEND_URL || 'https://apply-bureau.vercel.app';
    const registrationUrl = `${frontendUrl}/register?token=${registrationToken}`;
    
    // Email variables for the onboarding email
    const emailVariables = {
      client_name: 'Israel Loko',
      payment_amount: '$2,500',
      payment_method: 'Bank Transfer',
      package_tier: 'Premium Career Advancement',
      admin_name: 'Sarah Johnson',
      registration_url: registrationUrl,
      token_expiry: '7 days',
      next_steps: 'Once you create your account, you\'ll complete a comprehensive 20-question onboarding questionnaire that helps us understand your career goals, experience, and preferences. This allows us to provide personalized guidance and match you with the most relevant opportunities.',
      dashboard_url: `${frontendUrl}/dashboard`,
      current_year: new Date().getFullYear()
    };
    
    console.log('📧 Sending onboarding email with the following details:');
    console.log(`   Recipient: israelloko65@gmail.com`);
    console.log(`   Template: payment_verified_registration`);
    console.log(`   Client Name: ${emailVariables.client_name}`);
    console.log(`   Package: ${emailVariables.package_tier}`);
    console.log(`   Payment Amount: ${emailVariables.payment_amount}`);
    console.log(`   Registration URL: ${emailVariables.registration_url}`);
    console.log('');
    
    // Send the email
    const result = await sendEmail(
      'israelloko65@gmail.com',
      'payment_verified_registration',
      emailVariables
    );
    
    console.log('✅ Email sent successfully!');
    console.log('📊 Email Details:');
    console.log(`   Email ID: ${result.id}`);
    console.log(`   Status: Sent`);
    console.log('');
    console.log('📋 What the email contains:');
    console.log('   • Payment verification confirmation');
    console.log('   • Registration link to create account');
    console.log('   • Journey progress timeline');
    console.log('   • Next steps after registration');
    console.log('   • Package details and benefits');
    console.log('   • Important expiry information');
    console.log('');
    console.log('🎯 Next Steps for Testing:');
    console.log('   1. Check israelloko65@gmail.com for the email');
    console.log('   2. Click the registration link (note: token is mock, won\'t work)');
    console.log('   3. Verify email formatting and content');
    console.log('   4. Test on different email clients if needed');
    
  } catch (error) {
    console.error('❌ Failed to send onboarding email:', error);
    
    if (error.message?.includes('API key')) {
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('   • Check RESEND_API_KEY in .env file');
      console.log('   • Verify API key is valid and active');
    }
    
    if (error.message?.includes('domain')) {
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('   • Email domain may not be verified');
      console.log('   • Using default Resend domain for testing');
    }
    
    process.exit(1);
  }
}

// Additional test function to send multiple email templates for comparison
async function sendAllOnboardingTemplates() {
  console.log('🧪 Testing All Onboarding-Related Email Templates');
  console.log('================================================');
  
  const templates = [
    {
      name: 'payment_verified_registration',
      description: 'Post-payment registration email',
      variables: {
        client_name: 'Israel Loko',
        payment_amount: '$2,500',
        payment_method: 'Bank Transfer',
        package_tier: 'Premium Career Advancement',
        admin_name: 'Sarah Johnson',
        registration_url: `${process.env.FRONTEND_URL}/register?token=test123`,
        token_expiry: '7 days',
        next_steps: 'Complete your registration and onboarding questionnaire.'
      }
    },
    {
      name: 'onboarding_completion',
      description: 'Registration complete welcome email',
      variables: {
        client_name: 'Israel Loko',
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard`
      }
    },
    {
      name: 'onboarding_completed',
      description: 'Onboarding questionnaire completed',
      variables: {
        client_name: 'Israel Loko',
        admin_name: 'Sarah Johnson',
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard`
      }
    }
  ];
  
  for (const template of templates) {
    try {
      console.log(`\n📧 Sending ${template.name}...`);
      const result = await sendEmail(
        'israelloko65@gmail.com',
        template.name,
        template.variables
      );
      console.log(`✅ ${template.description} sent successfully (ID: ${result.id})`);
    } catch (error) {
      console.error(`❌ Failed to send ${template.name}:`, error.message);
    }
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--all')) {
    sendAllOnboardingTemplates();
  } else {
    sendTestOnboardingEmail();
  }
}

module.exports = {
  sendTestOnboardingEmail,
  sendAllOnboardingTemplates
};