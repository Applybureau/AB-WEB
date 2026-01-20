require('dotenv').config();
const { supabaseAdmin } = require('../utils/supabase');

async function debugAdminIssues() {
  console.log('🔍 DEBUGGING ADMIN ISSUES');
  console.log('=========================\n');

  try {
    // 1. Check where the super admin exists
    console.log('1. Checking super admin location...');
    
    const { data: adminInAdminsTable } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', 'admin@applybureau.com')
      .single();

    const { data: adminInClientsTable } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', 'admin@applybureau.com')
      .single();

    console.log('Admin in admins table:', !!adminInAdminsTable);
    console.log('Admin in clients table:', !!adminInClientsTable);

    if (adminInAdminsTable) {
      console.log('Admins table record:', {
        id: adminInAdminsTable.id,
        email: adminInAdminsTable.email,
        role: adminInAdminsTable.role,
        is_super_admin: adminInAdminsTable.is_super_admin
      });
    }

    if (adminInClientsTable) {
      console.log('Clients table record:', {
        id: adminInClientsTable.id,
        email: adminInClientsTable.email,
        role: adminInClientsTable.role
      });
    }

    // 2. Check table structures
    console.log('\n2. Checking table structures...');
    
    const { data: adminsTableData } = await supabaseAdmin
      .from('admins')
      .select('*')
      .limit(1);

    const { data: clientsTableData } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('role', 'admin')
      .limit(1);

    console.log('Admins table has records:', adminsTableData?.length || 0);
    console.log('Clients table admin records:', clientsTableData?.length || 0);

    // 3. Try to create the super admin in clients table if missing
    if (adminInAdminsTable && !adminInClientsTable) {
      console.log('\n3. Creating super admin in clients table...');
      
      const { data: newClientAdmin, error } = await supabaseAdmin
        .from('clients')
        .insert({
          email: adminInAdminsTable.email,
          password: adminInAdminsTable.password,
          full_name: adminInAdminsTable.full_name,
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create in clients table:', error);
      } else {
        console.log('✅ Super admin created in clients table:', newClientAdmin.id);
      }
    }

  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugAdminIssues();