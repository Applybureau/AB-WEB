#!/usr/bin/env node

/**
 * Create Test Admin User for Consultation Dashboard Testing
 * Uses the test email: israelloko65@gmail.com
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../utils/supabase');

async function createTestAdmin() {
  console.log('🔧 Creating test admin user for consultation dashboard testing...');
  
  try {
    const adminEmail = 'israelloko65@gmail.com';
    const adminPassword = 'admin123';
    
    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('clients')
      .select('id, email, role')
      .eq('email', adminEmail)
      .single();
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      
      // Update to ensure admin role and password
      const { data: updatedAdmin, error: updateError } = await supabaseAdmin
        .from('clients')
        .update({
          role: 'admin',
          password: await bcrypt.hash(adminPassword, 10),
          is_super_admin: true,
          full_name: 'Israel Loko (Admin)'
        })
        .eq('email', adminEmail)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Failed to update admin user:', updateError);
        return null;
      }
      
      console.log('✅ Admin user updated successfully');
      return updatedAdmin;
    }
    
    // Create new admin user
    const adminData = {
      full_name: 'Israel Loko (Admin)',
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: 'admin',
      is_super_admin: true,
      onboarding_complete: true,
      profile_unlocked: true,
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString()
    };
    
    const { data: newAdmin, error } = await supabaseAdmin
      .from('clients')
      .insert(adminData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create admin user:', error);
      
      // Try with minimal data
      console.log('🔄 Trying with minimal data...');
      const minimalData = {
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, 10),
        full_name: 'Israel Loko (Admin)',
        role: 'admin'
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
      
      console.log('✅ Admin user created with minimal data');
      return minimalAdmin;
    }
    
    console.log('✅ Admin user created successfully:', newAdmin.email);
    return newAdmin;
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    return null;
  }
}

// Run if called directly
if (require.main === module) {
  createTestAdmin()
    .then((admin) => {
      if (admin) {
        console.log('\n🎉 Test admin user setup complete!');
        console.log('You can now login with:');
        console.log('Email: israelloko65@gmail.com');
        console.log('Password: admin123');
        process.exit(0);
      } else {
        console.log('\n❌ Failed to create test admin user');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = createTestAdmin;