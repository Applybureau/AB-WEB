require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testConsultationConfirmation() {
  try {
    console.log('🧪 Testing Consultation Confirmation');
    console.log('====================================');
    
    // Step 1: Admin login
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Step 2: Get consultation list
    console.log('📋 Getting consultation list...');
    const consultationsResponse = await axios.get(`${BASE_URL}/api/admin/concierge/consultations`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const consultations = consultationsResponse.data.consultations;
    console.log(`✅ Found ${consultations.length} consultations`);
    
    if (consultations.length === 0) {
      console.log('❌ No consultations found to test');
      return;
    }
    
    // Step 3: Try to confirm the first consultation
    const testConsultation = consultations[0];
    console.log(`🎯 Testing confirmation for consultation: ${testConsultation.id}`);
    console.log(`   Client: ${testConsultation.name}`);
    console.log(`   Time slots: ${testConsultation.preferred_slots?.length || 0}`);
    
    if (!testConsultation.preferred_slots || testConsultation.preferred_slots.length === 0) {
      console.log('❌ No time slots available for confirmation');
      return;
    }
    
    // Step 4: Attempt confirmation
    console.log('⏰ Attempting consultation confirmation...');
    try {
      const confirmResponse = await axios.post(
        `${BASE_URL}/api/admin/concierge/consultations/${testConsultation.id}/confirm`,
        {
          selected_slot_index: 0,
          meeting_details: 'Test confirmation - consultation confirmed',
          meeting_link: 'https://meet.google.com/test-meeting',
          admin_notes: 'Test confirmation from automated test'
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      
      console.log('✅ Consultation confirmation successful!');
      console.log(`   Confirmed time: ${confirmResponse.data.confirmed_time}`);
      console.log(`   Selected slot: ${JSON.stringify(confirmResponse.data.confirmed_slot)}`);
      
    } catch (confirmError) {
      console.log('❌ Consultation confirmation failed');
      console.log('   Error:', confirmError.response?.data || confirmError.message);
      
      // Log more details about the error
      if (confirmError.response?.data) {
        console.log('   Status:', confirmError.response.status);
        console.log('   Response:', JSON.stringify(confirmError.response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('   Response:', error.response.data);
    }
  }
}

testConsultationConfirmation();