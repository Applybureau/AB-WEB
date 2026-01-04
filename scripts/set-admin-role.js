#!/usr/bin/env node

/**
 * Set Admin Role Script
 * Updates the admin user role to 'admin'
 */

require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function setAdminRole() {
  console.log('🔧 Setting admin role...');
  
  try {
    // Update the role using raw SQL if possible, or direct update
    const { data: updatedAdmin, error } = await supabaseAdmin
      .from('clients')
      .update({ role: 'admin' })
      .eq('email', 'admin@applybureau.com')
      .select('*')
      .single();
    
    if (error) {
      console.log('❌ Error updating role:', error);
      return false;
    }
    
    console.log('✅ Admin role updated successfully');
    console.log('📋 Updated user:', {
      id: updatedAdmin.id,
      email: updatedAdmin.email,
      role: updatedAdmin.role
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Error setting admin role:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  setAdminRole()
    .then((success) => {
      if (success) {
        console.log('\n🎉 Admin role set successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Failed to set admin role');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = setAdminRole;