const { sendEmail } = require('../utils/email');

async function testEmailDelivery() {
  console.log('🧪 Testing email delivery in production mode...');
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    EMAIL_TESTING_MODE: process.env.EMAIL_TESTING_MODE,
    VERIFIED_EMAIL_DOMAIN: process.env.VERIFIED_EMAIL_DOMAIN
  });

  try {
    // Test email to a different address
    const testEmail = 'test@example.com';
    console.log(`\n📧 Attempting to send email to: ${testEmail}`);
    
    const result = await sendEmail(testEmail, 'consultation_under_review', {
      client_name: 'Test User',
      role_targets: 'Software Engineer',
      package_interest: 'Premium Package',
      next_steps: 'This is a test email to verify production delivery.',
      estimated_response: '24 hours',
      submission_date: new Date().toLocaleDateString()
    });

    console.log('✅ Email sent successfully:', result);
    console.log('\n🎯 If this email was sent to the intended recipient, the fix is working!');
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    if (error.statusCode === 403) {
      console.log('\n⚠️  This is likely due to Resend API restrictions.');
      console.log('💡 For production, you need to:');
      console.log('   1. Verify your domain with Resend');
      console.log('   2. Set VERIFIED_EMAIL_DOMAIN in your environment');
      console.log('   3. Or upgrade to a paid Resend plan');
    }
  }
}

testEmailDelivery().catch(console.error);