#!/usr/bin/env node

/**
 * Test Verified Domain Email
 * Tests that emails are sent from the verified domain admin@applybureau.com
 */

require('dotenv').config();
const { sendApplicationUpdateEmail } = require('./utils/email');

const testVerifiedDomainEmail = async () => {
  console.log('📧 Testing Verified Domain Email System...');
  console.log('From: Apply Bureau <admin@applybureau.com>');
  console.log('To: israelloko65@gmail.com');
  console.log('=' .repeat(50));

  try {
    const result = await sendApplicationUpdateEmail('israelloko65@gmail.com', {
      client_name: 'Test User',
      company_name: 'Tech Company',
      position_title: 'Software Engineer',
      application_status: 'review',
      message: 'Your application is being reviewed by our team. This email is sent from our verified domain admin@applybureau.com.',
      next_steps: 'We will update you within 2-3 business days with the next steps.',
      consultant_email: 'applybureau@gmail.com',
      user_id: 'test-verified-domain'
    });

    console.log('✅ Email sent successfully!');
    console.log(`📧 Email ID: ${result.id}`);
    console.log('');
    console.log('🎯 Verification Steps:');
    console.log('1. Check your email inbox for the application update');
    console.log('2. Verify the "From" field shows: Apply Bureau <admin@applybureau.com>');
    console.log('3. Test the reply functionality - replies should go to applybureau@gmail.com');
    console.log('4. Check that the email is not in spam (verified domain should improve deliverability)');
    console.log('');
    console.log('✅ Email System Configuration:');
    console.log('   - From Address: admin@applybureau.com (verified domain)');
    console.log('   - Reply-To: applybureau@gmail.com (consultant email)');
    console.log('   - Support Contact: support@applybureau.com');
    console.log('   - No more testing mode - production ready!');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Verify admin@applybureau.com is verified in Resend dashboard');
    console.log('2. Check RESEND_API_KEY is correct');
    console.log('3. Ensure domain DNS records are properly configured');
  }
};

testVerifiedDomainEmail();