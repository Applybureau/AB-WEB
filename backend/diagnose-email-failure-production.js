require('dotenv').config();
const axios = require('axios');
const { sendEmail } = require('./utils/email');

const PRODUCTION_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

console.log('🔍 COMPREHENSIVE EMAIL FAILURE DIAGNOSIS');
console.log('='.repeat(80));

// Test 1: Check Environment Variables
function checkEnvironment() {
  console.log('\n1️⃣ ENVIRONMENT VARIABLES CHECK');
  console.log('-'.repeat(80));
  
  const requiredVars = {
    'RESEND_API_KEY': process.env.RESEND_API_KEY,
    'FRONTEND_URL': process.env.FRONTEND_URL,
    'ADMIN_EMAIL': process.env.ADMIN_EMAIL,
    'JWT_SECRET': process.env.JWT_SECRET
  };
  
  let allPresent = true;
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      console.log(`✅ ${key}: ${key === 'RESEND_API_KEY' || key === 'JWT_SECRET' ? '[HIDDEN]' : value}`);
    } else {
      console.log(`❌ ${key}: MISSING`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

// Test 2: Test Direct Email Sending
async function testDirectEmail() {
  console.log('\n2️⃣ DIRECT EMAIL SENDING TEST');
  console.log('-'.repeat(80));
  
  try {
    console.log('Attempting to send test email...');
    const result = await sendEmail('israelloko65@gmail.com', 'payment_confirmed_welcome_concierge', {
      client_name: 'Test User',
      tier_name: 'Test Tier',
      payment_amount: '499',
      payment_date: '2026-02-13',
      package_tier: 'Tier 2',
      package_type: 'tier',
      selected_services: 'Full service',
      payment_method: 'test',
      payment_reference: 'TEST-' + Date.now(),
      registration_url: 'https://www.applybureau.com/register?token=test123',
      registration_link: 'https://www.applybureau.com/register?token=test123',
      token_expiry: '2026-02-20',
      admin_name: 'Test Admin',
      next_steps: 'Test next steps',
      current_year: 2026
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Email sending FAILED!');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
    return false;
  }
}

// Test 3: Test Production Endpoint
async function testProductionEndpoint(adminToken) {
  console.log('\n3️⃣ PRODUCTION ENDPOINT TEST');
  console.log('-'.repeat(80));
  
  if (!adminToken) {
    console.log('⚠️  No admin token provided. Skipping production test.');
    console.log('To test: node diagnose-email-failure-production.js YOUR_ADMIN_TOKEN');
    return null;
  }
  
  try {
    console.log('Testing:', PRODUCTION_URL + '/api/admin/concierge/payment-confirmation');
    
    const testData = {
      client_email: 'israelloko65@gmail.com',
      client_name: 'Production Test User',
      payment_amount: '499',
      payment_date: '2026-02-13',
      package_tier: 'Tier 2',
      package_type: 'tier',
      selected_services: [],
      payment_method: 'interac_etransfer',
      payment_reference: 'PROD-TEST-' + Date.now(),
      admin_notes: 'Production diagnostic test'
    };
    
    console.log('Request data:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(
      PRODUCTION_URL + '/api/admin/concierge/payment-confirmation',
      testData,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('\n✅ Production endpoint responded!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Check for email_sent flag
    if ('email_sent' in response.data) {
      if (response.data.email_sent === true) {
        console.log('\n✅ email_sent: true - Email should have been sent!');
      } else {
        console.log('\n❌ email_sent: false - Email was NOT sent!');
        console.log('⚠️  Check server logs for email error details');
      }
    } else {
      console.log('\n⚠️  email_sent flag is MISSING from response');
      console.log('This means the deployed code does NOT have the fix yet!');
    }
    
    return response.data;
  } catch (error) {
    console.log('\n❌ Production endpoint FAILED!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

// Test 4: Check Resend API Directly
async function testResendAPI() {
  console.log('\n4️⃣ RESEND API DIRECT TEST');
  console.log('-'.repeat(80));
  
  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY not found');
    return false;
  }
  
  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    console.log('Sending test email via Resend API...');
    
    const result = await resend.emails.send({
      from: 'Apply Bureau <admin@applybureau.com>',
      to: ['israelloko65@gmail.com'],
      subject: 'Diagnostic Test Email',
      html: '<h1>Test Email</h1><p>If you receive this, Resend API is working!</p>'
    });
    
    console.log('✅ Resend API working!');
    console.log('Email ID:', result.id);
    return true;
  } catch (error) {
    console.log('❌ Resend API FAILED!');
    console.log('Error:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n⚠️  RESEND_API_KEY is invalid or expired!');
      console.log('Action: Check your Resend dashboard and update the API key');
    }
    
    return false;
  }
}

// Test 5: Check Template Exists
function checkTemplate() {
  console.log('\n5️⃣ EMAIL TEMPLATE CHECK');
  console.log('-'.repeat(80));
  
  const fs = require('fs');
  const path = require('path');
  
  const templatePath = path.join(__dirname, 'emails', 'templates', 'payment_confirmed_welcome_concierge.html');
  
  if (fs.existsSync(templatePath)) {
    console.log('✅ Template exists:', templatePath);
    const content = fs.readFileSync(templatePath, 'utf8');
    console.log('Template size:', content.length, 'bytes');
    
    // Check for required placeholders
    const requiredPlaceholders = ['client_name', 'registration_link', 'tier_name'];
    console.log('\nChecking placeholders:');
    requiredPlaceholders.forEach(placeholder => {
      const hasPlaceholder = content.includes(`{{${placeholder}}}`);
      console.log(`${hasPlaceholder ? '✅' : '❌'} {{${placeholder}}}`);
    });
    
    return true;
  } else {
    console.log('❌ Template NOT found:', templatePath);
    return false;
  }
}

// Test 6: Check Server Logs (if accessible)
function checkServerLogs() {
  console.log('\n6️⃣ SERVER LOGS CHECK');
  console.log('-'.repeat(80));
  console.log('To check production logs:');
  console.log('1. Go to DigitalOcean Dashboard');
  console.log('2. Navigate to your App → Runtime Logs');
  console.log('3. Look for:');
  console.log('   - "✅ Registration email sent to: [email]"');
  console.log('   - "❌ Failed to send welcome email: [error]"');
  console.log('   - "Email sent successfully: { id: ... }"');
}

// Main diagnostic function
async function runDiagnostics() {
  const adminToken = process.argv[2];
  
  console.log('Starting comprehensive email diagnostics...\n');
  
  const results = {
    environment: false,
    directEmail: false,
    productionEndpoint: null,
    resendAPI: false,
    template: false
  };
  
  // Run all tests
  results.environment = checkEnvironment();
  results.template = checkTemplate();
  results.resendAPI = await testResendAPI();
  results.directEmail = await testDirectEmail();
  results.productionEndpoint = await testProductionEndpoint(adminToken);
  checkServerLogs();
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSTIC SUMMARY');
  console.log('='.repeat(80));
  
  console.log('\n📊 Test Results:');
  console.log(`Environment Variables: ${results.environment ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Email Template: ${results.template ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Resend API: ${results.resendAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Direct Email: ${results.directEmail ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Production Endpoint: ${results.productionEndpoint ? '✅ TESTED' : '⏭️  SKIPPED'}`);
  
  // Diagnosis
  console.log('\n🔍 DIAGNOSIS:');
  
  if (!results.environment) {
    console.log('❌ CRITICAL: Environment variables missing!');
    console.log('   Action: Check .env file and DigitalOcean environment variables');
  }
  
  if (!results.resendAPI) {
    console.log('❌ CRITICAL: Resend API not working!');
    console.log('   Action: Verify RESEND_API_KEY is correct and active');
    console.log('   Check: https://resend.com/api-keys');
  }
  
  if (!results.template) {
    console.log('❌ CRITICAL: Email template missing!');
    console.log('   Action: Ensure template file is deployed to production');
  }
  
  if (results.directEmail && !results.productionEndpoint?.email_sent) {
    console.log('⚠️  WARNING: Local email works but production doesn\'t!');
    console.log('   Possible causes:');
    console.log('   1. Production environment variables not set');
    console.log('   2. Code not deployed to production');
    console.log('   3. Production using different RESEND_API_KEY');
  }
  
  if (results.productionEndpoint && !('email_sent' in results.productionEndpoint)) {
    console.log('❌ CRITICAL: Production code missing email_sent flag!');
    console.log('   Action: Deploy the latest code to production');
    console.log('   Command: git push origin main');
  }
  
  if (results.productionEndpoint?.email_sent === false) {
    console.log('❌ CRITICAL: Production endpoint says email NOT sent!');
    console.log('   Action: Check production server logs for error details');
    console.log('   Likely cause: RESEND_API_KEY not set in production environment');
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (!results.resendAPI) {
    console.log('1. Verify RESEND_API_KEY in DigitalOcean environment variables');
    console.log('2. Check Resend dashboard for API key status');
    console.log('3. Ensure domain is verified in Resend');
  }
  
  if (results.directEmail && results.resendAPI) {
    console.log('✅ Local email system is working correctly!');
    console.log('Issue is likely in production deployment or configuration');
  }
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Fix any CRITICAL issues above');
  console.log('2. Redeploy if code changes needed');
  console.log('3. Verify environment variables in DigitalOcean');
  console.log('4. Test again with: node diagnose-email-failure-production.js YOUR_ADMIN_TOKEN');
  console.log('5. Check production logs for detailed error messages');
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
