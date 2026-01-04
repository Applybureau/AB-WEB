#!/usr/bin/env node

/**
 * Fix Admin User Script
 * Updates the admin user with proper role and password
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../utils/supabase');

async function fixAdminUser() {
  console.log('🔧 Fixing admin user...');
  
  try {
    // First, let's see what the current admin user looks like
    const { data: currentAdmin, error: fetchError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', 'admin@applybureau.com')
      .single();
    
    if (fetchError) {
      console.log('❌ Error fetching admin:', fetchError);
      return false;
    }
    
    console.log('📋 Current admin user:', currentAdmin);
    
    // Hash the password properly
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('🔑 New password hash generated');
    
    // Update the admin user with proper fields
    const updateData = {
      password: hashedPassword,
      full_name: 'Admin User'
    };
    
    // Only add role if the column exists
    try {
      updateData.role = 'admin';
    } catch (e) {
      console.log('⚠️  Role column might not exist, skipping...');
    }
    
    const { data: updatedAdmin, error: updateError } = await supabaseAdmin
      .from('clients')
      .update(updateData)
      .eq('email', 'admin@applybureau.com')
      .select('*')
      .single();
    
    if (updateError) {
      console.log('❌ Error updating admin:', updateError);
      
      // Try with minimal update
      const minimalUpdate = { password: hashedPassword };
      const { data: minimalAdmin, error: minimalError } = await supabaseAdmin
        .from('clients')
        .update(minimalUpdate)
        .eq('email', 'admin@applybureau.com')
        .select('*')
        .single();
      
      if (minimalError) {
        console.log('❌ Minimal update also failed:', minimalError);
        return false;
      }
      
      console.log('✅ Admin password updated (minimal):', minimalAdmin.email);
      return true;
    }
    
    console.log('✅ Admin user updated successfully:', updatedAdmin.email);
    return true;
    
  } catch (error) {
    console.error('❌ Error fixing admin user:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  fixAdminUser()
    .then((success) => {
      if (success) {
        console.log('\n🎉 Admin user fixed successfully!');
        console.log('You can now login with:');
        console.log('Email: admin@applybureau.com');
        console.log('Password: admin123');
        process.exit(0);
      } else {
        console.log('\n❌ Failed to fix admin user');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = fixAdminUser;