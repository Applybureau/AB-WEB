require('dotenv').config();
const axios = require('axios');

async function testPaymentConfirmation() {
  try {
    console.log('💳 Testing Payment Confirmation');
    console.log('===============================');
    
    // Step 1: Admin login
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Step 2: Test payment confirmation
    console.log('💰 Testing payment confirmation and invite...');
    const paymentData = {
      client_email: 'test.client@example.com',
      client_name: 'Test Client',
      payment_amount: 2500.00,
      payment_method: 'interac_etransfer',
      payment_reference: 'TEST-12345',
      admin_notes: 'Test payment confirmation'
    };
    
    try {
      const paymentResponse = await axios.post(
        'http://localhost:3000/api/admin/concierge/payment/confirm-and-invite',
        paymentData,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      
      console.log('✅ Payment confirmation successful!');
      console.log('   Client Email:', paymentResponse.data.client_email);
      console.log('   Amount:', paymentResponse.data.payment_amount);
      console.log('   Registration Token Generated:', paymentResponse.data.registration_token ? 'Yes' : 'No');
      console.log('   Token Expires:', paymentResponse.data.token_expires_at);
      
    } catch (paymentError) {
      console.log('❌ Payment confirmation failed');
      console.log('   Status:', paymentError.response?.status);
      console.log('   Error:', paymentError.response?.data || paymentError.message);
      
      // Log more details
      if (paymentError.response?.data) {
        console.log('   Full Response:', JSON.stringify(paymentError.response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('   Response:', error.response.data);
    }
  }
}

testPaymentConfirmation();