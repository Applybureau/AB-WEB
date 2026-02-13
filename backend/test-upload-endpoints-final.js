// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { supabaseAdmin } = require('./utils/supabase');
const jwt = require('jsonwebtoken');
const axios = require('axios');

console.log('🧪 TESTING UPLOAD ENDPOINTS - FINAL VERIFICATION');
console.log('='.repeat(70));
console.log('');

const BACKEND_URL = process.env.BACKEND_URL || 'https://jellyfish-app-t4m35.ondigitalocean.app';

async function runTests() {
  try {
    // Step 1: Get a test client user
    console.log('1️⃣ Getting test client user...');
    const { data: testUser, error: userError } = await supabaseAdmin
      .from('registered_users')
      .select('id, email, full_name, role')
      .eq('role', 'client')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (userError || !testUser) {
      console.log('   ❌ No active client user found');
      console.log('   💡 Create a client user first');
      return;
    }

    console.log(`   ✅ Found client: ${testUser.email}`);
    console.log(`      ID: ${testUser.id}`);
    console.log(`      Role: ${testUser.role}`);

    // Step 2: Generate token
    console.log('');
    console.log('2️⃣ Generating authentication token...');
    const token = jwt.sign({
      userId: testUser.id,
      id: testUser.id,
      email: testUser.email,
      role: testUser.role,
      full_name: testUser.full_name,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }, process.env.JWT_SECRET);

    console.log('   ✅ Token generated');
    
    // Decode and verify
    const decoded = jwt.decode(token);
    console.log(`      Role in token: ${decoded.role}`);
    console.log(`      Expires: ${new Date(decoded.exp * 1000).toLocaleString()}`);

    // Step 3: Test LinkedIn upload
    console.log('');
    console.log('3️⃣ Testing LinkedIn upload endpoint...');
    try {
      const linkedinResponse = await axios.post(
        `${BACKEND_URL}/api/client/uploads/linkedin`,
        {
          linkedin_url: 'https://linkedin.com/in/testuser'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('   ✅ LinkedIn upload successful');
      console.log(`      Status: ${linkedinResponse.status}`);
      console.log(`      Message: ${linkedinResponse.data.message}`);
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ LinkedIn upload failed: ${error.response.status}`);
        console.log(`      Error: ${JSON.stringify(error.response.data)}`);
      } else {
        console.log(`   ❌ LinkedIn upload error: ${error.message}`);
      }
    }

    // Step 4: Test Portfolio upload
    console.log('');
    console.log('4️⃣ Testing Portfolio upload endpoint...');
    try {
      const portfolioResponse = await axios.post(
        `${BACKEND_URL}/api/client/uploads/portfolio`,
        {
          portfolio_urls: [
            'https://github.com/testuser',
            'https://testuser.com'
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('   ✅ Portfolio upload successful');
      console.log(`      Status: ${portfolioResponse.status}`);
      console.log(`      Message: ${portfolioResponse.data.message}`);
      console.log(`      URLs added: ${portfolioResponse.data.count}`);
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ Portfolio upload failed: ${error.response.status}`);
        console.log(`      Error: ${JSON.stringify(error.response.data)}`);
      } else {
        console.log(`   ❌ Portfolio upload error: ${error.message}`);
      }
    }

    // Step 5: Test upload status
    console.log('');
    console.log('5️⃣ Testing upload status endpoint...');
    try {
      const statusResponse = await axios.get(
        `${BACKEND_URL}/api/client/uploads/status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('   ✅ Status check successful');
      console.log(`      LinkedIn added: ${statusResponse.data.linkedin.added}`);
      console.log(`      Portfolio URLs: ${statusResponse.data.portfolio.count}`);
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ Status check failed: ${error.response.status}`);
        console.log(`      Error: ${JSON.stringify(error.response.data)}`);
      } else {
        console.log(`   ❌ Status check error: ${error.message}`);
      }
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('');
    console.log('✅ TESTING COMPLETE');
    console.log('');
    console.log('📋 Next Steps for Frontend:');
    console.log('1. User must log out and log in again to get fresh token');
    console.log('2. Clear browser localStorage and cache');
    console.log('3. Try upload again from frontend');
    console.log('4. Check browser console for any errors');
    console.log('');
    console.log('🔑 Test Token (valid for 24 hours):');
    console.log(token);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ TEST ERROR:', error.message);
    console.error('');
  }
}

runTests();
