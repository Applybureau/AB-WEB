#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('./utils/supabase');

async function createAdminUser() {
  console.log('🔧 Creating admin user...');
  
  try {
    // Hash the password properly
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create or update admin user
    const { data, error } = await supabaseAdmin
      .from('admins')
      .upsert({
        full_name: 'Israel Loko',
        email: 'israelloko65@gmail.com',
        password: hashedPassword,
        is_active: true,
        role: 'admin'
      }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating admin user:', error);
      return false;
    }

    console.log('✅ Admin user created successfully');
    console.log(`   Name: ${data.full_name}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   ID: ${data.id}`);
    console.log(`   Password: admin123`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUser()
    .then(success => {
      if (success) {
        console.log('\n🎉 Admin user ready! You can now login with:');
        console.log('   Email: israelloko65@gmail.com');
        console.log('   Password: admin123');
        process.exit(0);
      } else {
        console.log('\n❌ Failed to create admin user!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };