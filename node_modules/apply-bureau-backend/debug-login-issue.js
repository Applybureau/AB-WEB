#!/usr/bin/env node

/**
 * Debug Login Issue for Israel's Account
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');

const TEST_EMAIL = 'israelloko65@gmail.com';
const NEW_PASSWORD = 'SimplePass123!'; // Even simpler password

async function debugLoginIssue() {
  console.log('🔍 Debugging Login Issue...\n');

  try {
    // 1. Check auth users
    console.log('1️⃣ Checking auth users...');
    
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    const authUser = authUsers.users.find(u => u.email === TEST_EMAIL);
    console.log('Auth user found:', authUser ? `Yes (${authUser.id})` : 'No');
    
    if (authUser) {
      console.log('Auth user details:');
      console.log('  - ID:', authUser.id);
      console.log('  - Email:', authUser.email);
      console.log('  - Email confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No');
      console.log('  - Created:', authUser.created_at);
    }

    // 2. Check registered users
    console.log('\n2️⃣ Checking registered users...');
    
    const { data: regUsers, error: regError } = await supabaseAdmin
      .from('registered_users')
      .select('*')
      .eq('email', TEST_EMAIL);
    
    if (regError) {
      console.error('❌ Error fetching registered users:', regError);
    } else {
      console.log('Registered users found:', regUsers.length);
      regUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
        console.log(`     Unlocked: ${user.profile_unlocked}, Active: ${user.is_active}`);
      });
    }

    // 3. Create/update auth user with simple password
    console.log('\n3️⃣ Creating/updating auth user...');
    
    if (authUser) {
      // Update existing user
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        authUser.id,
        { 
          password: NEW_PASSWORD,
          email_confirm: true
        }
      );

      if (updateError) {
        console.error('❌ Error updating password:', updateError);
      } else {
        console.log('✅ Password updated successfully');
      }
    } else {
      // Create new auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: TEST_EMAIL,
        password: NEW_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'Israel Loko',
          role: 'client'
        }
      });

      if (createError) {
        console.error('❌ Error creating auth user:', createError);
      } else {
        console.log('✅ Auth user created:', newUser.user.id);
        
        // Update registered_users to match the auth user ID
        if (regUsers.length > 0) {
          const { error: linkError } = await supabaseAdmin
            .from('registered_users')
            .update({ id: newUser.user.id })
            .eq('email', TEST_EMAIL);
          
          if (linkError) {
            console.log('⚠️ Could not link registered user:', linkError.message);
          } else {
            console.log('✅ Linked registered user to auth user');
          }
        }
      }
    }

    // 4. Test login directly with Supabase
    console.log('\n4️⃣ Testing direct Supabase login...');
    
    try {
      const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: NEW_PASSWORD
      });

      if (loginError) {
        console.log('❌ Direct login failed:', loginError.message);
      } else {
        console.log('✅ Direct login successful');
        console.log('  - User ID:', loginData.user.id);
        console.log('  - Access token length:', loginData.session.access_token.length);
      }
    } catch (directLoginError) {
      console.log('❌ Direct login error:', directLoginError.message);
    }

    // 5. Test API login endpoint
    console.log('\n5️⃣ Testing API login endpoint...');
    
    try {
      const response = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: NEW_PASSWORD
        })
      });

      const responseText = await response.text();
      console.log('API Response Status:', response.status);
      console.log('API Response:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));

      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log('✅ API login successful');
        if (data.token) {
          console.log('  - Token received (length):', data.token.length);
        }
      } else {
        console.log('❌ API login failed');
      }
    } catch (apiError) {
      console.log('❌ API login error:', apiError.message);
    }

    // 6. Display final credentials
    console.log('\n' + '='.repeat(60));
    console.log('🎉 UPDATED CREDENTIALS');
    console.log('='.repeat(60));
    
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${NEW_PASSWORD}`);
    
    console.log('\n🌐 LOGIN URLS:');
    console.log('   Frontend: https://www.applybureau.com/login');
    console.log('   API: https://jellyfish-app-t4m35.ondigitalocean.app/api/auth/login');
    
    console.log('\n🧪 TESTING STEPS:');
    console.log('1. Try logging in with the new password');
    console.log('2. If it still fails, check the browser console for errors');
    console.log('3. Try the API endpoint directly with curl:');
    console.log(`   curl -X POST https://jellyfish-app-t4m35.ondigitalocean.app/api/auth/login \\`);
    console.log(`        -H "Content-Type: application/json" \\`);
    console.log(`        -d '{"email":"${TEST_EMAIL}","password":"${NEW_PASSWORD}"}'`);

    return {
      success: true,
      credentials: {
        email: TEST_EMAIL,
        password: NEW_PASSWORD
      }
    };

  } catch (error) {
    console.error('❌ Debug failed:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  debugLoginIssue()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Debug completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Debug failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { debugLoginIssue };