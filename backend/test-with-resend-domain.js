#!/usr/bin/env node

/**
 * Test with Resend's verified test domain
 */

require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

console.log('📧 Testing with Resend verified domain\n');

async function testWithVerifiedDomain() {
  const testEmail = {
    from: 'Apply Bureau <onboarding@resend.dev>',
    to: ['applybureau@gmail.com'],
    subject: 'Test Email - Using Resend Verified Domain',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Test Email from Apply Bureau</h1>
        <p>This email is sent using Resend's verified test domain: <strong>onboarding@resend.dev</strong></p>
        <p>If you receive this, it means:</p>
        <ul>
          <li>✅ Your Resend API key is working</li>
          <li>✅ Email sending functionality is operational</li>
          <li>⚠️ You need to verify applybureau.com domain to use admin@applybureau.com</li>
        </ul>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 14px;">
          To fix this permanently, verify your domain at: 
          <a href="https://resend.com/domains">https://resend.com/domains</a>
        </p>
      </div>
    `
  };
  
  try {
    const { data, error } = await resend.emails.send(testEmail);
    
    if (error) {
      console.error('❌ Failed:', error.message);
      return;
    }
    
    console.log('✅ Email sent successfully!');
    console.log('   Email ID:', data.id);
    console.log('\n📬 Check applybureau@gmail.com inbox!');
    console.log('\n💡 To use admin@applybureau.com as sender:');
    console.log('   1. Go to https://resend.com/domains');
    console.log('   2. Add applybureau.com');
    console.log('   3. Add DNS records (SPF, DKIM, DMARC)');
    console.log('   4. Wait for verification (usually 5-10 minutes)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWithVerifiedDomain();
