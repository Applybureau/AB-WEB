const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';

async function testVerifyInvite() {
  console.log('🧪 Testing Verify & Invite Functionality');
  console.log('=====================================');

  try {
    // First, let's test admin login to get a token
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'applybureau@gmail.com',
      password: 'Admin123@#'
    });

    if (loginResponse.status !== 200) {
      console.log('❌ Admin login failed');
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test 2: Check if consultation confirmation works
    console.log('\n2. Testing consultation confirmation...');
    try {
      // First get consultations to see if any exist
      const consultationsResponse = await axios.get(`${BASE_URL}/api/admin/concierge/consultations`, { headers });
      console.log(`✅ Found ${consultationsResponse.data.consultations?.length || 0} consultations`);
      
      if (consultationsResponse.data.consultations?.length > 0) {
        const consultation = consultationsResponse.data.consultations[0];
        console.log(`   First consultation: ${consultation.prospect_name} (${consultation.status})`);
      }
    } catch (error) {
      console.log('❌ Failed to fetch consultations:', error.response?.data?.error || error.message);
    }

    // Test 3: Test payment confirmation endpoint (Verify & Invite)
    console.log('\n3. Testing payment confirmation (Verify & Invite)...');
    try {
      const paymentData = {
        client_email: 'test@example.com',
        client_name: 'Test Client',
        payment_amount: 500,
        payment_date: new Date().toISOString().split('T')[0],
        package_tier: 'Standard Package',
        package_type: 'tier',
        selected_services: ['Resume Review', 'Interview Prep'],
        payment_method: 'interac_etransfer',
        payment_reference: 'TEST-REF-123',
        admin_notes: 'Test payment confirmation'
      };

      const paymentResponse = await axios.post(`${BASE_URL}/api/admin/concierge/payment-confirmation`, paymentData, { headers });
      
      if (paymentResponse.status === 200) {
        console.log('✅ Payment confirmation (Verify & Invite) working');
        console.log('   Response:', paymentResponse.data.message);
      } else {
        console.log('❌ Payment confirmation failed with status:', paymentResponse.status);
      }
    } catch (error) {
      console.log('❌ Payment confirmation failed:', error.response?.data?.error || error.message);
      if (error.response?.data?.details) {
        console.log('   Details:', error.response.data.details);
      }
    }

    // Test 4: Test alternative payment endpoint
    console.log('\n4. Testing alternative payment endpoint...');
    try {
      const altPaymentData = {
        client_email: 'test2@example.com',
        client_name: 'Test Client 2',
        payment_amount: 750,
        payment_date: new Date().toISOString().split('T')[0],
        package_tier: 'Premium Package',
        package_type: 'tier',
        selected_services: ['Full Service'],
        payment_method: 'interac_etransfer',
        payment_reference: 'TEST-REF-456',
        admin_notes: 'Test alternative payment endpoint'
      };

      const altPaymentResponse = await axios.post(`${BASE_URL}/api/admin/concierge/payment/confirm-and-invite`, altPaymentData, { headers });
      
      if (altPaymentResponse.status === 200) {
        console.log('✅ Alternative payment endpoint working');
        console.log('   Response:', altPaymentResponse.data.message);
      } else {
        console.log('❌ Alternative payment endpoint failed with status:', altPaymentResponse.status);
      }
    } catch (error) {
      console.log('❌ Alternative payment endpoint failed:', error.response?.data?.error || error.message);
      if (error.response?.data?.details) {
        console.log('   Details:', error.response.data.details);
      }
    }

    // Test 5: Check if routes are properly mounted
    console.log('\n5. Testing route availability...');
    const routesToTest = [
      '/api/admin/concierge/consultations',
      '/api/consultation-management',
      '/api/consultations'
    ];

    for (const route of routesToTest) {
      try {
        const response = await axios.get(`${BASE_URL}${route}`, { headers });
        console.log(`✅ ${route} - Available (${response.status})`);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`❌ ${route} - Not Found (404)`);
        } else {
          console.log(`⚠️  ${route} - Error: ${error.response?.status || 'Unknown'}`);
        }
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
}

// Run the test
testVerifyInvite().then(() => {
  console.log('\n🏁 Test completed');
}).catch(error => {
  console.error('💥 Test crashed:', error.message);
});