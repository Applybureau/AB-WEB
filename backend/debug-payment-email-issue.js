require('dotenv').config();
const { sendEmail } = require('./utils/email');

console.log('🔍 DEBUGGING PAYMENT CONFIRMATION EMAIL ISSUE');
console.log('='.repeat(70));

// Check environment variables
console.log('\n1️⃣ Environment Variables Check:');
console.log('   RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing');
console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || '❌ Missing');
console.log('   ADMIN_EMAIL:', process.env.ADMIN_EMAIL || '❌ Missing');

// Test email sending directly
async function testEmailSending() {
  console.log('\n2️⃣ Testing Direct Email Send:');
  
  try {
    const testEmail = 'israelloko65@gmail.com'; // Your test email
    const testData = {
      client_name: 'Test Client',
      payment_amount: '499',
      payment_date: '2026-02-13',
      package_tier: 'Tier 2',
      package_type: 'tier',
      selected_services: 'Full service package',
      payment_method: 'interac_etransfer',
      payment_reference: 'TEST-' + Date.now(),
      registration_url: 'https://www.applybureau.com/register?token=test123',
      registration_link: 'https://www.applybureau.com/register?token=test123',
      token_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      admin_name: 'Test Admin',
      next_steps: 'Click the registration link to create your account.',
      current_year: new Date().getFullYear()
    };

    console.log('   Sending to:', testEmail);
    console.log('   Template: payment_confirmed_welcome_concierge');
    console.log('   Data:', JSON.stringify(testData, null, 2));

    const result = await sendEmail(testEmail, 'payment_confirmed_welcome_concierge', testData);
    
    console.log('\n✅ Email sent successfully!');
    console.log('   Result:', result);
    
    return true;
  } catch (error) {
    console.error('\n❌ Email sending failed!');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    
    return false;
  }
}

// Check if template exists
async function checkTemplate() {
  console.log('\n3️⃣ Checking Email Template:');
  
  const fs = require('fs');
  const path = require('path');
  
  const templatePath = path.join(__dirname, 'emails', 'templates', 'payment_confirmed_welcome_concierge.html');
  
  if (fs.existsSync(templatePath)) {
    console.log('   ✅ Template exists:', templatePath);
    const content = fs.readFileSync(templatePath, 'utf8');
    console.log('   Template size:', content.length, 'bytes');
    
    // Check for required placeholders
    const requiredPlaceholders = [
      'client_name',
      'registration_url',
      'payment_amount',
      'package_tier'
    ];
    
    console.log('\n   Checking placeholders:');
    requiredPlaceholders.forEach(placeholder => {
      const hasPlaceholder = content.includes(`{{${placeholder}}}`);
      console.log(`   ${hasPlaceholder ? '✅' : '❌'} {{${placeholder}}}`);
    });
    
    return true;
  } else {
    console.log('   ❌ Template not found:', templatePath);
    return false;
  }
}

// Run all checks
async function runDiagnostics() {
  console.log('\n' + '='.repeat(70));
  console.log('STARTING DIAGNOSTICS');
  console.log('='.repeat(70));
  
  const templateExists = await checkTemplate();
  
  if (!templateExists) {
    console.log('\n❌ Cannot proceed - template missing');
    process.exit(1);
  }
  
  const emailSent = await testEmailSending();
  
  console.log('\n' + '='.repeat(70));
  console.log('DIAGNOSTICS COMPLETE');
  console.log('='.repeat(70));
  
  if (emailSent) {
    console.log('\n✅ Email system is working correctly!');
    console.log('   Check your inbox at israelloko65@gmail.com');
    console.log('\n📋 Next Steps:');
    console.log('   1. Verify email was received');
    console.log('   2. Check spam folder if not in inbox');
    console.log('   3. Test the payment confirmation endpoint');
  } else {
    console.log('\n❌ Email system has issues!');
    console.log('\n📋 Troubleshooting:');
    console.log('   1. Verify RESEND_API_KEY is correct');
    console.log('   2. Check Resend dashboard for errors');
    console.log('   3. Verify domain is verified in Resend');
    console.log('   4. Check server logs for detailed errors');
  }
  
  process.exit(emailSent ? 0 : 1);
}

runDiagnostics().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
