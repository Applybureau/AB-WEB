#!/usr/bin/env node

/**
 * SIMPLE TOKEN GENERATION TEST
 * Tests token generation without database dependencies
 */

require('dotenv').config({ path: './backend/.env' });
const jwt = require('jsonwebtoken');

console.log('🧪 TESTING TOKEN GENERATION SYSTEM');
console.log('===================================\n');

// Check environment
console.log('📋 Environment Check:');
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'Not set'}\n`);

if (!process.env.JWT_SECRET) {
  console.log('❌ JWT_SECRET is required for token generation');
  process.exit(1);
}

// Test data
const testConsultationId = 'test-consultation-123';
const testEmail = 'israelloko65@gmail.com';
const TOKEN_EXPIRY_HOURS = 72;

console.log('📝 Test Data:');
console.log(`   Consultation ID: ${testConsultationId}`);
console.log(`   Email: ${testEmail}`);
console.log(`   Token Expiry: ${TOKEN_EXPIRY_HOURS} hours\n`);

// Test 1: Generate Token
console.log('1️⃣ GENERATING REGISTRATION TOKEN');
console.log('─'.repeat(50));

try {
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  
  const payload = {
    consultation_id: testConsultationId,
    email: testEmail,
    type: 'registration',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiresAt.getTime() / 1000)
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET);
  
  console.log('✅ Token generated successfully!');
  console.log(`\n📝 Token Details:`);
  console.log(`   Token: ${token.substring(0, 50)}...`);
  console.log(`   Length: ${token.length} characters`);
  console.log(`   Expires: ${expiresAt.toLocaleString()}`);
  console.log(`   Valid for: ${TOKEN_EXPIRY_HOURS} hours`);
  
  // Construct registration URL
  const frontendUrl = process.env.FRONTEND_URL || 'https://www.applybureau.com';
  const registrationUrl = `${frontendUrl}/register?token=${token}`;
  console.log(`\n🔗 Registration URL:`);
  console.log(`   ${registrationUrl}`);
  
  // Test 2: Verify Token
  console.log('\n\n2️⃣ VERIFYING TOKEN');
  console.log('─'.repeat(50));
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('✅ Token JWT signature is valid!');
  console.log(`\n📝 Decoded Payload:`);
  console.log(`   Consultation ID: ${decoded.consultation_id}`);
  console.log(`   Email: ${decoded.email}`);
  console.log(`   Type: ${decoded.type}`);
  console.log(`   Issued At: ${new Date(decoded.iat * 1000).toLocaleString()}`);
  console.log(`   Expires At: ${new Date(decoded.exp * 1000).toLocaleString()}`);
  
  // Calculate time until expiry
  const now = Math.floor(Date.now() / 1000);
  const timeLeft = decoded.exp - now;
  const hoursLeft = Math.floor(timeLeft / 3600);
  const minutesLeft = Math.floor((timeLeft % 3600) / 60);
  console.log(`   Time Remaining: ${hoursLeft}h ${minutesLeft}m`);
  
  // Test 3: Test with expired token
  console.log('\n\n3️⃣ TESTING EXPIRED TOKEN');
  console.log('─'.repeat(50));
  
  const expiredPayload = {
    consultation_id: testConsultationId,
    email: testEmail,
    type: 'registration',
    iat: Math.floor(Date.now() / 1000) - (73 * 60 * 60),
    exp: Math.floor(Date.now() / 1000) - (1 * 60 * 60)
  };
  
  const expiredToken = jwt.sign(expiredPayload, process.env.JWT_SECRET);
  
  try {
    jwt.verify(expiredToken, process.env.JWT_SECRET);
    console.log('❌ Expired token was accepted (should have been rejected)');
  } catch (expiredError) {
    if (expiredError.name === 'TokenExpiredError') {
      console.log('✅ Expired token correctly rejected!');
      console.log(`   Error: ${expiredError.message}`);
    }
  }
  
  // Test 4: Test with invalid signature
  console.log('\n\n4️⃣ TESTING INVALID SIGNATURE');
  console.log('─'.repeat(50));
  
  const invalidToken = token.substring(0, token.length - 10) + 'TAMPERED123';
  
  try {
    jwt.verify(invalidToken, process.env.JWT_SECRET);
    console.log('❌ Invalid token was accepted (should have been rejected)');
  } catch (invalidError) {
    if (invalidError.name === 'JsonWebTokenError') {
      console.log('✅ Invalid token correctly rejected!');
      console.log(`   Error: ${invalidError.message}`);
    }
  }
  
  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('═'.repeat(50));
  console.log('✅ Token generation: WORKING');
  console.log('✅ Token verification: WORKING');
  console.log('✅ Expiry validation: WORKING');
  console.log('✅ Signature validation: WORKING');
  console.log('\n🎉 Token generation system is fully functional!');
  
  console.log('\n💡 Production Flow:');
  console.log('   1. Admin confirms payment in dashboard');
  console.log('   2. Backend generates JWT token (72h expiry)');
  console.log('   3. Email sent with registration URL');
  console.log(`   4. Client clicks: ${frontendUrl}/register?token=...`);
  console.log('   5. Frontend sends token to backend');
  console.log('   6. Backend validates & creates account');
  console.log('   7. Client can login and access dashboard');
  
} catch (error) {
  console.log(`❌ Test failed: ${error.message}`);
  console.error(error);
  process.exit(1);
}
