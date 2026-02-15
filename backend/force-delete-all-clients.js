// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { supabaseAdmin } = require('./utils/supabase');

/**
 * FORCE DELETE ALL CLIENTS - AGGRESSIVE CLEANUP
 * 
 * This script will forcefully delete ALL clients by:
 * 1. First deleting all dependent records (foreign keys)
 * 2. Then deleting client records from all tables
 * 3. Finally deleting from Supabase Auth
 * 
 * ⚠️  WARNING: THIS IS EXTREMELY DESTRUCTIVE!
 */

// Super admin email to preserve
const SUPER_ADMIN_EMAIL = 'applybureau@gmail.com';

async function forceDeleteAllClients() {
  console.log('🚨 FORCE DELETING ALL CLIENTS\n');
  console.log('='.repeat(70));
  console.log(`\n⚠️  Preserving super admin: ${SUPER_ADMIN_EMAIL}\n`);
  console.log('='.repeat(70));
  
  const results = {
    clients_found: 0,
    clients_deleted: 0,
    auth_users_deleted: 0,
    dependent_records_deleted: 0,
    errors: []
  };

  try {
    // ==================== STEP 1: FIND ALL CLIENTS ====================
    console.log('\n🔍 STEP 1: Finding all clients...\n');
    
    let allClientIds = new Set();
    
    // Get clients from registered_users
    try {
      const { data: regUsers, error } = await supabaseAdmin
        .from('registered_users')
        .select('id, email, full_name, role')
        .eq('role', 'client');
      
      if (!error && regUsers) {
        console.log(`Found ${regUsers.length} client(s) in registered_users:`);
        regUsers.forEach(user => {
          allClientIds.add(user.id);
          console.log(`  - ${user.email} (${user.id})`);
        });
        results.clients_found += regUsers.length;
      }
    } catch (error) {
      console.log('⚠️  registered_users table may not exist');
    }
    
    // Get clients from clients table
    try {
      const { data: clients, error } = await supabaseAdmin
        .from('clients')
        .select('id, email, full_name');
      
      if (!error && clients) {
        console.log(`\nFound ${clients.length} record(s) in clients table:`);
        clients.forEach(client => {
          allClientIds.add(client.id);
          console.log(`  - ${client.email || 'No email'} (${client.id})`);
        });
      }
    } catch (error) {
      console.log('⚠️  clients table may not exist');
    }
    
    console.log(`\n📊 Total unique client IDs found: ${allClientIds.size}`);
    
    if (allClientIds.size === 0) {
      console.log('\n✅ No clients found to delete!');
      return results;
    }

    const clientIdsArray = Array.from(allClientIds);

    // ==================== STEP 2: DELETE DEPENDENT RECORDS ====================
    console.log('\n🗑️  STEP 2: Deleting all dependent records...\n');
    
    // Tables with foreign keys to clients (delete in order)
    const dependentTables = [
      { name: 'application_logs', fk: 'client_id' },
      { name: 'messages', fk: 'client_id' },
      { name: 'notifications', fk: 'user_id' },
      { name: 'notifications', fk: 'client_id' },
      { name: 'applications', fk: 'client_id' },
      { name: 'consultations', fk: 'client_id' },
      { name: 'twenty_questions', fk: 'client_id' },
      { name: 'strategy_calls', fk: 'client_id' },
      { name: 'interviews', fk: 'client_id' },
      { name: 'meetings', fk: 'client_id' },
      { name: 'client_files', fk: 'client_id' },
      { name: 'leads', fk: 'client_id' }
    ];
    
    for (const table of dependentTables) {
      try {
        console.log(`Deleting from ${table.name}...`);
        
        const { data, error } = await supabaseAdmin
          .from(table.name)
          .delete()
          .in(table.fk, clientIdsArray)
          .select();
        
        if (error) {
          console.log(`  ⚠️  Error: ${error.message}`);
          results.errors.push(`${table.name}: ${error.message}`);
        } else {
          const count = data?.length || 0;
          results.dependent_records_deleted += count;
          console.log(`  ✅ Deleted ${count} record(s)`);
        }
      } catch (error) {
        console.log(`  ⚠️  Table ${table.name} may not exist`);
      }
    }

    // ==================== STEP 3: DELETE FROM CLIENTS TABLE ====================
    console.log('\n📋 STEP 3: Deleting from clients table...\n');
    
    try {
      const { data: deletedClients, error } = await supabaseAdmin
        .from('clients')
        .delete()
        .in('id', clientIdsArray)
        .select();
      
      if (error) {
        console.log('❌ Error deleting from clients:', error.message);
        results.errors.push(`Clients table: ${error.message}`);
      } else {
        const count = deletedClients?.length || 0;
        results.clients_deleted += count;
        console.log(`✅ Deleted ${count} record(s) from clients table`);
      }
    } catch (error) {
      console.log('⚠️  Clients table may not exist:', error.message);
    }

    // ==================== STEP 4: DELETE FROM REGISTERED_USERS ====================
    console.log('\n👥 STEP 4: Deleting from registered_users...\n');
    
    try {
      const { data: deletedUsers, error } = await supabaseAdmin
        .from('registered_users')
        .delete()
        .in('id', clientIdsArray)
        .select();
      
      if (error) {
        console.log('❌ Error deleting from registered_users:', error.message);
        results.errors.push(`Registered users: ${error.message}`);
      } else {
        const count = deletedUsers?.length || 0;
        results.clients_deleted += count;
        console.log(`✅ Deleted ${count} record(s) from registered_users`);
      }
    } catch (error) {
      console.log('⚠️  Registered_users table may not exist:', error.message);
    }

    // ==================== STEP 5: DELETE FROM SUPABASE AUTH ====================
    console.log('\n🔐 STEP 5: Deleting from Supabase Auth...\n');
    
    console.log('Attempting to delete auth users...');
    
    for (const clientId of clientIdsArray) {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.deleteUser(clientId);
        
        if (error) {
          if (error.message.includes('not found')) {
            console.log(`  ⚠️  Auth user ${clientId} not found (may already be deleted)`);
          } else {
            console.log(`  ❌ Error deleting auth user ${clientId}:`, error.message);
            results.errors.push(`Auth user ${clientId}: ${error.message}`);
          }
        } else {
          results.auth_users_deleted++;
          console.log(`  ✅ Deleted auth user ${clientId}`);
        }
      } catch (error) {
        console.log(`  ⚠️  Could not delete auth user ${clientId}:`, error.message);
      }
    }

    // ==================== STEP 6: VERIFY DELETION ====================
    console.log('\n✅ STEP 6: Verifying deletion...\n');
    
    // Check registered_users
    try {
      const { data: remainingUsers, error } = await supabaseAdmin
        .from('registered_users')
        .select('id, email, role')
        .eq('role', 'client');
      
      if (!error) {
        if (remainingUsers && remainingUsers.length > 0) {
          console.log(`⚠️  WARNING: ${remainingUsers.length} client(s) still remain in registered_users:`);
          remainingUsers.forEach(user => {
            console.log(`  - ${user.email} (${user.id})`);
          });
        } else {
          console.log('✅ No clients remain in registered_users');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not verify registered_users');
    }
    
    // Check clients table
    try {
      const { data: remainingClients, error } = await supabaseAdmin
        .from('clients')
        .select('id, email');
      
      if (!error) {
        if (remainingClients && remainingClients.length > 0) {
          console.log(`\n⚠️  WARNING: ${remainingClients.length} record(s) still remain in clients table:`);
          remainingClients.forEach(client => {
            console.log(`  - ${client.email || 'No email'} (${client.id})`);
          });
        } else {
          console.log('✅ No records remain in clients table');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not verify clients table');
    }

    // ==================== SUMMARY ====================
    console.log('\n' + '='.repeat(70));
    console.log('📊 DELETION SUMMARY\n');
    
    console.log(`Clients found: ${results.clients_found}`);
    console.log(`Clients deleted: ${results.clients_deleted}`);
    console.log(`Auth users deleted: ${results.auth_users_deleted}`);
    console.log(`Dependent records deleted: ${results.dependent_records_deleted}`);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Verify super admin still exists
    console.log('\n✅ Verifying super admin...');
    try {
      const { data: superAdmin, error } = await supabaseAdmin
        .from('admins')
        .select('id, email, full_name')
        .eq('email', SUPER_ADMIN_EMAIL)
        .single();
      
      if (error || !superAdmin) {
        console.log('⚠️  WARNING: Super admin not found!');
      } else {
        console.log(`✅ Super admin preserved: ${superAdmin.email}`);
      }
    } catch (error) {
      console.log('⚠️  Could not verify super admin');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Force deletion complete!\n');

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error);
    throw error;
  }
  
  return results;
}

// Confirmation prompt
async function confirmAndRun() {
  console.log('\n⚠️  ⚠️  ⚠️  EXTREME DANGER ZONE ⚠️  ⚠️  ⚠️\n');
  console.log('This script will FORCEFULLY DELETE ALL CLIENTS!');
  console.log('Including:');
  console.log('  • All client records from all tables');
  console.log('  • All dependent data (applications, consultations, etc.)');
  console.log('  • All auth users');
  console.log('\nThis action CANNOT be undone!\n');
  console.log('To proceed, edit this script and set CONFIRMED = true\n');
  
  const CONFIRMED = true; // Change to true to run
  
  if (!CONFIRMED) {
    console.log('❌ Script not confirmed. Exiting safely.\n');
    console.log('To run this script:');
    console.log('1. Edit backend/force-delete-all-clients.js');
    console.log('2. Set SUPER_ADMIN_EMAIL to your actual super admin email');
    console.log('3. Set CONFIRMED = true');
    console.log('4. Run: node backend/force-delete-all-clients.js\n');
    return;
  }
  
  console.log('✅ Confirmation received. Starting deletion in 3 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await forceDeleteAllClients();
}

// Run if called directly
if (require.main === module) {
  confirmAndRun()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Force deletion failed:', error);
      process.exit(1);
    });
}

module.exports = { forceDeleteAllClients };
