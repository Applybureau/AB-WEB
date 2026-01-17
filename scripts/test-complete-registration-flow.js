/**
 * COMPLETE REGISTRATION FLOW TEST
 * Tests the entire registration process from payment confirmation to account creation
 */

const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'israelloko65@gmail.com';
const ADMIN_PASSWORD = 'admin123';

async function testCompleteRegistrationFlow() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║    COMPLETE REGISTRATION FLOW TEST             ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  let adminToken = null;
  let consultationId = null;
  let registrationToken = null;
  let clientToken = null;

  try {
    // Step 1: Admin Login
    console.log('📝 Step 1: Admin Login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (loginResponse.data.token) {
      adminToken = loginResponse.data.token;
      console.log('✅ Admin logged in successfully\n');
    } else {
      throw new Error('No token received from login');
    }

    // Step 2: Create Consultation Request
    console.log('📝 Step 2: Creating consultation request...');
    const testEmail = 'regtest_' + Date.now() + '@example.com';
    const testName = 'Registration Test User';
    
    const consultationResponse = await axios.post(
      `${BASE_URL}/api/public-consultations`,
      {
        full_name: testName,
        email: testEmail,
        phone: '+1234567890',
        country: 'United States',
        preferred_date: '2026-02-15',
        preferred_time: '14:00',
        message: 'Testing complete registration flow'
      }
    );
    
    if (consultationResponse.data.consultation?.id) {
      consultationId = consultationResponse.data.consultation.id;
      console.log(`✅ Consultation created: ${consultationId}\n`);
    } else {
      throw new Error('No consultation ID received');
    }

    // Step 3: Confirm Payment and Generate Registration Token
    console.log('📝 Step 3: Confirming payment and generating registration token...');
    const paymentResponse = await axios.post(
      `${BASE_URL}/api/admin/concierge/payment/confirm-and-invite`,
      {
        consultation_id: consultationId,
        client_email: testEmail,
        client_name: testName,
        payment_amount: 500,
        payment_date: new Date().toISOString().split('T')[0],
        package_tier: 'Professional Package',
        package_type: 'tier',
        payment_method: 'bank_transfer',
        payment_reference: 'TEST-' + Date.now()
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    
    if (paymentResponse.data.registration_token) {
      registrationToken = paymentResponse.data.registration_token;
      console.log('✅ Registration token generated');
      console.log(`   Token: ${registrationToken.substring(0, 50)}...`);
      console.log(`   Expires: ${paymentResponse.data.token_expires_at}`);
      console.log(`   Registration URL: ${paymentResponse.data.registration_url}\n`);
    } else {
      console.log('❌ No registration token in response');
      console.log('Response:', JSON.stringify(paymentResponse.data, null, 2));
      throw new Error('No registration token received');
    }

    // Step 4: Validate Registration Token
    console.log('📝 Step 4: Validating registration token...');
    const validateResponse = await axios.get(
      `${BASE_URL}/api/client-registration/validate-token/${registrationToken}`
    );
    
    if (validateResponse.data.valid) {
      console.log('✅ Token is valid');
      console.log(`   Client: ${validateResponse.data.client.full_name}`);
      console.log(`   Email: ${validateResponse.data.client.email}`);
      console.log(`   Expires: ${validateResponse.data.client.expires_at}\n`);
    } else {
      throw new Error('Token validation failed: ' + validateResponse.data.error);
    }

    // Step 5: Complete Registration
    console.log('📝 Step 5: Completing client registration...');
    const password = 'TestPassword123!';
    const registerResponse = await axios.post(
      `${BASE_URL}/api/client-registration/register`,
      {
        token: registrationToken,
        password: password,
        confirm_password: password
      }
    );
    
    if (registerResponse.data.token) {
      clientToken = registerResponse.data.token;
      console.log('✅ Registration completed successfully');
      console.log(`   Client ID: ${registerResponse.data.user.id}`);
      console.log(`   Email: ${registerResponse.data.user.email}`);
      console.log(`   Name: ${registerResponse.data.user.full_name}`);
      console.log(`   Profile Unlocked: ${registerResponse.data.user.profile_unlocked}`);
      console.log(`   Payment Confirmed: ${registerResponse.data.user.payment_confirmed}`);
      console.log(`   Auth Token: ${clientToken.substring(0, 50)}...\n`);
    } else {
      throw new Error('No auth token received after registration');
    }

    // Step 6: Test Client Login
    console.log('📝 Step 6: Testing client login with new credentials...');
    const clientLoginResponse = await axios.post(
      `${BASE_URL}/api/auth/login`,
      {
        email: testEmail,
        password: password
      }
    );
    
    if (clientLoginResponse.data.token) {
      console.log('✅ Client can login successfully');
      console.log(`   Token: ${clientLoginResponse.data.token.substring(0, 50)}...\n`);
    } else {
      throw new Error('Client login failed');
    }

    // Step 7: Access Client Dashboard
    console.log('📝 Step 7: Accessing client dashboard...');
    const dashboardResponse = await axios.get(
      `${BASE_URL}/api/client/dashboard`,
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );
    
    if (dashboardResponse.data) {
      console.log('✅ Client dashboard accessible');
      console.log(`   Dashboard data received\n`);
    } else {
      throw new Error('Dashboard access failed');
    }

    // Step 8: Check Onboarding Status
    console.log('📝 Step 8: Checking onboarding status...');
    const onboardingResponse = await axios.get(
      `${BASE_URL}/api/client/onboarding-20q/status`,
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );
    
    console.log('✅ Onboarding status retrieved');
    console.log(`   Status: ${onboardingResponse.data.status || 'Not started'}\n`);

    // Final Summary
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║           TEST COMPLETED SUCCESSFULLY          ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    console.log('✅ All Steps Passed:\n');
    console.log('   1. ✅ Admin login');
    console.log('   2. ✅ Consultation creation');
    console.log('   3. ✅ Payment confirmation & token generation');
    console.log('   4. ✅ Token validation');
    console.log('   5. ✅ Client registration');
    console.log('   6. ✅ Client login');
    console.log('   7. ✅ Dashboard access');
    console.log('   8. ✅ Onboarding status check\n');
    
    console.log('📋 Test Details:\n');
    console.log(`   Test Email: ${testEmail}`);
    console.log(`   Test Password: ${password}`);
    console.log(`   Consultation ID: ${consultationId}`);
    console.log(`   Registration Token Expiry: 15 days`);
    console.log(`   Frontend URL: https://apply-bureau.vercel.app\n`);
    
    console.log('🎉 REGISTRATION FLOW IS WORKING PERFECTLY!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('\n📋 Test Progress:');
    console.log(`   Admin Token: ${adminToken ? '✅' : '❌'}`);
    console.log(`   Consultation ID: ${consultationId ? '✅' : '❌'}`);
    console.log(`   Registration Token: ${registrationToken ? '✅' : '❌'}`);
    console.log(`   Client Token: ${clientToken ? '✅' : '❌'}\n`);
    
    process.exit(1);
  }
}

// Run the test
testCompleteRegistrationFlow();
