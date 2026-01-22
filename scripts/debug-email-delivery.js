#!/usr/bin/env node

/**
 * Debug Email Delivery - Step by step diagnosis
 */

require('dotenv').config();
const { sendEmail } = require('../utils/email');
const { Resend } = require('resend');

async function debugEmailDelivery() {
  console.log('🔍 EMAIL DELIVERY DIAGNOSTIC');
  console.log('============================');
  
  // Step 1: Check environment variables
  console.log('\n1. 📋 Environment Check:');
  console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'Not set'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
  
  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY is missing! Email cannot be sent.');
    return;
  }
  
  // Step 2: Test Resend API directly
  console.log('\n2. 🧪 Testing Resend API directly...');
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const directResult = await resend.emails.send({
      from: 'Apply Bureau <onboarding@resend.dev>',
      to: ['israelloko65@gmail.com'],
      subject: 'Direct API Test - Apply Bureau',
      html: `
        <h1>Direct API Test</h1>
        <p>This is a direct test of the Resend API.</p>
        <p>If you receive this, the API key is working.</p>
        <p>Time: ${new Date().toISOString()}</p>
      `
    });
    
    console.log('✅ Direct API test successful!');
    console.log(`   Email ID: ${directResult.data.id}`);
    
  } catch (error) {
    console.log('❌ Direct API test failed:', error.message);
    if (error.message.includes('API key')) {
      console.log('   Issue: Invalid API key');
    }
    return;
  }
  
  // Step 3: Test email utility function
  console.log('\n3. 🛠️  Testing email utility function...');
  try {
    const utilResult = await sendEmail(
      'israelloko65@gmail.com',
      'payment_verified_registration',
      {
        client_name: 'Israel Loko',
        payment_amount: '$2,500',
        payment_method: 'Bank Transfer',
        package_tier: 'Premium Career Advancement',
        admin_name: 'Sarah Johnson',
        registration_url: `${process.env.FRONTEND_URL}/register?token=test123`,
        token_expiry: '7 days',
        next_steps: 'Complete your registration and onboarding questionnaire.'
      }
    );
    
    console.log('✅ Email utility test successful!');
    console.log(`   Email ID: ${utilResult.id}`);
    
  } catch (error) {
    console.log('❌ Email utility test failed:', error.message);
    console.log('   Full error:', error);
    return;
  }
  
  // Step 4: Test simple template
  console.log('\n4. 📧 Testing simple email template...');
  try {
    const simpleResult = await sendEmail(
      'israelloko65@gmail.com',
      'onboarding_completion',
      {
        client_name: 'Israel Loko',
        dashboard_url: `${process.env.FRONTEND_URL}/dashboard`
      }
    );
    
    console.log('✅ Simple template test successful!');
    console.log(`   Email ID: ${simpleResult.id}`);
    
  } catch (error) {
    console.log('❌ Simple template test failed:', error.message);
  }
  
  console.log('\n🎯 DIAGNOSTIC COMPLETE');
  console.log('======================');
  console.log('📬 Check israelloko65@gmail.com for test emails');
  console.log('📱 Also check spam/junk folder');
  console.log('⏰ Emails may take 1-2 minutes to arrive');
  
  // Step 5: Wait and check delivery status
  console.log('\n5. ⏳ Waiting 30 seconds to check delivery...');
  setTimeout(async () => {
    console.log('\n📊 Email should have been delivered by now.');
    console.log('   If you didn\'t receive emails, possible issues:');
    console.log('   • Email in spam/junk folder');
    console.log('   • Gmail blocking/filtering');
    console.log('   • Resend domain reputation');
    console.log('   • Network/firewall issues');
  }, 30000);
}

debugEmailDelivery();