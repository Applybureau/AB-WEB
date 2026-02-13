require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@applybureau.com';
const ADMIN_PASSWORD = 'Admin@2024!';

let adminToken = null;

// Helper function to login as admin
async function loginAsAdmin() {
  try {
    console.log('\n🔐 Logging in as admin...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    adminToken = response.data.token;
    console.log('✅ Admin login successful');
    return adminToken;
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test 1: Payment Verification with Email
async function testPaymentVerification() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 1: Payment Verification with Email');
  console.log('='.repeat(70));

  try {
    const paymentData = {
      consultation_id: null, // Can be null for direct payment
      client_email: 'test@example.com',
      client_name: 'Test User',
      payment_amount: '499',
      payment_date: '2026-02-13',
      package_tier: 'Tier 2',
      package_type: 'tier',
      selected_services: [],
      payment_method: 'interac_etransfer',
      payment_reference: 'TEST-' + Date.now(),
      admin_notes: 'Test payment verification'
    };

    console.log('\n📤 Sending payment verification request...');
    console.log('Endpoint: POST /api/admin/concierge/payment-confirmation');
    console.log('Data:', JSON.stringify(paymentData, null, 2));

    const response = await axios.post(
      `${BASE_URL}/api/admin/concierge/payment-confirmation`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Payment verification successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    // Verify required fields
    const requiredFields = ['success', 'email_sent', 'registration_url', 'client_email'];
    const missingFields = requiredFields.filter(field => !(field in response.data));
    
    if (missingFields.length > 0) {
      console.log('\n⚠️  Missing required fields:', missingFields);
    } else {
      console.log('\n✅ All required fields present');
    }

    if (response.data.email_sent === true) {
      console.log('✅ email_sent: true (Frontend will show success)');
    } else {
      console.log('❌ email_sent: false (Frontend will show error)');
    }

    return response.data;
  } catch (error) {
    console.error('\n❌ Payment verification failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

// Test 2: Profile Unlock with Email
async function testProfileUnlock(clientId) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 2: Profile Unlock with Email');
  console.log('='.repeat(70));

  try {
    console.log('\n📤 Sending profile unlock request...');
    console.log('Endpoint: POST /api/admin/clients/:id/unlock');
    console.log('Client ID:', clientId || 'Will use test client');

    // If no client ID provided, try to get one from registered_users
    if (!clientId) {
      console.log('\n🔍 Looking for a test client...');
      const { supabaseAdmin } = require('./utils/supabase');
      const { data: clients } = await supabaseAdmin
        .from('registered_users')
        .select('id, email, full_name, profile_unlocked')
        .eq('role', 'client')
        .eq('profile_unlocked', false)
        .limit(1);

      if (clients && clients.length > 0) {
        clientId = clients[0].id;
        console.log('✅ Found test client:', clients[0].email);
      } else {
        console.log('⚠️  No unlocked clients found. Skipping this test.');
        return null;
      }
    }

    const response = await axios.post(
      `${BASE_URL}/api/admin/clients/${clientId}/unlock`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Profile unlock successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    // Verify required fields
    const requiredFields = ['success', 'email_sent', 'profile_unlocked'];
    const missingFields = requiredFields.filter(field => !(field in response.data));
    
    if (missingFields.length > 0) {
      console.log('\n⚠️  Missing required fields:', missingFields);
    } else {
      console.log('\n✅ All required fields present');
    }

    if (response.data.email_sent === true) {
      console.log('✅ email_sent: true (Frontend will show success)');
    } else {
      console.log('❌ email_sent: false (Frontend will show error)');
    }

    return response.data;
  } catch (error) {
    console.error('\n❌ Profile unlock failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

// Test 3: Alternative unlock endpoint (onboardingWorkflow)
async function testAlternativeUnlockEndpoint(clientId) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 3: Alternative Profile Unlock Endpoint');
  console.log('='.repeat(70));

  try {
    console.log('\n📤 Sending profile unlock request...');
    console.log('Endpoint: PATCH /api/admin/clients/:id/unlock');

    if (!clientId) {
      console.log('⚠️  No client ID provided. Skipping this test.');
      return null;
    }

    const response = await axios.patch(
      `${BASE_URL}/api/admin/clients/${clientId}/unlock`,
      {
        profile_unlocked: true,
        admin_notes: 'Test unlock via alternative endpoint'
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Profile unlock successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.data.email_sent === true) {
      console.log('✅ email_sent: true');
    } else {
      console.log('⚠️  email_sent: false or missing');
    }

    return response.data;
  } catch (error) {
    console.error('\n❌ Profile unlock failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 EMAIL NOTIFICATION ENDPOINTS TEST');
  console.log('='.repeat(70));
  console.log('Testing backend email notification functionality');
  console.log('Base URL:', BASE_URL);
  console.log('='.repeat(70));

  try {
    // Login as admin
    await loginAsAdmin();

    // Test 1: Payment verification
    const paymentResult = await testPaymentVerification();

    // Test 2: Profile unlock (new endpoint)
    await testProfileUnlock();

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    
    if (paymentResult && paymentResult.email_sent === true) {
      console.log('✅ Payment verification endpoint working correctly');
    } else {
      console.log('❌ Payment verification endpoint needs attention');
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Check email inbox for test emails');
    console.log('2. Verify registration links work correctly');
    console.log('3. Test with real consultation data');
    console.log('4. Deploy to production');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
