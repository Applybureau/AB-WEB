/**
 * DIRECT RESEND API KEY TEST
 * 
 * This script tests if the RESEND_API_KEY works by making a direct API call
 * to Resend, bypassing all application code.
 * 
 * Usage: node backend/test-resend-api-key-direct.js
 */

const axios = require('axios');

const RESEND_API_KEY = 're_DkzYXYAB_DN7Td7bHkh6FFYbT9sLvHib8';
const TEST_EMAIL = 'israelloko65@gmail.com';

console.log('🧪 Testing Resend API Key Directly\n');
console.log('API Key:', RESEND_API_KEY.substring(0, 10) + '...');
console.log('Test Email:', TEST_EMAIL);
console.log('\n' + '='.repeat(60) + '\n');

async function testResendAPI() {
  try {
    console.log('📧 Sending test email via Resend API...\n');

    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: 'Apply Bureau <admin@applybureau.com>',
        to: [TEST_EMAIL],
        subject: 'Direct Resend API Test',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>✅ Resend API Test Successful</h2>
            <p>This email was sent directly via the Resend API to test if the API key works.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Test Type:</strong> Direct API Call (bypassing application code)</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              If you received this email, the Resend API key is working correctly.
            </p>
          </div>
        `
      },
      {
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ SUCCESS: Email sent via Resend API\n');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n' + '='.repeat(60));
    console.log('✅ RESEND API KEY IS WORKING');
    console.log('='.repeat(60));
    console.log('\nCheck your inbox at:', TEST_EMAIL);
    console.log('\nIf the API key works but production emails fail, the issue is:');
    console.log('  1. RESEND_API_KEY not set in DigitalOcean environment variables');
    console.log('  2. Production code not using the correct API key');
    console.log('  3. Email template or code error in production');
    
    return true;
  } catch (error) {
    console.log('❌ FAILED: Could not send email via Resend API\n');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n' + '='.repeat(60));
        console.log('❌ API KEY IS INVALID OR EXPIRED');
        console.log('='.repeat(60));
        console.log('\nThe Resend API key is not working. Possible reasons:');
        console.log('  1. API key is incorrect');
        console.log('  2. API key has been revoked');
        console.log('  3. API key does not have sending permissions');
        console.log('\nAction: Generate a new API key from Resend dashboard');
      } else if (error.response.status === 403) {
        console.log('\n' + '='.repeat(60));
        console.log('❌ DOMAIN NOT VERIFIED');
        console.log('='.repeat(60));
        console.log('\nThe domain admin@applybureau.com is not verified in Resend.');
        console.log('Action: Verify the domain in Resend dashboard');
      } else if (error.response.status === 422) {
        console.log('\n' + '='.repeat(60));
        console.log('❌ INVALID EMAIL FORMAT');
        console.log('='.repeat(60));
        console.log('\nThe email format is invalid.');
      }
    } else {
      console.log('Error:', error.message);
      console.log('\n' + '='.repeat(60));
      console.log('❌ NETWORK ERROR');
      console.log('='.repeat(60));
      console.log('\nCould not connect to Resend API. Check internet connection.');
    }
    
    return false;
  }
}

testResendAPI()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
