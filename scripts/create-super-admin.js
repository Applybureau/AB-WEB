require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
  console.log('🔐 CREATING SUPER ADMIN');
  console.log('======================\n');

  try {
    const email = 'admin@applybureau.com';
    const password = 'Admin123@#';
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log('1. Checking if super admin already exists...');
    
    // Check if admin exists in admins table
    const { data: existingAdmin } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (existingAdmin) {
      console.log('✅ Super admin exists in admins table, updating password...');
      
      const { error: updateError } = await supabaseAdmin
        .from('admins')
        .update({
          password: hashedPassword,
          is_super_admin: true,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (updateError) {
        console.error('❌ Failed to update admin:', updateError);
        return;
      }
      
      console.log('✅ Super admin password updated successfully');
    } else {
      console.log('📝 Creating new super admin...');
      
      const { data: newAdmin, error: createError } = await supabaseAdmin
        .from('admins')
        .insert({
          email: email,
          password: hashedPassword,
          full_name: 'Super Administrator',
          role: 'super_admin',
          is_super_admin: true,
          is_active: true,
          permissions: JSON.stringify({
            can_create_admins: true,
            can_delete_admins: true,
            can_suspend_admins: true,
            can_view_all_data: true,
            can_manage_system: true
          }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create super admin:', createError);
        return;
      }
      
      console.log('✅ Super admin created successfully:', newAdmin.id);
    }

    // Also ensure admin exists in clients table for compatibility
    console.log('\n2. Ensuring admin exists in clients table...');
    
    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', email)
      .single();

    if (existingClient) {
      console.log('✅ Admin exists in clients table, updating...');
      
      const { error: updateClientError } = await supabaseAdmin
        .from('clients')
        .update({
          password: hashedPassword,
          role: 'admin',
          is_super_admin: true,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (updateClientError) {
        console.error('⚠️ Failed to update client record:', updateClientError);
      } else {
        console.log('✅ Client record updated');
      }
    } else {
      console.log('📝 Creating admin in clients table...');
      
      const { error: createClientError } = await supabaseAdmin
        .from('clients')
        .insert({
          email: email,
          password: hashedPassword,
          full_name: 'Super Administrator',
          name: 'Super Administrator',
          role: 'admin',
          is_super_admin: true,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createClientError) {
        console.error('⚠️ Failed to create client record:', createClientError);
      } else {
        console.log('✅ Client record created');
      }
    }

    console.log('\n🎉 SUPER ADMIN SETUP COMPLETE');
    console.log('=============================');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Role: Super Administrator');
    console.log('Permissions: Full system access');
    console.log('\n✅ Ready for admin management testing!');

  } catch (error) {
    console.error('❌ Super admin creation failed:', error);
  }
}

createSuperAdmin();