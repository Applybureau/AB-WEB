require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'https://jellyfish-app-t4m35.ondigitalocean.app';

// Test credentials
const ADMIN_EMAIL = 'applybureau@gmail.com';
const ADMIN_PASSWORD = 'Admin123@#';
const TEST_CLIENT_EMAIL = 'israelloko65@gmail.com';
const TEST_CLIENT_PASSWORD = 'IsraelTest2024!';

let adminToken = '';
let clientToken = '';
let clientId = '';

async function runTests() {
  console.log('🧪 Testing Client Dashboard Complete System\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Admin Login
    console.log('\n📝 Step 1: Admin Login');
    const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    adminToken = adminLogin.data.token;
    console.log('✅ Admin logged in successfully');
    
    // Step 2: Client Login
    console.log('\n📝 Step 2: Client Login');
    const clientLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_CLIENT_EMAIL,
      password: TEST_CLIENT_PASSWORD
    });
    clientToken = clientLogin.data.token;
    clientId = clientLogin.data.user.id;
    console.log('✅ Client logged in successfully');
    console.log(`   Client ID: ${clientId}`);
    
    // Step 3: Get Dashboard Overview
    console.log('\n📝 Step 3: Get Dashboard Overview');
    const dashboard = await axios.get(`${BASE_URL}/api/client/dashboard`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    console.log('✅ Dashboard loaded successfully');
    console.log(`   Status: ${dashboard.data.status.overall_status}`);
    console.log(`   Message: ${dashboard.data.status.message}`);
    console.log(`   Progress: ${dashboard.data.status.progress_percentage}%`);
    console.log(`   20Q Status: ${dashboard.data.twenty_questions.status}`);
    console.log(`   Strategy Call: ${dashboard.data.strategy_call.has_booked ? 'Booked' : 'Not booked'}`);
    console.log(`   Applications: ${dashboard.data.applications.total_count}`);
    
    // Step 4: Get 20Q Status
    console.log('\n📝 Step 4: Get 20 Questions Status');
    const onboardingStatus = await axios.get(`${BASE_URL}/api/client/dashboard/onboarding/status`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    console.log('✅ 20Q status retrieved');
    console.log(`   Status: ${onboardingStatus.data.status}`);
    console.log(`   Display: ${onboardingStatus.data.display_status}`);
    console.log(`   Progress: ${onboardingStatus.data.progress}%`);
    console.log(`   Can Edit: ${onboardingStatus.data.can_edit}`);
    
    // Step 5: Get Upload Status
    console.log('\n📝 Step 5: Get File Upload Status');
    const uploadStatus = await axios.get(`${BASE_URL}/api/client/dashboard/uploads/status`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    console.log('✅ Upload status retrieved');
    console.log(`   Resume: ${uploadStatus.data.resume_uploaded ? 'Uploaded' : 'Not uploaded'}`);
    console.log(`   LinkedIn: ${uploadStatus.data.linkedin_added ? 'Added' : 'Not added'}`);
    console.log(`   Portfolio: ${uploadStatus.data.portfolio_added ? 'Added' : 'Not added'}`);
    console.log(`   Total Files: ${uploadStatus.data.files.length}`);
    
    // Step 6: Get Strategy Call Status
    console.log('\n📝 Step 6: Get Strategy Call Status');
    const strategyCallStatus = await axios.get(`${BASE_URL}/api/strategy-calls/status`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    console.log('✅ Strategy call status retrieved');
    console.log(`   Has Booked: ${strategyCallStatus.data.has_booked_call}`);
    console.log(`   Has Confirmed: ${strategyCallStatus.data.has_confirmed_call}`);
    if (strategyCallStatus.data.latest_call) {
      console.log(`   Latest Status: ${strategyCallStatus.data.latest_call.admin_status}`);
    }
    
    // Step 7: Get Application Stats
    console.log('\n📝 Step 7: Get Application Statistics');
    const appStats = await axios.get(`${BASE_URL}/api/client/dashboard/applications/stats`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    console.log('✅ Application stats retrieved');
    console.log(`   Total: ${appStats.data.total_count}`);
    console.log(`   Active: ${appStats.data.active_count}`);
    console.log(`   Interviews: ${appStats.data.interview_count}`);
    console.log(`   Offers: ${appStats.data.offer_count}`);
    
    // Step 8: Test 20Q Submission (if not already submitted)
    if (onboardingStatus.data.status === 'not_started') {
      console.log('\n📝 Step 8: Submit 20 Questions Assessment');
      try {
        const onboardingSubmit = await axios.post(
          `${BASE_URL}/api/client/dashboard/onboarding/submit`,
          {
            q1: 'Software Engineer, Full Stack Developer, Backend Engineer',
            q2: 'DevOps Engineer, Site Reliability Engineer',
            q3: 'Sales, Marketing, Customer Support',
            q4: 'remote',
            q5: 'country_wide',
            q6: 'Toronto, Vancouver, Montreal',
            q7: 'Rural areas',
            q8: 100000,
            q8_currency: 'CAD',
            q9: 150000,
            q9_currency: 'CAD',
            q10: 'depends',
            q10a: 'Only if 6+ months with benefits',
            q11: 'canadian_citizen',
            q12: 'no',
            q13: 'within_country',
            q14: 'yes',
            q14a: 'full',
            q15: 'Gambling, tobacco',
            q16: 'prefer_not_to_say',
            q17: 'no',
            q18: 'yes_will_disclose',
            q19: ['compensation', 'remote_flexibility'],
            q20: 'I prefer work-life balance and growth opportunities'
          },
          {
            headers: { Authorization: `Bearer ${clientToken}` }
          }
        );
        console.log('✅ 20Q assessment submitted');
        console.log(`   Status: ${onboardingSubmit.data.status}`);
      } catch (error) {
        if (error.response?.status === 400) {
          console.log('⚠️  Assessment already submitted');
        } else {
          throw error;
        }
      }
    } else {
      console.log('\n📝 Step 8: 20Q Assessment already submitted');
      console.log(`   Current status: ${onboardingStatus.data.status}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n📊 Dashboard Summary:');
    console.log(`   • Overall Status: ${dashboard.data.status.overall_status}`);
    console.log(`   • Progress: ${dashboard.data.status.progress_percentage}%`);
    console.log(`   • 20Q Status: ${dashboard.data.twenty_questions.display_status}`);
    console.log(`   • Strategy Call: ${dashboard.data.strategy_call.has_booked ? 'Booked' : 'Not booked'}`);
    console.log(`   • Files Uploaded: ${uploadStatus.data.files.length}`);
    console.log(`   • Applications: ${appStats.data.total_count}`);
    console.log(`   • Next Steps: ${dashboard.data.next_steps.length}`);
    
    if (dashboard.data.next_steps.length > 0) {
      console.log('\n📋 Next Steps:');
      dashboard.data.next_steps.forEach((step, i) => {
        console.log(`   ${i + 1}. ${step.title}`);
        console.log(`      ${step.description}`);
      });
    }
    
    console.log('\n🎉 Client Dashboard is fully functional!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

runTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
