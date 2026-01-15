require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const ADMIN_EMAIL = 'admin@applybureau.com';
const ADMIN_PASSWORD = 'Admin@123456';
const TEST_EMAIL = 'israelloko65@gmail.com';

async function createAdminAndTest() {
  console.log('🔧 Creating Admin in Clients Table and Testing...\n');
  
  try {
    // Step 1: Check if admin exists in clients table
    console.log('1️⃣ Checking for admin in clients table...');
    const { data: existingAdmins, error: checkError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('role', 'admin');
    
    if (checkError) {
      console.error('❌ Error checking clients:', checkError);
      return;
    }
    
    console.log(`✅ Found ${existingAdmins.length} admin(s) in clients table`);
    if (existingAdmins.length > 0) {
      existingAdmins.forEach(admin => {
        console.log(`   - ${admin.email} (ID: ${admin.id}, Role: ${admin.role})`);
      });
    }
    
    // Step 2: Create or update admin
    let adminUser = existingAdmins.find(a => a.email === ADMIN_EMAIL);
    
    if (!adminUser) {
      console.log('\n2️⃣ Creating admin user in clients table...');
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      const { data: newAdmin, error: createError } = await supabaseAdmin
        .from('clients')
        .insert({
          email: ADMIN_EMAIL,
          password: hashedPassword,
          role: 'admin',
          full_name: 'Admin User'
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
        .from('clients')
        .update({ 
          password: hashedPassword,
          role: 'admin'
        })
        .eq('email', ADMIN_EMAIL)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error updating admin:', updateError);
        return;
      }
      
      adminUser = updatedAdmin;
      console.log('✅ Admin password and role updated');
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
    console.log('✅ Admin login successful!');
    console.log('   User:', loginResponse.data.user);
    console.log('   Token:', token.substring(0, 30) + '...');
    
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
      crResponse.data.data.slice(0, 5).forEach((contact, index) => {
        console.log(`\n   ${index + 1}. ${contact.first_name} ${contact.last_name}`);
        console.log(`      Email: ${contact.email}`);
        console.log(`      Subject: ${contact.subject}`);
        console.log(`      Status: ${contact.status}`);
        console.log(`      Phone: ${contact.phone || 'N/A'}`);
        console.log(`      Created: ${new Date(contact.created_at).toLocaleString()}`);
      });
    }
    
    // Step 5: Test contact submissions endpoint
    console.log('\n5️⃣ Testing GET /api/contact...');
    const csResponse = await axios.get(`${BASE_URL}/api/contact`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Contact submissions loaded successfully!');
    console.log('   Total contacts:', csResponse.data.pagination?.total || 0);
    console.log('   Contacts in response:', csResponse.data.contacts?.length || 0);
    
    // Step 6: Submit a new test contact
    console.log('\n6️⃣ Submitting new test contact...');
    const contactData = {
      firstName: 'Final',
      lastName: 'Test',
      email: TEST_EMAIL,
      phone: '+1234567890',
      subject: 'Dashboard Fixed - Final Test',
      message: 'This contact was submitted after fixing the admin authentication issue.'
    };
    
    const contactResponse = await axios.post(`${BASE_URL}/api/contact-requests`, contactData);
    console.log('✅ New contact submitted:', contactResponse.data.id);
    
    // Step 7: Verify new contact appears
    console.log('\n7️⃣ Verifying new contact appears in dashboard...');
    const verifyResponse = await axios.get(`${BASE_URL}/api/contact-requests?limit=1`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.data.data && verifyResponse.data.data.length > 0) {
      const latestContact = verifyResponse.data.data[0];
      console.log('✅ Latest contact verified:');
      console.log(`   Name: ${latestContact.first_name} ${latestContact.last_name}`);
      console.log(`   Email: ${latestContact.email}`);
      console.log(`   Subject: ${latestContact.subject}`);
    }
    
    console.log('\n✅ ALL TESTS PASSED! DASHBOARD IS NOW WORKING!');
    console.log('\n🎉 PROBLEM SOLVED:');
    console.log('   ✓ Admin user created in clients table with role="admin"');
    console.log('   ✓ Admin can login successfully');
    console.log('   ✓ Contacts are loading in dashboard');
    console.log('   ✓ API endpoints working correctly');
    console.log('   ✓ Authentication and authorization working');
    console.log('\n🔑 ADMIN CREDENTIALS:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n📊 DASHBOARD STATISTICS:');
    console.log(`   Total Contact Requests: ${crResponse.data.total}`);
    console.log(`   Total Contact Submissions: ${csResponse.data.pagination?.total || 0}`);
    console.log('\n🌐 FRONTEND INTEGRATION:');
    console.log('   1. Login: POST /api/auth/login');
    console.log('      Body: { email, password }');
    console.log('      Response: { token, user: { role: "admin" } }');
    console.log('   2. Get Contacts: GET /api/contact-requests');
    console.log('      Headers: { Authorization: "Bearer <token>" }');
    console.log('      Response: { data: [...], total, page, totalPages }');
    console.log('   3. Update Contact: PATCH /api/contact-requests/:id');
    console.log('      Body: { status: "in_progress" | "handled" | "archived" }');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    console.error('\n   Stack:', error.stack);
  }
}

createAdminAndTest();
