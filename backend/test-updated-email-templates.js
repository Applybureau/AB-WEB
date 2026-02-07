#!/usr/bin/env node

/**
 * TEST UPDATED EMAIL TEMPLATES
 * 
 * This script tests all the newly updated email templates to ensure:
 * 1. Templates exist and are readable
 * 2. All required variables are present
 * 3. No hardcoded data exists
 * 4. Email sending works correctly
 */

require('dotenv').config({ path: __dirname + '/.env' });

const fs = require('fs');
const path = require('path');
const { sendEmail } = require('./utils/email');

console.log('🧪 TESTING UPDATED EMAIL TEMPLATES');
console.log('===================================\n');

const templatesDir = path.join(__dirname, 'emails', 'templates');

// Define required templates and their variables
const requiredTemplates = {
  'consultation_confirmed.html': {
    variables: ['client_name', 'consultation_date', 'consultation_time', 'consultation_duration', 'meeting_link', 'current_year'],
    description: 'Consultation Confirmed'
  },
  'consultation_rescheduled.html': {
    variables: ['client_name', 'new_date', 'new_time', 'current_year'],
    description: 'Consultation Rescheduled'
  },
  'consultation_waitlisted.html': {
    variables: ['client_name', 'current_year'],
    description: 'Consultation Waitlisted'
  },
  'payment_received_welcome.html': {
    variables: ['client_name', 'tier', 'dashboard_url', 'current_year'],
    description: 'Payment Confirmed Welcome'
  },
  'onboarding_completed.html': {
    variables: ['client_name', 'current_year'],
    description: 'Onboarding Completed'
  },
  'interview_update_enhanced.html': {
    variables: ['client_name', 'role_title', 'company_name', 'current_year'],
    description: 'Interview Update'
  },
  'strategy_call_confirmed.html': {
    variables: ['client_name', 'call_date', 'call_time', 'call_duration', 'current_year'],
    description: 'Strategy Call Confirmed'
  },
  'consultation_reminder.html': {
    variables: ['client_name', 'meeting_date', 'meeting_time', 'current_year'],
    description: 'Meeting Reminder'
  },
  'contact_form_received.html': {
    variables: ['client_name', 'current_year'],
    description: 'Contact Form Received'
  }
};

// Test 1: Check if all templates exist
console.log('1️⃣ CHECKING TEMPLATE FILES');
console.log('---------------------------');

let allTemplatesExist = true;
Object.keys(requiredTemplates).forEach(filename => {
  const filePath = path.join(templatesDir, filename);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${filename} exists`);
  } else {
    console.log(`❌ ${filename} MISSING`);
    allTemplatesExist = false;
  }
});

if (!allTemplatesExist) {
  console.log('\n❌ Some templates are missing. Please run update-all-email-templates.js first.');
  process.exit(1);
}

// Test 2: Check for required variables
console.log('\n2️⃣ CHECKING TEMPLATE VARIABLES');
console.log('-------------------------------');

let allVariablesPresent = true;
Object.entries(requiredTemplates).forEach(([filename, config]) => {
  const filePath = path.join(templatesDir, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log(`\n📄 ${config.description} (${filename})`);
  
  const missingVars = [];
  config.variables.forEach(variable => {
    const pattern = new RegExp(`{{${variable}}}`, 'g');
    if (content.match(pattern)) {
      console.log(`   ✅ {{${variable}}}`);
    } else {
      console.log(`   ❌ {{${variable}}} MISSING`);
      missingVars.push(variable);
      allVariablesPresent = false;
    }
  });
  
  if (missingVars.length === 0) {
    console.log(`   ✅ All variables present`);
  }
});

// Test 3: Check for hardcoded data
console.log('\n3️⃣ CHECKING FOR HARDCODED DATA');
console.log('-------------------------------');

const hardcodedPatterns = [
  { pattern: /Israel/gi, name: 'Hardcoded name "Israel"' },
  { pattern: /Tuesday, March 12/gi, name: 'Hardcoded date' },
  { pattern: /5:00 PM \(EST\)/gi, name: 'Hardcoded time' },
  { pattern: /Tier 2/gi, name: 'Hardcoded tier' },
  { pattern: /https:\/\/meet\.google\.com\/[a-z-]+/gi, name: 'Hardcoded Google Meet link' }
];

let noHardcodedData = true;
Object.entries(requiredTemplates).forEach(([filename, config]) => {
  const filePath = path.join(templatesDir, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const foundHardcoded = [];
  hardcodedPatterns.forEach(({ pattern, name }) => {
    if (content.match(pattern)) {
      foundHardcoded.push(name);
      noHardcodedData = false;
    }
  });
  
  if (foundHardcoded.length > 0) {
    console.log(`❌ ${filename}: Found hardcoded data`);
    foundHardcoded.forEach(item => console.log(`   - ${item}`));
  } else {
    console.log(`✅ ${filename}: No hardcoded data`);
  }
});

// Test 4: Test email sending (optional - requires email service)
console.log('\n4️⃣ TESTING EMAIL SENDING');
console.log('-------------------------');

const testEmail = process.env.TEST_EMAIL || 'test@example.com';
console.log(`Test email address: ${testEmail}`);

async function testEmailSending() {
  try {
    // Test consultation confirmed email
    console.log('\n📧 Testing Consultation Confirmed email...');
    
    const testData = {
      client_name: 'Test User',
      consultation_date: 'Tuesday, March 12',
      consultation_time: '5:00 PM (EST)',
      consultation_duration: '30–45 minutes',
      meeting_link: 'https://meet.google.com/test-link',
      current_year: new Date().getFullYear()
    };
    
    // Note: Uncomment to actually send test email
    // await sendEmail(testEmail, 'consultation_confirmed', testData);
    // console.log('✅ Test email sent successfully');
    
    console.log('ℹ️  Email sending test skipped (uncomment code to test)');
    console.log('   To test email sending:');
    console.log('   1. Set TEST_EMAIL environment variable');
    console.log('   2. Uncomment the sendEmail line in this script');
    console.log('   3. Run the script again');
    
  } catch (error) {
    console.log('❌ Email sending failed:', error.message);
  }
}

testEmailSending();

// Summary
console.log('\n📊 TEST SUMMARY');
console.log('===============');

const allTestsPassed = allTemplatesExist && allVariablesPresent && noHardcodedData;

if (allTestsPassed) {
  console.log('✅ ALL TESTS PASSED');
  console.log('\n🎉 Email templates are ready for production!');
  console.log('\nNext steps:');
  console.log('1. Commit the updated templates');
  console.log('2. Push to repository');
  console.log('3. Deploy to production');
  console.log('4. Test with real email sending');
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('\nPlease fix the issues above before deploying.');
  process.exit(1);
}

console.log('\n✨ Testing complete!');