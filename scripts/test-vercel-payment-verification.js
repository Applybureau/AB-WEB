require('dotenv').config();
const axios = require('axios');

const VERCEL_URL = 'https://apply-bureau-backend.vercel.app';

async function testVercelPaymentVerification() {
  console.log('🧪 Testing Payment Verification on Vercel\n');
  console.log('='.repeat(60));
  console.log('URL:', VERCEL_URL);
  console.log('='.repeat(60));

  try {
    // Step 1: Login as admin
    console.log('\n📝 Step 1: Login as admin...');
    const loginResponse = await axios.post(`${VERCEL_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'Admin@123456'
    });

    if (!loginResponse.data.token) {
      console.error('❌ Login failed - no token received');
      console.log('Response:', loginResponse.data);
      return;
    }

    const adminToken = loginResponse.data.token;
    console.log('✅ Admin logged in successfully');
    console.log('Token:', adminToken.substring(0, 20) + '...');

    // Step 2: Test payment verification with frontend format
    console.log('\n📝 Step 2: Testing payment verification...');
    
    const paymentData = {
      client_email: "israelloko65@gmail.com",
      client_name: "Test Client",
      payment_amount: "299",
      payment_date: "2026-01-15",
      package_tier: "Tier 2",
      package_type: "tier",
      selected_services: []
    };

    console.log('\n📋 Payment Data:');
    console.log(JSON.stringify(paymentData, null, 2));

    try {
      console.log('\n🔄 Sending request to Vercel...');
      const response = await axios.post(
        `${VERCEL_URL}/api/admin/concierge/payment/confirm-and-invite`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('\n✅ Payment verification successful!');
      console.log('\n📊 Response:');
      console.log(JSON.stringify(response.data, null, 2));

    } catch (verifyError) {
      console.error('\n❌ Payment verification failed!');
      
      if (verifyError.response) {
        console.error('\n📛 Error Details:');
        console.error('Status:', verifyError.response.status);
        console.error('Status Text:', verifyError.response.statusText);
        console.error('\n📄 Error Response:');
        console.error(JSON.stringify(verifyError.response.data, null, 2));
        console.error('\n📋 Response Headers:');
        console.error(JSON.stringify(verifyError.response.headers, null, 2));
      } else if (verifyError.request) {
        console.error('\n📛 No response received from server');
        console.error('Request:', verifyError.request);
      } else {
        console.error('\n📛 Error:', verifyError.message);
      }
      
      throw verifyError;
    }

  } catch (error) {
    console.error('\n❌ Test failed');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

console.log('🚀 Starting Vercel Payment Verification Test...\n');
testVercelPaymentVerification();
