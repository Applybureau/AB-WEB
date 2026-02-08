#!/usr/bin/env node

/**
 * Direct Resend API Test
 * Tests the Resend API directly to diagnose the issue
 */

require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

console.log('🔍 RESEND API DIAGNOSTIC TEST');
console.log('================================\n');
console.log('API Key:', process.env.RESEND_API_KEY ? '✅ Found' : '❌ Missing');
console.log('API Key (first 10 chars):', process.env.RESEND_API_KEY?.substring(0, 10) + '...\n');

async function testResendDirect() {
  console.log('📤 Attempting to send test email...\n');
  
  const testEmail = {
    from: 'Apply Bureau <admin@applybureau.com>',
    to: ['applybureau@gmail.com'],
    subject: 'Test Email - Resend Diagnostic',
    html: '<h1>Test Email</h1><p>This is a test email to diagnose the Resend issue.</p>'
  };
  
  console.log('Email config:', JSON.stringify(testEmail, null, 2));
  console.log('\n');
  
  try {
    const { data, error } = await resend.emails.send(testEmail);
    
    if (error) {
      console.error('❌ RESEND ERROR:', JSON.stringify(error, null, 2));
      console.log('\n📋 ERROR DETAILS:');
      console.log('   Status Code:', error.statusCode);
      console.log('   Error Name:', error.name);
      console.log('   Message:', error.message);
      
      if (error.statusCode === 403) {
        console.log('\n💡 SOLUTION:');
        console.log('   The domain "applybureau.com" needs to be verified in Resend.');
        console.log('   Options:');
        console.log('   1. Verify domain at: https://resend.com/domains');
        console.log('   2. Use a verified sender email (check your Resend dashboard)');
        console.log('   3. Use Resend test domain: onboarding@resend.dev');
      }
      
      return;
    }
    
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('   Email ID:', data.id);
    console.log('   Recipient:', testEmail.to[0]);
    console.log('\n📬 Check applybureau@gmail.com inbox!');
    
  } catch (error) {
    console.error('❌ UNEXPECTED ERROR:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testResendDirect();
