#!/usr/bin/env node

/**
 * Application Update Email Test
 * Tests the new application update email functionality with reply-to
 */

const { sendApplicationUpdateEmail } = require('../utils/email');

const testApplicationUpdateEmail = async () => {
  console.log('🧪 Testing Application Update Email with Reply-To functionality...');
  
  try {
    // Test data
    const testClientEmail = 'israelloko65@gmail.com'; // Your verified test email
    const applicationData = {
      client_name: 'John Doe',
      company_name: 'Tech Corp',
      position_title: 'Senior Software Engineer',
      application_status: 'review',
      message: 'Hello, your application is being reviewed! We have submitted your profile to the hiring team and they are currently evaluating your qualifications.',
      next_steps: 'The hiring team will review your application within 3-5 business days. If selected, you will receive an interview invitation directly to your email.',
      consultant_email: 'applybureau@gmail.com', // This is where replies will go
      user_id: 'test-user-123'
    };

    console.log('📧 Sending test application update email...');
    console.log(`   To: ${testClientEmail}`);
    console.log(`   Reply-To: ${applicationData.consultant_email}`);
    console.log(`   Company: ${applicationData.company_name}`);
    console.log(`   Position: ${applicationData.position_title}`);
    console.log(`   Status: ${applicationData.application_status}`);

    const result = await sendApplicationUpdateEmail(testClientEmail, applicationData);

    console.log('✅ Application update email sent successfully!');
    console.log(`   Email ID: ${result.id}`);
    console.log('');
    console.log('🎯 How to test the reply functionality:');
    console.log('1. Check your email inbox for the application update');
    console.log('2. Click "Reply" in your email client');
    console.log('3. Notice that the "To" field automatically shows: applybureau@gmail.com');
    console.log('4. Send a test reply - it will go directly to the consultant email');
    console.log('');
    console.log('💡 This creates a seamless user experience:');
    console.log('   - Professional emails from admin@applybureau.com');
    console.log('   - Replies go directly to applybureau@gmail.com');
    console.log('   - No backend storage needed for conversations');
    console.log('   - Client uses familiar Gmail interface');

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Run the test
testApplicationUpdateEmail().then(success => {
  process.exit(success ? 0 : 1);
});