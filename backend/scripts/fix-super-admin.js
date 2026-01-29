require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

const SUPER_ADMIN_EMAIL = 'applybureau@gmail.com';

async function fixSuperAdmin() {
  console.log('🔧 Fixing Super Admin Status...\n');

  try {
    // Check if admin exists in admins table
    const { data: adminFromAdminsTable, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', SUPER_ADMIN_EMAIL)
      .single();

    if (adminFromAdminsTable) {
      console.log('✅ Admin found in admins table:', adminFromAdminsTable.email);
      
      // Update to ensure super admin status
      const { error: updateError } = await supabaseAdmin
        .from('admins')
        .update({
          is_super_admin: true,
          permissions: {
            can_create_admins: true,
            can_delete_admins: true,
            can_suspend_admins: true,
            can_manage_clients: true,
            can_schedule_consultations: true,
            can_view_reports: true,
            can_manage_system: true
          }
        })
        .eq('email', SUPER_ADMIN_EMAIL);

      if (updateError) {
        console.error('❌ Failed to update admin in admins table:', updateError);
      } else {
        console.log('✅ Super admin status updated in admins table');
      }
    } else {
      console.log('⚠️ Admin not found in admins table, checking clients table...');
    }

    // Check if admin exists in clients table (legacy)
    const { data: adminFromClientsTable, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', SUPER_ADMIN_EMAIL)
      .single();

    if (adminFromClientsTable) {
      console.log('✅ Admin found in clients table:', adminFromClientsTable.email);
      console.log('📋 Admin details:', {
        id: adminFromClientsTable.id,
        email: adminFromClientsTable.email,
        role: adminFromClientsTable.role,
        full_name: adminFromClientsTable.full_name
      });

      // If not in admins table, create entry there
      if (!adminFromAdminsTable) {
        console.log('➕ Creating admin entry in admins table...');
        
        const { error: createError } = await supabaseAdmin
          .from('admins')
          .insert({
            id: adminFromClientsTable.id,
            email: adminFromClientsTable.email,
            full_name: adminFromClientsTable.full_name,
            password: adminFromClientsTable.password, // Use existing password
            role: 'admin',
            is_super_admin: true,
            is_active: true,
            permissions: {
              can_create_admins: true,
              can_delete_admins: true,
              can_suspend_admins: true,
              can_manage_clients: true,
              can_schedule_consultations: true,
              can_view_reports: true,
              can_manage_system: true
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error('❌ Failed to create admin in admins table:', createError);
        } else {
          console.log('✅ Admin created in admins table with super admin privileges');
        }
      }
    } else {
      console.log('❌ Admin not found in either table!');
      console.log('🔧 This should not happen. Please check the admin credentials.');
    }

    // Verify the fix
    console.log('\n🔍 Verifying super admin status...');
    
    const { data: verifyAdmin } = await supabaseAdmin
      .from('admins')
      .select('email, is_super_admin, permissions')
      .eq('email', SUPER_ADMIN_EMAIL)
      .single();

    if (verifyAdmin) {
      console.log('✅ Verification successful:');
      console.log('  Email:', verifyAdmin.email);
      console.log('  Is Super Admin:', verifyAdmin.is_super_admin);
      console.log('  Permissions:', verifyAdmin.permissions);
    } else {
      console.log('❌ Verification failed - admin not found in admins table');
    }

    console.log('\n🎉 Super admin fix completed!');

  } catch (error) {
    console.error('❌ Super admin fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixSuperAdmin();