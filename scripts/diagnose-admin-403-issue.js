require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function diagnoseAdminIssue() {
  console.log('\n🔍 DIAGNOSING ADMIN 403 ISSUE\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Check if admin exists
    console.log('\n📋 Step 1: Checking if admin@applybureau.com exists...');
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', 'admin@applybureau.com')
      .single();

    if (adminError) {
      console.log('❌ Error fetching admin:', adminError.message);
      
      // Try to create the admin
      console.log('\n🔧 Creating super admin account...');
      const hashedPassword = await bcrypt.hash('Admin@123456', 12);
      
      const { data: newAdmin, error: createError } = await supabaseAdmin
        .from('clients')
        .insert({
          full_name: 'Super Admin',
          email: 'admin@applybureau.com',
          password: hashedPassword,
          phone: '+1234567890',
          role: 'admin',
          status: 'active',
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Failed to create admin:', createError.message);
        return;
      }

      console.log('✅ Super admin created successfully!');
      console.log('Admin ID:', newAdmin.id);
      
      // Now test login
      await testLogin(newAdmin.id);
      return;
    }

    console.log('✅ Admin found!');
    console.log('Admin Details:');
    console.log('  - ID:', admin.id);
    console.log('  - Email:', admin.email);
    console.log('  - Full Name:', admin.full_name);
    console.log('  - Role:', admin.role);
    console.log('  - Status:', admin.status);
    console.log('  - Is Active:', admin.is_active);
    console.log('  - Has Password:', !!admin.password);

    // Step 2: Test password
    console.log('\n📋 Step 2: Testing password...');
    const passwordMatch = await bcrypt.compare('Admin@123456', admin.password);
    console.log('Password matches:', passwordMatch ? '✅ YES' : '❌ NO');

    if (!passwordMatch) {
      console.log('\n🔧 Resetting password to Admin@123456...');
      const hashedPassword = await bcrypt.hash('Admin@123456', 12);
      
      const { error: updateError } = await supabaseAdmin
        .from('clients')
        .update({ password: hashedPassword })
        .eq('id', admin.id);

      if (updateError) {
        console.log('❌ Failed to reset password:', updateError.message);
        return;
      }

      console.log('✅ Password reset successfully!');
    }

    // Step 3: Test login and token generation
    await testLogin(admin.id);

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

async function testLogin(adminId) {
  console.log('\n📋 Step 3: Testing login flow...');
  
  try {
    // Get admin data
    const { data: admin } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', adminId)
      .single();

    // Generate token
    const token = jwt.sign(
      {
        userId: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Token generated successfully!');
    console.log('\n📝 Token Details:');
    console.log('Token:', token.substring(0, 50) + '...');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('\n✅ Token verified successfully!');
    console.log('Decoded payload:');
    console.log('  - userId:', decoded.userId);
    console.log('  - email:', decoded.email);
    console.log('  - role:', decoded.role);

    // Step 4: Test super admin check
    console.log('\n📋 Step 4: Testing super admin check...');
    const { data: superAdminCheck } = await supabaseAdmin
      .from('clients')
      .select('email, role')
      .eq('id', decoded.userId)
      .eq('email', 'admin@applybureau.com')
      .eq('role', 'admin')
      .single();

    console.log('Super admin check result:', superAdminCheck ? '✅ PASSED' : '❌ FAILED');
    
    if (superAdminCheck) {
      console.log('✅ User IS a super admin!');
      console.log('\n🎉 DIAGNOSIS COMPLETE - Admin account is ready!');
      console.log('\n📝 Login Credentials:');
      console.log('  Email: admin@applybureau.com');
      console.log('  Password: Admin@123456');
      console.log('\n🔑 Use this token for testing:');
      console.log(token);
    } else {
      console.log('❌ User is NOT recognized as super admin');
      console.log('This will cause 403 errors when trying to create admins');
    }

  } catch (error) {
    console.error('❌ Login test failed:', error.message);
  }
}

// Run diagnosis
diagnoseAdminIssue()
  .then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('Diagnosis complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
