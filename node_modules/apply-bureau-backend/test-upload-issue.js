const { supabaseAdmin } = require('./utils/supabase');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const TEST_EMAIL = 'israelloko65@gmail.com';

console.log('🔍 UPLOAD ISSUE DIAGNOSIS');
console.log('='.repeat(60));
console.log('');

async function diagnose() {
  // Step 1: Check user in database
  console.log('1️⃣ Checking user in database...');
  const { data: user, error } = await supabaseAdmin
    .from('registered_users')
    .select('id, email, role, is_active, payment_confirmed, passcode_hash')
    .eq('email', TEST_EMAIL)
    .single();

  if (error || !user) {
    console.log('❌ User not found!');
    console.log('Error:', error?.message);
    return;
  }

  console.log('✅ User found:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role || 'NOT SET'}`);
  console.log(`   Active: ${user.is_active}`);
  console.log(`   Has Password: ${!!user.passcode_hash}`);
  console.log('');

  // Step 2: Check role
  console.log('2️⃣ Checking role for upload access...');
  if (!user.role) {
    console.log('❌ PROBLEM: Role is NULL');
    console.log('   → Upload will fail with 403');
    console.log('   → Fix: UPDATE registered_users SET role = \'client\' WHERE id = \'' + user.id + '\'');
  } else if (user.role !== 'client') {
    console.log(`❌ PROBLEM: Role is "${user.role}" not "client"`);
    console.log('   → Upload will fail with 403');
    console.log('   → Fix: UPDATE registered_users SET role = \'client\' WHERE id = \'' + user.id + '\'');
  } else {
    console.log('✅ Role is correct: "client"');
  }
  console.log('');

  // Step 3: Generate test token
  console.log('3️⃣ Generating test token...');
  const testToken = jwt.sign({
    userId: user.id,
    id: user.id,
    email: user.email,
    role: user.role || 'client',
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  }, process.env.JWT_SECRET);

  console.log('✅ Test token generated');
  console.log(`   Token: ${testToken.substring(0, 30)}...`);
  console.log('');

  // Step 4: Decode token to verify
  const decoded = jwt.decode(testToken);
  console.log('4️⃣ Token contents:');
  console.log(`   userId: ${decoded.userId}`);
  console.log(`   email: ${decoded.email}`);
  console.log(`   role: ${decoded.role}`);
  console.log('');

  // Step 5: Check client_files table
  console.log('5️⃣ Checking client_files table...');
  const { data: files, error: filesError } = await supabaseAdmin
    .from('client_files')
    .select('id')
    .limit(1);

  if (filesError) {
    console.log('❌ client_files table error:', filesError.message);
  } else {
    console.log('✅ client_files table accessible');
  }
  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));
  console.log('');

  if (!user.role || user.role !== 'client') {
    console.log('❌ ISSUE FOUND: User role is not "client"');
    console.log('');
    console.log('🔧 FIX:');
    console.log('Run this SQL command:');
    console.log('');
    console.log(`UPDATE registered_users SET role = 'client' WHERE id = '${user.id}';`);
    console.log('');
    console.log('Then have the user log out and log in again.');
  } else {
    console.log('✅ User configuration looks correct');
    console.log('');
    console.log('If still getting 403, check:');
    console.log('1. Token is being sent correctly');
    console.log('2. Authorization header format: "Bearer <token>"');
    console.log('3. Backend logs for specific error');
  }
  console.log('');
  console.log('📝 Test Token (use this to test manually):');
  console.log(testToken);
  console.log('');
  console.log('🧪 Test with cURL:');
  console.log(`curl -X POST https://jellyfish-app-t4m35.ondigitalocean.app/api/client/uploads/linkedin \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "Authorization: Bearer ${testToken}" \\`);
  console.log(`  -d '{"linkedin_url":"https://linkedin.com/in/test"}'`);
}

diagnose().catch(console.error);
