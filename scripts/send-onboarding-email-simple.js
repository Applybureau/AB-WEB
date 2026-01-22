#!/usr/bin/env node

/**
 * Simple script to send onboarding emails
 * Usage: node send-onboarding-email-simple.js [email] [template]
 */

require('dotenv').config();
const { sendEmail } = require('../utils/email');
const crypto = require('crypto');

// Default email templates and their variables
const EMAIL_TEMPLATES = {
  'payment_verified': {
    template: 'payment_verified_registration',
    variables: {
      client_name: 'Israel Loko',
      payment_amount: '$2,500',
      payment_method: 'Bank Transfer',
      package_tier: 'Premium Career Advancement',
      admin_name: 'Sarah Johnson',
      registration_url: `${process.env.FRONTEND_URL}/register?token=${crypto.randomBytes(32).toString('hex')}`,
      token_expiry: '7 days',
      next_steps: 'Complete your registration and onboarding questionnaire to get started.'
    }
  },
  'welcome': {
    template: 'onboarding_completion',
    variables: {
      client_name: 'Israel Loko',
      dashboard_url: `${process.env.FRONTEND_URL}/dashboard`
    }
  },
  'questionnaire_complete': {
    template: 'onboarding_completed',
    variables: {
      client_name: 'Israel Loko',
      admin_name: 'Sarah Johnson',
      dashboard_url: `${process.env.FRONTEND_URL}/dashboard`
    }
  }
};

async function sendOnboardingEmail(email = 'israelloko65@gmail.com', templateType = 'payment_verified') {
  try {
    const emailConfig = EMAIL_TEMPLATES[templateType];
    
    if (!emailConfig) {
      console.error(`❌ Unknown template type: ${templateType}`);
      console.log('Available templates:', Object.keys(EMAIL_TEMPLATES).join(', '));
      return;
    }
    
    console.log(`📧 Sending ${templateType} email to ${email}...`);
    
    const result = await sendEmail(
      email,
      emailConfig.template,
      emailConfig.variables
    );
    
    console.log(`✅ Email sent successfully! ID: ${result.id}`);
    
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
  }
}

// Command line usage
if (require.main === module) {
  const [email, templateType] = process.argv.slice(2);
  sendOnboardingEmail(email, templateType);
}

module.exports = { sendOnboardingEmail, EMAIL_TEMPLATES };