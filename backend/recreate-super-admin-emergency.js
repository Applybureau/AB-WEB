require('dotenv').config();
const { supabaseAdmin } = require('./utils/supabase');
const bcrypt = require('bcryptjs');

async function recreateSuperAdmin() {
  console.log('\n🚨 EMERGENCY: RECREATING SUPER ADMIN\n');
  console.log('=' .repeat(60));

  try {
    const superAdminEmail = 'applybureau@gmail.com';
    const superAdminPassword = 'ApplyBureau2024!'; // CHANGE THIS AFTER LOGIN
    const superAdminName = 'Apply Bureau Admin';

    console.log('\n📋 Super Admin Details:');
    console.log('-'.repeat(60));
    console.log(`Email: ${superAdminEmail}`);
    console.log(`Name: ${superAdminName}`);
    console.log(`Password: ${superAdminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change this password immediately after logging in!\n');

    // Check if super admin already exists
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from('admins')
      .select('id, email, is_active')
      .eq('email', superAdminEmail)
      .single();

    if (existingAdmin) {
      console.log('✅ Super admin already exists');
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Active: ${existingAdmin.is_active}`);
      
      if (!existingAdmin.is_active) {
        console.log('\n🔄 Reactivating super admin...');
        const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
        
        const { error: updateError } = await supabaseAdmin
          .from('admins')
          .update({
            is_active: true,
            password: hashedPassword,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAdmin.id);

        if (updateError) {
          console.error('❌ Error reactivating admin:', updateError);
        } else {
          console.log('✅ Super admin reactivated');
        }
      }
      
      return;
    }

    // Hash password
    console.log('\n🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
    console.log(`✅ Password hashed (length: ${hashedPassword.length})`);

    // Create super admin
    console.log('\n🔄 Creating super admin in admins table...');
    const { data: newAdmin, error: createError } = await supabaseAdmin
      .from('admins')
      .insert({
        email: superAdminEmail,
        full_name: superAdminName,
        password: hashedPassword,
        role: 'admin',
        is_active: true,
        is_super_admin: true,
        permissions: {
          can_create_admins: true,
          can_delete_admins: true,
          can_manage_clients: true,
          can_schedule_consultations: true,
          can_view_reports: true,
          can_manage_system: true
        },
        created_at: new Date().toISOString(),
        last_login_at: null
      })
      .select()
      .single();

    if (createError) {
      console.error('\n❌ ERROR CREATING SUPER ADMIN:', createError);
      
      // Try creating in clients table as fallback
      console.log('\n🔄 Trying to create in clients table as fallback...');
      const { data: clientAdmin, error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          email: superAdminEmail,
          full_name: superAdminName,
          password: hashedPassword,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (clientError) {
        console.error('❌ ERROR CREATING IN CLIENTS TABLE:', clientError);
        throw new Error('Failed to create super admin in both tables');
      }

      console.log('\n✅ SUPER ADMIN CREATED IN CLIENTS TABLE');
      console.log(`   ID: ${clientAdmin.id}`);
      console.log(`   Email: ${clientAdmin.email}`);
    } else {
      console.log('\n✅ SUPER ADMIN CREATED SUCCESSFULLY');
      console.log(`   ID: ${newAdmin.id}`);
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Role: ${newAdmin.role}`);
      console.log(`   Super Admin: ${newAdmin.is_super_admin}`);
    }

    console.log('\n\n📝 LOGIN CREDENTIALS:');
    console.log('=' .repeat(60));
    console.log(`Email: ${superAdminEmail}`);
    console.log(`Password: ${superAdminPassword}`);
    console.log(`Login URL: ${process.env.FRONTEND_URL}/admin/login`);
    console.log('\n⚠️  CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!');

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ SUPER ADMIN RECREATION COMPLETE\n');

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error);
    console.log('\n💡 MANUAL FIX REQUIRED:');
    console.log('-'.repeat(60));
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Run this SQL:');
    console.log(`
INSERT INTO admins (
  email, 
  full_name, 
  password, 
  role, 
  is_active, 
  is_super_admin,
  permissions,
  created_at
) VALUES (
  'applybureau@gmail.com',
  'Apply Bureau Admin',
  '$2a$12$HASH_HERE', -- Replace with bcrypt hash
  'admin',
  true,
  true,
  '{"can_create_admins":true,"can_delete_admins":true,"can_manage_clients":true,"can_schedule_consultations":true,"can_view_reports":true,"can_manage_system":true}'::jsonb,
  NOW()
);
    `);
  }
}

recreateSuperAdmin();
