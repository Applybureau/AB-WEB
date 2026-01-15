require('dotenv').config();
const { sendEmail } = require('../utils/email');

const TEST_EMAIL = 'israelloko65@gmail.com';

async function testRealEmailWithData() {
  console.log('📧 Testing Email with Real Data\n');
  console.log(`Recipient: ${TEST_EMAIL}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}\n`);
  
  try {
    // Test 1: Signup Invite with real data
    console.log('1️⃣ Testing Signup Invite with real data...');
    await sendEmail(TEST_EMAIL, 'signup_invite', {
      client_name: 'David Johnson',
      registration_link: `${process.env.FRONTEND_URL}complete-registration?token=abc123xyz`
    });
    console.log('✅ Signup Invite sent\n');
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Client Welcome with real data
    console.log('2️⃣ Testing Client Welcome with real data...');
    await sendEmail(TEST_EMAIL, 'client_welcome', {
      client_name: 'David Johnson',
      dashboard_link: `${process.env.FRONTEND_URL}dashboard`,
      onboarding_link: `${process.env.FRONTEND_URL}onboarding`
    });
    console.log('✅ Client Welcome sent\n');
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Consultation Confirmed with real data
    console.log('3️⃣ Testing Consultation Confirmed with real data...');
    await sendEmail(TEST_EMAIL, 'consultation_confirmed', {
      client_name: 'David Johnson',
      consultation_date: 'Monday, January 20, 2026',
      consultation_time: '10:00 AM EST',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      consultant_name: 'Sarah Williams'
    });
    console.log('✅ Consultation Confirmed sent\n');
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Profile Unlocked with real data
    console.log('4️⃣ Testing Profile Unlocked with real data...');
    await sendEmail(TEST_EMAIL, 'profile_unlocked', {
      client_name: 'David Johnson',
      unlock_date: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      dashboard_link: `${process.env.FRONTEND_URL}dashboard`
    });
    console.log('✅ Profile Unlocked sent\n');
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 5: Application Status Update with real data
    console.log('5️⃣ Testing Application Status Update with real data...');
    await sendEmail(TEST_EMAIL, 'application_status_update', {
      client_name: 'David Johnson',
      company_name: 'Tech Corp Inc.',
      position: 'Senior Software Engineer',
      status: 'Interview Scheduled',
      status_details: 'Your technical interview has been scheduled for Monday, January 20, 2026 at 2:00 PM EST. The interview will be conducted via Zoom and will last approximately 1 hour.',
      dashboard_link: `${process.env.FRONTEND_URL}dashboard`
    });
    console.log('✅ Application Status Update sent\n');
    
    console.log('✅ ALL TESTS COMPLETED!');
    console.log(`\n📬 Check ${TEST_EMAIL} for 5 emails with REAL DATA`);
    console.log('\n🔍 Verify that:');
    console.log('   ✓ Client name shows "David Johnson" (not {{client_name}})');
    console.log('   ✓ Links use http://localhost:5173/ (not placeholder)');
    console.log('   ✓ Dates and times are properly formatted');
    console.log('   ✓ All variables are replaced with actual values');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

testRealEmailWithData();
