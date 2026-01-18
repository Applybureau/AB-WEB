#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const { supabaseAdmin } = require('../utils/supabase');

async function debugAdminPermissions() {
  console.log('🔍 Debugging Admin Permissions\n');
  
  try {
    // Step 1: Login and get token
    console.log('1. Admin Login...');
    const loginResponse = await axios.post('https://apply-bureau-backend.vercel.app/api/auth/login', {
      email: 'admin@applybureau.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ Admin login successful');
    console.log('User from login:', JSON.stringify(user, null, 2));
    
    // Step 2: Check auth/me endpoint
    console.log('\n2. Checking auth/me...');
    const meResponse = await axios.get('https://apply-bureau-backend.vercel.app/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('User from /auth/me:', JSON.stringify(meResponse.data.user, null, 2));
    
    const adminId = meResponse.data.user.id;
    
    // Step 3: Check clients table for this admin
    console.log('\n3. Checking clients table...');
    const { data: adminInClients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', adminId);
    
    if (clientsError) {
      console.log('❌ Error checking clients table:', clientsError);
    } else {
      console.log('Admin in clients table:', JSON.stringify(adminInClients, null, 2));
    }
    
    // Step 4: Check registered_users table for this admin
    console.log('\n4. Checking registered_users table...');
    const { data: adminInRegistered, error: registeredError } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .eq('id', adminId);
    
    if (registeredError) {
      console.log('❌ Error checking registered_users table:', registeredError);
    } else {
      console.log('Admin in registered_users table:', JSON.stringify(adminInRegistered, null, 2));
    }
    
    // Step 5: Check all admins in clients table
    console.log('\n5. All admins in clients table...');
    const { data: allAdmins, error: allAdminsError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('role', 'admin');
    
    if (allAdminsError) {
      console.log('❌ Error getting all admins:', allAdminsError);
    } else {
      console.log('All admins:', JSON.stringify(allAdmins, null, 2));
    }
    
    // Step 6: Test the exact query used in the endpoint
    console.log('\n6. Testing exact endpoint query...');
    const { data: exactQuery, error: exactError } = await supabaseAdmin
      .from('clients')
      .select('id, role, full_name')
      .eq('id', adminId)
      .eq('role', 'admin')
      .single();
    
    if (exactError) {
      console.log('❌ Exact query failed:', exactError);
    } else {
      console.log('✅ Exact query result:', JSON.stringify(exactQuery, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Debug failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

debugAdminPermissions().catch(console.error);