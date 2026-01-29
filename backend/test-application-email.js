#!/usr/bin/env node

/**
 * Quick test for application update email functionality
 */

require('dotenv').config();
const { sendApplicationUpdateEmail } = require('./utils/email');

const testEmail = async () => {
  console.log('🧪 Testing Application Update Email...');
  
  try {
    const result = await sendApplicationUpdateEmail('israelloko65@gmail.com', {
      client_name: 'John Doe',
      company_name: 'Tech Corp',
      position_title: 'Senior Software Engineer',
      application_status: 'review',
      message: 'Hello, your application is being reviewed! We have submitted your profile to the hiring team.',
      next_steps: 'The hiring team will review your application within 3-5 business days.',
      consultant_email: 'applybureau@gmail.com',
      user_id: 'test-123'
    });

    console.log('✅ Email sent successfully!');
    console.log('Email ID:', result.id);
    console.log('');
    console.log('🎯 Check your email and test the reply functionality!');
    console.log('When you reply, it should go to: applybureau@gmail.com');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testEmail();