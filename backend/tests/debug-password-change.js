const axios = require('axios');

// Production Vercel URL
const BACKEND_URL = 'https://apply-bureau-backend.vercel.app';
const API_BASE = `${BACKEND_URL}/api`;

// Test admin credentials
const TEST_ADMIN = {
  email: 'admin@applybureautest.com',
  password: 'AdminTest123!'
};

async function debugPasswordChange() {
  console.log('🔍 DEBUGGING PASSWORD CHANGE FUNCTIONALITY');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Login to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, TEST_ADMIN);
    
    if (!loginResponse.data.token) {
      console.log('❌ Login failed');
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('User data:', loginResponse.data.user);
    
    // Step 2: Get user profile to verify token
    console.log('\n2. Getting user profile...');
    const profileResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Profile retrieved');
    console.log('Profile data:', profileResponse.data.user);
    
    // Step 3: Test password change
    console.log('\n3. Testing password change...');
    const passwordChangeData = {
      old_password: 'AdminTest123!',
      new_password: 'NewAdminTest123!'
    };
    
    try {
      const changeResponse = await axios.put(`${API_BASE}/auth/change-password`, passwordChangeData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Password change successful');
      console.log('Response:', changeResponse.data);
      
      // Step 4: Change password back
      console.log('\n4. Reverting password...');
      const revertData = {
        old_password: 'NewAdminTest123!',
        new_password: 'AdminTest123!'
      };
      
      const revertResponse = await axios.put(`${API_BASE}/auth/change-password`, revertData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Password reverted successfully');
      console.log('Response:', revertResponse.data);
      
    } catch (changeError) {
      console.log('❌ Password change failed');
      console.log('Error:', changeError.response?.data || changeError.message);
      console.log('Status:', changeError.response?.status);
    }
    
  } catch (error) {
    console.log('❌ Debug failed');
    console.log('Error:', error.response?.data || error.message);
  }
}

// Run debug
debugPasswordChange().catch(console.error);