require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function testUserCreation() {
  try {
    console.log('👤 Testing User Creation');
    console.log('=======================');
    
    // Test minimal user creation
    console.log('🧪 Testing minimal user creation...');
    const { data: minimalUser, error: minimalError } = await supabaseAdmin
      .from('registered_users')
      .insert({
        email: 'test.minimal@example.com',
        full_name: 'Test Minimal User',
        role: 'client'
      })
      .select()
      .single();
    
    if (minimalError) {
      console.log('❌ Minimal user creation failed:', minimalError.message);
      console.log('   Details:', minimalError.details);
      console.log('   Hint:', minimalError.hint);
      console.log('   Code:', minimalError.code);
    } else {
      console.log('✅ Minimal user created successfully');
      console.log('   ID:', minimalUser.id);
      console.log('   Email:', minimalUser.email);
      
      // Clean up
      await supabaseAdmin
        .from('registered_users')
        .delete()
        .eq('id', minimalUser.id);
      console.log('🧹 Test user cleaned up');
    }
    
    // Test with payment fields
    console.log('💳 Testing user creation with payment fields...');
    const { data: paymentUser, error: paymentError } = await supabaseAdmin
      .from('registered_users')
      .insert({
        email: 'test.payment@example.com',
        full_name: 'Test Payment User',
        role: 'client',
        is_active: true,
        payment_confirmed: true,
        payment_received: true,
        profile_unlocked: false,
        onboarding_completed: false,
        token_used: false
      })
      .select()
      .single();
    
    if (paymentError) {
      console.log('❌ Payment user creation failed:', paymentError.message);
      console.log('   Details:', paymentError.details);
      console.log('   Hint:', paymentError.hint);
      console.log('   Code:', paymentError.code);
    } else {
      console.log('✅ Payment user created successfully');
      console.log('   ID:', paymentUser.id);
      console.log('   Email:', paymentUser.email);
      
      // Clean up
      await supabaseAdmin
        .from('registered_users')
        .delete()
        .eq('id', paymentUser.id);
      console.log('🧹 Test user cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserCreation();