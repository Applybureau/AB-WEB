require('dotenv').config();
const axios = require('axios');
const { supabaseAdmin } = require('../utils/supabase');

const BASE_URL = 'http://localhost:3000';

async function testOnboardingApprovalDirect() {
  try {
    console.log('🧪 TESTING ONBOARDING APPROVAL DIRECTLY');
    console.log('=======================================');
    
    // 1. Get admin token
    console.log('\n🔐 1. Getting admin token...');
    const adminCredentials = {
      email: 'admin@applybureau.com',
      password: 'admin123'
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, adminCredentials);
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // 2. Get the actual onboarding ID from database
    console.log('\n📝 2. Getting onboarding ID from database...');
    const { data: onboardings, error } = await supabaseAdmin
      .from('client_onboarding_20q')
      .select('id, user_id, execution_status')
      .eq('execution_status', 'pending_approval')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error || !onboardings || onboardings.length === 0) {
      console.log('❌ No pending onboarding records found');
      return;
    }
    
    const onboardingId = onboardings[0].id;
    console.log(`✅ Found onboarding ID: ${onboardingId}`);
    console.log(`   User ID: ${onboardings[0].user_id}`);
    console.log(`   Status: ${onboardings[0].execution_status}`);
    
    // 3. Test the approval endpoint
    console.log('\n✅ 3. Testing approval endpoint...');
    const approvalData = {
      admin_notes: 'Test approval - excellent responses'
    };
    
    try {
      const approvalResponse = await axios.post(
        `${BASE_URL}/api/admin/concierge/onboarding/${onboardingId}/approve`,
        approvalData,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Approval successful!');
      console.log('📋 Response:', JSON.stringify(approvalResponse.data, null, 2));
      
      // 4. Verify the changes in database
      console.log('\n🔍 4. Verifying database changes...');
      const { data: updatedOnboarding } = await supabaseAdmin
        .from('client_onboarding_20q')
        .select('execution_status, approved_by, approved_at, admin_notes')
        .eq('id', onboardingId)
        .single();
      
      console.log('📋 Updated onboarding record:', JSON.stringify(updatedOnboarding, null, 2));
      
      const { data: updatedUser } = await supabaseAdmin
        .from('registered_users')
        .select('profile_unlocked, onboarding_completed')
        .eq('id', onboardings[0].user_id)
        .single();
      
      console.log('📋 Updated user record:', JSON.stringify(updatedUser, null, 2));
      
    } catch (approvalError) {
      console.log('❌ Approval failed');
      console.log('📋 Error response:', JSON.stringify(approvalError.response?.data, null, 2));
      console.log('📋 Error status:', approvalError.response?.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOnboardingApprovalDirect().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});