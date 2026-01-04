#!/usr/bin/env node

/**
 * Debug Password Script
 * Tests password hashing and comparison
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../utils/supabase');

async function debugPassword() {
  console.log('🔍 Debugging password...');
  
  try {
    // Get the current admin user
    const { data: admin, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', 'admin@applybureau.com')
      .single();
    
    if (error || !admin) {
      console.log('❌ Admin user not found:', error);
      return;
    }
    
    console.log('📋 Admin user found:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      hasPassword: !!admin.password,
      passwordLength: admin.password?.length
    });
    
    // Test password comparison
    const testPassword = 'admin123';
    console.log('\n🔑 Testing password comparison...');
    console.log('Test password:', testPassword);
    console.log('Stored hash:', admin.password);
    
    const isValid = await bcrypt.compare(testPassword, admin.password);
    console.log('Password valid:', isValid);
    
    // Create a new hash and test it
    console.log('\n🔄 Creating new hash...');
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('New hash:', newHash);
    
    const newIsValid = await bcrypt.compare(testPassword, newHash);
    console.log('New hash valid:', newIsValid);
    
    // Update with the new hash
    if (!isValid) {
      console.log('\n🔧 Updating with new hash...');
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('clients')
        .update({ password: newHash })
        .eq('email', 'admin@applybureau.com')
        .select('id, email, role')
        .single();
      
      if (updateError) {
        console.log('❌ Update failed:', updateError);
      } else {
        console.log('✅ Password updated successfully');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugPassword();