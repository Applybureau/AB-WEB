require('dotenv').config();
const axios = require('axios');

const VERCEL_URL = 'https://apply-bureau-backend.vercel.app';

async function testVercelEndpointDirect() {
  console.log('🧪 Testing Vercel Endpoint Directly\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Health check
    console.log('\n📝 Test 1: Health check...');
    try {
      const healthResponse = await axios.get(`${VERCEL_URL}/health`);
      console.log('✅ Health check passed');
      console.log('Response:', healthResponse.data);
    } catch (healthError) {
      console.error('❌ Health check failed:', healthError.message);
    }

    // Test 2: Try payment verification without auth to see the error
    console.log('\n📝 Test 2: Payment verification without auth...');
    
    const paymentData = {
      client_email: "test@example.com",
      client_name: "Test Client",
      payment_amount: "299",
      payment_date: "2026-01-15",
      package_tier: "Tier 2",
      package_type: "tier",
      selected_services: []
    };

    try {
      const response = await axios.post(
        `${VERCEL_URL}/api/admin/concierge/payment/confirm-and-invite`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Request succeeded (unexpected)');
      console.log('Response:', response.data);

    } catch (error) {
      console.log('\n📛 Expected Error (no auth):');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Error:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('Error:', error.message);
      }
    }

    // Test 3: Check if route exists
    console.log('\n📝 Test 3: Checking route registration...');
    try {
      const response = await axios.options(`${VERCEL_URL}/api/admin/concierge/payment/confirm-and-invite`);
      console.log('✅ Route exists');
      console.log('Allowed methods:', response.headers['allow'] || 'Not specified');
    } catch (error) {
      if (error.response) {
        console.log('Status:', error.response.status);
        if (error.response.status === 404) {
          console.error('❌ Route not found on Vercel!');
        } else {
          console.log('Route exists but returned:', error.response.status);
        }
      }
    }

    // Test 4: List available routes (if there's an endpoint)
    console.log('\n📝 Test 4: Testing base API...');
    try {
      const response = await axios.get(`${VERCEL_URL}/api/health`);
      console.log('✅ API is accessible');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('API health check:', error.message);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testVercelEndpointDirect();
