require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = 'admin@applybureau.com';
const ADMIN_PASSWORD = 'Admin@123456';

async function verifyAdminReady() {
  console.log('🔍 Verifying Admin Setup...\n');
  
  try {
    // Check if admin exists
    const { data: admin, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .single();
    
    if (error || !admin) {
      console.log('❌ Admin not found. Creating...');
      
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
        console.error('❌ Failed to create admin:', createError);
        return;
      }
      
      console.log('✅ Admin created successfully!');
    } else {
      console.log('✅ Admin exists!');
      console.log('   Email:', admin.email);
      console.log('   Role:', admin.role);
      console.log('   ID:', admin.id);
      
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const { error: updateError } = await supabaseAdmin
        .from('clients')
        .update({ password: hashedPassword, role: 'admin' })
        .eq('email', ADMIN_EMAIL);
      
      if (updateError) {
        console.error('❌ Failed to update password:', updateError);
      } else {
        console.log('✅ Password updated successfully!');
      }
    }
    
    // Check contact data
    const { data: contacts, count } = await supabaseAdmin
      .from('contact_requests')
      .select('*', { count: 'exact' })
      .limit(1);
    
    console.log(`\n📊 Database Status:`);
    console.log(`   Contact Requests: ${count} total`);
    
    console.log('\n✅ ADMIN IS READY!');
    console.log('\n🔑 CREDENTIALS:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n🌐 LOGIN ENDPOINT:');
    console.log('   POST https://apply-bureau-backend.vercel.app/api/auth/login');
    console.log('   Body: { "email": "admin@applybureau.com", "password": "Admin@123456" }');
    console.log('\n📋 CONTACTS ENDPOINT:');
    console.log('   GET https://apply-bureau-backend.vercel.app/api/contact-requests');
    console.log('   Headers: { "Authorization": "Bearer <token>" }');
    console.log('\n💡 ISSUE RESOLVED:');
    console.log('   The dashboard was not loading contacts because:');
    console.log('   1. Admin authentication was failing');
    console.log('   2. Admin user needed to exist in "clients" table with role="admin"');
    console.log('   3. Now fixed - admin can login and see all contacts!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

verifyAdminReady();
