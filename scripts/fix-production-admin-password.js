require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');

async function fixProductionAdminPassword() {
  console.log('\n🔧 FIXING PRODUCTION ADMIN PASSWORD\n');
  console.log('=' .repeat(60));

  try {
    const targetEmail = 'admin@applybureau.com';
    const newPassword = 'Admin@123456';

    // Step 1: Check if admin exists
    console.log('\n📋 Step 1: Finding admin account...');
    const { data: admin, error: findError } = await supabaseAdmin
      .from('clients')
      .select('id, email, full_name, role')
      .eq('email', targetEmail)
      .single();

    if (findError || !admin) {
      console.log('❌ Admin not found:', findError?.message);
      
      // Create admin if doesn't exist
      console.log('\n🔧 Creating super admin account...');
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      const { data: newAdmin, error: createError } = await supabaseAdmin
        .from('clients')
        .insert({
          full_name: 'Super Admin',
          email: targetEmail,
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
      console.log('Email:', newAdmin.email);
      console.log('Password:', newPassword);
      return;
    }

    console.log('✅ Admin found!');
    console.log('Admin ID:', admin.id);
    console.log('Email:', admin.email);
    console.log('Full Name:', admin.full_name);
    console.log('Role:', admin.role);

    // Step 2: Hash new password with bcrypt (same as production)
    console.log('\n📋 Step 2: Hashing new password...');
    console.log('Using bcrypt with 12 rounds (production standard)');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('✅ Password hashed successfully!');
    console.log('Hash preview:', hashedPassword.substring(0, 30) + '...');

    // Step 3: Update password in database
    console.log('\n📋 Step 3: Updating password in database...');
    const { error: updateError } = await supabaseAdmin
      .from('clients')
      .update({ 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', admin.id);

    if (updateError) {
      console.log('❌ Failed to update password:', updateError.message);
      return;
    }

    console.log('✅ Password updated successfully!');

    // Step 4: Verify the update
    console.log('\n📋 Step 4: Verifying password update...');
    const { data: updatedAdmin } = await supabaseAdmin
      .from('clients')
      .select('password')
      .eq('id', admin.id)
      .single();

    const passwordMatches = await bcrypt.compare(newPassword, updatedAdmin.password);
    console.log('Password verification:', passwordMatches ? '✅ PASSED' : '❌ FAILED');

    if (passwordMatches) {
      console.log('\n🎉 SUCCESS! Admin password has been reset!');
      console.log('\n📝 Login Credentials:');
      console.log('  Email:', targetEmail);
      console.log('  Password:', newPassword);
      console.log('\n✅ You can now login on Vercel with these credentials');
    } else {
      console.log('\n❌ Password verification failed - something went wrong');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n' + '='.repeat(60));
}

// Run fix
fixProductionAdminPassword()
  .then(() => {
    console.log('Fix complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
