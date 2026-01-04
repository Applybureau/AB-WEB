#!/usr/bin/env node

/**
 * Create Admin User Script
 * Creates an admin user in the database for testing
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../utils/supabase');

async function createAdminUser() {
  console.log('🔧 Creating admin user...');
  
  try {
    // First, let's check what columns exist in the clients table
    const { data: existingClients } = await supabaseAdmin
      .from('clients')
      .select('*')
      .limit(1);
    
    console.log('📋 Existing clients table structure detected');
    
    const adminData = {
      full_name: 'Admin User',
      email: 'admin@applybureau.com',
      password: await bcrypt.hash('admin123', 10)
    };
    
    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('clients')
      .select('id, email')
      .eq('email', adminData.email)
      .single();
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return existingAdmin;
    }
    
    // Create new admin user with minimal required fields
    const { data: newAdmin, error } = await supabaseAdmin
      .from('clients')
      .insert(adminData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create admin user:', error);
      
      // Try with even more minimal data
      console.log('🔄 Trying with minimal data...');
      const minimalData = {
        email: 'admin@applybureau.com',
        password: await bcrypt.hash('admin123', 10),
        full_name: 'Admin User'
      };
      
      const { data: minimalAdmin, error: minimalError } = await supabaseAdmin
        .from('clients')
        .insert(minimalData)
        .select()
        .single();
      
      if (minimalError) {
        console.error('❌ Minimal creation also failed:', minimalError);
        return null;
      }
      
      console.log('✅ Admin user created with minimal data:', minimalAdmin.email);
      return minimalAdmin;
    }
    
    console.log('✅ Admin user created successfully:', newAdmin.email);
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password: admin123');
    
    return newAdmin;
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    return null;
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUser()
    .then((admin) => {
      if (admin) {
        console.log('\n🎉 Admin user setup complete!');
        console.log('You can now login with:');
        console.log('Email: admin@applybureau.com');
        console.log('Password: admin123');
        process.exit(0);
      } else {
        console.log('\n❌ Failed to create admin user');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = createAdminUser;