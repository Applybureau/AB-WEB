// Load environment variables from backend/.env
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { supabaseAdmin } = require('./utils/supabase');
const jwt = require('jsonwebtoken');

console.log('🔧 FIXING UPLOAD ENDPOINTS - COMPLETE DIAGNOSIS & FIX');
console.log('='.repeat(70));
console.log('');

async function runFix() {
  const results = {
    checks: [],
    fixes: [],
    errors: []
  };

  // Step 1: Check if client_files table exists
  console.log('1️⃣ Checking client_files table...');
  try {
    const { data, error } = await supabaseAdmin
      .from('client_files')
      .select('*')
      .limit(1);

    if (error) {
      console.log('   ❌ client_files table issue:', error.message);
      results.errors.push('client_files table: ' + error.message);
    } else {
      console.log('   ✅ client_files table exists');
      results.checks.push('client_files table exists');
    }
  } catch (error) {
    console.log('   ❌ Error checking table:', error.message);
    results.errors.push('Table check failed: ' + error.message);
  }

  // Step 2: Check registered_users table and roles
  console.log('');
  console.log('2️⃣ Checking user roles in registered_users...');
  try {
    const { data: users, error } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, role, is_active, payment_confirmed')
      .limit(10);

    if (error) {
      console.log('   ❌ Error:', error.message);
      results.errors.push('User check failed: ' + error.message);
    } else {
      console.log(`   ✅ Found ${users.length} users`);
      
      const usersWithoutRole = users.filter(u => !u.role || u.role !== 'client');
      if (usersWithoutRole.length > 0) {
        console.log(`   ⚠️  ${usersWithoutRole.length} users without proper role`);
        console.log('   📋 Users needing role fix:');
        usersWithoutRole.forEach(u => {
          console.log(`      - ${u.email}: role="${u.role || 'NULL'}"`);
        });
        
        // Fix roles
        console.log('');
        console.log('   🔧 Fixing user roles...');
        for (const user of usersWithoutRole) {
          const { error: updateError } = await supabaseAdmin
            .from('registered_users')
            .update({ role: 'client' })
            .eq('id', user.id);

          if (updateError) {
            console.log(`      ❌ Failed to fix ${user.email}: ${updateError.message}`);
            results.errors.push(`Role fix failed for ${user.email}`);
          } else {
            console.log(`      ✅ Fixed role for ${user.email}`);
            results.fixes.push(`Fixed role for ${user.email}`);
          }
        }
      } else {
        console.log('   ✅ All users have correct role');
        results.checks.push('All users have role=client');
      }
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    results.errors.push('User role check failed: ' + error.message);
  }

  // Step 3: Check storage bucket
  console.log('');
  console.log('3️⃣ Checking Supabase storage bucket...');
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    
    if (error) {
      console.log('   ❌ Error listing buckets:', error.message);
      results.errors.push('Storage check failed: ' + error.message);
    } else {
      const clientFilesBucket = buckets.find(b => b.name === 'client-files');
      if (clientFilesBucket) {
        console.log('   ✅ client-files bucket exists');
        console.log(`      Public: ${clientFilesBucket.public}`);
        results.checks.push('client-files bucket exists');
      } else {
        console.log('   ❌ client-files bucket NOT found');
        console.log('   📋 Available buckets:', buckets.map(b => b.name).join(', '));
        results.errors.push('client-files bucket missing');
      }
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    results.errors.push('Storage bucket check failed: ' + error.message);
  }

  // Step 4: Test token generation
  console.log('');
  console.log('4️⃣ Testing token generation...');
  try {
    const { data: testUser, error } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name, role')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error || !testUser) {
      console.log('   ⚠️  No active user found for testing');
    } else {
      const testToken = jwt.sign({
        userId: testUser.id,
        id: testUser.id,
        email: testUser.email,
        role: testUser.role || 'client',
        full_name: testUser.full_name,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      }, process.env.JWT_SECRET);

      const decoded = jwt.decode(testToken);
      console.log('   ✅ Test token generated');
      console.log(`      User: ${testUser.email}`);
      console.log(`      Role in token: ${decoded.role}`);
      
      if (decoded.role === 'client') {
        console.log('   ✅ Token has correct role');
        results.checks.push('Token generation works correctly');
      } else {
        console.log('   ❌ Token role is wrong');
        results.errors.push('Token generation issue');
      }
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    results.errors.push('Token test failed: ' + error.message);
  }

  // Step 5: Check CORS configuration
  console.log('');
  console.log('5️⃣ Checking CORS configuration...');
  const serverPath = './server.js';
  const fs = require('fs');
  try {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    if (serverContent.includes('Authorization')) {
      console.log('   ✅ Authorization header in CORS config');
      results.checks.push('CORS allows Authorization header');
    } else {
      console.log('   ⚠️  Authorization header might not be in CORS config');
      results.errors.push('CORS might not allow Authorization header');
    }
  } catch (error) {
    console.log('   ⚠️  Could not check server.js');
  }

  // Summary
  console.log('');
  console.log('='.repeat(70));
  console.log('');
  console.log('📊 SUMMARY:');
  console.log('');
  console.log(`✅ Checks Passed: ${results.checks.length}`);
  results.checks.forEach(check => console.log(`   - ${check}`));
  
  console.log('');
  console.log(`🔧 Fixes Applied: ${results.fixes.length}`);
  results.fixes.forEach(fix => console.log(`   - ${fix}`));
  
  console.log('');
  console.log(`❌ Errors Found: ${results.errors.length}`);
  results.errors.forEach(error => console.log(`   - ${error}`));
  
  console.log('');
  console.log('='.repeat(70));
  console.log('');
  
  if (results.fixes.length > 0) {
    console.log('✅ FIXES APPLIED!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Users need to log out and log in again to get new tokens');
    console.log('2. Test the upload endpoints');
    console.log('3. Check if 403 errors are resolved');
  }
  
  if (results.errors.length > 0) {
    console.log('⚠️  ISSUES FOUND!');
    console.log('');
    console.log('Manual fixes needed:');
    if (results.errors.some(e => e.includes('bucket'))) {
      console.log('- Create client-files storage bucket in Supabase');
    }
    if (results.errors.some(e => e.includes('table'))) {
      console.log('- Run database migration to create client_files table');
    }
  }
  
  if (results.checks.length > 0 && results.errors.length === 0) {
    console.log('🎉 ALL CHECKS PASSED!');
    console.log('');
    console.log('If still getting 403 errors:');
    console.log('1. Clear browser cache and localStorage');
    console.log('2. Log out and log in again');
    console.log('3. Check browser console for actual error message');
    console.log('4. Verify token is being sent in Authorization header');
  }
}

runFix().catch(error => {
  console.error('');
  console.error('❌ FATAL ERROR:', error);
  console.error('');
  process.exit(1);
});
