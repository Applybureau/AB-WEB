const { sendEmail, buildUrl } = require('./utils/email');
require('dotenv').config();

// Test the payment confirmation email sending
async function testPaymentConfirmationEmail() {
  console.log('🧪 Testing Payment Confirmation Email');
  console.log('=====================================\n');

  // Check environment variables
  console.log('Environment Check:');
  console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set (will use default)');
  console.log('- EMAIL_TESTING_MODE:', process.env.EMAIL_TESTING_MODE || 'false');
  console.log('');

  // Test data matching what the frontend sends
  const testData = {
    client_email: 'israelloko65@gmail.com', // Your test email
    client_name: 'Test Client',
    payment_amount: '$500',
    payment_date: new Date().toISOString().split('T')[0],
    package_tier: 'Standard Package',
    package_type: 'tier',
    selected_services: ['Resume Review', 'Interview Prep'],
    payment_method: 'interac_etransfer',
    payment_reference: 'TEST-REF-12345',
    admin_name: 'Admin Test User'
  };

  // Generate a test token
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { 
      email: testData.client_email,
      name: testData.client_name,
      type: 'registration',
      payment_confirmed: true
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const tokenExpiry = new Date();
  tokenExpiry.setDate(tokenExpiry.getDate() + 7);

  const registrationUrl = buildUrl(`/register?token=${token}`);

  console.log('Test Data:');
  console.log('- Client Email:', testData.client_email);
  console.log('- Client Name:', testData.client_name);
  console.log('- Payment Amount:', testData.payment_amount);
  console.log('- Registration URL:', registrationUrl);
  console.log('');

  try {
    console.log('📧 Attempting to send email...\n');
    
    const result = await sendEmail(
      testData.client_email, 
      'payment_confirmed_welcome_concierge', 
      {
        client_name: testData.client_name,
        payment_amount: testData.payment_amount,
        payment_date: testData.payment_date,
        package_tier: testData.package_tier,
        package_type: testData.package_type,
        selected_services: testData.selected_services.join(', '),
        payment_method: testData.payment_method,
        payment_reference: testData.payment_reference,
        registration_url: registrationUrl,
        registration_link: registrationUrl,
        token_expiry: tokenExpiry.toLocaleDateString(),
        admin_name: testData.admin_name,
        next_steps: 'Click the registration link to create your account and begin your onboarding process.',
        current_year: new Date().getFullYear()
      }
    );

    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('');
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('');
    console.log('✅ Check your inbox at:', testData.client_email);
    console.log('');
    
  } catch (error) {
    console.error('❌ EMAIL SENDING FAILED!');
    console.error('');
    console.error('Error Details:');
    console.error('- Message:', error.message);
    console.error('- Name:', error.name);
    console.error('- Stack:', error.stack);
    console.error('');
    
    if (error.response) {
      console.error('API Response Error:');
      console.error(JSON.stringify(error.response, null, 2));
    }
    
    console.error('');
    console.error('Possible Issues:');
    console.error('1. RESEND_API_KEY is invalid or expired');
    console.error('2. Email template has syntax errors');
    console.error('3. Resend API is down or rate limited');
    console.error('4. Domain verification issues with Resend');
    console.error('');
    
    process.exit(1);
  }
}

// Run the test
testPaymentConfirmationEmail()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
