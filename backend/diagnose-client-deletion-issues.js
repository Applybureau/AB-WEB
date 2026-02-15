// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { supabaseAdmin } = require('./utils/supabase');

/**
 * DIAGNOSE CLIENT DELETION ISSUES
 * 
 * This script will help identify why clients aren't being deleted
 */

async function diagnoseClientDeletionIssues() {
  console.log('🔍 DIAGNOSING CLIENT DELETION ISSUES\n');
  console.log('='.repeat(70));
  
  try {
    // ==================== CHECK 1: FIND ALL CLIENTS ====================
    console.log('\n📋 CHECK 1: Finding all clients in all tables...\n');
    
    // Check registered_users
    try {
      const { data: regUsers, error } = await supabaseAdmin
        .from('registered_users')
        .select('id, email, full_name, role, created_at')
        .eq('role', 'client');
      
      if (error) {
        console.log('❌ Error querying registered_users:', error.message);
      } else {
        console.log(`✅ registered_users table:`);
        console.log(`   Found ${regUsers?.length || 0} client(s)`);
        if (regUsers && regUsers.length > 0) {
          regUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
          });
        }
      }
    } catch (error) {
      console.log('⚠️  registered_users table may not exist');
    }
    
    // Check clients table
    try {
      const { data: clients, error } = await supabaseAdmin
        .from('clients')
        .select('id, email, full_name, created_at');
      
      if (error) {
        console.log('\n❌ Error querying clients:', error.message);
      } else {
        console.log(`\n✅ clients table:`);
        console.log(`   Found ${clients?.length || 0} record(s)`);
        if (clients && clients.length > 0) {
          clients.forEach((client, index) => {
            console.log(`   ${index + 1}. ${client.email || 'No email'} (ID: ${client.id})`);
          });
        }
      }
    } catch (error) {
      console.log('⚠️  clients table may not exist');
    }

    // ==================== CHECK 2: FOREIGN KEY CONSTRAINTS ====================
    console.log('\n🔗 CHECK 2: Checking foreign key constraints...\n');
    
    // Get a sample client ID
    const { data: sampleClient } = await supabaseAdmin
      .from('registered_users')
      .select('id')
      .eq('role', 'client')
      .limit(1)
      .single();
    
    if (sampleClient) {
      const clientId = sampleClient.id;
      console.log(`Using sample client ID: ${clientId}\n`);
      
      // Check all tables that might reference this client
      const tablesToCheck = [
        'applications',
        'consultations',
        'consultation_requests',
        'messages',
        'notifications',
        'twenty_questions',
        'strategy_calls',
        'interviews',
        'meetings',
        'client_files',
        'application_logs',
        'leads'
      ];
      
      for (const tableName of tablesToCheck) {
        try {
          const { data, error } = await supabaseAdmin
            .from(tableName)
            .select('id')
            .eq('client_id', clientId);
          
          if (error) {
            console.log(`  ⚠️  ${tableName}: ${error.message}`);
          } else {
            const count = data?.length || 0;
            if (count > 0) {
              console.log(`  ⚠️  ${tableName}: ${count} record(s) reference this client`);
            } else {
              console.log(`  ✅ ${tableName}: No references`);
            }
          }
        } catch (error) {
          console.log(`  ⚠️  ${tableName}: Table may not exist`);
        }
      }
    } else {
      console.log('No clients found to check foreign keys');
    }

    // ==================== CHECK 3: AUTH USERS ====================
    console.log('\n🔐 CHECK 3: Checking Supabase Auth users...\n');
    
    try {
      // List all auth users
      const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        console.log('❌ Error listing auth users:', error.message);
      } else {
        console.log(`Found ${authUsers.users?.length || 0} auth user(s)`);
        
        if (authUsers.users && authUsers.users.length > 0) {
          console.log('\nAuth users:');
          authUsers.users.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`);
            console.log(`     Created: ${user.created_at}`);
            console.log(`     Role: ${user.user_metadata?.role || 'N/A'}`);
          });
        }
      }
    } catch (error) {
      console.log('⚠️  Could not list auth users:', error.message);
    }

    // ==================== CHECK 4: RLS POLICIES ====================
    console.log('\n🛡️  CHECK 4: Checking RLS policies...\n');
    
    console.log('RLS (Row Level Security) policies may prevent deletion.');
    console.log('If deletion fails, you may need to:');
    console.log('  1. Temporarily disable RLS on tables');
    console.log('  2. Use service role key (which bypasses RLS)');
    console.log('  3. Check policy definitions in Supabase Dashboard\n');

    // ==================== CHECK 5: DELETION ATTEMPT ====================
    console.log('\n🧪 CHECK 5: Testing deletion (DRY RUN)...\n');
    
    try {
      const { data: testClient } = await supabaseAdmin
        .from('registered_users')
        .select('id, email')
        .eq('role', 'client')
        .limit(1)
        .single();
      
      if (testClient) {
        console.log(`Attempting to delete test client: ${testClient.email}`);
        console.log('(This is a dry run - not actually deleting)\n');
        
        // Try to delete (but don't actually do it)
        console.log('Steps that would be taken:');
        console.log('  1. Delete dependent records (applications, consultations, etc.)');
        console.log('  2. Delete from clients table');
        console.log('  3. Delete from registered_users table');
        console.log('  4. Delete from Supabase Auth');
        console.log('\nTo actually delete, use force-delete-all-clients.js');
      } else {
        console.log('No clients found to test deletion');
      }
    } catch (error) {
      console.log('⚠️  Could not test deletion:', error.message);
    }

    // ==================== RECOMMENDATIONS ====================
    console.log('\n' + '='.repeat(70));
    console.log('💡 RECOMMENDATIONS\n');
    
    console.log('If clients are not being deleted, try:');
    console.log('1. Use force-delete-all-clients.js instead');
    console.log('   - Deletes dependent records first');
    console.log('   - Handles foreign key constraints');
    console.log('   - Deletes from auth');
    console.log('');
    console.log('2. Check Supabase Dashboard:');
    console.log('   - Database → Tables → Check for remaining records');
    console.log('   - Authentication → Users → Manually delete if needed');
    console.log('   - Database → Policies → Check RLS policies');
    console.log('');
    console.log('3. Manual SQL deletion (use with caution):');
    console.log('   - Go to Supabase SQL Editor');
    console.log('   - Run: DELETE FROM registered_users WHERE role = \'client\';');
    console.log('   - Run: DELETE FROM clients;');
    console.log('');
    console.log('4. Check for cascading delete rules:');
    console.log('   - Foreign keys may have ON DELETE CASCADE');
    console.log('   - Or ON DELETE RESTRICT (prevents deletion)');
    
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Diagnosis complete!\n');

  } catch (error) {
    console.error('\n❌ Diagnosis failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  diagnoseClientDeletionIssues()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Diagnosis failed:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseClientDeletionIssues };
