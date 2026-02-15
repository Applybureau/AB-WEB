// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const axios = require('axios');
const { supabaseAdmin } = require('./utils/supabase');

/**
 * Test Unlock and Verify Email Endpoints
 * 
 * This script tests both endpoints with actual client data
 */

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// You'll need to replace this with a valid admin token
const ADMIN_TOKEN = 'YOUR_ADMIN_JWT_TOKEN_HERE';

async function testUnlockAndVerifyEndpoints() {
  console.log('🧪 TESTING UNLOCK & VERIFY EMAIL ENDPOINTS\n');
  console.log('='.repeat(70));
  
  // Get a test client
  console.log('\n📋 Step 1: Finding test client...\n');
  
  const { data: testClients, error } = await supabaseAdmin
    .from('registered_users')
    .select('id, email, full_name, profile_unlocked, email_verified')
    .eq('role', 'client')
    .limit(5);
  
  if (error || !testClients || testClients.length === 0) {
    console.log('❌ No test clients found');
    return;
  }
  
  console.log(`Found ${testClients.length} test clients:\n`);
  testClients.forEach((client, index) => {
    console.log(`${index + 1}. ${client.email}`);
    console.log(`   ID: ${client.id}`);
    console.log(`   Unlocked: ${client.profile_unlocked}`);
    console.log(`   Email Verified: ${client.email_verified}`);
    console.log('');
  });
  
  // Find a locked client for unlock test
  const lockedClient = testClients.find(c => !c.profile_unlocked);
  
  // Find an unverified client for verify test
  const unverifiedClient = testClients.find(c => !c.email_verified);
  
  // ==================== TEST 1: UNLOCK ENDPOINT ====================
  if (lockedClient) {
    console.log('\n' + '='.repeat(70));
    console.log('🔓 TEST 1: Unlock Account Endpoint\n');
    
    console.log(`Testing with client: ${lockedClient.email}`);
    console.log(`Client ID: ${lockedClient.id}\n`);
    
    try {
      console.log('Making request to unlock endpoint...');
      console.log(`POST ${BASE_URL}/api/admin/clients/${lockedClient.id}/unlock\n`);
      
      const response = await axios.post(
        `${BASE_URL}/api/admin/clients/${lockedClient.id}/unlock`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ UNLOCK TEST PASSED!\n');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.email_sent) {
        console.log('\n✅ Email was sent successfully!');
        console.log(`   Sent to: ${response.data.client_email || lockedClient.email}`);
      } else {
        console.log('\n⚠️  Email was NOT sent (check logs for errors)');
      }
      
    } catch (error) {
      console.log('❌ UNLOCK TEST FAILED!\n');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Error:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 401) {
          console.log('\n💡 TIP: You need to provide a valid admin JWT token');
          console.log('   Update ADMIN_TOKEN in this script with a real token');
        } else if (error.response.status === 404) {
          console.log('\n💡 TIP: Client not found in registered_users table');
          console.log('   Frontend may be passing wrong client ID');
        }
      } else {
        console.log('Error:', error.message);
      }
    }
  } else {
    console.log('\n⚠️  No locked clients available for unlock test');
    console.log('   All clients are already unlocked');
  }
  
  // ==================== TEST 2: VERIFY EMAIL ENDPOINT ====================
  if (unverifiedClient) {
    console.log('\n' + '='.repeat(70));
    console.log('📧 TEST 2: Resend Verification Email Endpoint\n');
    
    console.log(`Testing with client: ${unverifiedClient.email}`);
    console.log(`Client ID: ${unverifiedClient.id}\n`);
    
    try {
      console.log('Making request to resend verification endpoint...');
      console.log(`POST ${BASE_URL}/api/admin/clients/${unverifiedClient.id}/resend-verification\n`);
      
      const response = await axios.post(
        `${BASE_URL}/api/admin/clients/${unverifiedClient.id}/resend-verification`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ VERIFY EMAIL TEST PASSED!\n');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.email_sent) {
        console.log('\n✅ Verification email was sent successfully!');
        console.log(`   Sent to: ${response.data.sent_to}`);
      } else {
        console.log('\n⚠️  Email was NOT sent (check logs for errors)');
      }
      
    } catch (error) {
      console.log('❌ VERIFY EMAIL TEST FAILED!\n');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Error:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 401) {
          console.log('\n💡 TIP: You need to provide a valid admin JWT token');
          console.log('   Update ADMIN_TOKEN in this script with a real token');
        } else if (error.response.status === 404) {
          console.log('\n💡 TIP: Endpoint may not exist yet');
          console.log('   Make sure the new endpoint was added to backend/routes/admin.js');
        }
      } else {
        console.log('Error:', error.message);
      }
    }
  } else {
    console.log('\n⚠️  No unverified clients available for verify email test');
    console.log('   All clients have verified emails');
  }
  
  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY\n');
  
  console.log('Endpoints tested:');
  console.log('1. POST /api/admin/clients/:id/unlock');
  console.log('2. POST /api/admin/clients/:id/resend-verification\n');
  
  console.log('💡 IMPORTANT NOTES:\n');
  console.log('1. If you see 401 errors, you need a valid admin JWT token');
  console.log('2. To get a token, login as admin and copy from browser DevTools');
  console.log('3. Frontend must use these exact endpoints and HTTP methods');
  console.log('4. Frontend must pass client ID from registered_users table');
  console.log('5. Check server logs for detailed email sending information\n');
  
  console.log('🔍 DEBUGGING FRONTEND ISSUES:\n');
  console.log('If frontend calls don\'t send emails, check:');
  console.log('- Is frontend using POST method (not GET or PATCH)?');
  console.log('- Is frontend passing correct client ID?');
  console.log('- Is frontend including Authorization header?');
  console.log('- Check browser Network tab for actual request details');
  console.log('- Check backend logs for error messages\n');
  
  console.log('='.repeat(70));
  console.log('\n✅ Testing complete!\n');
}

// Run tests
if (require.main === module) {
  testUnlockAndVerifyEndpoints()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testUnlockAndVerifyEndpoints };
