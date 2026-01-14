require('dotenv').config();
const axios = require('axios');
const { supabaseAdmin } = require('../utils/supabase');

async function debugAdminUser() {
  try {
    console.log('🔍 Debugging Admin User Issue');
    console.log('=============================');
    
    // Step 1: Login and get token info
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const adminToken = loginResponse.data.token;
    const adminUser = loginResponse.data.user;
    console.log('✅ Admin login successful');
    console.log('   User ID from token:', adminUser.id);
    console.log('   Email:', adminUser.email);
    console.log('   Role:', adminUser.role);
    
    // Step 2: Check if this user exists in registered_users table
    console.log('🔍 Checking registered_users table...');
    const { data: registeredUser, error: registeredError } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .eq('id', adminUser.id)
      .single();
    
    if (registeredError) {
      console.log('❌ User not found in registered_users:', registeredError.message);
      
      // Check what users do exist
      const { data: allUsers, error: allUsersError } = await supabaseAdmin
        .from('registered_users')
        .select('id, email, role, full_name')
        .eq('role', 'admin');
      
      if (allUsersError) {
        console.log('❌ Error fetching admin users:', allUsersError.message);
      } else {
        console.log('📋 Existing admin users:');
        allUsers.forEach(user => {
          console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.full_name}`);
        });
      }
    } else {
      console.log('✅ User found in registered_users');
      console.log('   Full name:', registeredUser.full_name);
      console.log('   Role:', registeredUser.role);
      console.log('   Created:', registeredUser.created_at);
    }
    
    // Step 3: Check consultation_requests table structure
    console.log('🔍 Checking consultation_requests table...');
    const { data: consultations, error: consultError } = await supabaseAdmin
      .from('consultation_requests')
      .select('id, admin_action_by')
      .limit(1);
    
    if (consultError) {
      console.log('❌ Error accessing consultation_requests:', consultError.message);
    } else {
      console.log('✅ consultation_requests table accessible');
      if (consultations.length > 0) {
        console.log('   Sample admin_action_by values:', consultations[0].admin_action_by);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response?.data) {
      console.error('   Response:', error.response.data);
    }
  }
}

debugAdminUser();