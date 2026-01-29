#!/usr/bin/env node

/**
 * Check existing users in the database
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');

async function checkUsers() {
  console.log('🔍 Checking existing users...\n');

  try {
    // List auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    console.log(`📊 Found ${authUsers.users.length} auth users:`);
    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.id}) - ${user.user_metadata?.role || 'no role'}`);
    });

    // List registered users
    const { data: registeredUsers, error: regError } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .limit(10);
    
    if (regError) {
      console.error('❌ Error fetching registered users:', regError);
      return;
    }

    console.log(`\n📋 Found ${registeredUsers.length} registered users:`);
    registeredUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.id}) - ${user.role} - Unlocked: ${user.profile_unlocked}`);
    });

    // Check for client users specifically
    const clientUsers = registeredUsers.filter(u => u.role === 'client');
    console.log(`\n👥 Client users: ${clientUsers.length}`);
    
    if (clientUsers.length > 0) {
      console.log('\n🎯 Existing client users that could be used for testing:');
      clientUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - Unlocked: ${user.profile_unlocked} - Payment: ${user.payment_confirmed}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkUsers()
  .then(() => {
    console.log('\n✅ User check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script error:', error);
    process.exit(1);
  });