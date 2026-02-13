const { sendEmail } = require('./utils/email');

/**
 * Test the fixed invite email functionality
 * This verifies that the signup_invite template works correctly
 */

async function testInviteEmail() {
  console.log('🧪 Testing Invite Email Fix...\n');

  try {
    // Test data matching what the endpoint sends
    const testData = {
      client_name: 'Test Client',
      registration_link: 'https://applybureau.com/register?token=test123',
      token_expiry: '7 days',
      admin_name: 'Apply Bureau Team'
    };

    console.log('📧 Sending test invite email with data:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('');

    // Send the email using the correct template name
    const result = await sendEmail(
      process.env.TEST_EMAIL || 'israelloko65@gmail.com',
      'signup_invite',
      testData
    );

    console.log('✅ SUCCESS! Invite email sent successfully');
    console.log('Email ID:', result.id);
    console.log('');
    console.log('📋 Template used: signup_invite.html');
    console.log('🎯 Fix verified: Template name corrected from "client_registration_invite" to "signup_invite"');
    console.log('');
    console.log('✨ The invite email functionality is now working!');

  } catch (error) {
    console.error('❌ FAILED:', error.message);
    console.error('');
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the test
testInviteEmail();
