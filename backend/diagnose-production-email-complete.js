/**
 * COMPREHENSIVE PRODUCTION EMAIL DIAGNOSTIC SCRIPT
 * 
 * This script diagnoses why emails are not being sent in production
 * despite the code being deployed and frontend showing success.
 * 
 * Usage: node backend/diagnose-production-email-complete.js <ADMIN_TOKEN>
 */

const axios = require('axios');

const PRODUCTION_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';
const TEST_EMAIL = 'israelloko65@gmail.com'; // Verified test email

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.magenta}${'='.repeat(60)}${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.magenta}${'='.repeat(60)}${colors.reset}\n`)
};

async function runDiagnostics(adminToken) {
  log.section('PRODUCTION EMAIL DIAGNOSTIC REPORT');
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const results = {
    serverReachable: false,
    authValid: false,
    endpointExists: false,
    emailSentFlag: null,
    responseData: null,
    errors: []
  };

  // TEST 1: Check if production server is reachable
  log.section('TEST 1: Server Reachability');
  try {
    const response = await axios.get(`${PRODUCTION_URL}/health`, { timeout: 10000 });
    results.serverReachable = true;
    log.success(`Production server is reachable`);
    log.info(`Health check response: ${JSON.stringify(response.data)}`);
  } catch (error) {
    results.serverReachable = false;
    results.errors.push('Server not reachable');
    log.error(`Production server is NOT reachable`);
    log.error(`Error: ${error.message}`);
    return results; // Can't continue if server is down
  }

  // TEST 2: Verify admin authentication
  log.section('TEST 2: Admin Authentication');
  try {
    const response = await axios.get(`${PRODUCTION_URL}/api/admin/clients`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      timeout: 10000
    });
    results.authValid = true;
    log.success(`Admin token is valid`);
    log.info(`Found ${response.data.clients?.length || 0} clients in database`);
  } catch (error) {
    results.authValid = false;
    results.errors.push('Invalid admin token');
    log.error(`Admin token is INVALID or expired`);
    log.error(`Status: ${error.response?.status}`);
    log.error(`Error: ${error.response?.data?.error || error.message}`);
    return results; // Can't continue without valid auth
  }

  // TEST 3: Test payment confirmation endpoint
  log.section('TEST 3: Payment Confirmation Endpoint Test');
  const testPayload = {
    consultation_id: null,
    client_email: TEST_EMAIL,
    client_name: 'Production Test User',
    payment_amount: '499',
    payment_date: new Date().toISOString().split('T')[0],
    package_tier: 'Diagnostic Test Package',
    package_type: 'tier',
    selected_services: [],
    payment_method: 'test',
    payment_reference: `DIAGNOSTIC-${Date.now()}`,
    admin_notes: 'Production diagnostic test - please ignore'
  };

  log.info('Sending test payment confirmation...');
  log.info(`Payload: ${JSON.stringify(testPayload, null, 2)}`);

  try {
    const response = await axios.post(
      `${PRODUCTION_URL}/api/admin/concierge/payment-confirmation`,
      testPayload,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    results.endpointExists = true;
    results.responseData = response.data;
    results.emailSentFlag = response.data.email_sent;

    log.success(`Endpoint responded successfully`);
    log.info(`Response status: ${response.status}`);
    log.info(`Full response: ${JSON.stringify(response.data, null, 2)}`);

    // Check email_sent flag
    if (response.data.email_sent === true) {
      log.success(`✅ EMAIL_SENT FLAG IS TRUE - Email should have been sent!`);
      log.info(`Check inbox at: ${TEST_EMAIL}`);
    } else if (response.data.email_sent === false) {
      log.error(`❌ EMAIL_SENT FLAG IS FALSE - Email was NOT sent`);
      results.errors.push('email_sent flag is false');
    } else {
      log.warning(`⚠️  EMAIL_SENT FLAG IS MISSING from response`);
      results.errors.push('email_sent flag missing from response');
    }

    // Check for registration URL
    if (response.data.registration_url) {
      log.success(`Registration URL generated: ${response.data.registration_url}`);
    } else {
      log.warning(`Registration URL missing from response`);
    }

  } catch (error) {
    results.endpointExists = false;
    results.errors.push(`Endpoint error: ${error.message}`);
    
    log.error(`Endpoint request FAILED`);
    log.error(`Status: ${error.response?.status}`);
    log.error(`Error: ${error.response?.data?.error || error.message}`);
    
    if (error.response?.data) {
      log.info(`Full error response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }

  // TEST 4: Check environment variables (indirect test)
  log.section('TEST 4: Environment Configuration Check');
  log.info('Testing if RESEND_API_KEY is configured...');
  
  // We can't directly check env vars, but we can infer from the response
  if (results.emailSentFlag === false) {
    log.warning('Email sending failed - possible causes:');
    log.warning('  1. RESEND_API_KEY not set in DigitalOcean environment');
    log.warning('  2. RESEND_API_KEY is invalid or expired');
    log.warning('  3. Resend domain not verified');
    log.warning('  4. Email template file missing');
    log.warning('  5. Code deployment did not update properly');
  }

  // TEST 5: Check if code is actually deployed
  log.section('TEST 5: Code Deployment Verification');
  log.info('Checking if latest code is deployed...');
  
  // Try to trigger an endpoint that should log specific messages
  try {
    const response = await axios.post(
      `${PRODUCTION_URL}/api/admin/concierge/payment-confirmation`,
      {
        client_email: 'diagnostic@test.com',
        client_name: 'Diagnostic',
        payment_amount: '1'
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (response.data.hasOwnProperty('email_sent')) {
      log.success('Latest code IS deployed (email_sent flag present)');
    } else {
      log.error('Latest code may NOT be deployed (email_sent flag missing)');
      results.errors.push('Code may not be deployed');
    }
  } catch (error) {
    // Expected to fail with minimal data, but we can check the error structure
    if (error.response?.data?.hasOwnProperty('email_sent')) {
      log.success('Latest code IS deployed (email_sent flag present in error)');
    }
  }

  // FINAL REPORT
  log.section('DIAGNOSTIC SUMMARY');
  
  console.log(`Server Reachable: ${results.serverReachable ? '✅ YES' : '❌ NO'}`);
  console.log(`Auth Valid: ${results.authValid ? '✅ YES' : '❌ NO'}`);
  console.log(`Endpoint Exists: ${results.endpointExists ? '✅ YES' : '❌ NO'}`);
  console.log(`Email Sent Flag: ${results.emailSentFlag === true ? '✅ TRUE' : results.emailSentFlag === false ? '❌ FALSE' : '⚠️  MISSING'}`);
  
  if (results.errors.length > 0) {
    log.section('ERRORS FOUND');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  // RECOMMENDATIONS
  log.section('RECOMMENDATIONS');
  
  if (!results.serverReachable) {
    log.error('CRITICAL: Production server is down or unreachable');
    log.info('Action: Check DigitalOcean app status and logs');
  } else if (!results.authValid) {
    log.error('CRITICAL: Admin token is invalid');
    log.info('Action: Generate a new admin token');
  } else if (!results.endpointExists) {
    log.error('CRITICAL: Payment confirmation endpoint not working');
    log.info('Action: Check server logs for errors');
  } else if (results.emailSentFlag === false) {
    log.error('CRITICAL: Emails are not being sent');
    log.info('Action: Check the following in DigitalOcean:');
    console.log('  1. Go to DigitalOcean App Platform');
    console.log('  2. Select your app');
    console.log('  3. Go to Settings > App-Level Environment Variables');
    console.log('  4. Verify RESEND_API_KEY is set to: re_DkzYXYAB_DN7Td7bHkh6FFYbT9sLvHib8');
    console.log('  5. If missing or wrong, add/update it');
    console.log('  6. Redeploy the app after updating');
    console.log('');
    log.info('Also check:');
    console.log('  - Resend dashboard: https://resend.com/emails');
    console.log('  - Verify domain admin@applybureau.com is verified');
    console.log('  - Check if API key has sending permissions');
  } else if (results.emailSentFlag === true) {
    log.success('SUCCESS: Email was sent!');
    log.info(`Check inbox at: ${TEST_EMAIL}`);
    log.info('If email not received, check:');
    console.log('  - Spam/junk folder');
    console.log('  - Resend dashboard for delivery status');
    console.log('  - Email provider blocking');
  } else {
    log.warning('UNKNOWN: email_sent flag is missing from response');
    log.info('Action: Code may not be fully deployed');
    log.info('Redeploy the application to DigitalOcean');
  }

  log.section('NEXT STEPS');
  
  if (results.emailSentFlag === false) {
    console.log('1. SSH into DigitalOcean or check app logs');
    console.log('2. Look for email sending errors in logs');
    console.log('3. Verify RESEND_API_KEY environment variable');
    console.log('4. Test Resend API key directly:');
    console.log('   curl https://api.resend.com/emails \\');
    console.log('     -H "Authorization: Bearer re_DkzYXYAB_DN7Td7bHkh6FFYbT9sLvHib8" \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"from":"admin@applybureau.com","to":"israelloko65@gmail.com","subject":"Test","html":"Test"}\'');
  }

  console.log('\n');
  return results;
}

// Main execution
const adminToken = process.argv[2];

if (!adminToken) {
  console.error('❌ Error: Admin token required');
  console.log('Usage: node backend/diagnose-production-email-complete.js <ADMIN_TOKEN>');
  console.log('');
  console.log('To get an admin token:');
  console.log('1. Login to admin dashboard');
  console.log('2. Open browser console');
  console.log('3. Run: localStorage.getItem("token")');
  process.exit(1);
}

runDiagnostics(adminToken)
  .then((results) => {
    console.log('\n✅ Diagnostic complete\n');
    process.exit(results.errors.length > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnostic failed:', error.message);
    process.exit(1);
  });
