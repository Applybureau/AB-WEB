#!/usr/bin/env node

require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function findAdminUser() {
  console.log('🔍 Finding Admin User Location\n');
  
  const adminId = '688b3986-0398-4c00-8aa9-0f14a411b378';
  const adminEmail = 'admin@applybureau.com';
  
  try {
    // Check all possible tables
    const tables = ['clients', 'registered_users', 'admins', 'users'];
    
    for (const table of tables) {
      console.log(`\n📋 Checking ${table} table...`);
      
      try {
        // Check by ID
        const { data: byId, error: idError } = await supabaseAdmin
          .from(table)
          .select('*')
          .eq('id', adminId);
        
        if (!idError && byId && byId.length > 0) {
          console.log(`✅ Found by ID in ${table}:`, JSON.stringify(byId, null, 2));
        } else if (idError) {
          console.log(`❌ Error checking ${table} by ID:`, idError.message);
        } else {
          console.log(`⚪ Not found by ID in ${table}`);
        }
        
        // Check by email
        const { data: byEmail, error: emailError } = await supabaseAdmin
          .from(table)
          .select('*')
          .eq('email', adminEmail);
        
        if (!emailError && byEmail && byEmail.length > 0) {
          console.log(`✅ Found by email in ${table}:`, JSON.stringify(byEmail, null, 2));
        } else if (emailError) {
          console.log(`❌ Error checking ${table} by email:`, emailError.message);
        } else {
          console.log(`⚪ Not found by email in ${table}`);
        }
        
      } catch (error) {
        console.log(`❌ Table ${table} doesn't exist or error:`, error.message);
      }
    }
    
    // Check Supabase auth users
    console.log('\n🔐 Checking Supabase Auth Users...');
    try {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.log('❌ Error getting auth users:', authError);
      } else {
        const adminAuthUser = authUsers.users.find(u => u.email === adminEmail || u.id === adminId);
        if (adminAuthUser) {
          console.log('✅ Found in Supabase Auth:', JSON.stringify(adminAuthUser, null, 2));
        } else {
          console.log('⚪ Not found in Supabase Auth');
        }
      }
    } catch (error) {
      console.log('❌ Error checking auth users:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Search failed:', error.message);
  }
}

findAdminUser().catch(console.error);