require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');

async function updateAdminPassword() {
  console.log('\n🔧 UPDATING ADMIN PASSWORD IN ADMINS TABLE\n');
  console.log('=' .repeat(60));

  try {
    const targetEmail = 'admin@applybureau.com';
    const newPassword = 'admin123';

    // Find admin in admins table
    console.log('\n📋 Finding admin in admins table...');
    const { data: admin, error: findError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', targetEmail)
      .single();

    if (findError || !admin) {
      console.log('❌ Admin not found in admins table');
      return;
    }

    console.log('✅ Admin found!');
    console.log('ID:', admin.id);
    console.log('Email:', admin.email);
    console.log('Full Name:', admin.full_name);

    // Hash password
    console.log('\n📋 Hashing password...');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('✅ Password hashed!');

    // Update password
    console.log('\n📋 Updating password...');
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({ password: hashedPassword })
      .eq('id', admin.id);

    if (updateError) {
      console.log('❌ Failed to update:', updateError.message);
      return;
    }

    console.log('✅ Password updated!');

    // Verify
    console.log('\n📋 Verifying...');
    const { data: updated } = await supabaseAdmin
      .from('admins')
      .select('password')
      .eq('id', admin.id)
      .single();

    const matches = await bcrypt.compare(newPassword, updated.password);
    console.log('Verification:', matches ? '✅ SUCCESS' : '❌ FAILED');

    if (matches) {
      console.log('\n🎉 Password updated successfully!');
      console.log('\n📝 Login with:');
      console.log('  Email:', targetEmail);
      console.log('  Password:', newPassword);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
}

updateAdminPassword()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
