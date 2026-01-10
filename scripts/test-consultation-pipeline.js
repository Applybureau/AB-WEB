const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

async function testConsultationPipeline() {
  console.log('🚀 Testing Consultation-to-Client Pipeline...\n');

  try {
    // Step 1: Submit a consultation request
    console.log('1. Submitting consultation request...');
    const consultationData = {
      full_name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-123-4567',
      linkedin_url: 'https://linkedin.com/in/johndoe',
      role_targets: 'Software Engineer, Full Stack Developer',
      location_preferences: 'San Francisco, Remote',
      minimum_salary: '$120,000',
      target_market: 'Tech Startups',
      employment_status: 'Currently Employed',
      package_interest: 'Tier 2',
      area_of_concern: 'Need help with interview preparation and salary negotiation',
      consultation_window: 'Next 2 weeks'
    };

    const consultationResponse = await axios.post(
      `${BASE_URL}/api/consultation-requests`,
      consultationData
    );

    console.log('✅ Consultation submitted:', consultationResponse.data);
    const consultationId = consultationResponse.data.id;

    // Step 2: Admin login (you'll need to create an admin user first)
    console.log('\n2. Admin login...');
    const adminLoginResponse = await axios.post(
      `${BASE_URL}/api/auth/login`,
      {
        email: 'admin@applybureau.com',
        password: 'admin123'
      }
    );

    const adminToken = adminLoginResponse.data.token;
    console.log('✅ Admin logged in');

    // Step 3: Get consultation requests (admin view)
    console.log('\n3. Getting consultation requests...');
    const consultationsResponse = await axios.get(
      `${BASE_URL}/api/consultation-requests`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    console.log('✅ Consultations retrieved:', consultationsResponse.data.length, 'requests');

    // Step 4: Approve consultation (generates registration token)
    console.log('\n4. Approving consultation...');
    const approvalResponse = await axios.patch(
      `${BASE_URL}/api/consultation-requests/${consultationId}`,
      {
        action: 'approve',
        admin_notes: 'Great candidate with strong background. Approved for Tier 2 service.'
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    console.log('✅ Consultation approved:', approvalResponse.data);
    const registrationToken = approvalResponse.data.registration_token;

    // Step 5: Validate registration token
    console.log('\n5. Validating registration token...');
    const tokenValidationResponse = await axios.get(
      `${BASE_URL}/api/consultation-requests/validate-token/${registrationToken}`
    );

    console.log('✅ Token validated:', tokenValidationResponse.data);

    // Step 6: Complete client registration
    console.log('\n6. Completing client registration...');
    const registrationResponse = await axios.post(
      `${BASE_URL}/api/consultation-requests/register`,
      {
        token: registrationToken,
        password: 'securePassword123!',
        confirm_password: 'securePassword123!'
      }
    );

    console.log('✅ Client registered:', registrationResponse.data);
    const clientToken = registrationResponse.data.token;

    // Step 7: Get client profile
    console.log('\n7. Getting client profile...');
    const profileResponse = await axios.get(
      `${BASE_URL}/api/client/profile`,
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );

    console.log('✅ Profile retrieved:', {
      name: profileResponse.data.profile.full_name,
      completion: profileResponse.data.completion.percentage + '%'
    });

    // Step 8: Update client profile
    console.log('\n8. Updating client profile...');
    const profileUpdateResponse = await axios.patch(
      `${BASE_URL}/api/client/profile`,
      {
        current_job: 'Senior Software Engineer',
        target_job: 'Staff Software Engineer',
        years_of_experience: 5,
        country: 'United States',
        user_location: 'San Francisco, CA',
        age: 28
      },
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );

    console.log('✅ Profile updated:', {
      completion: profileUpdateResponse.data.completion.percentage + '%',
      features_unlocked: profileUpdateResponse.data.completion.features_unlocked
    });

    // Step 9: Get client dashboard
    console.log('\n9. Getting client dashboard...');
    const dashboardResponse = await axios.get(
      `${BASE_URL}/api/client/dashboard`,
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );

    console.log('✅ Dashboard retrieved:', {
      client: dashboardResponse.data.client.full_name,
      tier: dashboardResponse.data.client.tier,
      profile_completion: dashboardResponse.data.profile_completion.percentage + '%',
      quick_actions: dashboardResponse.data.quick_actions.length
    });

    // Step 10: Get application stats
    console.log('\n10. Getting application statistics...');
    const statsResponse = await axios.get(
      `${BASE_URL}/api/applications/stats`,
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );

    console.log('✅ Application stats:', {
      tier: statsResponse.data.tier,
      weekly_target: statsResponse.data.weekly_target,
      total_applications: statsResponse.data.total_applications
    });

    console.log('\n🎉 Consultation-to-Client Pipeline Test Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Consultation ID: ${consultationId}`);
    console.log(`- Client registered: ${registrationResponse.data.user.full_name}`);
    console.log(`- Profile completion: ${profileUpdateResponse.data.completion.percentage}%`);
    console.log(`- Service tier: ${dashboardResponse.data.client.tier}`);
    console.log(`- Weekly target: ${statsResponse.data.weekly_target} applications`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Note: Make sure you have:');
      console.log('1. Applied the PIPELINE_SCHEMA.sql to your database');
      console.log('2. Created an admin user with email: admin@applybureau.com');
      console.log('3. Started the backend server');
    }
  }
}

// Run the test
testConsultationPipeline();