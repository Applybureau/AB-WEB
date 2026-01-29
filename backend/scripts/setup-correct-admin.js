#!/usr/bin/env node

/**
 * Setup Correct Super Admin
 * Deletes all existing admins and creates the correct super admin
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../utils/supabase');

const SUPER_ADMIN_EMAIL = 'admin@applybureau.com';
const SUPER_ADMIN_PASSWORD = 'Admin123@#';

const setupCorrectAdmin = async () => {
  console.log('🧹 Cleaning up existing admins and setting up correct super admin...');
  
  try {
    // Step 1: Delete all existing admins from clients table
    console.log('1. Deleting all existing admins from clients table...');
    const { error: deleteClientsError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('role', 'admin');
    
    if (deleteClientsError) {
      console.error('Error deleting admins from clients:', deleteClientsError);
    } else {
      console.log('✅ Deleted all admins from clients table');
    }

    // Step 2: Delete all existing admins from admins table (if it exists)
    console.log('2. Deleting all existing admins from admins table...');
    const { error: deleteAdminsError } = await supabaseAdmin
      .from('admins')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteAdminsError) {
      console.log('Note: admins table might not exist or is empty:', deleteAdminsError.message);
    } else {
      console.log('✅ Deleted all admins from admins table');
    }

    // Step 3: Hash the password
    console.log('3. Hashing super admin password...');
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
    console.log('✅ Password hashed successfully');

    // Step 4: Create the correct super admin in clients table
    console.log('4. Creating super admin in clients table...');
    const { data: newAdmin, error: createError } = await supabaseAdmin
      .from('clients')
      .insert({
        full_name: 'Super Admin',
        email: SUPER_ADMIN_EMAIL,
        password: hashedPassword, // Use password field for clients table
        role: 'admin',
        status: 'active',
        onboarding_complete: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, full_name, email, role, status')
      .single();

    if (createError) {
      console.error('❌ Error creating super admin:', createError);
      throw createError;
    }

    console.log('✅ Super admin created successfully:', newAdmin);

    // Step 5: Verify login works
    console.log('5. Verifying super admin login...');
    const { data: loginAdmin } = await supabaseAdmin
      .from('clients')
      .select('id, email, password, role')
      .eq('email', SUPER_ADMIN_EMAIL)
      .eq('role', 'admin')
      .single();

    if (!loginAdmin) {
      throw new Error('Super admin not found after creation');
    }

    const passwordMatch = await bcrypt.compare(SUPER_ADMIN_PASSWORD, loginAdmin.password);
    if (!passwordMatch) {
      throw new Error('Password verification failed');
    }

    console.log('✅ Super admin login verification successful');

    // Step 6: Test API login
    console.log('6. Testing API login...');
    const axios = require('axios');
    const BASE_URL = process.env.VERCEL_URL || 'https://apply-bureau-backend.vercel.app';
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (loginResponse.data.token) {
        console.log('✅ API login test successful');
        console.log('🎉 Super admin setup completed successfully!');
        console.log(`📧 Email: ${SUPER_ADMIN_EMAIL}`);
        console.log(`🔑 Password: ${SUPER_ADMIN_PASSWORD}`);
      } else {
        console.log('⚠️ API login returned no token');
      }
    } catch (apiError) {
      console.log('⚠️ API login test failed:', apiError.response?.data || apiError.message);
      console.log('But database setup was successful');
    }

  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
};

setupCorrectAdmin().catch(error => {
  console.error('💥 Script crashed:', error);
  process.exit(1);
});