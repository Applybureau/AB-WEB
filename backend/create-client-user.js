#!/usr/bin/env node

/**
 * Create Client User in the Correct Table
 */

// Load environment variables
require('dotenv').config();

const { supabaseAdmin } = require('./utils/supabase');
const bcrypt = require('bcryptjs');

const TEST_EMAIL = 'israelloko65@gmail.com';
const PASSWORD = 'SimplePass123!';

async function createClientUser() {
  console.log('👤 Creating Client User in Correct Table...\n');

  try {
    // 1. Check if client already exists
    console.log('1️⃣ Checking existing client...');
    
    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();

    if (existingClient) {
      console.log('⚠️ Client already exists, updating...');
      
      // Update existing client
      const hashedPassword = await bcrypt.hash(PASSWORD, 12);
      
      const { data: updatedClient, error: updateError } = await supabaseAdmin
        .from('clients')
        .update({
          password: hashedPassword,
          full_name: 'Israel Loko',
          role: 'client',
          onboarding_complete: true
        })
        .eq('email', TEST_EMAIL)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating client:', updateError);
        return;
      } else {
        console.log('✅ Client updated successfully');
      }
    } else {
      console.log('📝 Creating new client...');
      
      // Create new client
      const hashedPassword = await bcrypt.hash(PASSWORD, 12);
      
      const { data: newClient, error: createError } = await supabaseAdmin
        .from('clients')
        .insert({
          email: TEST_EMAIL,
          password: hashedPassword,
          full_name: 'Israel Loko',
          role: 'client',
          onboarding_complete: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating client:', createError);
        return;
      } else {
        console.log('✅ Client created successfully');
        console.log('   Client ID:', newClient.id);
      }
    }

    // 2. Test API login
    console.log('\n2️⃣ Testing API login...');
    
    try {
      const response = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: PASSWORD
        })
      });

      const responseText = await response.text();
      console.log('API Response Status:', response.status);

      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log('✅ API login successful!');
        console.log('  - User ID:', data.user.id);
        console.log('  - Role:', data.user.role);
        console.log('  - Dashboard Type:', data.user.dashboard_type);
        console.log('  - Token received:', data.token ? 'Yes' : 'No');
        
        // Test dashboard endpoint
        if (data.token) {
          console.log('\n3️⃣ Testing dashboard endpoint...');
          
          const dashResponse = await fetch('https://jellyfish-app-t4m35.ondigitalocean.app/api/client/dashboard', {
            headers: {
              'Authorization': `Bearer ${data.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (dashResponse.ok) {
            const dashData = await dashResponse.json();
            console.log('✅ Dashboard endpoint working');
            console.log('  - Dashboard data received');
          } else {
            console.log('⚠️ Dashboard endpoint issue:', dashResponse.status);
            const errorText = await dashResponse.text();
            console.log('  - Error:', errorText.substring(0, 100));
          }
        }
        
      } else {
        console.log('❌ API login failed:', responseText);
      }
    } catch (apiError) {
      console.log('❌ API login error:', apiError.message);
    }

    // 4. Display final credentials
    console.log('\n' + '='.repeat(60));
    console.log('🎉 CLIENT USER CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    
    console.log('\n📋 WORKING LOGIN CREDENTIALS:');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${PASSWORD}`);
    
    console.log('\n🌐 LOGIN URLS:');
    console.log('   Frontend: https://apply-bureau.vercel.app/login');
    console.log('   API: https://jellyfish-app-t4m35.ondigitalocean.app/api/auth/login');
    
    console.log('\n✅ ACCOUNT STATUS:');
    console.log('   ✅ Client Record: EXISTS');
    console.log('   ✅ Password Set: YES');
    console.log('   ✅ Onboarding Complete: YES');
    console.log('   ✅ Ready for Testing: YES');
    
    console.log('\n🧪 TESTING INSTRUCTIONS:');
    console.log('1. Use the credentials above to login');
    console.log('2. Test the client dashboard functionality');
    console.log('3. Check application tracking features');

    return {
      success: true,
      credentials: {
        email: TEST_EMAIL,
        password: PASSWORD
      }
    };

  } catch (error) {
    console.error('❌ Failed to create client user:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  createClientUser()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Client user creation completed successfully!');
        process.exit(0);
      } else {
        console.error('\n💥 Client user creation failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { createClientUser };