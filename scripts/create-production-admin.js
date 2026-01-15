require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');

async function createProductionAdmin() {
  console.log('🔧 Creating Admin User in Production Database\n');
  console.log('='.repeat(60));

  try {
    const adminEmail = 'admin@applybureau.com';
    const adminPassword = 'Admin@123456';
    const adminName = 'Admin User';

    // Step 1: Check if admin already exists
    console.log('\n📝 Step 1: Checking if admin exists...');
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from('clients')
      .select('id, email, role')
      .eq('email', adminEmail)
      .single();

    if (existingAdmin) {
      console.log('✅ Admin already exists!');
      console.log('Admin ID:', existingAdmin.id);
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      
      if (existingAdmin.role !== 'admin') {
        console.log('\n⚠️  User exists but role is not admin. Updating role...');
        const { error: updateError } = await supabaseAdmin
          .from('clients')
          .update({ role: 'admin' })
          .eq('id', existingAdmin.id);

        if (updateError) {
          console.error('❌ Failed to update role:', updateError);
        } else {
          console.log('✅ Role updated to admin');
        }
      }
      
      return;
    }

    // Step 2: Hash password
    console.log('\n📝 Step 2: Hashing password...');
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    console.log('✅ Password hashed');

    // Step 3: Create admin user
    console.log('\n📝 Step 3: Creating admin user...');
    const { data: newAdmin, error: createError } = await supabaseAdmin
      .from('clients')
      .insert({
        full_name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create admin:', createError);
      console.error('Error details:', JSON.stringify(createError, null, 2));
      throw createError;
    }

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📊 Admin Details:');
    console.log('ID:', newAdmin.id);
    console.log('Name:', newAdmin.full_name);
    console.log('Email:', newAdmin.email);
    console.log('Role:', newAdmin.role);
    console.log('Status:', newAdmin.status);
    console.log('Active:', newAdmin.is_active);

    console.log('\n🔑 Admin Credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);

    console.log('\n✅ Production admin is ready!');
    console.log('You can now login at: https://apply-bureau-backend.vercel.app/api/auth/login');

  } catch (error) {
    console.error('\n❌ Failed to create admin:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createProductionAdmin();
