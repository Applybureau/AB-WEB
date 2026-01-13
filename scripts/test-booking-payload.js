const axios = require('axios');

// Configuration
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://apply-bureau-backend.vercel.app'
  : 'http://localhost:3000';

console.log('🧪 TESTING NEW BOOKING PAYLOAD');
console.log('==============================');
console.log(`Base URL: ${BASE_URL}`);

// Test data with new booking payload format
const simpleBooking = {
  full_name: 'Jane Simple Booking',
  email: 'jane.simple@test.com',
  phone: '+1-555-0123',
  message: 'I am interested in your concierge services and would like to discuss my career goals. I have 5 years of experience in software development and am looking to transition into a senior role.'
};

const bookingWithTimeSlots = {
  full_name: 'John Time Slots',
  email: 'john.timeslots@test.com',
  phone: '+1-555-0124',
  message: 'Looking for career guidance and job search strategy. Available for consultation next week.',
  preferred_slots: [
    { date: '2024-02-15', time: '14:00' },
    { date: '2024-02-16', time: '15:00' },
    { date: '2024-02-17', time: '16:00' }
  ]
};

async function testBookingPayload(bookingData, testName) {
  try {
    console.log(`\n📝 Testing ${testName}...`);
    
    const response = await axios.post(`${BASE_URL}/api/public-consultations`, bookingData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Booking submitted successfully');
    console.log(`   ID: ${response.data.id}`);
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Admin Status: ${response.data.admin_status}`);
    console.log(`   Message: ${response.data.message}`);
    
    // Check booking details in response
    if (response.data.booking_details) {
      console.log('📋 Booking Details:');
      console.log(`   Name: ${response.data.booking_details.name}`);
      console.log(`   Email: ${response.data.booking_details.email}`);
      console.log(`   Phone: ${response.data.booking_details.phone}`);
      console.log(`   Message: ${response.data.booking_details.message || 'No message'}`);
      console.log(`   Time Slots: ${response.data.booking_details.preferred_slots?.length || 0} slots`);
    }
    
    return { success: true, id: response.data.id };
  } catch (error) {
    console.log('❌ Booking submission failed');
    console.log('   Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function testAdminDashboardDisplay(consultationId) {
  try {
    console.log('\n📊 Testing Admin Dashboard Display...');
    
    // First login as admin
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.token) {
      console.log('❌ Admin login failed');
      return false;
    }
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Get consultations list
    const dashboardResponse = await axios.get(`${BASE_URL}/api/admin/concierge/consultations`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('✅ Admin dashboard data retrieved');
    console.log(`   Total consultations: ${dashboardResponse.data.consultations.length}`);
    
    // Find our test consultation
    const testConsultation = dashboardResponse.data.consultations.find(c => c.id === consultationId);
    if (testConsultation) {
      console.log('✅ Test consultation found in dashboard');
      console.log('📋 Dashboard Display Format:');
      console.log(`   Name: ${testConsultation.booking_details.name}`);
      console.log(`   Email: ${testConsultation.booking_details.email}`);
      console.log(`   Phone: ${testConsultation.booking_details.phone}`);
      console.log(`   Message: ${testConsultation.booking_details.message}`);
      console.log(`   Display Message: ${testConsultation.display_message}`);
      console.log(`   Has Time Slots: ${testConsultation.has_time_slots}`);
      console.log(`   Time Slots Count: ${testConsultation.time_slots.length}`);
    } else {
      console.log('❌ Test consultation not found in dashboard');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Admin dashboard test failed');
    console.log('   Error:', error.response?.data || error.message);
    return false;
  }
}

async function runBookingPayloadTests() {
  console.log('🚀 Starting Booking Payload Tests');
  console.log('==================================');
  
  let testResults = [];
  
  // Test 1: Simple booking (name, email, phone, message only)
  const simpleResult = await testBookingPayload(simpleBooking, 'Simple Booking (No Time Slots)');
  testResults.push({ name: 'Simple Booking', success: simpleResult.success });
  
  // Test 2: Booking with time slots
  const slotsResult = await testBookingPayload(bookingWithTimeSlots, 'Booking with Time Slots');
  testResults.push({ name: 'Booking with Time Slots', success: slotsResult.success });
  
  // Test 3: Admin dashboard display
  if (simpleResult.success) {
    const dashboardResult = await testAdminDashboardDisplay(simpleResult.id);
    testResults.push({ name: 'Admin Dashboard Display', success: dashboardResult });
  }
  
  // Summary
  console.log('\n🏁 BOOKING PAYLOAD TEST SUMMARY');
  console.log('===============================');
  
  const passed = testResults.filter(r => r.success).length;
  const total = testResults.length;
  
  testResults.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.success ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 ALL BOOKING PAYLOAD TESTS PASSED!');
    console.log('✅ New booking payload format is working correctly');
    console.log('✅ Dashboard displays all booking details including messages');
    console.log('✅ Both simple bookings and bookings with time slots work');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
  
  return passed === total;
}

// Run the tests
if (require.main === module) {
  runBookingPayloadTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runBookingPayloadTests };