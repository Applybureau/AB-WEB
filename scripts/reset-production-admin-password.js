require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');

async function resetProductionAdminPassword() {
  console.log('🔧 Resetting Production Admin Password\n');
  console.log('='.repeat(60));

  try {
    const adminEmail = 'admin@applybureau.com';
    const newPassword = 'Admin@123456';

    // Step 1: Find admin
    console.log('\n📝 Step 1: Finding admin...');
    const { data: admin, error: findError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (findError || !admin) {
      console.error('❌ Admin not found:', findError);
      return;
    }

    console.log('✅ Admin found:');
    console.log('ID:', admin.id);
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('Current password hash:', admin.password ? admin.password.substring(0, 20) + '...' : 'None');

    // Step 2: Hash new password
    console.log('\n📝 Step 2: Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('✅ New password hashed');
    console.log('New hash:', hashedPassword.substring(0, 20) + '...');

    // Step 3: Update password
    console.log('\n📝 Step 3: Updating password...');
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('clients')
      .update({ 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', admin.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update password:', updateError);
      throw updateError;
    }

    console.log('\n✅ Password updated successfully!');
    console.log('\n🔑 New Credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', newPassword);

    // Step 4: Verify the password works
    console.log('\n📝 Step 4: Verifying password...');
    const isMatch = await bcrypt.compare(newPassword, hashedPassword);
    console.log('Password verification:', isMatch ? '✅ PASS' : '❌ FAIL');

    console.log('\n✅ Admin password reset complete!');
    console.log('Try logging in at: https://apply-bureau-backend.vercel.app/api/auth/login');

  } catch (error) {
    console.error('\n❌ Failed to reset password:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

resetProductionAdminPassword();
