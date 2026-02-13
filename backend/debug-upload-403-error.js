const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('🔍 DEBUGGING 403 ERROR ON UPLOAD ENDPOINTS');
console.log('='.repeat(70));
console.log('');

// Test token (replace with actual token from frontend)
const TEST_TOKEN = 'PASTE_YOUR_TOKEN_HERE';

console.log('Instructions:');
console.log('1. Get the Bearer token from your frontend (from localStorage or API call)');
console.log('2. Replace TEST_TOKEN above with your actual token');
console.log('3. Run this script: node debug-upload-403-error.js');
console.log('');
console.log('='.repeat(70));
console.log('');

if (TEST_TOKEN === 'PASTE_YOUR_TOKEN_HERE') {
  console.log('❌ Please paste your actual token in the script first!');
  console.log('');
  console.log('To get your token:');
  console.log('1. Open browser DevTools (F12)');
  console.log('2. Go to Application > Local Storage');
  console.log('3. Find the auth token');
  console.log('4. Copy the token value');
  console.log('');
  process.exit(1);
}

try {
  // Decode without verification first to see what's in it
  const decoded = jwt.decode(TEST_TOKEN);
  
  console.log('📋 Token Contents (decoded):');
  console.log(JSON.stringify(decoded, null, 2));
  console.log('');
  
  // Check critical fields
  console.log('🔍 Critical Field Checks:');
  console.log(`   userId: ${decoded?.userId || decoded?.id || 'MISSING'}`);
  console.log(`   email: ${decoded?.email || 'MISSING'}`);
  console.log(`   role: ${decoded?.role || 'MISSING'}`);
  console.log(`   exp: ${decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : 'MISSING'}`);
  console.log('');
  
  // Verify the token
  try {
    const verified = jwt.verify(TEST_TOKEN, process.env.JWT_SECRET);
    console.log('✅ Token is valid and not expired');
    console.log('');
  } catch (verifyError) {
    console.log('❌ Token verification failed:', verifyError.message);
    console.log('');
  }
  
  // Check role specifically
  console.log('🎯 Role Check (for requireClient middleware):');
  if (!decoded) {
    console.log('   ❌ Token could not be decoded');
  } else if (!decoded.role) {
    console.log('   ❌ PROBLEM: No role field in token');
    console.log('   → This is why you get 403 error');
    console.log('   → Token needs to have role: "client"');
  } else if (decoded.role !== 'client') {
    console.log(`   ❌ PROBLEM: Role is "${decoded.role}" but should be "client"`);
    console.log('   → This is why you get 403 error');
    console.log('   → requireClient middleware only allows role: "client"');
  } else {
    console.log('   ✅ Role is correctly set to "client"');
    console.log('   → This should work fine');
  }
  console.log('');
  
  // Check user ID
  console.log('🆔 User ID Check:');
  const userId = decoded?.userId || decoded?.id;
  if (!userId) {
    console.log('   ❌ PROBLEM: No userId or id field in token');
    console.log('   → Backend needs req.user.id to work');
  } else {
    console.log(`   ✅ User ID found: ${userId}`);
  }
  console.log('');
  
  // Recommendations
  console.log('💡 Recommendations:');
  if (!decoded?.role || decoded.role !== 'client') {
    console.log('');
    console.log('The token is missing the correct role. This happens when:');
    console.log('1. User was created before role field was added');
    console.log('2. Login endpoint is not setting role correctly');
    console.log('3. Token was generated with old code');
    console.log('');
    console.log('Solutions:');
    console.log('1. Check the user record in registered_users table');
    console.log('2. Verify the role field is set to "client"');
    console.log('3. Log out and log in again to get a new token');
    console.log('4. Check the login endpoint generates token with role field');
  } else {
    console.log('');
    console.log('Token looks good! If still getting 403, check:');
    console.log('1. Token is being sent in Authorization header');
    console.log('2. Format is: "Bearer <token>"');
    console.log('3. No extra spaces or characters');
    console.log('4. CORS is allowing the Authorization header');
  }
  
} catch (error) {
  console.log('❌ Error decoding token:', error.message);
  console.log('');
  console.log('This usually means:');
  console.log('1. Token format is invalid');
  console.log('2. Token is corrupted');
  console.log('3. Not a valid JWT token');
}

console.log('');
console.log('='.repeat(70));
console.log('');
console.log('Next Steps:');
console.log('1. Fix any issues identified above');
console.log('2. Test the upload endpoints again');
console.log('3. Check backend logs for more details');
