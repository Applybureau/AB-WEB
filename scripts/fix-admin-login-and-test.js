require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'admin@applybureau.com';
const ADMIN_PASSWORD = 'Admin@123456';
const TEST_EMAIL = 'israelloko65@gmail.com';

async function fixAdminAndTest() {
  console.log('🔧 Fixing Admin Login and Testing Contacts...\n');
  
  try {
    // Step 1: Check admin_users table
    console.log('1️⃣ Checking admin_users table...');
    const { data: admins, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .limit(5);
    
    if (adminError) {
      console.error('❌ Error checking admin_users:', adminError);
      return;
    }
    
    console.log(`✅ Found ${admins.length} admin user(s)`);
    if (admins.length > 0) {
      admins.forEach(admin => {
        console.log(`   - ${admin.email} (ID: ${admin.id}, Role: ${admin.role})`);
      });
    }
    
    // Step 2: Create or update admin user
    let adminUser = admins.find(a => a.email === ADMIN_EMAIL);
    
    if (!adminUser) {
      console.log('\n2️⃣ Creating admin user...');
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      const { data: newAdmin, error: createError } = await supabaseAdmin
        .from('admin_users')
        .insert({
          email: ADMIN_EMAIL,
          password: hashedPassword,
          role: 'super_admin',
          first_name: 'Admin',
          last_name: 'User',
          is_active: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating admin:', createError);
        return;
      }
      
      adminUser = newAdmin;
      console.log('✅ Admin user created:', adminUser.email);
    } else {
      console.log('\n2️⃣ Updating admin password...');
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      const { data: updatedAdmin, error: updateError } = await supabaseAdmin
        .from('admin_users')
        .update({ 
          password: hashedPassword,
          is_active: true,
          role: 'super_admin'
        })
        .eq('email', ADMIN_EMAIL)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error updating admin:', updateError);
        return;
      }
      
      adminUser = updatedAdmin;
      console.log('✅ Admin password updated');
    }
    
    // Step 3: Test login
    console.log('\n3️⃣ Testing admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (!loginResponse.data.token) {
      console.error('❌ Login failed - no token received');
      console.log('Response:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    console.log('   Token:', token.substring(0, 30) + '...');
    console.log('   User:', loginResponse.data.user);
    
    // Step 4: Test contact-requests endpoint
    console.log('\n4️⃣ Testing GET /api/contact-requests...');
    const crResponse = await axios.get(`${BASE_URL}/api/contact-requests`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Contact requests loaded successfully!');
    console.log('   Total contacts:', crResponse.data.total);
    console.log('   Contacts in response:', crResponse.data.data?.length || 0);
    console.log('   Page:', crResponse.data.page);
    console.log('   Total pages:', crResponse.data.totalPages);
    
    if (crResponse.data.data && crResponse.data.data.length > 0) {
      console.log('\n📋 Recent contacts:');
      crResponse.data.data.slice(0, 3).forEach(contact => {
        console.log(`   - ${contact.first_name} ${contact.last_name}`);
        console.log(`     Email: ${contact.email}`);
        console.log(`     Subject: ${contact.subject}`);
        console.log(`     Status: ${contact.status}`);
        console.log(`     Created: ${new Date(contact.created_at).toLocaleString()}`);
        console.log('');
      });
    }
    
    // Step 5: Test contact submissions endpoint
    console.log('5️⃣ Testing GET /api/contact...');
    const csResponse = await axios.get(`${BASE_URL}/api/contact`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Contact submissions loaded successfully!');
    console.log('   Total contacts:', csResponse.data.pagination?.total || 0);
    console.log('   Contacts in response:', csResponse.data.contacts?.length || 0);
    
    // Step 6: Test with filters
    console.log('\n6️⃣ Testing with filters...');
    const filteredResponse = await axios.get(`${BASE_URL}/api/contact-requests?status=new&limit=5`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Filtered contacts loaded:');
    console.log('   New contacts:', filteredResponse.data.total);
    
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('\n📊 DASHBOARD SHOULD NOW WORK:');
    console.log('   ✓ Admin can login');
    console.log('   ✓ Contacts are loading');
    console.log('   ✓ API endpoints working');
    console.log('   ✓ Authentication working');
    console.log('\n🔑 ADMIN CREDENTIALS:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n🌐 FRONTEND CONFIGURATION:');
    console.log('   Endpoint: GET /api/contact-requests');
    console.log('   Headers: { Authorization: "Bearer <token>" }');
    console.log('   Response format: { data: [...], total: N, page: 1, totalPages: N }');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
      console.error('   Headers:', error.response.headers);
    }
    console.error('\n   Stack:', error.stack);
  }
}

fixAdminAndTest();
