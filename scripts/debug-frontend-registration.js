require('dotenv').config();
const jwt = require('jsonwebtoken');

console.log('🔍 Frontend Registration Debug Information');
console.log('==========================================');

// The token from the error message
const tokenFromError = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb25zdWx0YXRpb25JZCI6ImU3YjFjY2VhLTE0ZTAtNDk2MS04NzQ2LTNjNDQ0ODA0Y2I1YSIsImVtYWlsIjoiIiwidHlwZSI6ImNsaWVudF9yZWdpc3RyYXRpb24iLCJleHAiOjE3Njg2Mzg2NTksImlhdCI6MTc2ODAzMzg1OX0.sFhRNE4ff69Iw35zvdINT-KpzT2bDr5YhRVMWrYek5U';

console.log('Token from error:', tokenFromError);

try {
  const decoded = jwt.verify(tokenFromError, process.env.JWT_SECRET);
  console.log('✅ Token is valid');
  console.log('Decoded token:', decoded);
  
  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  const isExpired = decoded.exp < now;
  console.log('Current timestamp:', now);
  console.log('Token expires:', decoded.exp);
  console.log('Is expired:', isExpired);
  
  if (isExpired) {
    console.log('❌ Token has expired');
  } else {
    const timeLeft = decoded.exp - now;
    const hoursLeft = Math.floor(timeLeft / 3600);
    console.log(`✅ Token is valid for ${hoursLeft} more hours`);
  }
  
} catch (error) {
  console.log('❌ Token verification failed:', error.message);
}

console.log('\n📋 Frontend Checklist:');
console.log('1. ✅ Backend generates correct URL: http://localhost:5173/register?token=...');
console.log('2. ❌ Frontend shows error: "No routes matched location //register?token=..."');
console.log('3. 🔍 Issue: Frontend routing problem - missing /register route or URL parsing issue');
console.log('\n💡 Solutions:');
console.log('- Check if frontend has a /register route defined');
console.log('- Check React Router configuration');
console.log('- Verify frontend is running on localhost:5173');
console.log('- Check for any URL rewriting or proxy issues');