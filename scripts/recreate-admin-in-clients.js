require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../utils/supabase');

async function recreateAdminInClients() {
  console.log('🔧 Recreating Admin Account in Clients Table\n');
  console.log('='.repeat(70));

  try {
    // Check if admin already exists in clients table
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('clients')
      .select('id, email, role')
      .eq('email', 'admin@applybureau.com')
      .single();

    if (existing) {
      console.log('✅ Admin already exists in clients table');
      console.log('   Email:', existing.email);
      console.log('   Role:', existing.role);
      return;
    }

    console.log('📝 Creating admin account in clients table...');

    // Hash the password
    const password = 'Admin@123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin in clients table
    const { data: admin, error: createError } = await supabaseAdmin
      .from('clients')
      .insert({
        email: 'admin@applybureau.com',
        full_name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        onboarding_complete: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating admin:', createError);
      console.error('Details:', createError.message);
      return;
    }

    console.log('✅ Admin account created successfully!');
    console.log('\n📋 Admin Details:');
    console.log('   ID:', admin.id);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Status:', admin.status);

    console.log('\n🔐 Login Credentials:');
    console.log('   Email: admin@applybureau.com');
    console.log('   Password: Admin@123456');

    console.log('\n' + '='.repeat(70));
    console.log('✅ COMPLETE! You can now login with the admin account.');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Details:', error.message);
  }
}

recreateAdminInClients();
