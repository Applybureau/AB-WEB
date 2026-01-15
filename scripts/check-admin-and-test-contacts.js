require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const BASE_URL = 'https://apply-bureau-backend.vercel.app';
const TEST_EMAIL = 'israelloko65@gmail.com';

async function checkAndTestContacts() {
  console.log('🔍 Checking Admin User and Testing Contacts...\n');
  
  try {
    // Step 1: Check if admin user exists
    console.log('1️⃣ Checking for admin user...');
    const { data: admins, error: adminError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .limit(5);
    
    if (adminError) {
      console.error('❌ Error checking admin users:', adminError);
    } else {
      console.log(`✅ Found ${admins.length} admin user(s)`);
      if (admins.length > 0) {
        admins.forEach(admin => {
          console.log(`   - ${admin.email} (ID: ${admin.id})`);
        });
      }
    }
    
    // Step 2: Create admin if none exists
    let adminEmail = 'admin@applybureau.com';
    let adminPassword = 'Admin@123456';
    
    if (!admins || admins.length === 0) {
      console.log('\n2️⃣ Creating admin user...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const { data: newAdmin, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          first_name: 'Admin',
          last_name: 'User'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating admin:', createError);
      } else {
        console.log('✅ Admin user created:', newAdmin.email);
      }
    } else {
      adminEmail = admins[0].email;
      console.log(`\n2️⃣ Using existing admin: ${adminEmail}`);
    }
    
    // Step 3: Check contact_requests table
    console.log('\n3️⃣ Checking contact_requests table...');
    const { data: contactRequests, error: crError, count: crCount } = await supabaseAdmin
      .from('contact_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (crError) {
      console.error('❌ Error checking contact_requests:', crError);
    } else {
      console.log(`✅ Found ${crCount} contact request(s) in contact_requests table`);
      if (contactRequests && contactRequests.length > 0) {
        console.log('   Recent contacts:');
        contactRequests.forEach(cr => {
          console.log(`   - ${cr.first_name} ${cr.last_name} (${cr.email}) - ${cr.status}`);
        });
      }
    }
    
    // Step 4: Check contact_submissions table
    console.log('\n4️⃣ Checking contact_submissions table...');
    const { data: contactSubmissions, error: csError, count: csCount } = await supabaseAdmin
      .from('contact_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (csError) {
      console.error('❌ Error checking contact_submissions:', csError);
    } else {
      console.log(`✅ Found ${csCount} contact submission(s) in contact_submissions table`);
      if (contactSubmissions && contactSubmissions.length > 0) {
        console.log('   Recent submissions:');
        contactSubmissions.forEach(cs => {
          console.log(`   - ${cs.name} (${cs.email}) - ${cs.status}`);
        });
      }
    }
    
    // Step 5: Test API endpoints
    console.log('\n5️⃣ Testing API endpoints...');
    
    // Submit a test contact
    console.log('   Submitting test contact...');
    const contactData = {
      firstName: 'Dashboard',
      lastName: 'Test',
      email: TEST_EMAIL,
      phone: '+1234567890',
      subject: 'Contact Loading Diagnostic',
      message: 'Testing contact loading in dashboard'
    };
    
    try {
      const contactResponse = await axios.post(`${BASE_URL}/api/contact-requests`, contactData);
      console.log('   ✅ Contact submitted:', contactResponse.data.id);
    } catch (error) {
      console.error('   ❌ Contact submission failed:', error.response?.data || error.message);
    }
    
    // Try to login
    console.log('\n   Testing admin login...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: adminEmail,
        password: adminPassword
      });
      
      if (loginResponse.data.token) {
        console.log('   ✅ Admin login successful');
        const token = loginResponse.data.token;
        
        // Test contact-requests endpoint
        console.log('\n   Testing GET /api/contact-requests...');
        try {
          const crResponse = await axios.get(`${BASE_URL}/api/contact-requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('   ✅ Contact requests loaded:', crResponse.data.total, 'total');
        } catch (error) {
          console.error('   ❌ Failed to load contact requests');
          console.error('      Status:', error.response?.status);
          console.error('      Error:', error.response?.data);
        }
        
        // Test contact endpoint
        console.log('\n   Testing GET /api/contact...');
        try {
          const cResponse = await axios.get(`${BASE_URL}/api/contact`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('   ✅ Contact submissions loaded:', cResponse.data.pagination?.total, 'total');
        } catch (error) {
          console.error('   ❌ Failed to load contact submissions');
          console.error('      Status:', error.response?.status);
          console.error('      Error:', error.response?.data);
        }
      }
    } catch (error) {
      console.error('   ❌ Admin login failed');
      console.error('      Status:', error.response?.status);
      console.error('      Error:', error.response?.data);
      console.log('\n   💡 Trying to update admin password...');
      
      // Update admin password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ password: hashedPassword })
        .eq('email', adminEmail);
      
      if (updateError) {
        console.error('      ❌ Failed to update password:', updateError);
      } else {
        console.log('      ✅ Password updated, please retry login');
      }
    }
    
    console.log('\n✅ DIAGNOSTIC COMPLETE');
    console.log('\n📊 SUMMARY:');
    console.log(`   - Admin users: ${admins?.length || 0}`);
    console.log(`   - Contact requests: ${crCount || 0}`);
    console.log(`   - Contact submissions: ${csCount || 0}`);
    console.log('\n💡 FRONTEND SHOULD USE:');
    console.log('   - Endpoint: GET /api/contact-requests');
    console.log('   - Headers: Authorization: Bearer <token>');
    console.log('   - Response: { data: [...], total: N }');
    
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error.message);
    console.error(error);
  }
}

checkAndTestContacts();
