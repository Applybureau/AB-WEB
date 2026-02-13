#!/usr/bin/env node

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../utils/supabase');

const debugAdmin = async () => {
  console.log('🔍 Debugging admin in database...');
  
  try {
    // Check what's in the clients table
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, password, role, status')
      .eq('email', 'applybureau@gmail.com');

    console.log('Clients table query result:');
    console.log('Error:', clientsError);
    console.log('Data:', clients);

    if (clients && clients.length > 0) {
      const admin = clients[0];
      console.log('\nAdmin record found:');
      console.log('ID:', admin.id);
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Status:', admin.status);
      console.log('Has password field:', !!admin.password);
      
      // Test password comparison
      if (admin.password) {
        const testPassword = 'Admin123@#';
        const isValid = await bcrypt.compare(testPassword, admin.password);
        console.log('Password comparison test:', isValid);
      }
    }

    // Also check admins table
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('admins')
      .select('id, email, full_name, password, role, is_active')
      .eq('email', 'applybureau@gmail.com');

    console.log('\nAdmins table query result:');
    console.log('Error:', adminsError);
    console.log('Data:', admins);

  } catch (error) {
    console.error('Debug failed:', error);
  }
};

debugAdmin().catch(console.error);