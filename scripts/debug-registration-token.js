require('dotenv').config();
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../utils/supabase');

async function debugRegistrationToken() {
  try {
    console.log('🔍 DEBUGGING REGISTRATION TOKEN FLOW');
    console.log('====================================');
    
    const testEmail = 'john.concierge@test.com';
    const testName = 'John Concierge Test';
    
    // 1. Generate a token like the admin route does
    console.log('\n📝 1. Generating registration token...');
    const token = jwt.sign(
      { 
        email: testEmail,
        name: testName,
        type: 'registration',
        payment_confirmed: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✅ Token generated successfully');
    console.log(`📄 Token: ${token.substring(0, 50)}...`);
    
    // 2. Verify the token like the client registration route does
    console.log('\n🔍 2. Verifying token...');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified successfully');
      console.log('📋 Decoded payload:', JSON.stringify(decoded, null, 2));
      
      if (decoded.type !== 'registration') {
        console.log('❌ Token type mismatch!');
        console.log(`   Expected: 'registration'`);
        console.log(`   Got: '${decoded.type}'`);
      } else {
        console.log('✅ Token type is correct');
      }
    } catch (jwtError) {
      console.log('❌ Token verification failed:', jwtError.message);
    }
    
    // 3. Check if user exists in registered_users table
    console.log('\n👤 3. Checking user in registered_users table...');
    const { data: user, error } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, registration_token, token_expires_at, token_used, payment_confirmed')
      .eq('email', testEmail)
      .single();
    
    if (error) {
      console.log('❌ User not found in registered_users table');
      console.log('   Error:', error.message);
      console.log('   This might be why registration is failing');
      
      // Check if user exists in consultation_requests
      console.log('\n🔍 Checking consultation_requests table...');
      const { data: consultation, error: consultError } = await supabaseAdmin
        .from('consultation_requests')
        .select('id, email, name')
        .eq('email', testEmail)
        .single();
      
      if (consultation) {
        console.log('✅ User found in consultation_requests');
        console.log('   This user needs to be moved to registered_users after payment confirmation');
      } else {
        console.log('❌ User not found in consultation_requests either');
      }
    } else {
      console.log('✅ User found in registered_users table');
      console.log('📋 User data:', JSON.stringify(user, null, 2));
      
      if (!user.payment_confirmed) {
        console.log('⚠️  Payment not confirmed for this user');
      }
      
      if (user.token_used) {
        console.log('⚠️  Registration token already used');
      }
      
      if (user.registration_token !== token) {
        console.log('⚠️  Token mismatch in database');
        console.log(`   DB token: ${user.registration_token?.substring(0, 50)}...`);
        console.log(`   Generated token: ${token.substring(0, 50)}...`);
      }
    }
    
    console.log('\n📊 DEBUGGING SUMMARY');
    console.log('====================');
    console.log('The registration flow requires:');
    console.log('1. ✅ Valid JWT token with type: "registration"');
    console.log('2. ❓ User record in registered_users table');
    console.log('3. ❓ payment_confirmed = true');
    console.log('4. ❓ token_used = false');
    console.log('5. ❓ Token matches database record');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugRegistrationToken().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});